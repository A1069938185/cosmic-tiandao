import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '@/lib/api';
import type { WorldState, CharacterMeta, WorldDimension, EntropyReport } from '@/types';
import EntropyGauge from '@/components/world/EntropyGauge';
import CharacterCard from '@/components/characters/CharacterCard';
import EntropyEvents from '@/components/world/EntropyEvents';

export default function WorldDashboard() {
  const { worldId } = useParams<{ worldId: string }>();
  const navigate = useNavigate();
  const decodedId = decodeURIComponent(worldId ?? '');

  const [state, setState] = useState<WorldState | null>(null);
  const [characters, setCharacters] = useState<{ characters: CharacterMeta[] } | null>(null);
  const [dimensions, setDimensions] = useState<WorldDimension[]>([]);
  const [chronicles, setChronicles] = useState<unknown[]>([]);
  const [entropy, setEntropy] = useState<{ meta: unknown; reports: EntropyReport[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'characters' | 'chronicles' | 'entropy'>('overview');
  const [simDays, setSimDays] = useState(7);
  const [simStatus, setSimStatus] = useState<'idle' | 'running'>('idle');

  const fetchAll = useCallback(async () => {
    if (!decodedId) return;
    try {
      const [ws, chars, chrons, entr] = await Promise.all([
        api.getWorld(decodedId).catch(() => null),
        api.listCharacters(decodedId).catch(() => null),
        api.getChronicles(decodedId).catch(() => []),
        api.getEntropy(decodedId).catch(() => null),
      ]);
      const worldState = ws as WorldState | null;
      setState(worldState);
      setCharacters(chars as { characters: CharacterMeta[] } | null);
      setDimensions(worldState?.dimensions ?? []);
      setChronicles(chrons as unknown[]);
      setEntropy(entr as { meta: unknown; reports: unknown[] } | null);
    } finally {
      setLoading(false);
    }
  }, [decodedId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Poll simulation status
  useEffect(() => {
    if (simStatus !== 'running') return;
    const interval = setInterval(async () => {
      try {
        const s = await api.getSimStatus(decodedId);
        if (!s.isRunning) {
          setSimStatus('idle');
          fetchAll();
        }
      } catch { /* ignore */ }
    }, 3000);
    return () => clearInterval(interval);
  }, [simStatus, decodedId, fetchAll]);

  const handleSimulate = async () => {
    try {
      await api.simulate(decodedId, simDays);
      setSimStatus('running');
    } catch (e) {
      alert((e as Error).message);
    }
  };

  // Resolve entropy values for EntropyGauge
  // New world: entropy is number[], legacy world: entropy is { visible/invisible }
  const entropyValues: number[] = (() => {
    if (!state) return [];
    if (Array.isArray(state.entropy)) return state.entropy;
    if (typeof state.entropy === 'object' && state.entropy !== null) {
      const e = state.entropy as Record<string, number>;
      return [e.visible ?? 0, e.invisible ?? 0];
    }
    return [];
  })();

  if (loading) return <LoadingState />;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <Link to="/" style={{ color: '#666', textDecoration: 'none', fontSize: 13 }}>← 世界列表</Link>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginTop: 8 }}>
            {decodedId}
          </h1>
          <p style={{ color: '#555', fontSize: 13 }}>
            {state?.currentTime ?? '时间未知'}
            {state?.activeArc && ` · ${state.activeArc}`}
          </p>
        </div>
        <button
          onClick={() => navigate(`/world/${encodeURIComponent(decodedId)}/simulate`)}
          style={{
            padding: '10px 24px',
            background: 'linear-gradient(135deg, #6b5ce7 0%, #8b5cf6 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          ◈ 开始推演
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid #2a2a3a' }}>
        {(['overview', 'characters', 'chronicles', 'entropy'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 16px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid #6b5ce7' : '2px solid transparent',
              color: activeTab === tab ? '#fff' : '#666',
              cursor: 'pointer',
              fontSize: 14,
              transition: 'color 0.2s',
            }}
          >
            {tab === 'overview' ? '总览' : tab === 'characters' ? '角色' : tab === 'chronicles' ? '编年' : '熵变'}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Entropy */}
          <Panel title="熵值">
            {entropyValues.length > 0 && dimensions.length > 0 ? (
              <EntropyGauge entropy={entropyValues} dimensions={dimensions} />
            ) : (
              <p style={{ color: '#555' }}>暂无数据</p>
            )}
          </Panel>

          {/* Quick Sim */}
          <Panel title="快速推演">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label style={{ color: '#888', fontSize: 13 }}>
                推演天数：
                <input
                  type="number"
                  value={simDays}
                  onChange={e => setSimDays(Math.max(1, Math.min(365, +e.target.value)))}
                  style={{
                    marginLeft: 8, width: 64, padding: '4px 8px',
                    background: '#1a1a28', border: '1px solid #333',
                    color: '#fff', borderRadius: 4,
                  }}
                />
              </label>
              <button
                onClick={handleSimulate}
                disabled={simStatus === 'running'}
                style={{
                  padding: '8px 16px',
                  background: simStatus === 'running' ? '#333' : '#6b5ce7',
                  color: '#fff', border: 'none', borderRadius: 6,
                  cursor: simStatus === 'running' ? 'not-allowed' : 'pointer',
                }}
              >
                {simStatus === 'running' ? '◈ 推演中…' : '启动推演'}
              </button>
            </div>
          </Panel>

          {/* Recent Chronicles */}
          <Panel title="最近编年" style={{ gridColumn: '1 / -1' }}>
            {chronicles.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {chronicles.slice(-3).reverse().map((c: unknown) => (
                  <div key={(c as { file: string }).file} style={{ color: '#888', fontSize: 13, padding: '4px 0', borderBottom: '1px solid #1a1a28' }}>
                    {(c as { file: string }).file}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#555' }}>暂无编年记录</p>
            )}
          </Panel>
        </div>
      )}

      {activeTab === 'characters' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {characters?.characters?.length ? (
            characters.characters.map(char => (
              <CharacterCard key={char.id} char={char} worldId={decodedId} dimensions={dimensions} />
            ))
          ) : (
            <p style={{ color: '#555', gridColumn: '1/-1' }}>暂无角色数据</p>
          )}
        </div>
      )}

      {activeTab === 'chronicles' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {chronicles.length > 0 ? (
            chronicles.map((c: unknown) => {
              const item = c as { file: string; raw: string };
              const lines = item.raw.split('\n');
              return (
                <div key={item.file} style={{ background: '#12121a', border: '1px solid #2a2a3a', borderRadius: 8, padding: 20 }}>
                  <p style={{ color: '#6b5ce7', fontWeight: 600, fontSize: 16, marginBottom: 12 }}>{item.file}</p>
                  <div style={{ color: '#ccc', fontSize: 14, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                    {lines.map((line, i) => {
                      if (line.startsWith('## ')) return <h2 key={i} style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginTop: 20, marginBottom: 8 }}>{line.slice(3)}</h2>;
                      if (line.startsWith('### ')) return <h3 key={i} style={{ color: '#ddd', fontSize: 15, fontWeight: 600, marginTop: 16, marginBottom: 6 }}>{line.slice(4)}</h3>;
                      if (line.startsWith('**') && line.endsWith('**')) return <p key={i} style={{ color: '#fff', fontWeight: 600, marginTop: 8 }}>{line.slice(2, -2)}</p>;
                      if (line.startsWith('> ')) return <p key={i} style={{ color: '#777', fontStyle: 'italic', borderLeft: '2px solid #333', paddingLeft: 12, margin: '8px 0' }}>{line.slice(2)}</p>;
                      if (line.startsWith('---')) return <hr key={i} style={{ border: 'none', borderTop: '1px solid #2a2a3a', margin: '16px 0' }} />;
                      if (line.startsWith('- ')) return <p key={i} style={{ color: '#bbb', paddingLeft: 16 }}>• {renderInline(line.slice(2))}</p>;
                      if (line.startsWith('*') && line.endsWith('*')) return <p key={i} style={{ color: '#888', fontStyle: 'italic', marginTop: 6 }}>{line.slice(1, -1)}</p>;
                      if (line.trim() === '') return <br key={i} />;
                      return <p key={i} style={{ color: '#bbb', margin: '2px 0' }}>{renderInline(line)}</p>;
                    })}
                  </div>
                </div>
              );
            })
          ) : (
            <p style={{ color: '#555' }}>暂无编年记录</p>
          )}
        </div>
      )}

      {activeTab === 'entropy' && (
        <div>
          {/* Entropy events */}
          <EntropyEvents reports={entropy?.reports ?? []} />

          {/* Inject button */}
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <button
              onClick={async () => {
                try {
                  await api.injectEntropy(decodedId, { type: 'random', intensity: 'medium' });
                  fetchAll();
                } catch (e) { alert((e as Error).message); }
              }}
              style={{
                padding: '8px 20px',
                background: '#1a0a0a',
                color: '#f87171',
                border: '1px solid #f8717133',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              + 召唤熵君注入熵变
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Panel({ title, children, style }: { title: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: '#12121a', border: '1px solid #2a2a3a', borderRadius: 12, padding: 20, ...style }}>
      <h3 style={{ color: '#aaa', fontSize: 13, fontWeight: 500, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i} style={{ color: '#fff' }}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*')) return <em key={i}>{part.slice(1, -1)}</em>;
    return part;
  });
}

function LoadingState() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <p style={{ color: '#666' }}>加载中…</p>
    </div>
  );
}

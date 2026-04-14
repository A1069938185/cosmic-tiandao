import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import type { WorldInfo } from '@/types';

export default function WorldList() {
  const [worlds, setWorlds] = useState<WorldInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.listWorlds()
      .then(setWorlds)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px' }}>
      <header style={{ marginBottom: 40, display: 'flex', alignItems: 'center', gap: 16 }}>
        <TitleIcon />
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff' }}>天道 · 世界推演台</h1>
          <p style={{ color: '#666', marginTop: 4 }}>世界索引 · {worlds.length} 个世界已建立</p>
        </div>
      </header>

      {worlds.length === 0 ? (
        <EmptyState />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {worlds.map(w => (
            <WorldCard
              key={w.id}
              world={w}
              onEnter={() => navigate(`/world/${encodeURIComponent(w.id)}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function WorldCard({ world, onEnter }: { world: WorldInfo; onEnter: () => void }) {
  return (
    <div
      onClick={onEnter}
      style={{
        background: 'linear-gradient(135deg, #12121a 0%, #1a1a28 100%)',
        border: '1px solid #2a2a3a',
        borderRadius: 12,
        padding: '20px 24px',
        cursor: 'pointer',
        transition: 'border-color 0.2s, transform 0.15s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = '#6b5ce7';
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = '#2a2a3a';
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#fff' }}>{world.name}</h2>
          <p style={{ color: '#555', fontSize: 13, marginTop: 4 }}>
            ID: {world.id}
          </p>
        </div>
        <div style={{ color: '#6b5ce7', fontSize: 24 }}>→</div>
      </div>
    </div>
  );
}

function TitleIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="20" stroke="#6b5ce7" strokeWidth="2" />
      <circle cx="24" cy="24" r="12" stroke="#6b5ce7" strokeWidth="1.5" strokeDasharray="3 3" />
      <circle cx="24" cy="24" r="4" fill="#6b5ce7" />
    </svg>
  );
}

function LoadingState() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>◈</div>
        <p style={{ color: '#666' }}>加载世界中……</p>
      </div>
    </div>
  );
}

function ErrorState({ error }: { error: string }) {
  return (
    <div style={{ maxWidth: 500, margin: '60px auto', padding: '0 20px', textAlign: 'center' }}>
      <p style={{ color: '#e55', marginBottom: 12 }}>⚠ 连接失败</p>
      <p style={{ color: '#666', fontSize: 13 }}>{error}</p>
      <button
        onClick={() => window.location.reload()}
        style={{ marginTop: 16, padding: '8px 20px', background: '#6b5ce7', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
      >
        重试
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#555' }}>
      <p style={{ fontSize: 48, marginBottom: 16 }}>◇</p>
      <p>暂无世界数据</p>
      <p style={{ fontSize: 13, marginTop: 8 }}>请先通过天道创建世界</p>
    </div>
  );
}

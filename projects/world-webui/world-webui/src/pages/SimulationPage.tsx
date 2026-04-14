import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '@/lib/api';

export default function SimulationPage() {
  const { worldId } = useParams<{ worldId: string }>();
  const decodedId = decodeURIComponent(worldId ?? '');

  const [days, setDays] = useState(7);
  const [status, setStatus] = useState<'idle' | 'running' | 'done'>('idle');
  const [sessionKey, setSessionKey] = useState('');
  const [log, setLog] = useState<string[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [log]);

  const handleStart = async () => {
    try {
      setStatus('running');
      setLog(l => [...l, `[系统] 召唤常羲，推演 ${days} 天…`]);
      const result = await api.simulate(decodedId, days);
      setSessionKey(result.sessionKey);
      setLog(l => [...l, `[系统] 子代理已激活，Session: ${result.sessionKey.slice(0, 8)}…`]);

      // Poll for completion
      const poll = setInterval(async () => {
        try {
          const s = await api.getSimStatus(decodedId);
          if (!s.isRunning) {
            clearInterval(poll);
            setStatus('done');
            setLog(l => [...l, `[系统] 推演完成。`]);
          }
        } catch { /* ignore */ }
      }, 4000);

    } catch (e) {
      setStatus('idle');
      setLog(l => [...l, `[错误] ${(e as Error).message}`]);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 20px' }}>
      <div style={{ marginBottom: 24 }}>
        <Link to={`/world/${encodeURIComponent(decodedId)}`} style={{ color: '#666', textDecoration: 'none', fontSize: 13 }}>
          ← {decodedId}
        </Link>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginTop: 8 }}>世界推演</h1>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <label style={{ color: '#888', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          推演天数：
          <input
            type="number"
            value={days}
            onChange={e => setDays(Math.max(1, +e.target.value))}
            disabled={status === 'running'}
            style={{
              width: 64, padding: '6px 10px', background: '#1a1a28',
              border: '1px solid #333', color: '#fff', borderRadius: 6,
            }}
          />
        </label>

        <button
          onClick={handleStart}
          disabled={status === 'running'}
          style={{
            padding: '8px 24px',
            background: status === 'running' ? '#333' : 'linear-gradient(135deg, #6b5ce7, #8b5cf6)',
            color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, cursor: status === 'running' ? 'not-allowed' : 'pointer',
          }}
        >
          {status === 'running' ? '◈ 推演中…' : '▶ 开始推演'}
        </button>

        {status === 'running' && (
          <button
            onClick={async () => {
              await api.cancelSim(decodedId);
              setStatus('idle');
              setLog(l => [...l, `[系统] 推演已取消`]);
            }}
            style={{ padding: '8px 16px', background: '#3a1a1a', color: '#e55', border: '1px solid #e55353', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}
          >
            ■ 停止
          </button>
        )}
      </div>

      {/* Log */}
      <div style={{
        background: '#0d0d14',
        border: '1px solid #2a2a3a',
        borderRadius: 10,
        padding: 16,
        height: 480,
        overflowY: 'auto',
        fontFamily: '"Cascadia Code", "Fira Code", monospace',
        fontSize: 13,
      }}>
        {log.length === 0 ? (
          <p style={{ color: '#333', fontStyle: 'italic' }}>等待推演开始…</p>
        ) : (
          log.map((line, i) => (
            <div key={i} style={{ color: line.includes('[错误]') ? '#e55' : line.includes('[系统]') ? '#6b5ce7' : '#aaa', marginBottom: 4, lineHeight: 1.6 }}>
              <span style={{ color: '#333', marginRight: 8 }}>{String(i + 1).padStart(3, '0')}</span>
              {line}
            </div>
          ))
        )}
        <div ref={logEndRef} />
      </div>

      {status === 'done' && (
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <p style={{ color: '#4ade80', marginBottom: 12 }}>✓ 推演完成</p>
          <Link
            to={`/world/${encodeURIComponent(decodedId)}`}
            style={{
              display: 'inline-block',
              padding: '10px 28px',
              background: 'linear-gradient(135deg, #6b5ce7, #8b5cf6)',
              color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 600,
            }}
          >
            查看世界状态
          </Link>
        </div>
      )}
    </div>
  );
}

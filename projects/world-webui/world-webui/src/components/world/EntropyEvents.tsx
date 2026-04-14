import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { EntropyReport } from '@/types';

// ─── Type badge config ───────────────────────────────────────────────────────

const TYPE_META: Record<string, { label: string; bg: string; color: string; icon: string }> = {
  REVELATION:     { label: '真相揭露', bg: '#1a0a2e', color: '#c084fc', icon: '◈' },
  COLLAPSE:        { label: '秩序崩溃', bg: '#1a0a0a', color: '#f87171', icon: '◉' },
  EMERGENCE:       { label: '新事件涌现', bg: '#0a1a0a', color: '#4ade80', icon: '◎' },
  ENTANGLEMENT:    { label: '因果纠缠', bg: '#0a1a1a', color: '#38bdf8', icon: '◐' },
  PHASE_SHIFT:     { label: '相变',     bg: '#1a1a0a', color: '#fbbf24', icon: '◑' },
  UNKNOWN:         { label: '未知',     bg: '#1a1a1a', color: '#6b7280', icon: '◇' },
};

const STATUS_META: Record<string, { label: string; color: string }> = {
  active:    { label: '活跃', color: '#f87171' },
  dormant:    { label: '休眠', color: '#fbbf24' },
  resolved:   { label: '已解决', color: '#4ade80' },
  escalating: { label: '升级中', color: '#fb923c' },
  unknown:    { label: '未知', color: '#6b7280' },
};

function getTypeMeta(type: string) {
  return TYPE_META[type.toUpperCase()] ?? TYPE_META.UNKNOWN;
}

function getStatusMeta(status: string) {
  return STATUS_META[status.toLowerCase()] ?? STATUS_META.unknown;
}

// ─── Event card ─────────────────────────────────────────────────────────────

function EventCard({ report }: { report: EntropyReport }) {
  const [expanded, setExpanded] = useState(false);
  const type = getTypeMeta(report.type ?? 'UNKNOWN');
  const status = getStatusMeta(report.status ?? 'unknown');

  return (
    <div style={{
      background: '#0f0f1a',
      border: `1px solid ${type.color}33`,
      borderRadius: 12,
      overflow: 'hidden',
      transition: 'border-color 0.2s',
    }}>
      {/* Header */}
      <div
        onClick={() => setExpanded(v => !v)}
        style={{
          padding: '16px 20px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
          userSelect: 'none',
        }}
      >
        {/* Type icon */}
        <div style={{
          width: 36, height: 36,
          borderRadius: 8,
          background: type.bg,
          border: `1px solid ${type.color}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, color: type.color,
          flexShrink: 0,
        }}>
          {type.icon}
        </div>

        {/* Main info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            {/* Type badge */}
            <span style={{
              padding: '2px 8px',
              borderRadius: 4,
              background: type.bg,
              border: `1px solid ${type.color}44`,
              color: type.color,
              fontSize: 11, fontWeight: 600,
            }}>
              {type.label}
            </span>
            {/* Status badge */}
            <span style={{
              padding: '2px 8px',
              borderRadius: 4,
              background: '#1a1a1a',
              border: `1px solid ${status.color}44`,
              color: status.color,
              fontSize: 11, fontWeight: 600,
            }}>
              {status.label}
            </span>
          </div>

          {/* Title */}
          <p style={{ color: '#fff', fontWeight: 700, fontSize: 15, margin: 0, lineHeight: 1.4 }}>
            {report.title ?? report.id}
          </p>

          {/* Meta row */}
          <div style={{ display: 'flex', gap: 16, marginTop: 6, flexWrap: 'wrap' }}>
            {report.date && (
              <span style={{ color: '#555', fontSize: 12 }}>
                ⏱ {report.date}
              </span>
            )}
            <span style={{ color: '#555', fontSize: 12 }}>
              ID: <code style={{ color: '#444', fontSize: 11 }}>{report.id}</code>
            </span>
          </div>
        </div>

        {/* Expand chevron */}
        <div style={{
          color: '#444', fontSize: 18, flexShrink: 0, marginTop: 8,
          transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s',
        }}>
          ▾
        </div>
      </div>

      {/* Summary (always visible when collapsed) */}
      {!expanded && report.summary && (
        <div style={{
          padding: '0 20px 16px 68px',
          color: '#777', fontSize: 13, lineHeight: 1.7,
        }}>
          {report.summary}
        </div>
      )}

      {/* Full report (only when expanded) */}
      {expanded && (
        <div style={{
          borderTop: `1px solid #1e1e2e`,
          padding: '16px 20px',
        }}>
          {/* Report markdown */}
          <div className="entropy-report-content">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 700, marginBottom: 12, borderBottom: '1px solid #2a2a3a', paddingBottom: 8 }}>{children}</h1>,
                h2: ({ children }) => <h2 style={{ color: '#e0e0e0', fontSize: 16, fontWeight: 700, marginTop: 20, marginBottom: 8 }}>{children}</h2>,
                h3: ({ children }) => <h3 style={{ color: '#ccc', fontSize: 14, fontWeight: 600, marginTop: 16, marginBottom: 6 }}>{children}</h3>,
                p: ({ children }) => <p style={{ color: '#a0a0a0', fontSize: 14, lineHeight: 1.8, marginBottom: 12 }}>{children}</p>,
                ul: ({ children }) => <ul style={{ color: '#a0a0a0', fontSize: 14, lineHeight: 1.8, paddingLeft: 20, marginBottom: 12 }}>{children}</ul>,
                ol: ({ children }) => <ol style={{ color: '#a0a0a0', fontSize: 14, lineHeight: 1.8, paddingLeft: 20, marginBottom: 12 }}>{children}</ol>,
                li: ({ children }) => <li style={{ marginBottom: 4 }}>{children}</li>,
                table: ({ children }) => (
                  <div style={{ overflowX: 'auto', marginBottom: 12 }}>
                    <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 13 }}>
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => <thead style={{ background: '#1a1a28' }}>{children}</thead>,
                tbody: ({ children }) => <tbody>{children}</tbody>,
                tr: ({ children }) => <tr style={{ borderBottom: '1px solid #2a2a3a' }}>{children}</tr>,
                th: ({ children }) => <th style={{ padding: '6px 12px', color: '#888', fontWeight: 600, textAlign: 'left' }}>{children}</th>,
                td: ({ children }) => <td style={{ padding: '6px 12px', color: '#a0a0a0' }}>{children}</td>,
                blockquote: ({ children }) => (
                  <blockquote style={{ borderLeft: '3px solid #333', paddingLeft: 16, color: '#777', margin: '12px 0' }}>{children}</blockquote>
                ),
                hr: () => <hr style={{ border: 'none', borderTop: '1px solid #2a2a3a', margin: '16px 0' }} />,
                strong: ({ children }) => <strong style={{ color: '#e0e0e0', fontWeight: 700 }}>{children}</strong>,
                em: ({ children }) => <em style={{ color: '#888' }}>{children}</em>,
                code: ({ children }) => (
                  <code style={{ background: '#1a1a28', color: '#c084fc', padding: '1px 5px', borderRadius: 4, fontSize: 12 }}>{children}</code>
                ),
              }}
            >
              {report.content ?? ''}
            </ReactMarkdown>
          </div>

          {/* Collapse button */}
          <button
            onClick={() => setExpanded(false)}
            style={{
              marginTop: 12, padding: '6px 16px',
              background: 'transparent',
              border: '1px solid #333',
              borderRadius: 6, color: '#666',
              fontSize: 12, cursor: 'pointer',
            }}
          >
            收起报告 ▴
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

interface EntropyEventsProps {
  reports: EntropyReport[];
}

export default function EntropyEvents({ reports }: EntropyEventsProps) {
  if (!reports || reports.length === 0) {
    return (
      <div style={{
        textAlign: 'center', padding: '48px 0',
        color: '#444', fontSize: 14,
      }}>
        目前尚无熵变事件记录
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {reports.map(report => (
        <EventCard key={report.id} report={report} />
      ))}
    </div>
  );
}

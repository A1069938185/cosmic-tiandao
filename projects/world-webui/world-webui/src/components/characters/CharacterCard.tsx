import { useState } from 'react';
import type { CharacterMeta, WorldDimension } from '@/types';

const STATUS_TEXT: Record<string, string> = {
  active: '活跃',
  missing: '失联',
  deceased: '已故',
  unknown: '未知',
};

interface Props {
  char: CharacterMeta;
  worldId: string;
  /** World dimension definitions — used to resolve layerTags → color + name */
  dimensions?: WorldDimension[];
}

export default function CharacterCard({ char, dimensions = [] }: Props) {
  const [expanded, setExpanded] = useState(false);

  // Resolve primary layer tag → color + name
  const primaryTag = char.layerTags[0] ?? char.layer;
  const layerInfo = findLayerInfo(primaryTag, dimensions);
  const layerColor = layerInfo?.color ?? '#888';
  const layerName = layerInfo?.name ?? (typeof primaryTag === 'string' ? primaryTag : '未知');

  return (
    <div
      style={{
        background: '#12121a',
        border: '1px solid #2a2a3a',
        borderRadius: 12,
        padding: 16,
        cursor: 'pointer',
        transition: 'border-color 0.2s',
      }}
      onClick={() => setExpanded(e => !e)}
      onMouseEnter={e => (e.currentTarget.style.borderColor = layerColor)}
      onMouseLeave={e => (e.currentTarget.style.borderColor = '#2a2a3a')}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{char.name}</h3>
          <p style={{ fontSize: 12, color: '#666', marginTop: 2 }}>{char.role}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: layerColor, marginBottom: 4, marginLeft: 'auto' }} />
          <span style={{ fontSize: 11, color: '#555' }}>{layerName}</span>
        </div>
      </div>

      <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Tag color={layerColor}>{STATUS_TEXT[char.status] ?? char.status}</Tag>
        {char.layerTags.map(tag => {
          const info = findLayerInfo(tag, dimensions);
          return (
            <Tag key={tag} color={info?.color ?? '#555'}>
              {info?.name ?? tag}
            </Tag>
          );
        })}
        <Tag color="#555">{char.id}</Tag>
      </div>

      {char.note && (
        <p style={{ fontSize: 12, color: '#555', marginTop: 8, fontStyle: 'italic' }}>
          {char.note}
        </p>
      )}
    </div>
  );
}

function Tag({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span style={{ fontSize: 11, padding: '2px 8px', background: `${color}22`, color, borderRadius: 4 }}>
      {children}
    </span>
  );
}

/** Look up a layer by id across all dimensions */
function findLayerInfo(
  layerId: string | undefined,
  dimensions: WorldDimension[]
): { name: string; color: string } | undefined {
  if (!layerId) return undefined;
  for (const dim of dimensions) {
    const layer = dim.layers.find(l => l.id === layerId);
    if (layer) return { name: layer.name, color: layer.color };
  }
  return undefined;
}

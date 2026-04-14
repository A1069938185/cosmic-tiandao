import type { WorldDimension } from '@/types';

interface Props {
  /** Entropy value per layer, aligned with dimensions[].layers order */
  entropy: number[];
  /** World dimension definitions from world.md */
  dimensions: WorldDimension[];
}

export default function EntropyGauge({ entropy, dimensions }: Props) {
  // Build a flat list of (dimensionName, layerName, layerColor, value)
  const bars: { dimName: string; layerName: string; color: string; value: number }[] = [];
  for (const dim of dimensions) {
    for (const layer of dim.layers) {
      const idx = bars.length;
      bars.push({
        dimName: dim.name,
        layerName: layer.name,
        color: layer.color,
        value: entropy[idx] ?? 0,
      });
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {bars.map((bar, i) => (
        <LayerBar key={i} label={`${bar.dimName} · ${bar.layerName}`} value={bar.value} color={bar.color} />
      ))}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#555', marginTop: 4 }}>
        <span>稳定</span>
        <span>活跃</span>
        <span>混沌</span>
      </div>
    </div>
  );
}

function LayerBar({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.min(100, Math.max(0, value * 10));
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: '#888' }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color }}>{value.toFixed(1)}</span>
      </div>
      <div style={{ height: 6, background: '#1a1a28', borderRadius: 3, overflow: 'hidden' }}>
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${color}88, ${color})`,
            borderRadius: 3,
            transition: 'width 0.5s ease',
          }}
        />
      </div>
    </div>
  );
}

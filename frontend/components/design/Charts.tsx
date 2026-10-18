'use client';
import type { DesignResult } from '@/lib/types';
import { fixed, thousands } from '@/lib/design-defaults';

const COLORS: Record<string, string> = {
  ac: '#8B4513', dbm: '#FF69B4', base: '#90EE90', subbase: '#4169E1', capping: '#FF8C00', subgrade: '#556B2F',
};

/** Pavement cross-section to scale; labels are spread out so thin layers stay readable. */
export function CrossSection({ result }: { result: DesignResult }) {
  const width = 520, top = 16, pavementHeight = 260, subgradeHeight = 60, x = 140, colWidth = 130, gap = 17;
  const total = result.totalThicknessMm || 1;
  const blocks: Array<{ key: string; y: number; h: number; label: string; ok: boolean }> = [];
  let y = top;
  for (const layer of result.layers) {
    const h = layer.thicknessMm > 0 ? Math.max(3, (layer.thicknessMm / total) * pavementHeight) : 0;
    blocks.push({ key: layer.key, y, h, label: `${fixed(layer.thicknessMm, 1)} mm  ${layer.name}`, ok: layer.checkOk });
    y += h;
  }
  const pavementBottom = y;
  blocks.push({
    key: 'subgrade', y, h: subgradeHeight, ok: true,
    label: result.cbrIsEstimated ? `Subgrade (MR ${thousands(result.mrPsi.subgrade ?? 0)} psi)`
      : `Subgrade (CBR ${fixed(result.cbr.subgrade ?? 0, 1)} %)`,
  });
  const height = y + subgradeHeight + 12;

  const visible = blocks.filter((b) => b.h > 0);
  const labels: number[] = [];
  visible.forEach((b, i) => labels.push(Math.max(b.y + b.h / 2, i ? labels[i - 1] + gap : -Infinity)));
  for (let i = labels.length - 1, limit = height - 8; i >= 0; i--) {
    labels[i] = Math.min(labels[i], limit);
    limit = labels[i] - gap;
  }
  const midY = (top + pavementBottom) / 2;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full text-slate-700" role="img" aria-label="Pavement cross-section">
      {visible.map((b, i) => (
        <g key={b.key}>
          <rect x={x} y={b.y} width={colWidth} height={b.h} fill={COLORS[b.key]}
            stroke={b.ok ? '#222' : '#d92d20'} strokeWidth={b.ok ? 1 : 2.5} />
          <line x1={x + colWidth} y1={b.y + b.h / 2} x2={x + colWidth + 18} y2={labels[i]} stroke="currentColor" strokeOpacity={0.45} />
          <text x={x + colWidth + 22} y={labels[i] + 4} fontSize={12} fill="currentColor">{b.label}{b.ok ? '' : '  ✗'}</text>
        </g>
      ))}
      <line x1={x - 18} y1={top} x2={x - 18} y2={pavementBottom} stroke="currentColor" strokeWidth={1.2} />
      <line x1={x - 24} y1={top} x2={x - 12} y2={top} stroke="currentColor" />
      <line x1={x - 24} y1={pavementBottom} x2={x - 12} y2={pavementBottom} stroke="currentColor" />
      <text x={x - 28} y={midY} fontSize={12} fill="currentColor" textAnchor="middle" transform={`rotate(-90 ${x - 28} ${midY})`}>
        Total {fixed(result.totalThicknessMm, 1)} mm
      </text>
    </svg>
  );
}

/** Horizontal bars: cumulative SN at the bottom of each layer, with the required SN marked in red. */
export function SnChart({ result }: { result: DesignResult }) {
  const width = 520, left = 120, right = 70, rowHeight = 44, top = 30;
  const max = Math.max(result.requiredTotalSn, result.totalSn, ...result.layers.map((l) => l.requiredSn)) * 1.08 || 1;
  const scale = (v: number) => left + (v / max) * (width - left - right);
  const height = top + result.layers.length * rowHeight + 10;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full text-slate-700" role="img"
      aria-label="Cumulative structural number against the requirement for each layer">
      <rect x={left} y={8} width={12} height={10} rx={2} fill="#2E86AB" />
      <text x={left + 16} y={17} fontSize={12} fill="currentColor">Cumulative SN</text>
      <line x1={left + 130} y1={6} x2={left + 130} y2={20} stroke="#d92d20" strokeWidth={3} />
      <text x={left + 136} y={17} fontSize={12} fill="currentColor">Required SN at layer bottom</text>
      {result.layers.map((layer, i) => {
        const y = top + i * rowHeight;
        const rx = scale(layer.requiredSn);
        return (
          <g key={layer.key}>
            <text x={left - 8} y={y + 18} fontSize={12} fill="currentColor" textAnchor="end">{layer.name}</text>
            <rect x={left} y={y + 6} width={Math.max(0, scale(layer.cumulativeSn) - left)} height={18} rx={3}
              fill={layer.checkOk ? '#2E86AB' : '#d92d20'} opacity={0.85} />
            <line x1={rx} y1={y + 1} x2={rx} y2={y + 29} stroke="#d92d20" strokeWidth={3} />
            <text x={Math.max(scale(layer.cumulativeSn), rx) + 6} y={y + 19} fontSize={11} fill="#64748b">
              {fixed(layer.cumulativeSn)} / {fixed(layer.requiredSn)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

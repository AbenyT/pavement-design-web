'use client';
import { useId } from 'react';
import { MATERIALS, PavementDefs, patternId, type MaterialKey } from './pavementTextures';

const DEFAULT: Array<[MaterialKey, number]> = [['ac', 1], ['dbm', 1.3], ['base', 2.2], ['subbase', 2.4], ['capping', 1.8], ['subgrade', 2.4]];

/** Decorative textured pavement block (no design numbers), for the home page. */
export function LayerStack({ layers = DEFAULT, labels = false, className = '' }:
  { layers?: Array<[MaterialKey, number]>; labels?: boolean; className?: string }) {
  const prefix = `ls${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const W = labels ? 400 : 228, bw = 200, skew = 26, depth = 16, top = depth + 2;
  const unit = 150 / layers.reduce((sum, [, weight]) => sum + weight, 0);
  const blocks: Array<{ key: MaterialKey; y: number; h: number }> = [];
  let y = top;
  for (const [key, weight] of layers) {
    blocks.push({ key, y, h: weight * unit });
    y += weight * unit;
  }
  const H = y + 2;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} aria-hidden="true">
      <PavementDefs prefix={prefix} />
      <mask id={`${prefix}-bottom`} maskContentUnits="objectBoundingBox">
        <rect width="1" height="1" fill={`url(#${prefix}-fade)`} />
      </mask>
      <g mask={`url(#${prefix}-bottom)`}>
        {blocks.map((b) => {
          const fill = `url(#${patternId(prefix, b.key)})`;
          const side = `${bw},${b.y} ${bw + skew},${b.y - depth} ${bw + skew},${b.y + b.h - depth} ${bw},${b.y + b.h}`;
          return (
            <g key={b.key}>
              <polygon points={side} fill={fill} /><polygon points={side} fill="#000" fillOpacity={0.35} />
              <rect x={0} y={b.y} width={bw} height={b.h} fill={fill} />
              <line x1={0} x2={bw} y1={b.y + b.h} y2={b.y + b.h} stroke="#000" strokeOpacity={0.45} strokeWidth={0.7} />
            </g>
          );
        })}
      </g>
      <polygon points={`0,${top} ${skew},${top - depth} ${bw + skew},${top - depth} ${bw},${top}`} fill={`url(#${patternId(prefix, blocks[0].key)})`} />
      <polygon points={`0,${top} ${skew},${top - depth} ${bw + skew},${top - depth} ${bw},${top}`} fill={`url(#${prefix}-sheen)`} />
      {labels && blocks.map((b) => (
        <g key={`l-${b.key}`}>
          <line x1={bw + skew + 6} x2={bw + skew + 20} y1={b.y + b.h / 2 - depth / 2} y2={b.y + b.h / 2 - depth / 2} stroke="#fff" strokeOpacity={0.5} />
          <text x={bw + skew + 26} y={b.y + b.h / 2 - depth / 2 + 4} fontSize={11} fill="#fff" fillOpacity={0.85}>{MATERIALS[b.key].material}</text>
        </g>
      ))}
    </svg>
  );
}

/** A plain area filled with one material texture (decorative). */
export function TextureFill({ material, scale = 1.6, className = '' }: { material: MaterialKey; scale?: number; className?: string }) {
  const prefix = `tf${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <svg className={className} aria-hidden="true" preserveAspectRatio="none">
      <PavementDefs prefix={prefix} scale={scale} />
      <rect width="100%" height="100%" fill={`url(#${patternId(prefix, material)})`} />
    </svg>
  );
}

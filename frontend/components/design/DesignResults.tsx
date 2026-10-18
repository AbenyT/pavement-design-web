'use client';
import type { DesignInput, DesignResult, LayerKey } from '@/lib/types';
import { fixed } from '@/lib/design-defaults';
import { Card } from '../ui';
import { CrossSection, SnChart } from './Charts';
import { ThicknessField } from './fields';

interface Props {
  result: DesignResult;
  inputs: DesignInput;
  stale: boolean;
  setThickness: (key: LayerKey, mm: number | null) => void;
  setValidity: (field: string, valid: boolean) => void;
}

/** Right-hand side: verdict, layer table with thickness boxes, notes and drawings. */
export function DesignResults({ result, inputs, stale, setThickness, setValidity }: Props) {
  const r = result;
  const detail = r.adequate
    ? `Total SN ${fixed(r.totalSn)} ≥ required ${fixed(r.requiredTotalSn)}, and every layer passes its check.`
    : r.totalOk
      ? `The total SN is met, but the layer check failed for: ${r.failedLayers.join(', ')}.`
      : `Total SN ${fixed(r.totalSn)} < required ${fixed(r.requiredTotalSn)} (short by ${fixed(r.requiredTotalSn - r.totalSn)}).`
        + (r.failedLayers.length ? ` Layer check failed for: ${r.failedLayers.join(', ')}.` : '');

  return (
    <div className="space-y-4" aria-live="polite">
      <section className={`rounded-xl border-2 p-5 ${stale ? 'border-slate-300 bg-amber-50'
        : r.adequate ? 'border-green-600 bg-green-50' : 'border-red-600 bg-red-50'}`}>
        <p className={`text-xl font-bold ${stale ? 'text-slate-600' : r.adequate ? 'text-green-800' : 'text-red-700'}`}>
          {stale ? '⚠️ Results not updated' : r.adequate ? '✅ Design is ADEQUATE' : '❌ Design is NOT ADEQUATE'}
        </p>
        <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[['Total SN', fixed(r.totalSn)], ['Required SN', fixed(r.requiredTotalSn)],
            ['Total thickness', `${fixed(r.totalThicknessMm, 1)} mm`], ['ZR', fixed(r.zr)]].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
              <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
              <dd className="text-lg font-semibold tabular-nums text-slate-900">{stale ? '—' : value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-sm text-slate-700">
          {stale ? 'An input cannot be read, so these results are out of date. Fix the red field and they update automatically.' : detail}
        </p>
      </section>

      <Card className={stale ? 'opacity-50' : ''}>
        <h2 className="font-semibold text-slate-900">Layer-by-layer design</h2>
        <p className="mt-1 text-xs text-slate-500">
          Each box shows the <strong>minimum thickness</strong>. Leave it empty to use it, or type your own
          (250, 250mm, 25cm, 10in). The SN so far must reach the SN required on the layer below.
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="py-2 pr-2">#</th><th className="pr-2">Layer</th><th className="pr-2">Thickness (mm)</th>
                <th className="pr-2">Min (mm)</th><th className="pr-2">SN added</th><th className="pr-2">Cumulative</th>
                <th className="pr-2">Required</th><th>Check</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {r.layers.map((layer) => (
                <tr key={layer.key} className={`border-b border-slate-100 ${layer.checkOk ? '' : 'bg-red-50'}`}>
                  <td className="py-2 pr-2 text-slate-500">{layer.number}</td>
                  <td className="pr-2">
                    <span className="font-medium text-slate-800">{layer.name}</span>
                    <span className="block text-xs text-slate-400">
                      on {layer.supports} · {layer.coefficientSymbol} = {layer.a}
                      {layer.key === 'ac' ? '' : ` · m${layer.coefficientSymbol.slice(1)} = ${layer.m}`}
                    </span>
                  </td>
                  <td className="pr-2">
                    <div className="flex items-center gap-1">
                      <ThicknessField label={`${layer.name} thickness`} value={inputs.thicknessMm[layer.key]}
                        placeholderMm={layer.suggestedThicknessMm} onChange={(mm) => setThickness(layer.key, mm)}
                        onValidity={(ok) => setValidity(`thickness.${layer.key}`, ok)} />
                      {layer.thicknessIsCustom && (
                        <button type="button" onClick={() => setThickness(layer.key, null)}
                          className="px-1 text-xs text-blue-700 hover:underline">use min</button>
                      )}
                    </div>
                  </td>
                  <td className="pr-2">{fixed(layer.minThicknessMm, 1)}</td>
                  <td className="pr-2">{fixed(layer.snContribution)}</td>
                  <td className="pr-2">{fixed(layer.cumulativeSn)}</td>
                  <td className="pr-2">{fixed(layer.requiredSn)}</td>
                  <td className={`font-semibold ${layer.checkOk ? 'text-green-700' : 'text-red-700'}`}>
                    {layer.checkOk ? '✅ OK' : '❌ NOT OK'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(r.layers.some((l) => l.notes.length) || r.warnings.length > 0) && (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
            {r.layers.flatMap((l) => l.notes.map((note) => (
              <li key={`${l.key}-${note}`} className={note.includes('below the minimum') ? 'text-red-700' : 'text-slate-600'}>
                Layer {l.number} ({l.name}): {note}
              </li>
            )))}
            {r.warnings.map((w) => <li key={w} className="text-amber-800">{w}</li>)}
          </ul>
        )}
      </Card>

      <div className={`grid gap-4 xl:grid-cols-2 ${stale ? 'opacity-50' : ''}`}>
        <Card><h2 className="mb-2 font-semibold text-slate-900">Cross-section</h2><CrossSection result={r} /></Card>
        <Card><h2 className="mb-2 font-semibold text-slate-900">Cumulative SN vs required</h2><SnChart result={r} /></Card>
      </div>
    </div>
  );
}

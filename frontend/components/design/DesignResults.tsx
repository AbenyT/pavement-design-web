'use client';
import type { DesignInput, DesignResult, LayerKey } from '@/lib/types';
import { fixed } from '@/lib/design-defaults';
import { Alert, CheckCircle, XCircle } from '../icons';
import { Card } from '../ui';
import { CrossSectionPanel, SnChart } from './Charts';
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

  const tone = stale ? 'stale' : r.adequate ? 'ok' : 'bad';
  const VerdictIcon = tone === 'stale' ? Alert : tone === 'ok' ? CheckCircle : XCircle;

  return (
    <div className="space-y-4" aria-live="polite">
      {/* Verdict: a dark panel, like the feature card in the reference design. */}
      <section className="shadow-float overflow-hidden rounded-2xl bg-[#111113] p-5 text-white sm:p-6">
        <div className="flex items-start gap-3">
          <span className={`mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
            tone === 'ok' ? 'bg-[#16a34a]' : tone === 'bad' ? 'bg-[#dc2626]' : 'bg-[#b54708]'}`}>
            <VerdictIcon size={20} />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/55">Design verdict</p>
            <p className="text-2xl font-semibold tracking-[-0.02em]">
              {stale ? 'Results not updated' : r.adequate ? 'Design is ADEQUATE' : 'Design is NOT ADEQUATE'}
            </p>
          </div>
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-white/10 sm:grid-cols-4">
          {[['Total SN', fixed(r.totalSn)], ['Required SN', fixed(r.requiredTotalSn)],
            ['Total thickness', `${fixed(r.totalThicknessMm, 1)} mm`], ['ZR', fixed(r.zr)]].map(([label, value]) => (
            <div key={label} className="bg-[#111113] px-4 py-3">
              <dt className="text-[11px] uppercase tracking-[0.12em] text-white/55">{label}</dt>
              <dd className="num mt-0.5 text-lg font-semibold text-white">{stale ? '—' : value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-sm text-white/75">
          {stale ? 'An input cannot be read, so these results are out of date. Fix the red field and they update automatically.' : detail}
        </p>
      </section>

      <Card className={stale ? 'opacity-50' : ''}>
        <h2 className="font-semibold text-ink">Layer-by-layer design</h2>
        <div className="-mx-5 mt-4 overflow-x-auto px-5 sm:-mx-6 sm:px-6">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-[11px] uppercase tracking-[0.1em] text-subtle">
                <th className="py-2 pr-2 font-medium">#</th><th className="pr-2 font-medium">Layer</th>
                <th className="pr-2 font-medium">Thickness (mm)</th><th className="pr-2 font-medium">Min (mm)</th>
                <th className="pr-2 font-medium">SN added</th><th className="pr-2 font-medium">Cumulative</th>
                <th className="pr-2 font-medium">Required</th><th className="font-medium">Check</th>
              </tr>
            </thead>
            <tbody>
              {r.layers.map((layer) => (
                <tr key={layer.key} className={`border-b border-line last:border-0 ${layer.checkOk ? '' : 'bg-bad-soft'}`}>
                  <td className="num py-3 pr-2 text-subtle">{layer.number}</td>
                  <td className="py-3 pr-2">
                    <span className="font-medium text-ink">{layer.name}</span>
                    <span className="block text-xs text-subtle">
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
                          className="whitespace-nowrap px-1 text-xs font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">use min</button>
                      )}
                    </div>
                  </td>
                  <td className="num pr-2 text-muted">{fixed(layer.minThicknessMm, 1)}</td>
                  <td className="num pr-2">{fixed(layer.snContribution)}</td>
                  <td className="num pr-2">{fixed(layer.cumulativeSn)}</td>
                  <td className="num pr-2">{fixed(layer.requiredSn)}</td>
                  <td className={`font-semibold ${layer.checkOk ? 'text-ok' : 'text-bad'}`}>
                    <span className="inline-flex items-center gap-1 whitespace-nowrap">
                      {layer.checkOk ? <><CheckCircle size={15} />OK</> : <><XCircle size={15} />NOT OK</>}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(r.layers.some((l) => l.notes.length) || r.warnings.length > 0) && (
          <ul className="mt-4 list-disc space-y-1 pl-5 text-sm">
            {r.layers.flatMap((l) => l.notes.map((note) => (
              <li key={`${l.key}-${note}`} className={note.includes('below the minimum') ? 'text-bad' : 'text-muted'}>
                Layer {l.number} ({l.name}): {note}
              </li>
            )))}
            {r.warnings.map((w) => <li key={w} className="text-warn">{w}</li>)}
          </ul>
        )}
      </Card>

      <div className={`space-y-4 ${stale ? 'opacity-50' : ''}`}>
        <CrossSectionPanel result={r} />
        <Card>
          <h2 className="mb-3 font-semibold text-ink">Cumulative SN vs required</h2>
          <SnChart result={r} />
        </Card>
      </div>
    </div>
  );
}

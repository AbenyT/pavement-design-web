'use client';
import type { DesignInput, DesignResult, LayerKey, SupportKey, UnboundKey } from '@/lib/types';
import { fixed, thousands } from '@/lib/design-defaults';
import { Card } from '../ui';
import { NumberField } from './fields';

interface Props {
  inputs: DesignInput;
  result: DesignResult | null;
  update: (patch: Partial<DesignInput>) => void;
  setValidity: (field: string, valid: boolean) => void;
}

const SUPPORTS: Array<{ key: SupportKey; label: string }> = [
  { key: 'dbm', label: 'Surface / DBM (asphalt)' },
  { key: 'base', label: 'Base' },
  { key: 'subbase', label: 'Subbase' },
  { key: 'capping', label: 'Capping layer' },
  { key: 'subgrade', label: 'Subgrade' },
];

const COEFFICIENTS: Array<{ key: LayerKey; label: string; n: number }> = [
  { key: 'ac', label: 'AC course', n: 1 },
  { key: 'dbm', label: 'DBM', n: 2 },
  { key: 'base', label: 'Base', n: 3 },
  { key: 'subbase', label: 'Subbase', n: 4 },
  { key: 'capping', label: 'Capping', n: 5 },
];

function Section({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <Card>
      <h2 className="mb-4 font-semibold text-slate-900">{number} · {title}</h2>
      {children}
    </Card>
  );
}

/** The left-hand form: design conditions, structure, layer support, coefficients and options. */
export function DesignInputsPanel({ inputs, result, update, setValidity }: Props) {
  const active = (key: SupportKey | LayerKey) =>
    (key !== 'dbm' || inputs.useDbmLayer) && (key !== 'capping' || inputs.useCappingLayer);
  const valid = (field: string) => (ok: boolean) => setValidity(field, ok);

  return (
    <div className="space-y-4">
      <Section number={1} title="Design conditions">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <NumberField label="Reliability R" unit="%" value={inputs.reliability} min={50} max={99.99}
            onChange={(v) => update({ reliability: v })} onValidity={valid('reliability')} />
          <NumberField label="Standard deviation So" value={inputs.so} min={0.01} max={1}
            onChange={(v) => update({ so: v })} onValidity={valid('so')} />
          <NumberField label="Design traffic W18" unit="×10⁶ ESAL" value={inputs.w18} min={0.0001}
            onChange={(v) => update({ w18: v })} onValidity={valid('w18')} />
          <NumberField label="Serviceability loss ΔPSI" value={inputs.dpsi} min={0.01} max={5}
            onChange={(v) => update({ dpsi: v })} onValidity={valid('dpsi')} />
        </div>
      </Section>

      <Section number={2} title="Pavement structure">
        <p className="mb-3 text-xs text-slate-500">AC course, base and subbase are always included — a design has 3, 4 or 5 layers.</p>
        {([['useDbmLayer', 'DBM layer (Dense Bituminous Macadam) under the AC course'],
          ['useCappingLayer', 'Capping layer above the subgrade']] as const).map(([field, label]) => (
          <label key={field} className="mb-2 flex items-start gap-2 text-sm text-slate-800">
            <input type="checkbox" className="mt-0.5 h-4 w-4 accent-blue-700" checked={inputs[field]}
              onChange={(e) => update({ [field]: e.target.checked } as Partial<DesignInput>)} />
            {label}
          </label>
        ))}
      </Section>

      <Section number={3} title="Layer support (resilient modulus)">
        <div className="mb-3 inline-flex overflow-hidden rounded-lg border border-slate-300 text-sm" role="radiogroup">
          {([['cbr', 'From CBR'], ['mr', 'Enter MR (psi)']] as const).map(([value, label]) => (
            <button key={value} type="button" role="radio" aria-checked={inputs.mrMethod === value}
              onClick={() => update({ mrMethod: value })}
              className={`px-3 py-1.5 ${inputs.mrMethod === value ? 'bg-blue-700 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'}`}>
              {label}
            </button>
          ))}
        </div>
        <p className="mb-3 text-xs text-slate-500">
          {inputs.mrMethod === 'cbr'
            ? 'MR = 1500·CBR (CBR ≤ 5 %), else 145·17.6·CBR^0.64 psi — for base, subbase, capping and subgrade. The DBM is asphalt: its MR is always entered directly.'
            : 'Enter each layer\'s resilient modulus in psi. The CBR shown is only an estimate.'}
        </p>
        <div className="space-y-3">
          {SUPPORTS.filter((s) => active(s.key)).map(({ key, label }) => {
            const useCbr = inputs.mrMethod === 'cbr' && key !== 'dbm';
            const derived = result
              ? key === 'dbm' ? 'asphalt (MR)'
                : useCbr ? (result.mrPsi[key] !== undefined ? `→ ${thousands(result.mrPsi[key] as number)} psi` : '')
                  : (result.cbr[key as UnboundKey] !== undefined ? `≈ CBR ${fixed(result.cbr[key as UnboundKey] as number, 1)} %` : '')
              : '';
            return (
              <div key={`${key}-${useCbr ? 'cbr' : 'mr'}`} className="grid grid-cols-[1fr_auto] items-end gap-3">
                {useCbr ? (
                  <NumberField label={`${label} CBR`} unit="%" value={inputs.cbr[key as UnboundKey]} min={0.01}
                    onChange={(v) => update({ cbr: { ...inputs.cbr, [key]: v } })} onValidity={valid(`cbr.${key}`)} />
                ) : (
                  <NumberField label={`${label} MR`} unit="psi" value={inputs.mrPsi[key]} min={1}
                    onChange={(v) => update({ mrPsi: { ...inputs.mrPsi, [key]: v } })} onValidity={valid(`mrPsi.${key}`)} />
                )}
                <span className="w-28 pb-2.5 text-right text-xs tabular-nums text-slate-500">{derived}</span>
              </div>
            );
          })}
        </div>
      </Section>

      <Section number={4} title="Layer & drainage coefficients">
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_6rem_6rem] gap-3 text-xs font-medium uppercase tracking-wide text-slate-400">
            <span>Layer</span><span>a</span><span>m</span>
          </div>
          {COEFFICIENTS.filter((c) => active(c.key)).map(({ key, label, n }) => (
            <div key={key} className="grid grid-cols-[1fr_6rem_6rem] items-center gap-3">
              <span className="text-sm text-slate-700">{label} <span className="text-slate-400">(a{n}{key === 'ac' ? '' : `, m${n}`})</span></span>
              <NumberField label={`a${n} (${label})`} hideLabel value={inputs.a[key]} min={key === 'ac' ? 0.001 : 0} max={1}
                onChange={(v) => update({ a: { ...inputs.a, [key]: v } })} onValidity={valid(`a.${key}`)} />
              {key === 'ac' ? <span className="text-sm text-slate-400">1.0</span> : (
                <NumberField label={`m${n} (${label})`} hideLabel value={inputs.m[key]} min={0.4} max={1.4}
                  onChange={(v) => update({ m: { ...inputs.m, [key]: v } })} onValidity={valid(`m.${key}`)} />
              )}
            </div>
          ))}
          <p className="text-xs text-slate-400">Drainage coefficient m: AASHTO 1993 range 0.4 – 1.4.</p>
        </div>
      </Section>

      <Section number={5} title="Options">
        <label className="mb-3 block text-sm text-slate-600">
          <span className="mb-1 block">Round suggested thickness up to</span>
          <select className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            value={inputs.roundUpToMm ?? ''} onChange={(e) => update({ roundUpToMm: e.target.value ? Number(e.target.value) : null })}>
            <option value="">Off (exact minimum, 0.1 mm)</option>
            <option value="5">5 mm</option>
            <option value="10">10 mm</option>
            <option value="25">25 mm</option>
          </select>
        </label>
        <label className="flex items-start gap-2 text-sm text-slate-800">
          <input type="checkbox" className="mt-0.5 h-4 w-4 accent-blue-700" checked={inputs.enforceAashtoMinimums}
            onChange={(e) => update({ enforceAashtoMinimums: e.target.checked })} />
          Apply AASHTO 1993 minimum AC and base thickness for the traffic level
        </label>
      </Section>
    </div>
  );
}

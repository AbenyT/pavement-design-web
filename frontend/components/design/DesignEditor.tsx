'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { DEFAULT_INPUT, withDefaults } from '@/lib/design-defaults';
import type { DesignInput, DesignResult, LayerKey } from '@/lib/types';
import { Button, ErrorBox, inputClass, Loading } from '../ui';
import { DesignInputsPanel } from './DesignInputsPanel';
import { DesignResults } from './DesignResults';

interface Props {
  initialInputs?: Partial<DesignInput>;
  initialName?: string;
  /** Called with the name and inputs when the user clicks Save; omit for the public calculator. */
  onSave?: (name: string, inputs: DesignInput) => Promise<void>;
  saveLabel?: string;
}

/** Inputs on the left, live results on the right (recalculated by the API as you type). */
export function DesignEditor({ initialInputs, initialName = '', onSave, saveLabel = 'Save design' }: Props) {
  const [inputs, setInputs] = useState<DesignInput>(() => withDefaults(initialInputs));
  const [name, setName] = useState(initialName);
  const [result, setResult] = useState<DesignResult | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [invalidFields, setInvalidFields] = useState<Set<string>>(new Set());
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const requestId = useRef(0);

  const update = useCallback((patch: Partial<DesignInput>) => {
    setInputs((current) => ({ ...current, ...patch }));
    setSaveMessage(null);
  }, []);

  const setThickness = useCallback((key: LayerKey, mm: number | null) => {
    setInputs((current) => ({ ...current, thicknessMm: { ...current.thicknessMm, [key]: mm } }));
    setSaveMessage(null);
  }, []);

  const setValidity = useCallback((field: string, valid: boolean) => {
    setInvalidFields((current) => {
      if (valid === !current.has(field)) return current;
      const next = new Set(current);
      if (valid) next.delete(field); else next.add(field);
      return next;
    });
  }, []);

  const stale = invalidFields.size > 0 || errors.length > 0;

  // Recalculate 300 ms after the last change (only the newest answer is shown).
  useEffect(() => {
    if (invalidFields.size > 0) return;
    const id = ++requestId.current;
    const timer = setTimeout(async () => {
      setCalculating(true);
      try {
        const next = await api.designs.calculate(cleanInputs(inputs));
        if (id === requestId.current) { setResult(next); setErrors([]); }
      } catch (error) {
        if (id === requestId.current) setErrors(error instanceof ApiError ? error.messages : [String(error)]);
      } finally {
        if (id === requestId.current) setCalculating(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [inputs, invalidFields]);

  const save = async () => {
    if (!onSave) return;
    if (!name.trim()) { setSaveMessage('Give the design a name before saving.'); return; }
    setSaving(true);
    setSaveMessage(null);
    try {
      await onSave(name.trim(), cleanInputs(inputs));
      setSaveMessage('Saved ✓');
    } catch (error) {
      setSaveMessage(error instanceof ApiError ? error.messages.join(' ') : 'Saving failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        {onSave && (
          <label className="min-w-64 flex-1 text-sm text-slate-600">
            <span className="mb-1 block">Design name</span>
            <input className={inputClass} value={name} onChange={(e) => { setName(e.target.value); setSaveMessage(null); }}
              placeholder="e.g. Section A, km 12+000" maxLength={150} />
          </label>
        )}
        {onSave && <Button onClick={save} disabled={saving || stale || !result}>{saving ? 'Saving…' : saveLabel}</Button>}
        <Button variant="secondary" onClick={() => { setInputs({ ...DEFAULT_INPUT }); setSaveMessage(null); }}>
          Reset to defaults
        </Button>
        <span className="text-sm text-slate-500" aria-live="polite">
          {calculating ? 'Calculating…' : saveMessage}
        </span>
      </div>

      <ErrorBox title="Please check these inputs" messages={errors} />

      <div className="grid gap-4 lg:grid-cols-[minmax(320px,420px)_1fr]">
        <DesignInputsPanel inputs={inputs} result={result} update={update} setValidity={setValidity} />
        <div className="min-w-0">
          {result ? (
            <DesignResults result={result} inputs={inputs} stale={stale} setThickness={setThickness} setValidity={setValidity} />
          ) : errors.length ? null : <Loading label="Calculating the design… (the free server can take up to a minute to wake up)" />}
        </div>
      </div>
    </div>
  );
}

/** What is sent to the API: thickness only for layers that exist and were actually typed. */
function cleanInputs(inputs: DesignInput): DesignInput {
  const active: LayerKey[] = ['ac', 'base', 'subbase', ...(inputs.useDbmLayer ? ['dbm' as const] : []),
    ...(inputs.useCappingLayer ? ['capping' as const] : [])];
  const thicknessMm = Object.fromEntries(
    Object.entries(inputs.thicknessMm).filter(([key, mm]) => active.includes(key as LayerKey) && mm != null),
  );
  return { ...inputs, thicknessMm };
}

'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ScriptBlock } from '@/components/onboarding/script-block';
import { Button } from '@/components/ui/button';
import { parseVerification, type Verification } from '@/lib/setup-verification';

export function VerificationPanel({ id, verification, onChange, onReuse }: {
  id: string; verification: Verification;
  onChange: (state: 'ok' | 'error' | 'unknown') => void;
  onReuse: () => void;
}) {
  const t = useTranslations('Wizard');
  const [output, setOutput] = useState('');
  const [state, setState] = useState<'ok' | 'error' | 'unknown' | null>(null);
  return <section className="my-4 space-y-3 rounded-lg border border-sky-500/30 p-4" aria-label={t('verify')}>
    <h4 className="font-semibold">{t('verify')}</h4>
    <p className="text-sm text-muted-foreground">{t('verifyGuide')}</p>
    <ScriptBlock script={verification.command} />
    <p className="break-all text-xs">{t('expected')}: <code>{verification.expected}</code></p>
    <label htmlFor={`result-${id}`} className="block text-sm">{t('resultLabel')}</label>
    <textarea id={`result-${id}`} rows={3} maxLength={12000} value={output}
      className="w-full rounded-md border bg-background p-3 font-mono text-sm"
      onChange={e => { setOutput(e.target.value); setState(null); onChange('unknown'); }} />
    <p className="text-xs text-muted-foreground">{t('localOnly')}</p>
    <Button size="sm" variant="outline" disabled={!output.trim()} onClick={() => {
      const result = parseVerification(output, id); setState(result); onChange(result);
    }}>{t('checkResult')}</Button>
    {state && <p role="status" className={`text-sm ${state === 'ok' ? 'text-green-600' : 'text-amber-600'}`}>{t(`result.${state}`)}</p>}
    {state === 'ok' && verification.canReuse && <Button size="sm" variant="secondary" onClick={onReuse}>{t('reuse')}</Button>}
  </section>;
}

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ScriptBlock } from '@/components/onboarding/script-block';
import {
  defaultDiagnosisMatcher,
  getRemedy,
  diagnosisRules,
  parseMarkers,
  maskSensitive,
} from '@vibestart/diagnosis-catalog';
import type { DiagnosisOutcome, DiagnosisRule, DiagnosisStep } from '@vibestart/shared-types';

interface StuckHelperProps {
  step: DiagnosisStep;
}

type Phase = 'idle' | 'paste' | 'result' | 'resolved';

const ruleById = new Map<string, DiagnosisRule>(diagnosisRules.map((r) => [r.id, r]));

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * "안 됐어요?" 진단 루프 — D′ 무실패 셋업의 복구 UI(어댑터).
 * 매칭·복구 정의는 @vibestart/diagnosis-catalog(도메인)에 있고, 여기선 렌더만 한다.
 * 붙여넣은 출력은 신뢰 불가 — 매칭에만 쓰고 명령을 합성하지 않는다.
 */
export function StuckHelper({ step }: StuckHelperProps) {
  const t = useTranslations('Diagnosis');
  const c = useTranslations('Common');
  const [phase, setPhase] = useState<Phase>('idle');
  const [output, setOutput] = useState('');
  const [outcome, setOutcome] = useState<DiagnosisOutcome | null>(null);
  const [activeRuleId, setActiveRuleId] = useState<string | null>(null);
  const [bundleCopied, setBundleCopied] = useState(false);
  const [reportStatus, setReportStatus] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');

  function reset() {
    setOutput('');
    setOutcome(null);
    setActiveRuleId(null);
    setReportStatus('idle');
  }

  // '모름' 상태에서 (마스킹된) 출력을 서버로 보내 미인식 실패를 수집한다.
  async function sendReport() {
    setReportStatus('sending');
    try {
      const res = await fetch('/api/diagnosis-report', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ step, output: maskSensitive(output) }),
      });
      const data = (await res.json()) as { ok?: boolean };
      setReportStatus(data.ok ? 'sent' : 'failed');
    } catch {
      setReportStatus('failed');
    }
  }

  // 도움 요청 번들은 외부로 전송될 수 있으므로 홈 경로·이메일·IP를 가린다.
  function bundleText() {
    return `[VibeStart 진단 요청]\nstep: ${step}\n---\n${maskSensitive(output)}`;
  }

  function handleSubmit() {
    const markers = parseMarkers(output);
    const hasOk = markers.some((m) => m.result === 'ok');
    const hasFail = markers.some((m) => m.result === 'fail');
    if (hasOk && !hasFail) {
      setPhase('resolved');
      return;
    }
    setOutcome(defaultDiagnosisMatcher.diagnose({ output, step }));
    setActiveRuleId(null);
    setPhase('result');
  }

  async function handleCopyBundle() {
    if (await copyText(bundleText())) {
      setBundleCopied(true);
      setTimeout(() => setBundleCopied(false), 2000);
    }
  }

  function renderRemedy(rule: DiagnosisRule) {
    const remedy = rule.remedy;
    switch (remedy.kind) {
      case 'script': {
        const script = getRemedy(remedy.remedyKey);
        return (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">{t('remedy.scriptInstruction')}</p>
            {script?.actions.map((a, i) => (
              <ScriptBlock key={i} script={a.command} />
            ))}
          </div>
        );
      }
      case 'guide':
        return (
          <div className="flex flex-col gap-3">
            <p className="whitespace-pre-line text-sm text-muted-foreground">
              {t(`guide.${remedy.guideKey}`)}
            </p>
            {remedy.image && (
              // 텍스트만으론 부족한 케이스(BIOS 등)의 그림 가이드.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={remedy.image.src}
                alt={t(remedy.image.altKey)}
                className="w-full max-w-xl rounded-lg border border-border/40"
              />
            )}
          </div>
        );
      case 'reboot':
        return <p className="text-sm text-muted-foreground">{t('remedy.reboot')}</p>;
      case 'newShell':
        return <p className="text-sm text-muted-foreground">{t('remedy.newShell')}</p>;
      case 'ask':
        return (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">{t(remedy.questionKey)}</p>
            <div className="flex flex-wrap gap-2">
              {remedy.branchRuleIds.map((bid) => {
                const branch = ruleById.get(bid);
                return (
                  <Button
                    key={bid}
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveRuleId(bid)}
                  >
                    {branch ? t(branch.causeKey) : bid}
                  </Button>
                );
              })}
            </div>
          </div>
        );
      default:
        return null;
    }
  }

  function renderRecognized(rule: DiagnosisRule) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm font-medium text-foreground">{t(rule.causeKey)}</p>
        {renderRemedy(rule)}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            size="sm"
            onClick={() => {
              reset();
              setPhase('paste');
            }}
          >
            {t('recheck')}
          </Button>
          <button
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => {
              setActiveRuleId(null);
              setOutcome({ kind: 'unknown' });
            }}
          >
            {t('stillBroken')}
          </button>
        </div>
      </div>
    );
  }

  // 막다른 길 방지 — 붙여넣은 글을 유지한 채 수정/재시도하거나 처음으로 돌아간다.
  function renderRetryNav() {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <button
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setPhase('paste')}
        >
          {t('editAgain')}
        </button>
        <button
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => {
            reset();
            setPhase('idle');
          }}
        >
          {t('startOver')}
        </button>
      </div>
    );
  }

  function renderUnknown() {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-foreground">{t('unknownTitle')}</p>
        <p className="text-sm text-muted-foreground">{t('unknownBody')}</p>
        <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-400">
          {bundleText()}
        </pre>
        {reportStatus === 'sent' ? (
          <p className="text-sm font-medium text-emerald-400">{t('reportSent')}</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm" disabled={reportStatus === 'sending'} onClick={sendReport}>
                {reportStatus === 'sending' ? t('reportSending') : t('sendReport')}
              </Button>
              <button
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                onClick={handleCopyBundle}
              >
                {bundleCopied ? c('copied') : t('copyBundle')}
              </button>
            </div>
            {reportStatus === 'failed' && (
              <p className="text-xs text-red-400">{t('reportFailed')}</p>
            )}
          </>
        )}
        {renderRetryNav()}
      </div>
    );
  }

  function renderResult() {
    if (!outcome) return null;
    if (activeRuleId) {
      const r = ruleById.get(activeRuleId);
      return r ? renderRecognized(r) : renderUnknown();
    }
    if (outcome.kind === 'recognized') return renderRecognized(outcome.hit.rule);
    if (outcome.kind === 'ambiguous') {
      const [only] = outcome.hits;
      if (outcome.hits.length === 1 && only) return renderRecognized(only.rule);
      return (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">{t('chooseTitle')}</p>
          <div className="flex flex-wrap gap-2">
            {outcome.hits.map((h) => (
              <Button
                key={h.rule.id}
                variant="outline"
                size="sm"
                onClick={() => setActiveRuleId(h.rule.id)}
              >
                {t(h.rule.causeKey)}
              </Button>
            ))}
          </div>
          {renderRetryNav()}
        </div>
      );
    }
    return renderUnknown();
  }

  if (phase === 'idle') {
    return (
      <button
        className="text-xs text-amber-400/70 hover:text-amber-400 transition-colors"
        onClick={() => setPhase('paste')}
      >
        {t('stuckButton')}
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
      {phase === 'paste' && (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-foreground">{t('pasteTitle')}</p>
          <textarea
            value={output}
            onChange={(e) => setOutput(e.target.value)}
            rows={6}
            placeholder={t('pastePlaceholder')}
            className="w-full rounded-lg border border-border/50 bg-background/80 p-3 font-mono text-xs text-muted-foreground"
          />
          <p className="text-xs text-muted-foreground/60">{t('pasteHelp')}</p>
          <div className="flex items-center gap-3">
            <Button size="sm" disabled={output.trim().length === 0} onClick={handleSubmit}>
              {t('submit')}
            </Button>
            <button
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => {
                reset();
                setPhase('idle');
              }}
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      )}
      {phase === 'result' && renderResult()}
      {phase === 'resolved' && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-foreground">{t('resolvedTitle')}</p>
          <p className="text-sm text-muted-foreground">{t('resolvedBody')}</p>
        </div>
      )}
    </div>
  );
}

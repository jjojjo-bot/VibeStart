'use client';

import { useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { templates, getTemplate, renderTemplate, FIELD_KINDS } from '@vibestart/template-catalog';
import type {
  TemplateCategory,
  TemplateDefinition,
  TemplateFieldKey,
  TemplatePreviewLabels,
  TemplateValues,
} from '@vibestart/shared-types';
import { Link } from '@/i18n/navigation';
import { validateSlug, normalizeSlug } from '@/lib/publish/slug';

type Step = 'category' | 'build' | 'publish' | 'graduate';
type PubStatus = 'idle' | 'publishing' | 'done' | 'error';

// 슬러그 거부 사유 → i18n 키.
const SLUG_MSG: Record<string, string> = {
  'too-short': 'tooShort',
  'too-long': 'tooLong',
  'invalid-chars': 'invalid',
  reserved: 'reserved',
};

// 발행 후 가입 시 영구 claim하도록 pending slug를 쿠키에 심는다(모듈 레벨 — 컴포넌트
// 반응형 스코프 밖). 서버: lib/publish/claim-pending.ts의 PENDING_CLAIM_COOKIE와 동일 이름.
function setPendingClaimCookie(slug: string): void {
  document.cookie = `vs_pending_claim=${slug}; path=/; max-age=1800; SameSite=Lax`;
}

// 카테고리 라인 아이콘 — 색깔띠 대신 "무슨 페이지인지"를 전달한다.
// 리퀴드 글래스 타일(.cat-icon)에 담겨 accent 틴트로 렌더된다(질감은 glass-ctl 토큰).
const CATEGORY_ICONS: Record<TemplateCategory, ReactNode> = {
  intro: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8.2" r="3.3" />
      <path d="M5.6 19.4c0-3.5 2.9-5.5 6.4-5.5s6.4 2 6.4 5.5" />
    </svg>
  ),
  shop: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 9.5 5.4 5h13.2L20 9.5" />
      <path d="M4.6 9.5a2.1 2.1 0 0 0 3.9 0 2.1 2.1 0 0 0 3.9 0 2.1 2.1 0 0 0 3.9 0" />
      <path d="M5 10.6V19a.6.6 0 0 0 .6.6h12.8a.6.6 0 0 0 .6-.6v-8.4" />
      <path d="M9.8 19.6v-4.3h4.4v4.3" />
    </svg>
  ),
  todo: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 7h9" />
      <path d="M10 12h9" />
      <path d="M10 17h9" />
      <path d="m4 6.7 1.1 1.1L7.4 5.5" />
      <path d="M4.3 12h2.9" />
      <path d="M4.3 17h2.9" />
    </svg>
  ),
  invitation: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3.5" y="5.8" width="17" height="12.6" rx="2.2" />
      <path d="m4.4 7.4 7.6 5.1 7.6-5.1" />
      <path d="M12 18.4c1.7-1.3 2.7-2.3 2.7-3.4a1.35 1.35 0 0 0-2.7-.4 1.35 1.35 0 0 0-2.7.4c0 1.1 1 2.1 2.7 3.4z" />
    </svg>
  ),
  launch: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  ),
};

/**
 * B′ 첫성공 빌더 — 카테고리 선택 → 빈칸 채우기 → 라이브 미리보기.
 * 빌더 chrome은 liquid-glass, 생성 페이지(iframe)는 별도 에디토리얼 톤.
 * 렌더/이스케이프는 @vibestart/template-catalog(도메인)에 위임한다.
 */
export function BuildWizard() {
  const t = useTranslations('Start');
  const locale = useLocale();
  const [step, setStep] = useState<Step>('category');
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [values, setValues] = useState<TemplateValues>({});

  // 발행 상태
  const [slug, setSlug] = useState('');
  const [pubStatus, setPubStatus] = useState<PubStatus>('idle');
  const [pubPath, setPubPath] = useState<string | null>(null);
  const [pubError, setPubError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const template = templateId ? getTemplate(templateId) : undefined;

  function pick(id: string): void {
    setTemplateId(id);
    setValues({});
    setStep('build');
  }

  function setField(key: TemplateFieldKey, v: string): void {
    setValues((prev) => ({ ...prev, [key]: v }));
  }

  // 라벨/placeholder는 템플릿별 오버라이드(templates.{id}.fields.{key})가 있으면 그걸,
  // 없으면 전역(fields.{key})을 쓴다. (예: 투두 body = "할 일 목록", "자세한 소개" 아님)
  function fieldText(
    tpl: TemplateDefinition,
    key: TemplateFieldKey,
    part: 'label' | 'placeholder',
  ): string {
    const override = `templates.${tpl.id}.fields.${key}.${part}`;
    return t.has(override) ? t(override) : t(`fields.${key}.${part}`);
  }

  // 빈 칸은 샘플로 채운다 — 미리보기와 발행이 동일하게 보이도록.
  function mergedValues(tpl: TemplateDefinition): TemplateValues {
    const merged: TemplateValues = {};
    for (const key of tpl.fields) {
      const v = (values[key] ?? '').trim();
      merged[key] = v.length > 0 ? v : t(`samples.${tpl.id}.${key}`);
    }
    return merged;
  }

  // 미리보기 페이지의 구조 라벨(섹션 머리말·데모)을 활성 로케일로 주입한다.
  // 도메인 renderTemplate은 i18n을 모르므로 여기서 메시지를 모아 넘긴다.
  function previewLabels(): TemplatePreviewLabels {
    return {
      lang: locale,
      about: t('preview.about'),
      expertise: t('preview.expertise'),
      work: t('preview.work'),
      links: t('preview.links'),
      directions: t('preview.directions'),
      gallery: t('preview.gallery'),
      guestbook: t('preview.guestbook'),
      guestbookPlaceholder: t('preview.guestbookPlaceholder'),
      guestbookSamples: [
        { who: t('preview.guestbook1Who'), msg: t('preview.guestbook1Msg') },
        { who: t('preview.guestbook2Who'), msg: t('preview.guestbook2Msg') },
      ],
      todoAdd: t('preview.todoAdd'),
      todoProgress: t('preview.todoProgress'),
    };
  }

  function previewHtml(tpl: TemplateDefinition): string {
    return renderTemplate(tpl, mergedValues(tpl), previewLabels());
  }

  // 미리보기 → 발행 화면. 슬러그를 제목에서 추정해 미리 채운다.
  function goPublish(): void {
    if (template && slug === '') {
      const base = (values.title ?? '').trim() || t(`samples.${template.id}.title`);
      setSlug(normalizeSlug(base));
    }
    setPubStatus('idle');
    setPubError(null);
    setStep('publish');
  }

  async function publish(): Promise<void> {
    if (!template) return;
    const clean = normalizeSlug(slug); // 대문자·공백·잘못된 문자 정리
    if (clean !== slug) setSlug(clean);
    const v = validateSlug(clean);
    if (!v.ok) {
      setPubError(t(`publish.${SLUG_MSG[v.reason]}`));
      return;
    }
    setPubStatus('publishing');
    setPubError(null);
    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          slug: clean,
          templateId: template.id,
          values: mergedValues(template),
        }),
      });
      const data = (await res.json()) as { ok: boolean; path?: string; reason?: string };
      if (data.ok && data.path) {
        setPubPath(data.path);
        setPubStatus('done');
        setPendingClaimCookie(clean);
      } else {
        setPubStatus('error');
        setPubError(
          t(
            data.reason === 'slug-taken'
              ? 'publish.errorTaken'
              : data.reason === 'rate-limited'
                ? 'publish.errorRate'
                : 'publish.errorGeneric',
          ),
        );
      }
    } catch {
      setPubStatus('error');
      setPubError(t('publish.errorGeneric'));
    }
  }

  if (step === 'category' || !template) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-8 py-10">
        <header className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">{t('heroTitle')}</h1>
          <p className="mt-3 text-base text-[color:var(--txt-2,#9aa6b8)] md:text-lg">
            {t('heroSub')}
          </p>
        </header>
        <h2 className="mt-2 text-center text-lg font-medium text-[color:var(--txt-2,#9aa6b8)] md:text-xl">
          {t('categoryTitle')}
        </h2>
        <div className="mx-auto grid w-full max-w-2xl gap-4 sm:grid-cols-2">
          {templates.map((tpl) => (
            <button
              key={tpl.id}
              className="card cursor-pointer text-left transition hover:-translate-y-0.5"
              onClick={() => pick(tpl.id)}
            >
              <span className="cat-icon" style={{ ['--ico']: tpl.accent } as CSSProperties}>
                {CATEGORY_ICONS[tpl.category]}
              </span>
              <h3 className="card-title mt-3.5">{t(`templates.${tpl.id}.title`)}</h3>
              <p className="card-sub mt-1">{t(`templates.${tpl.id}.desc`)}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // 화면 4 — 퍼블리시: 슬러그 선택 → 익명 발행(TTL) → 라이브 URL + 가입 유도.
  if (step === 'publish' && template) {
    // 정규화한 슬러그로 검증 — 공백·대문자는 정리돼 통과, 예약어·짧음·비라틴은 거부.
    const slugCheck = slug ? validateSlug(normalizeSlug(slug)) : null;
    const fullUrl = pubPath
      ? (typeof window !== 'undefined' ? window.location.origin : 'https://vibe-start.com') +
        pubPath
      : '';
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-6 px-4 py-10 sm:px-6">
        <div>
          <button className="btn-ghost" onClick={() => setStep('build')}>
            {t('publish.back')}
          </button>
        </div>

        {pubStatus !== 'done' ? (
          <>
            <header className="text-center">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {t('publish.title')}
              </h1>
            </header>
            <div className="card">
              <label className="field">
                <span className="field-label">{t('publish.slugLabel')}</span>
                <div className="flex items-center gap-1 rounded-lg border border-[color:var(--glass-ctl-border,#2a3550)] bg-[color:var(--glass-ctl-bg,#0e1422)] px-3 py-2">
                  <span className="shrink-0 text-sm text-[color:var(--txt-3,#7c8aa5)]">
                    vibe-start.com/p/
                  </span>
                  <input
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                    value={slug}
                    spellCheck={false}
                    autoCapitalize="none"
                    placeholder="my-page"
                    // 매 키마다 strip하면 한글 IME 조합이 깨져 숫자만 남는다.
                    // 소문자화만 하고(영문은 IME 비대상이라 안전), 정리는 onBlur·발행 시 normalize.
                    onChange={(e) => setSlug(e.target.value.toLowerCase())}
                    onBlur={(e) => setSlug(normalizeSlug(e.target.value))}
                  />
                </div>
                <span className="field-hint">{t('publish.slugHint')}</span>
                {slugCheck && !slugCheck.ok && (
                  <span className="text-xs text-red-400">
                    {t(`publish.${SLUG_MSG[slugCheck.reason]}`)}
                  </span>
                )}
              </label>
              <button
                className="btn-primary w-full justify-center py-2.5"
                disabled={pubStatus === 'publishing' || !slugCheck?.ok}
                onClick={publish}
              >
                {pubStatus === 'publishing' ? t('publish.publishing') : t('publish.publishBtn')}
              </button>
              {pubError && <p className="text-center text-xs text-red-400">{pubError}</p>}
            </div>
          </>
        ) : (
          <div className="card text-center">
            <h1 className="text-2xl font-bold tracking-tight">{t('publish.successTitle')}</h1>
            <div className="mt-2 rounded-lg border border-[color:var(--glass-ctl-border,#2a3550)] bg-[color:var(--glass-ctl-bg,#0e1422)] px-3 py-3">
              <span className="field-label">{t('publish.liveLabel')}</span>
              <code className="mt-1 block break-all text-sm text-[color:#bae6fd]">{fullUrl}</code>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                className="btn-ghost flex-1 justify-center py-2"
                onClick={() => {
                  void navigator.clipboard?.writeText(fullUrl);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
              >
                {copied ? t('publish.copied') : t('publish.copy')}
              </button>
              <a
                className="btn-ghost flex-1 justify-center py-2"
                href={pubPath ?? '#'}
                target="_blank"
                rel="noopener"
              >
                {t('publish.open')}
              </a>
            </div>
            <p className="field-hint mt-3">{t('publish.tempNote')}</p>
            <Link href="/login" className="btn-primary mt-3 w-full justify-center py-2.5">
              {t('publish.keepCta')}
            </Link>
            <button
              className="btn-ghost mt-2 w-full justify-center py-2"
              onClick={() => setStep('graduate')}
            >
              {t('publish.growCta')}
            </button>
          </div>
        )}
      </div>
    );
  }

  // 화면 5 — 졸업 브릿지: 미리보기로 첫 성공 → 진짜 '내 것'으로 가는 두 갈래.
  // 🆓 무료(브라우저 GitHub+Vercel, /dashboard) / 🚀 AI(로컬 설치, /onboarding).
  if (step === 'graduate' && template) {
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-10 sm:px-6">
        <div>
          <button className="btn-ghost" onClick={() => setStep('build')}>
            {t('graduate.back')}
          </button>
        </div>
        <header className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">{t('graduate.title')}</h1>
          <p className="mx-auto mt-4 max-w-xl text-base font-medium leading-relaxed text-[color:var(--txt-2,#c7d0de)] sm:text-lg">
            {t('graduate.manifesto')}
          </p>
        </header>
        <div className="grid gap-5 sm:grid-cols-2">
          <Link href="/dashboard" className="card text-left transition hover:-translate-y-0.5">
            <span className="chip self-start">{t('graduate.free.badge')}</span>
            <h2 className="text-lg font-semibold tracking-tight">{t('graduate.free.title')}</h2>
            <p className="flex-1 text-sm leading-relaxed text-[color:var(--txt-2,#9aa6b8)]">
              {t('graduate.free.desc')}
            </p>
            <span className="btn-primary w-full justify-center py-2.5">
              {t('graduate.free.cta')}
            </span>
            <span className="field-hint text-center">{t('graduate.free.note')}</span>
          </Link>
          <Link href="/onboarding" className="card text-left transition hover:-translate-y-0.5">
            <span className="chip self-start">{t('graduate.ai.badge')}</span>
            <h2 className="text-lg font-semibold tracking-tight">{t('graduate.ai.title')}</h2>
            <p className="flex-1 text-sm leading-relaxed text-[color:var(--txt-2,#9aa6b8)]">
              {t('graduate.ai.desc')}
            </p>
            <span className="btn-ghost w-full justify-center py-2.5">{t('graduate.ai.cta')}</span>
            <span className="field-hint text-center">{t('graduate.ai.note')}</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-[1480px] items-start gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[330px_minmax(0,1fr)]">
      <section className="card">
        <div className="card-head">
          <div className="min-w-0">
            <h2 className="card-title truncate">{t(`templates.${template.id}.title`)}</h2>
          </div>
          <button
            className="btn-ghost shrink-0 whitespace-nowrap"
            onClick={() => setStep('category')}
          >
            {t('build.back')}
          </button>
        </div>
        <div className="card-body flex flex-col gap-4">
          {template.fields.map((key) => (
            <label key={key} className="field">
              <span className="field-label">{fieldText(template, key, 'label')}</span>
              {FIELD_KINDS[key] === 'textarea' ? (
                <textarea
                  className="textarea"
                  value={values[key] ?? ''}
                  placeholder={fieldText(template, key, 'placeholder')}
                  onChange={(e) => setField(key, e.target.value)}
                />
              ) : (
                <input
                  className="input"
                  type="text"
                  value={values[key] ?? ''}
                  placeholder={fieldText(template, key, 'placeholder')}
                  onChange={(e) => setField(key, e.target.value)}
                />
              )}
            </label>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <div>
            <h2 className="card-title">{t('build.previewLabel')}</h2>
          </div>
        </div>
        <div className="card-body flex flex-col gap-3">
          <div className="mx-auto w-full max-w-[1100px] overflow-hidden rounded-xl border border-[color:var(--glass-ctl-border,#2a3550)] bg-[#0a0d15] shadow-[0_24px_60px_-24px_rgba(0,0,0,0.7)]">
            <div className="flex items-center gap-1.5 border-b border-white/[0.06] bg-white/[0.03] px-3.5 py-2.5">
              <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
              <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
              <span className="h-3 w-3 rounded-full bg-[#28c840]" />
              <span className="ml-2 truncate text-xs text-[color:var(--txt-3,#7c8aa5)]">
                vibe-start.com/p/
                {normalizeSlug((values.title ?? '').trim() || t(`samples.${template.id}.title`)) ||
                  'my-page'}
              </span>
            </div>
            <iframe
              title={t('build.previewLabel')}
              srcDoc={previewHtml(template)}
              className="block h-[72vh] min-h-[560px] w-full border-0 bg-white"
            />
          </div>
          <button
            type="button"
            className="btn-primary w-full justify-center py-2.5 text-sm"
            onClick={goPublish}
          >
            {t('publish.enterCta')}
          </button>
        </div>
      </section>
    </div>
  );
}

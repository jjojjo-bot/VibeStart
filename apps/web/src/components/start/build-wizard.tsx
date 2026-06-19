'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { templates, getTemplate, renderTemplate, FIELD_KINDS } from '@vibestart/template-catalog';
import type { TemplateDefinition, TemplateFieldKey, TemplateValues } from '@vibestart/shared-types';
import { Link } from '@/i18n/navigation';

type Step = 'category' | 'build' | 'graduate';

/**
 * B′ 첫성공 빌더 — 카테고리 선택 → 빈칸 채우기 → 라이브 미리보기.
 * 빌더 chrome은 liquid-glass, 생성 페이지(iframe)는 별도 에디토리얼 톤.
 * 렌더/이스케이프는 @vibestart/template-catalog(도메인)에 위임한다.
 */
export function BuildWizard() {
  const t = useTranslations('Start');
  const [step, setStep] = useState<Step>('category');
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [values, setValues] = useState<TemplateValues>({});

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

  // 빈 칸은 샘플로 채워 미리보기가 항상 그럴듯하게 보이도록 한다.
  function previewHtml(tpl: TemplateDefinition): string {
    const merged: TemplateValues = {};
    for (const key of tpl.fields) {
      const v = (values[key] ?? '').trim();
      merged[key] = v.length > 0 ? v : t(`samples.${tpl.id}.${key}`);
    }
    return renderTemplate(tpl, merged);
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
        <div className="grid gap-4 sm:grid-cols-3">
          {templates.map((tpl) => (
            <button
              key={tpl.id}
              className="card cursor-pointer text-left transition hover:-translate-y-0.5"
              onClick={() => pick(tpl.id)}
            >
              <span className="block h-1.5 w-10 rounded-full" style={{ background: tpl.accent }} />
              <h3 className="card-title mt-3">{t(`templates.${tpl.id}.title`)}</h3>
              <p className="card-sub mt-1">{t(`templates.${tpl.id}.desc`)}</p>
            </button>
          ))}
        </div>
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
            <span className="btn-ghost w-full justify-center py-2.5">
              {t('graduate.ai.cta')}
            </span>
            <span className="field-hint text-center">{t('graduate.ai.note')}</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-7xl items-start gap-5 px-4 py-10 sm:px-6 xl:grid-cols-[300px_1fr]">
      <section className="card">
        <div className="card-head">
          <div>
            <h2 className="card-title">{t(`templates.${template.id}.title`)}</h2>
          </div>
          <button className="btn-ghost" onClick={() => setStep('category')}>
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
          <iframe
            title={t('build.previewLabel')}
            srcDoc={previewHtml(template)}
            className="h-[640px] w-full rounded-lg border-0 bg-[#0a0d15]"
          />
          <button
            type="button"
            className="btn-primary w-full justify-center py-2.5 text-sm"
            onClick={() => setStep('graduate')}
          >
            {t('graduate.cta')}
          </button>
        </div>
      </section>
    </div>
  );
}

import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messages from '../../messages/ko.json';
import { getSetupSteps } from '@/lib/setup-steps';
import { verificationFor } from '@/lib/setup-verification';

const state=vi.hoisted(()=>({params:new URLSearchParams(),push:vi.fn()}));
vi.mock('next/navigation',()=>({useSearchParams:()=>state.params}));
vi.mock('@/i18n/navigation',()=>({useRouter:()=>({push:state.push}),Link:({children,...props}: React.PropsWithChildren<{href:string}>)=><a {...props}>{children}</a>}));
vi.mock('@/components/diagnosis/stuck-helper',()=>({StuckHelper:()=>null}));
vi.mock('@/lib/stats',()=>({incrementCompletions:vi.fn()}));
vi.mock('@/app/[locale]/login/actions',()=>({signInFromCompleteAction:vi.fn(),goToDashboardWithPhase1Action:vi.fn()}));
vi.mock('canvas-confetti',()=>({default:vi.fn()}));
vi.mock('@/lib/ga',()=>({trackSetupStart:vi.fn(),trackSetupComplete:vi.fn(),trackSetupScanShown:vi.fn(),trackSetupScanResult:vi.fn(),trackSetupScanSkipped:vi.fn()}));
import SetupPage from '@/app/[locale]/setup/page';
import CompletePage from '@/app/[locale]/complete/page';
import { ScriptBlock } from '@/components/onboarding/script-block';

beforeEach(()=>{
  cleanup(); localStorage.clear(); state.push.mockClear();
  Element.prototype.scrollIntoView=vi.fn();
  window.matchMedia=vi.fn().mockReturnValue({matches:true});
});
function mount(os: 'windows'|'macos', project='wizard-test') {
  state.params=new URLSearchParams({os,goal:'web-nextjs',project});
  return render(<NextIntlClientProvider locale="ko" messages={messages}><SetupPage/></NextIntlClientProvider>);
}

describe('Installation wizard user journeys (simulated terminal evidence)',()=>{
  it.each(['windows','macos'] as const)('%s: blocks unverified tools, handles errors, reuses tools, and requires a running project',async os=>{
    mount(os);
    await screen.findByRole('button',{name:'완료했어요!'});
    for(const step of getSetupSteps(os,'web-nextjs','wizard-test',key=>key)) {
      const verification=verificationFor(step.id,os,'web-nextjs');
      if(verification) {
        expect(screen.getByRole('button',{name:'완료했어요!'})).toBeDisabled();
        const input=screen.getByLabelText('실행 결과를 붙여넣으세요 (명령어 제외)');
        fireEvent.change(input,{target:{value:verification.command}});
        fireEvent.click(screen.getByRole('button',{name:'결과 확인'}));
        expect(screen.getByRole('button',{name:'완료했어요!'})).toBeDisabled();
        fireEvent.change(input,{target:{value:`VIBESTART_CHECK::${step.id}::fail`}});
        fireEvent.click(screen.getByRole('button',{name:'결과 확인'}));
        expect(screen.getByRole('button',{name:'완료했어요!'})).toBeDisabled();
        fireEvent.change(input,{target:{value:verification.expected}});
        fireEvent.click(screen.getByRole('button',{name:'결과 확인'}));
        expect(screen.getByRole('button',{name:'완료했어요!'})).toBeEnabled();
        if(verification.canReuse) { fireEvent.click(screen.getByRole('button',{name:'이미 설치되어 있어요 — 다음으로'})); continue; }
      }
      if(step.optional) { fireEvent.click(screen.getByRole('button',{name:'고급 프로젝트 구조는 나중에 설정'})); continue; }
      if(step.id==='run-check') {
        expect(screen.getByRole('button',{name:'완료했어요!'})).toBeDisabled();
        for(const label of Object.values(messages.Wizard.final)) fireEvent.click(screen.getByLabelText(label));
      }
      fireEvent.click(screen.getByRole('button',{name:'완료했어요!'}));
    }
    await waitFor(()=>expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow','100'));
    const saved=localStorage.getItem(`vibestart-progress-v2-${os}-web-nextjs-wizard-test`)!;
    expect(JSON.parse(saved)).toContain('run-check');
    cleanup(); mount(os);
    await waitFor(()=>expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow','100'));
    // Undoing the first step invalidates downstream completion.
    fireEvent.click(screen.getByRole('button',{name:/터미널 열기.*명령어를 실행할 창/}));
    fireEvent.click(screen.getByRole('button',{name:messages.Setup.undoCompleteButton}));
    await waitFor(()=>expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow','0'));
  }, 20000);
  it('corrupt progress does not crash or report completion',async()=>{
    localStorage.setItem('vibestart-progress-v2-macos-web-nextjs-wizard-test','{"bad":true}');
    mount('macos');
    await waitFor(()=>expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow','0'));
  }, 20000);
  it('invalid OS never renders Mac installation commands',()=>{
    state.params=new URLSearchParams('os=linux&goal=web-nextjs&project=demo');
    render(<NextIntlClientProvider locale="ko" messages={messages}><SetupPage/></NextIntlClientProvider>);
    expect(screen.getByText(messages.Wizard.invalid)).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
});


describe('Completion and clipboard failures',()=>{
  it('a direct completion URL does not claim successful installation',()=>{
    state.params=new URLSearchParams('os=macos&goal=web-nextjs&project=demo&verified=1');
    render(<NextIntlClientProvider locale="ko" messages={messages}><CompletePage/></NextIntlClientProvider>);
    expect(screen.getByText(messages.Wizard.unverifiedComplete)).toBeInTheDocument();
    expect(screen.queryByText(messages.Complete.congratulations)).not.toBeInTheDocument();
  });
  it('clipboard failure offers manual copy instead of claiming success',async()=>{
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:vi.fn().mockRejectedValue(new Error('denied'))}});
    document.execCommand=vi.fn().mockImplementation(()=>{throw new Error('unsupported');});
    render(<NextIntlClientProvider locale="ko" messages={messages}><ScriptBlock script="node --version"/></NextIntlClientProvider>);
    fireEvent.click(screen.getByRole('button',{name:messages.Wizard.copyLabel}));
    expect(await screen.findByRole('alert')).toHaveTextContent(messages.Wizard.copyFailed);
  });
});

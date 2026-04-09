"use client";

/**
 * 서버 액션 폼 안에서 사용하는 버튼. submit 진행 중일 때 자동으로
 * 비활성화 + 텍스트 전환. useFormStatus는 <form> 자식에서만 동작하므로
 * 반드시 <form action={serverAction}> 안에 렌더해야 한다.
 */

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

interface PendingButtonProps
  extends React.ComponentProps<typeof Button> {
  /** 서버 액션 진행 중 표시할 텍스트 ("연결 중...", "생성 중..." 등) */
  pendingText: string;
  children: React.ReactNode;
}

export function PendingButton({
  pendingText,
  children,
  ...props
}: PendingButtonProps): React.ReactNode {
  const { pending } = useFormStatus();
  return (
    <Button disabled={pending} {...props}>
      {pending ? pendingText : children}
    </Button>
  );
}

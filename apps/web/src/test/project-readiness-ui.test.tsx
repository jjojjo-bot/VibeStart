import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";

import messages from "../../messages/ko.json";
import { ProjectReadinessCheck } from "@/components/projects/project-readiness-check";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, ...props }: React.PropsWithChildren<{ href: string }>) => (
    <a {...props}>{children}</a>
  ),
}));

afterEach(cleanup);

function renderCheck(): void {
  render(
    <NextIntlClientProvider locale="ko" messages={messages}>
      <ProjectReadinessCheck
        locale="ko"
        initialOs="macos"
        continueAction={vi.fn()}
      />
    </NextIntlClientProvider>,
  );
}

describe("ProjectReadinessCheck", () => {
  it("builds the command from the folder name and unlocks the ready path", () => {
    renderCheck();
    fireEvent.change(screen.getByLabelText(messages.Readiness.project.label), {
      target: { value: "launch-site" },
    });

    expect(screen.getByText(/HOME\/launch-site/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(messages.Readiness.check.outputLabel), {
      target: {
        value: "VIBESTART_READY::git=ok::node=ok::npm=ok::project=ok::next=ok",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: messages.Readiness.check.submit }));

    expect(
      screen.getByRole("button", { name: messages.Readiness.result.continue }),
    ).toBeInTheDocument();
  });

  it("routes a missing project to the prefilled quick-start path", () => {
    renderCheck();
    fireEvent.change(screen.getByLabelText(messages.Readiness.check.outputLabel), {
      target: {
        value: "VIBESTART_READY::git=ok::node=ok::npm=ok::project=missing::next=missing",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: messages.Readiness.check.submit }));

    expect(
      screen.getByRole("link", { name: messages.Readiness.result.quickStart }),
    ).toHaveAttribute(
      "href",
      "/onboarding?mode=project-only&os=macos&project=my-portfolio",
    );
  });

  it("routes missing tools to the full setup path", () => {
    renderCheck();
    fireEvent.change(screen.getByLabelText(messages.Readiness.check.outputLabel), {
      target: {
        value: "VIBESTART_READY::git=missing::node=ok::npm=ok::project=ok::next=ok",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: messages.Readiness.check.submit }));

    expect(
      screen.getByRole("link", { name: messages.Readiness.result.fullSetup }),
    ).toHaveAttribute("href", "/onboarding?mode=full&os=macos");
  });
});

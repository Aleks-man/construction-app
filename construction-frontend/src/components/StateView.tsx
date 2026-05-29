import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

type StateViewProps = {
  action?: ReactNode;
  message: string;
  title?: string;
  tone?: "default" | "error";
};

export function LoadingState({ message }: { message: string }) {
  return (
    <div className="state-view state-view-compact" aria-live="polite">
      <span className="loading-dot" aria-hidden="true" />
      <p className="muted">{message}</p>
    </div>
  );
}

export function EmptyState({ action, message, title }: StateViewProps) {
  return <StateView action={action} message={message} title={title} />;
}

export function ErrorState({ action, message, title = "Something went wrong" }: StateViewProps) {
  const { t } = useTranslation();

  return (
    <StateView
      action={action}
      message={message}
      title={title === "Something went wrong" ? t("state.somethingWrong") : title}
      tone="error"
    />
  );
}

function StateView({ action, message, title, tone = "default" }: StateViewProps) {
  return (
    <div className={`state-view ${tone === "error" ? "state-view-error" : ""}`}>
      {title ? <h2>{title}</h2> : null}
      <p className="muted">{message}</p>
      {action ? <div className="state-view-action">{action}</div> : null}
    </div>
  );
}

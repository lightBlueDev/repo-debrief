import type { PropsWithChildren } from "react";

type InfoPanelProps = PropsWithChildren<{
  eyebrow?: string;
  title?: string;
  tone?: "default" | "navy";
}>;

export function InfoPanel({
  children,
  eyebrow,
  title,
  tone = "default"
}: InfoPanelProps) {
  return (
    <section className={`info-panel info-panel--${tone}`}>
      {eyebrow ? <p className="panel-eyebrow">{eyebrow}</p> : null}
      {title ? <h2 className="panel-title">{title}</h2> : null}
      <div className="panel-body">{children}</div>
    </section>
  );
}

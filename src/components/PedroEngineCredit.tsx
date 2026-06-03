/** Subtle technology credit — Pedro is the companion, Claude is the engine. */
export function PedroEngineCredit({
  className,
  inline,
}: {
  className?: string;
  inline?: boolean;
}) {
  const Tag = inline ? "span" : "p";

  return (
    <Tag
      className={[
        "claude-badge",
        inline && "claude-badge--inline",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label="Powered by Claude"
    >
      <span className="claude-badge-powered">Powered by</span>
      <span className="claude-badge-brand">
        <ClaudeMark className="claude-badge-mark" aria-hidden />
        Claude
      </span>
    </Tag>
  );
}

function ClaudeMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 2.5c.4 3.2 1.6 5.4 3.8 7.6 2.2 2.2 4.4 3.4 7.6 3.8-3.2.4-5.4 1.6-7.6 3.8-2.2 2.2-3.4 4.4-3.8 7.6-.4-3.2-1.6-5.4-3.8-7.6C9.8 9.5 7.6 8.3 4.4 7.9c3.2-.4 5.4-1.6 7.6-3.8C14.2 4 15.4 1.8 12 2.5z" />
    </svg>
  );
}

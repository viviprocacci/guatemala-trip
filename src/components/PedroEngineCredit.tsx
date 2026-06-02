/** Subtle technology credit — Pedro is the companion, Claude is the engine. */
export function PedroEngineCredit({ className }: { className?: string }) {
  return (
    <p className={`pedro-engine ${className ?? ""}`.trim()} aria-hidden>
      powered by claude
    </p>
  );
}

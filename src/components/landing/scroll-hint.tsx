"use client";

import { ChevronDownIcon } from "@heroicons/react/24/outline";

// Scrolls smoothly to the element identified by targetId. Used on the landing
// hero to invite the user to reveal the content below the fold.
export function ScrollHint({ targetId }: { targetId: string }) {
  return (
    <button
      type="button"
      aria-label="Desplazar hacia abajo"
      onClick={() =>
        document
          .getElementById(targetId)
          ?.scrollIntoView({ behavior: "smooth" })
      }
      className="group rounded-full p-2 text-foreground/40 transition-colors hover:text-foreground"
    >
      <ChevronDownIcon className="h-6 w-6 animate-bounce" />
    </button>
  );
}

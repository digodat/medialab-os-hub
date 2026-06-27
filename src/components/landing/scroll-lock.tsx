"use client";

import { useEffect } from "react";

// Locks both axes of page scroll while mounted. Used on the home route,
// which is designed to fit entirely within the viewport.
export function ScrollLock() {
  useEffect(() => {
    const { documentElement, body } = document;
    const prevHtml = documentElement.style.overflow;
    const prevBody = body.style.overflow;

    documentElement.style.overflow = "hidden";
    body.style.overflow = "hidden";

    return () => {
      documentElement.style.overflow = prevHtml;
      body.style.overflow = prevBody;
    };
  }, []);

  return null;
}

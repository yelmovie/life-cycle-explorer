// The app option and OS preference both reduce motion; neither overwrites the other.
export const reducedMotion=settings=>!!settings?.reducedMotion||!!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

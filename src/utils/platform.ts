/**
 * WebKit da Apple: o Safari e todo navegador do iOS (que usa o motor do Safari). Alguns recursos de
 * renderização se comportam mal ali e ficam desligados (ver router/viewTransition.ts e main.css).
 */
export const appleWebKit = typeof navigator !== 'undefined' && navigator.vendor.startsWith('Apple')

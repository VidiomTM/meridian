export function trapFocus(node: HTMLElement) {
  const getFocusable = () =>
    [...node.querySelectorAll<HTMLElement>(
      'button:not([disabled]),a[href],input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])'
    )];

  function onKeydown(e: KeyboardEvent) {
    if (e.key !== 'Tab') return;
    const focusable = getFocusable();
    if (!focusable.length) return;
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  }

  node.addEventListener('keydown', onKeydown);
  // Focus first element on mount
  const first = getFocusable()[0];
  if (first) first.focus();

  return { destroy() { node.removeEventListener('keydown', onKeydown); } };
}

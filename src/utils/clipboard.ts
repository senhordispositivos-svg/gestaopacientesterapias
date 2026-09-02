/**
 * Bulletproof clipboard copy helper.
 * Works consistently in iframe sandbox, secure/non-secure contexts,
 * mobile WebViews, and prevents browser extension / translation DOM crashes.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;

  // 1. Try modern async Clipboard API if available and document is focused
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    console.warn('Modern clipboard API failed or restricted, trying fallback:', err);
  }

  // 2. Robust fallback via hidden textarea (document.execCommand)
  try {
    if (typeof document === 'undefined') return false;

    const textArea = document.createElement('textarea');
    textArea.value = text;
    // Ensure element is offscreen and invisible but selectable
    textArea.style.position = 'fixed';
    textArea.style.top = '-9999px';
    textArea.style.left = '-9999px';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    textArea.setAttribute('readonly', '');
    textArea.setAttribute('aria-hidden', 'true');

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    textArea.setSelectionRange(0, 99999);

    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (fallbackErr) {
    console.error('All clipboard copy attempts failed:', fallbackErr);
    return false;
  }
}

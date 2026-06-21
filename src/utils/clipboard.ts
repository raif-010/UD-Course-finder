/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Bulletproof clipboard copier that tries BOTH navigator.clipboard and fallback document.execCommand
 * to work across sandboxed iframes and other browser contexts.
 */
export function copyTextToClipboard(text: string): Promise<boolean> {
  // Try navigator.clipboard first
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    return navigator.clipboard.writeText(text)
      .then(() => true)
      .catch((err) => {
        console.warn("navigator.clipboard.writeText rejected/failed, using selection fallback:", err);
        return fallbackCopyToClipboardCode(text);
      });
  }
  return Promise.resolve(fallbackCopyToClipboardCode(text));
}

function fallbackCopyToClipboardCode(text: string): boolean {
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    // Hide off-screen and set absolute positioning to avoid page-jump
    textArea.style.position = "fixed";
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.width = "2em";
    textArea.style.height = "2em";
    textArea.style.padding = "0";
    textArea.style.border = "none";
    textArea.style.outline = "none";
    textArea.style.boxShadow = "none";
    textArea.style.background = "transparent";
    textArea.style.opacity = "0";
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error("Fallback clipboard copy failed:", err);
    return false;
  }
}

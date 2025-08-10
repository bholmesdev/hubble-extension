// Content script: listens for a double-tap on the Shift key and summarizes the page
// using Chrome's experimental Summarizer API when available. Falls back to logging the title.
// Avoid triggering inside editable fields.
(function () {
  let lastShiftTime = 0;
  const DOUBLE_TAP_THRESHOLD_MS = 350; // a quick double-tap window
  let inFlight = false;

  function isEditable(target) {
    if (!target) return false;
    const el = target;
    const tag = (el.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea') return true;
    if (el.isContentEditable) return true;
    const role = el.getAttribute && el.getAttribute('role');
    return role === 'textbox';
  }

  async function saveClip({ title, url, summary }) {
    try {
      const { clips } = await chrome.storage.local.get(['clips']);
      const next = Array.isArray(clips) ? clips : [];
      next.unshift({ title, url, summary, createdAt: Date.now() });
      await chrome.storage.local.set({ clips: next });
    } catch (e) {
      console.warn('[Hubble] Failed to save clip to storage:', e);
    }
  }

  async function summarizePage() {
    if (inFlight) return;
    inFlight = true;
    try {
      // Try to use the Summarizer API within the page context
      // eslint-disable-next-line no-undef
      const Summarizer = (self && self.Summarizer) || undefined;
      if (!Summarizer) {
        console.warn('[Hubble] Summarizer API not available in this browser/tab.');
        console.log('[Hubble] Page title:', document.title);
        return;
      }

      const availability = await Summarizer.availability();
      if (availability === 'unavailable') {
        console.warn('[Hubble] Summarizer API is unavailable.');
        console.log('[Hubble] Page title:', document.title);
        return;
      }

      const longText = (document.body?.innerText || '').slice(0, 100000);
      if (!longText) {
        console.warn('[Hubble] No readable text found on this page.');
        console.log('[Hubble] Page title:', document.title);
        return;
      }

      const summarizer = await Summarizer.create({
        type: 'key-points',
        format: 'markdown',
        length: 'medium',
      });

      const out = await summarizer.summarize(longText, {
        context: `${document.title} — ${location.hostname}`,
      });
      const text = typeof out === 'string' ? out : String(out);
      await saveClip({ title: document.title, url: location.href, summary: text });
      // eslint-disable-next-line no-console
      console.log('[Hubble] Summary saved to storage.');
    } catch (err) {
      console.warn('[Hubble] Summarization failed:', err);
      console.log('[Hubble] Page title:', document.title);
    } finally {
      inFlight = false;
    }
  }

  window.addEventListener(
    'keydown',
    (e) => {
      // Ignore if any modifier other than shift is pressed
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key !== 'Shift') return;
      if (isEditable(e.target)) return;

      const now = Date.now();
      if (!e.repeat && now - lastShiftTime <= DOUBLE_TAP_THRESHOLD_MS) {
        summarizePage();
        lastShiftTime = 0; // reset window
      } else {
        lastShiftTime = now;
      }
    },
    true,
  );
})();

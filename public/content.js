// Content script: listens for a double-tap on the Shift key and logs the page title.
// Avoid triggering inside editable fields.
(function () {
  let lastShiftTime = 0;
  const DOUBLE_TAP_THRESHOLD_MS = 350; // a quick double-tap window

  function isEditable(target) {
    if (!target) return false;
    const el = target;
    const tag = (el.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea') return true;
    // contenteditable elements
    if (el.isContentEditable) return true;
    // avoid when user is typing in elements with role="textbox"
    const role = el.getAttribute && el.getAttribute('role');
    return role === 'textbox';
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
        // Detected a double tap
        try {
          // Using document.title ensures we grab the <title> element content
          // Log it to the page console
          // eslint-disable-next-line no-console
          console.log(document.title);
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn('Failed to log page title', err);
        }
        lastShiftTime = 0; // reset window
      } else {
        lastShiftTime = now;
      }
    },
    true,
  );
})();

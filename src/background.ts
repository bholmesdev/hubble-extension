// Background service worker for MV3 (ESM)
// Types are provided via "chrome-types" and tsconfig types: ["chrome"].

chrome.runtime.onInstalled.addListener((details) => {
  console.log('Hubble extension installed/updated', details);
});

chrome.action.onClicked.addListener(async (tab) => {
  // Example: open the popup as a separate page if clicked on the icon without popup
  // With default_popup set, this usually won't fire, but keep as sample behavior.
  console.log('Action clicked', tab?.id);
});

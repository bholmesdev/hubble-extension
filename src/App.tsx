import { useEffect, useState } from 'react';
import './App.css';

type Clip = {
  title: string;
  url: string;
  summary: string;
  createdAt: number;
};

function App() {
  const [clips, setClips] = useState<Clip[]>([]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const { clips } = await chrome.storage.local.get(['clips']);
        if (!mounted) return;
        setClips(Array.isArray(clips) ? (clips as Clip[]) : []);
      } catch (e) {
        console.warn('[Hubble] Failed to read clips from storage:', e);
      }
    }

    load();

    const onChanged: Parameters<typeof chrome.storage.onChanged.addListener>[0] = (
      changes,
      area,
    ) => {
      if (area !== 'local') return;
      if ('clips' in changes) {
        setClips((changes.clips.newValue ?? []) as Clip[]);
      }
    };

    chrome.storage.onChanged.addListener(onChanged);
    return () => {
      mounted = false;
      chrome.storage.onChanged.removeListener(onChanged);
    };
  }, []);

  if (clips.length === 0) {
    return (
      <div style={{ padding: 12, minWidth: 280 }}>
        <h1 style={{ margin: 0, fontSize: 16 }}>Saved pages</h1>
        <p style={{ color: '#666' }}>No clips yet. Double-tap Shift on a page to save a summary.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 12, minWidth: 320 }}>
      <h1 style={{ margin: '0 0 8px', fontSize: 16 }}>Saved pages</h1>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {clips.map((c) => (
          <li key={c.url + ':' + c.createdAt} style={{ marginBottom: 6 }}>
            <a href={c.url} target="_blank" rel="noreferrer">
              {c.title || c.url}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;

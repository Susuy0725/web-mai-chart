// Lightweight ZIP loader wrapper using JSZip (loaded via CDN at runtime)
// Exposes: loadZipFromUrl(url) -> Promise<{name: string, files: Array<{name, text, arrayBuffer}>}>

export async function ensureJSZip() {
    if (window.JSZip) return window.JSZip;
    // Load from CDN
    return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
        s.onload = () => { resolve(window.JSZip); };
        s.onerror = (e) => { reject(new Error('Failed to load JSZip from CDN')); };
        document.head.appendChild(s);
    });
}

export async function loadZipFromUrl(url) {
    const JSZip = await ensureJSZip();
    // helper: try direct fetch, fallback to AllOrigins proxy if blocked by CORS
    async function fetchWithCorsFallback(u) {
        try {
            const r = await fetch(u);
            if (r.ok) return r;
            // Non-ok (404 etc.) — throw to allow higher-level handling
            throw new Error(`Failed to download zip: ${r.status}`);
        } catch (err) {
            // Likely a CORS or network error; attempt proxy fallback
            console.warn('Direct fetch failed, attempting AllOrigins proxy fallback:', err && err.message);
            const proxy = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u);
            const r2 = await fetch(proxy);
            if (!r2.ok) throw new Error(`Proxy fetch failed: ${r2.status}`);
            return r2;
        }
    }

    const resp = await fetchWithCorsFallback(url);
    if (!resp.ok) throw new Error(`Failed to download zip: ${resp.status}`);
    const ab = await resp.arrayBuffer();
    const zip = await JSZip.loadAsync(ab);
    const files = [];
    await Promise.all(Object.keys(zip.files).map(async (filename) => {
        const entry = zip.files[filename];
        if (entry.dir) return;
        // Read text for small files, fallback to arrayBuffer for binary
        try {
            const txt = await entry.async('text');
            files.push({ name: filename, text: txt, arrayBuffer: null });
        } catch (e) {
            const arr = await entry.async('arraybuffer');
            files.push({ name: filename, text: null, arrayBuffer: arr });
        }
    }));
    return { name: url, files };
}

const localesCache = {};
let currentLocale = document.documentElement.lang || 'en';
let currentDict = {};

export async function loadLocale(locale) {
    if (localesCache[locale]) { currentDict = localesCache[locale]; currentLocale = locale; return; }
    try {
        const resp = await fetch(`Other/locales/${locale}.json`);
        if (!resp.ok || resp.status === 404) throw new Error('no locale');
        const dict = await resp.json();
        localesCache[locale] = dict;
        currentDict = dict;
        currentLocale = locale;
    } catch (e) {
        console.warn('loadLocale failed', e);
    }
}

export function t(org, key, vars) {
    console.log('Translating key:', key, 'with vars:', vars);
    let s = (currentDict && currentDict[key]) ? currentDict[key] : org;
    if (vars && typeof vars === 'object') {
        Object.keys(vars).forEach(k => {
            s = s.replace(new RegExp(`\\{\\{\\s*${k}\\s*\\}\\}`, 'g'), vars[k]);
        });
    }
    return s;
}

export function translateDOM(root = document) {
    root.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (!key) return;
        el.textContent = t(el.textContent, key);
    });
    // 支援屬性翻譯: data-i18n-attr="placeholder:KEY;title:KEY2"
    root.querySelectorAll('[data-i18n-attr]').forEach(el => {
        const spec = el.getAttribute('data-i18n-attr');
        spec.split(';').forEach(pair => {
            const [attr, key] = pair.split(':').map(s => s && s.trim());
            if (attr && key) el.setAttribute(attr, t(key));
        });
    });
}

export async function setLocale(locale) {
    await loadLocale(locale);
    translateDOM();
    try { localStorage.setItem('locale', locale); } catch (e) { }
}
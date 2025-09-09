// Local storage helpers for web-mai-chart
// Exposes window.localStore with methods: saveSettings(obj), loadSettings(), clearSettings()
import * as main from './main.js';

(function () {
    const STORAGE_KEY = 'web_mai_chart_settings_v1';

    function safeParse(raw) {
        try {
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            console.warn('Failed to parse stored settings', e);
            return null;
        }
    }

    function saveSettings(settingsObj) {
        try {
            if (!settingsObj || typeof settingsObj !== 'object') return false;
            const toStore = {};
            // Only store primitive values and plain objects/arrays to keep payload small
            for (const k in settingsObj) {
                try {
                    const v = settingsObj[k];
                    // skip functions and DOM nodes
                    if (typeof v === 'function') continue;
                    toStore[k] = v;
                } catch (e) { /* ignore */ }
            }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
            return true;
        } catch (e) {
            console.error('Failed to save settings to localStorage', e);
            return false;
        }
    }

    function loadSettings() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            console.log('Loaded settings from localStorage:', JSON.parse(raw));
            return safeParse(raw) || null;
        } catch (e) {
            console.error('Failed to load settings from localStorage', e);
            return null;
        }
    }

    function clearSettings() {
        try {
            localStorage.removeItem(STORAGE_KEY);
            return true;
        } catch (e) {
            console.error('Failed to clear settings in localStorage', e);
            return false;
        }
    }

    function mergeIntoAppSettings(stored) {
        try {
            if (!stored || typeof stored !== 'object') return;
            if (typeof window === 'undefined') return;
            if (!window.settings) return;
            // only copy keys that exist on window.settings to avoid adding unknown fields
            for (const k in stored) {
                if (Object.prototype.hasOwnProperty.call(window.settings, k)) {
                    try { window.settings[k] = stored[k]; } catch (e) { }
                }
            }
            // call optional hook to update UI
            if (typeof window.updateBgDarknessCss === 'function') {
                try { window.updateBgDarknessCss(); } catch (e) { }
            }
        } catch (e) {
            console.error('mergeIntoAppSettings failed', e);
        }
    }

    // Expose API
    window.localStore = {
        saveSettings,
        loadSettings,
        clearSettings,
        _mergeIntoAppSettings: mergeIntoAppSettings
    };

    // On DOMContentLoaded, attempt to load & merge stored settings
    if (typeof document !== 'undefined') {
        document.addEventListener('DOMContentLoaded', function () {
            try {
                const s = loadSettings();
                if (s) mergeIntoAppSettings(s);

                try { main.updateBgDarknessCss(); } catch (e) { }
                try { main.updateMainColorCss(); } catch (e) { }
            } catch (e) { /* ignore */ }
        });
    }
})();

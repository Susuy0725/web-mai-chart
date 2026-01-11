import { simai_decode } from "./decode.js";
import * as render from "./render.js";
import { loadZipFromUrl } from "./zipLoader.js";

const viteDev = import.meta.env.MODE === 'development';

export const defaultSettings = {
    'musicDelay': 0,
    'distanceToMid': 0.3,
    'roundStroke': true,
    'noteSize': 0.09,
    'speed': 5.5,
    'pinkStar': false,
    'starRotate': true,
    'touchSpeed': 2,
    'slideSpeed': 0,
    'holdEndNoSound': false,
    'showSlide': true,
    'nextNoteHighlight': false,
    'followText': true,
    'nowDiff': 5,
    'showEffect': true,
    'effectDecayTime': 0.3,
    'noSensor': false,
    'disableSensorWhenPlaying': true,
    'lineWidthFactor': 0.8,
    'noNoteArc': false,
    'middleDisplay': 2, // 0 none, 1 combo, 2 score (0.00 - 101.00)
    'maxSlideOnScreenCount': 200,
    'showFpsCounter': false,
    'audioZoom': 200,
    'showPerfBreakdown': false,
    'backgroundDarkness': 0.7,
    'showBgMask': true,
    'useImgSkin': true,
    'mainColor': '#444e5d',
    'debug': false,
    'hires': true,
    'disablePreview': false,
    'disablePreviewAtAudio': false,
    'deviceAudioOffset': 0,
    'noteSkin': 1, // 0 default ,1 Deluxe
    'disableSyntaxErrorNotify': true,
    'hideBgAndVideoWhenPaused': true,
    'showHanabiEffect': false, // testing
};

const imgsToCreate = [
    ['outline',
        'png',
        ''],
    ['sensor',
        'svg',
        ''],
    ['star_eff',
        'svg',
        ''],
    ['sensor_text',
        'svg',
        ''],
    ['tap',
        'png',
        'TapSkins'],
    ['tap_break',
        'png',
        'TapSkins'],
    ['tap_each',
        'png',
        'TapSkins'],
    ['tap_ex',
        'png',
        'TapSkins'],
    ['hold',
        'png',
        'HoldSkins'],
    ['hold_break',
        'png',
        'HoldSkins'],
    ['hold_each',
        'png',
        'HoldSkins'],
    ['hold_ex',
        'png',
        'HoldSkins'],
    ['touch',
        'png',
        'TouchSkins'],
    ['touch_point',
        'png',
        'TouchSkins'],
    ['touch_point_each',
        'png',
        'TouchSkins'],
    ['touch_each',
        'png',
        'TouchSkins'],
    ['star',
        'png',
        'StarSkins'],
    ['star_pink',
        'png',
        'StarSkins'],
    ['star_ex',
        'png',
        'StarSkins'],
    ['star_break',
        'png',
        'StarSkins'],
    ['star_each',
        'png',
        'StarSkins'],
    ['star_double',
        'png',
        'StarSkins'],
    ['star_pink_double',
        'png',
        'StarSkins'],
    ['star_break_double',
        'png',
        'StarSkins'],
    ['star_each_double',
        'png',
        'StarSkins'],
    ['slide',
        'png',
        'SlideSkins'],
    ['slide_each',
        'png',
        'SlideSkins'],
    ['slide_break',
        'png',
        'SlideSkins'],
    ['wifi_0',
        'png',
        'WifiSkins'],
    ['wifi_1',
        'png',
        'WifiSkins'],
    ['wifi_2',
        'png',
        'WifiSkins'],
    ['wifi_3',
        'png',
        'WifiSkins'],
    ['wifi_4',
        'png',
        'WifiSkins'],
    ['wifi_5',
        'png',
        'WifiSkins'],
    ['wifi_6',
        'png',
        'WifiSkins'],
    ['wifi_7',
        'png',
        'WifiSkins'],
    ['wifi_8',
        'png',
        'WifiSkins'],
    ['wifi_9',
        'png',
        'WifiSkins'],
    ['wifi_10',
        'png',
        'WifiSkins'],
    ['wifi_each_0',
        'png',
        'WifiSkins'],
    ['wifi_each_1',
        'png',
        'WifiSkins'],
    ['wifi_each_2',
        'png',
        'WifiSkins'],
    ['wifi_each_3',
        'png',
        'WifiSkins'],
    ['wifi_each_4',
        'png',
        'WifiSkins'],
    ['wifi_each_5',
        'png',
        'WifiSkins'],
    ['wifi_each_6',
        'png',
        'WifiSkins'],
    ['wifi_each_7',
        'png',
        'WifiSkins'],
    ['wifi_each_8',
        'png',
        'WifiSkins'],
    ['wifi_each_9',
        'png',
        'WifiSkins'],
    ['wifi_each_10',
        'png',
        'WifiSkins'],
    ['wifi_break_0',
        'png',
        'WifiSkins'],
    ['wifi_break_1',
        'png',
        'WifiSkins'],
    ['wifi_break_2',
        'png',
        'WifiSkins'],
    ['wifi_break_3',
        'png',
        'WifiSkins'],
    ['wifi_break_4',
        'png',
        'WifiSkins'],
    ['wifi_break_5',
        'png',
        'WifiSkins'],
    ['wifi_break_6',
        'png',
        'WifiSkins'],
    ['wifi_break_7',
        'png',
        'WifiSkins'],
    ['wifi_break_8',
        'png',
        'WifiSkins'],
    ['wifi_break_9',
        'png',
        'WifiSkins'],
    ['wifi_break_10',
        'png',
        'WifiSkins'],
    ['touch_border_2',
        'png',
        'TouchSkins'],
    ['touch_border_3',
        'png',
        'TouchSkins'],
    ['touch_border_2_each',
        'png',
        'TouchSkins'],
    ['touch_border_3_each',
        'png',
        'TouchSkins'],
    ['touchhold_0',
        'png',
        'TouchHoldSkins'],
    ['touchhold_1',
        'png',
        'TouchHoldSkins'],
    ['touchhold_2',
        'png',
        'TouchHoldSkins'],
    ['touchhold_3',
        'png',
        'TouchHoldSkins'],
    ['touchhold_border',
        'png',
        'TouchHoldSkins'],
];
const effects = [
    'ColorBall.png'
];

if (defaultSettings.debug) {
    const debugConsole = document.createElement('div');
    debugConsole.style.position = 'fixed';
    debugConsole.style.bottom = '0';
    debugConsole.style.right = '0';
    debugConsole.style.width = '50%';
    debugConsole.style.height = '100px';
    debugConsole.style.overflow = 'auto';
    debugConsole.style.backgroundColor = 'rgba(0,0,0,0.5)';
    debugConsole.style.color = 'white';
    debugConsole.style.zIndex = '9999';
    debugConsole.touchAction = 'none';
    debugConsole.style.userSelect = 'none';
    debugConsole.style.fontSize = '12px';
    debugConsole.style.fontFamily = 'monospace';
    debugConsole.overflowY = 'scroll';
    document.body.appendChild(debugConsole);

    // from https://stackoverflow.com/questions/19846078/how-to-read-from-chromes-console-in-javascript
    console.stdlog = console.log.bind(console);
    console.stdwarn = console.warn.bind(console);
    console.stderror = console.error.bind(console);
    console.log = function () {
        console.stdlog.apply(console, arguments);
        const text = document.createElement('div');
        text.textContent = Array.from(arguments).join(' ');
        debugConsole.appendChild(text);
    }
    console.warn = function () {
        console.stdwarn.apply(console, arguments);
        const text = document.createElement('div');
        text.style.color = 'yellow';
        text.textContent = Array.from(arguments).join(' ');
        debugConsole.appendChild(text);
    }
    console.error = function () {
        console.stderror.apply(console, arguments);
        const text = document.createElement('div');
        text.style.color = 'red';
        text.textContent = Array.from(arguments).join(' ');
        debugConsole.appendChild(text);
    }
}

// Export a separate settings object (clone) so runtime changes don't mutate defaultSettings
export let settings = JSON.parse(JSON.stringify(defaultSettings)); // deep clone

// 把 settings.backgroundDarkness 同步到 CSS :root 的 --bg-dark
export function updateBgDarknessCss() {
    try {
        let v = parseFloat(settings.backgroundDarkness);
        if (!isFinite(v)) v = 0;
        v = Math.max(0, Math.min(1, v));
        // 使用 rgba 黑色，加上透明度
        const cssVal = `rgba(0,0,0,${v})`;
        if (typeof document !== 'undefined' && document.documentElement && document.documentElement.style) {
            document.documentElement.style.setProperty('--bg-dark', cssVal);
        }
    } catch (e) {
        // ignore
    }

}

// Save a blob/file as bg.<ext> into the provided directoryHandle (File System Access API)
async function saveBgToDirectory(blobOrFile, directoryHandle) {
    if (!directoryHandle) return false;
    try {
        // Determine extension
        let ext = 'png';
        try {
            if (blobOrFile.name) {
                const parts = blobOrFile.name.split('.');
                if (parts.length > 1) ext = parts.pop().toLowerCase();
            } else if (blobOrFile.type) {
                const t = blobOrFile.type.split('/').pop();
                if (t) ext = t;
            }
        } catch (e) { /* fallback to png */ }

        const newName = `bg.${ext}`;
        // get or create file handle
        const fh = await directoryHandle.getFileHandle(newName, { create: true });
        const writable = await fh.createWritable();
        // If it's a File or Blob, get ArrayBuffer
        const buffer = await (blobOrFile.arrayBuffer ? blobOrFile.arrayBuffer() : (await fetch(blobOrFile).then(r => r.arrayBuffer())));
        await writable.write(buffer);
        await writable.close();
        return true;
    } catch (e) {
        console.warn('saveBgToDirectory failed:', e);
        return false;
    }
}

// Show/hide background image and video depending on play state
function updateBgVisibility() {
    try {
        const bgImgEl = document.getElementById('bgImg');
        const bgVideoEl = document.getElementById('backgroundVideo');
        const isPlaying = !play.pause; // play.pause true means paused

        if (bgImgEl) {
            try {
                bgImgEl.style.display = (isPlaying && bgImgEl.src) ? '' : 'none';
            } catch (e) { }
        }
        if (bgVideoEl) {
            try {
                bgVideoEl.style.display = (isPlaying && bgVideoEl.src) ? '' : 'none';
            } catch (e) { }
        }
    } catch (e) { console.warn('updateBgVisibility failed', e); }
}

// 把 settings.mainColor 同步到 CSS :root 的 --main-color
export function updateMainColorCss() {
    try {
        let v = settings.mainColor || defaultSettings.mainColor;
        if (typeof document !== 'undefined' && document.documentElement && document.documentElement.style) {
            document.documentElement.style.setProperty('--main-color', v);
        }
    } catch (e) {
        // ignore
    }
}

// 顯示或隱藏背景遮罩 (#bgMask)
// 如果傳入 value，則會更新 settings.showBgMask；否則使用目前的設定值
export function showBgMask(value) {
    try {
        if (typeof value === 'boolean') settings.showBgMask = value;
        const el = document.getElementById('bgMask');
        if (!el) return;
        // 確保 CSS 變數同步
        try { updateBgDarknessCss(); } catch (e) { }
        if (settings.showBgMask) {
            // 顯示遮罩：恢復 display，讓 CSS 的背景漸層生效
            el.style.display = '';
            // 若之前被設定為負 z-index，保留檔案的樣式；確保能看到時可調
            // 由 CSS 控制大小與背景，這裡不改變 background
        } else {
            // 隱藏遮罩：使用 display none
            el.style.display = 'none';
        }
    } catch (e) {
        console.error('showBgMask error:', e);
    }
}
const icons = ['pause', 'play_arrow', 'skip_previous', 'replay_10', 'replay_5', 'forward_5', 'forward_10'];

export let play = {
    'pauseBoth': function (btn) {
        play.btnPause = true;
        play.pause = true;
        btn.textContent = icons[0 + play.btnPause];
    },
    'lastPauseTime': 0,
    'pause': true,
    'btnPause': true,
    'nowIndex': 0,
    'combo': 0,
    'score': 0,
    'playbackSpeed': 1,
    'maximized': false,
};

// --- Performance instrumentation overlay ---
export const perf = (function () {
    let overlay = null;
    const stats = {
        fps: 0,
        frameMs: 0,
        updateMs: 0,
        renderMs: 0,
        audioMs: 0,
    };
    let lastTime = performance.now();
    let frames = 0;

    function tick(frameMs, updateMs, renderMs, audioMs) {
        frames++;
        const now = performance.now();
        if (now - lastTime >= 1000) {
            stats.fps = Math.round((frames * 1000) / (now - lastTime));
            frames = 0;
            lastTime = now;
        }
        stats.frameMs = Math.round(frameMs * 10) / 10;
        stats.updateMs = Math.round(updateMs * 10) / 10;
        stats.renderMs = Math.round(renderMs * 10) / 10;
        stats.audioMs = Math.round(audioMs * 10) / 10;
    }

    return { tick, _stats: stats };
})();

export function loadimgs() {
    // --- 動態建立 imgs 區塊的 <img> 元素，並把對象放到 noteImages ---
    try {
        const imgsContainer = document.getElementById('imgs');
        if (imgsContainer) {
            imgsContainer.innerHTML = '';
            console.log('Creating note images for skin:', noteSkin[settings.noteSkin]);
            imgsToCreate.forEach(([id, filetype, notetype]) => {
                const img = document.createElement('img');
                img.id = "img_" + id;
                // only set src if using image skin; otherwise keep empty for programmatic draws
                img.src = `Skins/${noteSkin[settings.noteSkin]}/${notetype == "" ? "" : (notetype + "/")}${id}.${filetype}`;
                imgsContainer.appendChild(img);
                // Also populate the exported noteImages map for other modules to use
            });
            effects.forEach((filename) => {
                const img = document.createElement('img');
                img.id = "img_" + filename.split('.')[0];
                img.src = `Skins/Effects/${filename}`;
                imgsContainer.appendChild(img);
            });
            getImgs().catch(err => console.error('getImgs failed:', err));
        }
    } catch (e) { console.warn('create imgs error', e); }
}

const noteSkin = ['default', 'Deluxe'];

let soundSettings = {
    'answer': true,
    'sfxs': true,
    'music': true,
    'answerVol': 0.8,
    'judgeVol': 0.2,
    'judgeExVol': 0.1,
    'breakJudgeVol': 0.3,
    'touchVol': 0.2,
    'breakVol': 0.2,
    'musicVol': 0.7,
    'hanabiVol': 0.3,
    'slideVol': 0.2,
};
// Snapshot of default sound settings for reset
const defaultSoundSettings = JSON.parse(JSON.stringify(soundSettings));
let maidata; // Chart data

const settingsFormConfig = {
    game: [
        { target: settings, key: 'musicDelay', label: '譜面偏移 (音樂延遲)', type: 'number', step: 0.01, min: -20, max: 20 },
        { target: settings, key: 'backgroundDarkness', label: '背景暗度', type: 'number', step: 0.05, min: 0, max: 1 },
        { target: play, key: 'playbackSpeed', label: '回放速度', type: 'number', step: 0.01, min: 0.01, max: 4 },
        { target: settings, key: 'followText', label: '文本跟隨', type: 'boolean' },
        { target: settings, key: 'speed', label: 'Tap/Hold 速度', type: 'number', step: 0.1 },
        { target: settings, key: 'slideSpeed', label: 'Slide 速度', type: 'number', step: 0.1 },
        { target: settings, key: 'touchSpeed', label: 'Touch 速度', type: 'number', step: 0.1 },
        { target: settings, key: 'pinkStar', label: '粉紅色星星', type: 'boolean' },
        { target: settings, key: 'starRotate', label: '星星旋轉', type: 'boolean' },
        { target: settings, key: 'middleDisplay', label: '中央顯示', type: 'dropdown', options: ['無', 'COMBO', '分數(累加)'], value: [0, 1, 2] },
        { target: settings, key: 'holdEndNoSound', label: 'Hold 結尾無音效', type: 'boolean' },
    ],
    display: [
        { target: settings, key: 'showSlide', label: '顯示 Slide 軌跡', type: 'boolean' },
        { target: settings, key: 'disableSensorWhenPlaying', label: '播放時隱藏 Touch 位置文本', type: 'boolean' },
        { target: settings, key: 'distanceToMid', label: 'Note 出現位置 (0-1)', type: 'number', step: 0.01, min: 0, max: 1 },
        { target: settings, key: 'noteSize', label: 'Note 大小 (0-1)', type: 'number', step: 0.01, min: 0, max: 1 },
        { target: settings, key: 'lineWidthFactor', label: 'Note 粗細 (不影響 Touch) (0-1)', type: 'number', step: 0.01, min: 0, max: 2 },
        { target: settings, key: 'showEffect', label: '顯示簡單效果', type: 'boolean' },
        { target: settings, key: 'effectDecayTime', label: '效果持續時間', type: 'number', step: 0.01 },
        { target: settings, key: 'noNoteArc', label: '不顯示音符弧線', type: 'boolean' },
        { target: settings, key: 'roundStroke', label: '圓滑邊緣', type: 'boolean' },
    ],
    sound: [
        { target: settings, key: 'deviceAudioOffset', label: '設備音訊延遲 (毫秒)', type: 'number', step: 1, min: -1000, max: 1000 },
        { target: soundSettings, key: 'sfxs', label: '啟用打擊音效', type: 'boolean' },
        { target: soundSettings, key: 'answer', label: '啟用 Answer 音效', type: 'boolean' },
        { target: soundSettings, key: 'music', label: '啟用音樂', type: 'boolean' },
        { target: soundSettings, key: 'musicVol', label: '音樂音量 (0-1)', type: 'number', step: 0.01, min: 0, max: 1 },
        { target: soundSettings, key: 'answerVol', label: 'Answer 音量 (0-1)', type: 'number', step: 0.01, min: 0, max: 1 },
        { target: soundSettings, key: 'judgeVol', label: 'judge 音量 (0-1)', type: 'number', step: 0.01, min: 0, max: 1 },
        { target: soundSettings, key: 'judgeExVol', label: 'Ex 音量 (0-1)', type: 'number', step: 0.01, min: 0, max: 1 },
        { target: soundSettings, key: 'breakJudgeVol', label: 'Break judge音量 (0-1)', type: 'number', step: 0.01, min: 0, max: 1 },
        { target: soundSettings, key: 'touchVol', label: 'Touch 音量 (0-1)', type: 'number', step: 0.01, min: 0, max: 1 },
        { target: soundSettings, key: 'breakVol', label: 'Break 音量 (0-1)', type: 'number', step: 0.01, min: 0, max: 1 },
        { target: soundSettings, key: 'slideVol', label: 'Slide 音量 (0-1)', type: 'number', step: 0.01, min: 0, max: 1 },
        { target: soundSettings, key: 'hanabiVol', label: '煙火音量 (0-1)', type: 'number', step: 0.01, min: 0, max: 1 },
    ],
    other: [
        { target: settings, key: 'showFpsCounter', label: '顯示 FPS', type: 'boolean' },
        { target: settings, key: 'showPerfBreakdown', label: '啟用性能監控', type: 'boolean' },
        { target: settings, key: 'mainColor', label: '主色', type: 'color' },
        { target: settings, key: 'useImgSkin', label: '使用圖片皮膚(測試中)', type: 'boolean' },
        { target: settings, key: 'hires', label: '高解析度', type: 'boolean' },
        { target: settings, key: 'noteSkin', label: 'Note 皮膚 (需要重新整理)', type: 'dropdown', options: ['default', 'Deluxe'], value: [0, 1] },
        { target: settings, key: 'disablePreview', label: '禁用音符預覽', type: 'boolean' },
        { target: settings, key: 'disableSyntaxErrorNotify', label: '不要顯示語法錯誤訊息', type: 'boolean' },
        { target: settings, key: 'hideBgAndVideoWhenPaused', label: '當暫停時不要顯示BG和影片', type: 'boolean' },
    ]
}, settingsGroupConfig = [
    { key: 'game', title: '基本' },
    { key: 'sound', title: '音效' },
    { key: 'display', title: '顯示' },
    { key: 'other', title: '其他' }
];

let notes = [{}], notesData = {}, marks = {};
let triggered = [];
let startTime = 0;
let maxTime = 1000;
let sfxReady = false, inSettings = false;
let currentTimelineValue = 0;

// Export a mutable object that will be populated asynchronously.
export const noteImages = {};

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// Ensure AudioContext is resumed on first user interaction (fixes iOS autoplay restrictions)
async function ensureAudioUnlocked() {
    try {
        if (!audioCtx) return Promise.resolve();
        if (audioCtx.state === 'suspended') {
            try {
                await audioCtx.resume();
                console.log('AudioContext resumed by user interaction.');
            } catch (e) {
                console.warn('AudioContext resume failed:', e);
            }
        }
    } catch (e) {
        console.warn('ensureAudioUnlocked error:', e);
    }
    return Promise.resolve();
}

// install one-time listeners to resume AudioContext on first user gesture (touch/mouse/keyboard)
['touchstart', 'mousedown', 'keydown'].forEach(evt => {
    window.addEventListener(evt, function _unlockOnce() {
        try { ensureAudioUnlocked(); } catch (e) { /* ignore */ }
        window.removeEventListener(evt, _unlockOnce);
    }, { passive: true });
});

let analyser;
let audioWaveform_dataArray;
let audioWaveform_bufferLength;
let isAudioSourceConnected = false;
let fullAudioBuffer;
let audioRenderDragging = false;
let directoryHandle = null;
let maidataFileHandle = null;
let audioFileHandle = null;
let lastDragX;
// 用來儲存當前為開啟資料夾註冊的 drop/dragover handler，以便在需要時解除註冊
let openFolderDropHandler = null;
let openFolderDragOverHandler = null;

const soundFiles = {
    tap: 'judge.wav', ex: 'judge_ex.wav', break: 'judge_break.wav', break_woo: 'break.wav',
    touch: 'touch.wav', hanabi: 'hanabi.wav', slide: 'slide.wav', breakSlide: 'break_slide_start.wav',
    breakSlideEnd: 'break_slide.wav', answer: 'answer.wav',
};

let soundBuffers = {};

async function loadAllSounds(list) {
    const buffers = {};
    let active = 0;
    const loadPromises = Object.entries(list).map(async ([key, url]) => {
        active++;
        try {
            showLoading(`下載音效：${url}`);
            const resp = await fetch('Sounds/' + url);
            if (!resp.ok) throw new Error(`Failed to fetch ${url}: ${resp.statusText}`);
            updateLoading(30);
            const arrayBuffer = await resp.arrayBuffer();
            updateLoading(70);
            buffers[key] = await audioCtx.decodeAudioData(arrayBuffer);
            updateLoading(100);
        } catch (error) {
            console.error(`Error loading sound ${key} (${url}):`, error);
            buffers[key] = null;
        } finally {
            active--;
            hideLoading();
        }
    });
    await Promise.all(loadPromises);
    return buffers;
}

function playSound(buffers, name, { volume = 0.1 } = {}) {
    // Play immediately or at a scheduled AudioContext time using `when`.
    // If caller wants to schedule, pass { when: audioCtx.currentTime + offset }
    if (audioCtx.state === 'suspended') { audioCtx.resume(); }
    const buffer = buffers[name];
    if (!buffer) return;

    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    const gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
    source.connect(gainNode).connect(audioCtx.destination);
    // support optional scheduling via `when` in the options object
    const when = (arguments[2] && arguments[2].when) ? arguments[2].when : audioCtx.currentTime;
    try {
        source.start(when);
    } catch (e) {
        // fallback to immediate start
        try { source.start(); } catch (e2) { /* ignore */ }
    }
}

// --- 新增：Sound queue 與處理器（將播放從 RAF 解耦） ---
let soundQueue = [];
let soundQueueInterval = null;

function queueSound(name, volume = 0.1) {
    if (!sfxReady || !soundBuffers[name]) return;
    if (audioCtx.state === 'suspended') { audioCtx.resume(); }
    // schedule slightly in the future to avoid glitches
    const when = audioCtx.currentTime + 0.02;
    soundQueue.push({ name, volume, when });
}

function processSoundQueue() {
    if (!soundQueue || soundQueue.length === 0) return;
    soundQueue = [...new Map(soundQueue.map(item => [item.name + item.when.toFixed(3), item])).values()];
    const now = audioCtx.currentTime;
    // play any sounds due within a small lookahead window
    const lookahead = 0.05; // seconds
    while (soundQueue.length > 0 && soundQueue[0].when <= now + lookahead) {
        const ev = soundQueue.shift();
        playSound(soundBuffers, ev.name, { volume: ev.volume, when: ev.when });
    }
}

// start interval processor
if (!soundQueueInterval) {
    soundQueueInterval = setInterval(processSoundQueue, 1);
    // ensure cleanup on page unload
    window.addEventListener('unload', () => {
        if (soundQueueInterval) clearInterval(soundQueueInterval);
    });
}
// --- 新增結束 ---

// --- Loading overlay API ---
let _loadingCount = 0; // number of concurrent loading tasks
function _getLoadingElements() {
    const overlay = document.getElementById('loading-overlay');
    const msg = document.getElementById('loading-message');
    const progress = document.getElementById('loading-progress');
    const bar = progress ? progress.querySelector('.loading-progress-bar') : null;
    return { overlay, msg, progress, bar };
}

export function showLoading(message = '載入中...', { determinate = false, progress = null } = {}) {
    try {
        _loadingCount++;
        const { overlay, msg, progress, bar } = _getLoadingElements();
        if (!overlay || !msg) return;
        msg.textContent = message;
        if (progress != null && bar) {
            progress.setAttribute('aria-hidden', 'false');
            bar.style.width = Math.max(0, Math.min(100, progress)) + '%';
        } else if (determinate && progress && bar) {
            progress.setAttribute('aria-hidden', 'false');
            // leave bar width as-is until updated
        } else if (progress && bar) {
            progress.setAttribute('aria-hidden', 'true');
        }
        overlay.classList.remove('hide');
    } catch (e) { console.warn('showLoading error', e); }
}

export function updateLoading(messageOrProgress) {
    try {
        const { overlay, msg, progress, bar } = _getLoadingElements();
        if (!overlay || !msg) return;
        if (typeof messageOrProgress === 'string') msg.textContent = messageOrProgress;
        else if (typeof messageOrProgress === 'number' && bar) {
            progress.setAttribute('aria-hidden', 'false');
            bar.style.width = Math.max(0, Math.min(100, messageOrProgress)) + '%';
        }
    } catch (e) { console.warn('updateLoading error', e); }
}

export function hideLoading(force = false) {
    try {
        if (force) _loadingCount = 0; else _loadingCount = Math.max(0, _loadingCount - 1);
        if (_loadingCount > 0 && !force) return; // still have active tasks
        const { overlay, progress, bar } = _getLoadingElements();
        if (!overlay) return;
        overlay.classList.add('hide');
        if (progress && bar) {
            progress.setAttribute('aria-hidden', 'true');
            bar.style.width = '0%';
        }
    } catch (e) { console.warn('hideLoading error', e); }
}
// --- end loading overlay API ---

// Download a conservative set of resources into the cache for offline use.
// This function is conservative (app shell + fonts + sounds + current skin images listed in imgsToCreate)
// and reports progress via the existing loading overlay API.
export async function downloadOffline() {
    const CACHE_NAME = 'web-mai-chart-cache-v1';
    try {
        // app shell
        const core = [
            './', './index.html',
            './Styles/main.css',
            './Js/main.js',
            './Js/render.js',
            './Js/decode.js',
        ];

        // fonts (conservative list)
        const fonts = [
            './Fonts/Inter.ttf',
            './Fonts/MaterialSymbolsRounded[FILL,GRAD,opsz,wght].ttf',
            './Fonts/Arimo-Bold.ttf',
            './Fonts/ChironGoRoundTC-VariableFont_wght.ttf',
            './Fonts/SUSE-VariableFont_wght.ttf',
        ];

        // sounds derived from soundFiles if available
        let sounds = [];
        try { sounds = Object.values(soundFiles || {}).map(u => './Sounds/' + u); } catch (e) { sounds = []; }

        // skins: map imgsToCreate for the currently selected noteSkin
        const skins = [];
        try {
            const skinName = (noteSkin && noteSkin[settings.noteSkin]) ? noteSkin[settings.noteSkin] : noteSkin[0];
            if (skinName && Array.isArray(imgsToCreate)) {
                imgsToCreate.forEach(([id, filetype, notetype]) => {
                    const path = './Skins/' + skinName + (notetype ? '/' + notetype : '') + '/' + id + '.' + filetype;
                    skins.push(path);
                });
            }
        } catch (e) { /* ignore */ }

        const toCache = Array.from(new Set([...core, ...fonts, ...sounds, ...skins]));
        if (toCache.length === 0) {
            showNotification('沒有可快取的資源。');
            return;
        }

        showLoading('下載離線資源 - 準備中...', { determinate: true, progress: 0 });
        const cache = await caches.open(CACHE_NAME);

        for (let i = 0; i < toCache.length; i++) {
            const url = toCache[i];
            try {
                updateLoading(`下載離線資源：${i + 1}/${toCache.length} — ${url}`);
                const resp = await fetch(url, { cache: 'no-cache' });
                if (resp && resp.ok) {
                    await cache.put(url, resp.clone());
                } else {
                    console.warn('fetch failed for', url, resp && resp.status);
                }
            } catch (e) {
                console.warn('cache put failed for', url, e);
            }
            const pct = Math.round(((i + 1) / toCache.length) * 100);
            updateLoading(pct);
        }

        hideLoading();
        showNotification('主要資源已快取完成。部分資源會在首次使用時自動快取。');
    } catch (err) {
        hideLoading(true);
        console.error('downloadOffline error', err);
        showNotification('下載離線資源失敗：' + (err && err.message));
    }
}

loadAllSounds(soundFiles).then(buffers => {
    soundBuffers = buffers;
    console.log('All sounds loaded');
    sfxReady = true;
}).catch(error => {
    console.error("Failed to load some sounds:", error);
    sfxReady = true;
});


function _playEffect(note, hold = false) {
    // queue sounds instead of playing immediately to decouple from RAF
    if (!sfxReady || play.pause) return;
    if (soundSettings.answer && soundBuffers.answer && !note.slide) {
        queueSound('answer', soundSettings.answerVol);
    }
    if (soundSettings.sfxs) {
        if (note.ex && soundBuffers.ex && !hold) {
            queueSound('ex', soundSettings.judgeExVol);
        }
        if (hold) {
            if (note.touchTime && note.hanabi) {
                if (soundBuffers.hanabi) queueSound('hanabi', soundSettings.hanabiVol);
            }
            if (note.break) {
                if (note.slide) {
                    if (soundBuffers.breakSlideEnd) queueSound('breakSlideEnd', soundSettings.breakSlideVol);
                }
            }
        } else {
            if (note.break) {
                if (note.slide) {
                    if (soundBuffers.breakSlide) queueSound('breakSlide', soundSettings.breakSlideVol);
                } else {
                    if (soundBuffers.break_woo) queueSound('break_woo', soundSettings.breakVol);
                    if (soundBuffers.break) queueSound('break', soundSettings.breakJudgeVol);
                }
            } else {
                if (note.slide) {
                    if (soundBuffers.slide) queueSound('slide', soundSettings.slideVol);
                } else if (note.touch) {
                    if (soundBuffers.touch) queueSound('touch', soundSettings.touchVol);
                    if (!note.touchTime && note.hanabi) {
                        if (soundBuffers.hanabi) queueSound('hanabi', soundSettings.hanabiVol);
                    }
                } else if (soundBuffers.tap) {
                    queueSound('tap', soundSettings.judgeVol);
                }
            }
        }
    }
}

function debounce(func, delay) {
    let timeout;
    return function (...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

// Helper to find closest ancestor matching selector (vanilla .closest())
function findClosest(el, selector) {
    while (el) {
        if (el.matches(selector)) {
            return el;
        }
        el = el.parentElement;
    }
    return null;
}

// --- 新增：顯示通知氣泡的函式 ---
export let notificationTimeout; // 用於儲存計時器ID，以便取消

export function showNotification(message) {
    let notification = document.getElementById('notification-bubble');
    if (!notification) {
        // 如果通知元素不存在，就創建它並添加到 body
        notification = document.createElement('div');
        notification.id = 'notification-bubble';
        document.body.appendChild(notification);
    }

    notification.innerText = message;
    // 顯示通知（透過 CSS 類別控制顯示/隱藏和動畫）
    notification.classList.add('show');

    // 清除任何現有的計時器，避免多個通知重疊
    clearTimeout(notificationTimeout);
    // 設定計時器，在指定時間後隱藏通知
    notificationTimeout = setTimeout(() => {
        notification.classList.remove('show');
    }, 3000); // 3 秒後通知消失
}
// --- 新增結束 ---

async function triggerSave(data) {
    data.first = settings.musicDelay ?? 0;
    // 1. 序列化文字    
    function serializeMaidata(dataObj) {
        const lines = [];

        // Preferred metadata order first
        const metaOrder = ['artist', 'title', 'first', 'des', 'wholebpm', 'bpm'];
        for (const k of metaOrder) {
            if (Object.prototype.hasOwnProperty.call(dataObj, k)) {
                const v = dataObj[k];
                lines.push(`&${k}=${v ?? ''}`);
            }
        }

        // Then any other non-difficulty keys (preserve insertion order for remaining keys)
        for (const key of Object.keys(dataObj)) {
            if (metaOrder.includes(key)) continue;
            if (/^(des_|lv_|inote_)/.test(key)) continue; // skip difficulty keys for now
            lines.push(`&${key}=${dataObj[key] ?? ''}`);
        }

        // Separate metadata from per-difficulty blocks with an empty line if any difficulty exists
        let addedDiff = false;
        for (let i = 1; i <= 7; i++) {
            const lvk = `lv_${i}`;
            const desk = `des_${i}`;
            const inok = `inote_${i}`;
            const lv = dataObj[lvk];
            const desV = dataObj[desk];
            const inV = dataObj[inok];

            // Skip empty difficulty blocks (keep original behavior)
            if ((lv === undefined || lv === '' || lv === null) && (desV === undefined || desV === '' || desV === null) && (inV === undefined || inV === '' || inV === null)) {
                continue;
            }

            if (!addedDiff) {
                lines.push('');
                addedDiff = true;
            }

            if (!(lv === undefined || lv === '' || lv === null)) lines.push(`&${lvk}=${lv}`);
            if (!(desV === undefined || desV === '' || desV === null)) lines.push(`&${desk}=${desV}`);
            if (!(inV === undefined || inV === '' || inV === null)) lines.push(`&${inok}=${inV}`);
        }

        return lines.join('\n');
    }

    const text = serializeMaidata(data);

    // 2. 如果已經有 File System Access Handlers
    if (directoryHandle && maidataFileHandle && 'createWritable' in maidataFileHandle) {
        try {
            const writable = await maidataFileHandle.createWritable();
            console.log("create ok");
            await writable.write(text);
            console.log("write ok");
            await writable.close();
            console.log('已儲存到：', maidataFileHandle.name);
            showNotification(`已儲存到：${maidataFileHandle.name}`);
            return;
        } catch (err) {
            console.error("寫回檔案失敗：", err);

            // 如果是 InvalidStateError，嘗試重新獲取 handle 並重試一次
            if (err.name === 'InvalidStateError' && directoryHandle) {
                try {
                    const fileName = maidataFileHandle.name || 'maidata';
                    maidataFileHandle = await window.showSaveFilePicker({ suggestedName: fileName, startIn: directoryHandle });
                    const writable = await maidataFileHandle.createWritable();
                    await writable.write(text);
                    await writable.close();
                    console.log('重試成功，已儲存到：', maidataFileHandle.name);
                    showNotification(`已儲存到：${maidataFileHandle.name}`);
                    return;
                } catch (retryErr) {
                    console.error("重試失敗：", retryErr);
                }
            }

            showNotification('儲存失敗，將嘗試下載。');
        }
    }

    // 3. Blob 下載後備方案
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (maidataFileHandle?.name || 'maidata');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification('檔案已下載！'); // <-- 在下載後顯示通知

    // 如果瀏覽器支援 showOpenFilePicker，提示使用者選取剛下載的檔案以便未來可以直接覆寫
    // 注意：只有在使用者互動（例如按下儲存）觸發時才會開啟檔案選擇器，並且需在 secure context
    (async function offerOpenForOverwrite() {
        try {
            if (typeof window.showOpenFilePicker === 'function') {
                const ok = confirm('要選取剛剛下載的 maidata 檔案以便日後直接覆寫嗎？(若要覆寫，請選取該檔案)');
                if (!ok) return;
                try {
                    const handles = await window.showOpenFilePicker({
                        multiple: false,
                        types: [{ description: 'Maidata', accept: { 'text/plain': ['.txt', '.maidata'] } }],
                        excludeAcceptAllOption: false
                    });
                    if (handles && handles.length > 0) {
                        maidataFileHandle = handles[0];
                        try {
                            if (typeof maidataFileHandle.requestPermission === 'function') {
                                await maidataFileHandle.requestPermission({ mode: 'readwrite' });
                            }
                        } catch (permErr) { /* ignore */ }
                        showNotification('已指定檔案，未來儲存會嘗試直接覆寫該檔案');
                    }
                } catch (pickerErr) {
                    console.warn('選取檔案被取消或失敗', pickerErr);
                    showNotification('未指定覆寫檔案');
                }
            }
        } catch (e) { console.warn('offerOpenForOverwrite error', e); }
    })();
}

document.addEventListener('DOMContentLoaded', function () {
    // 初始時同步 CSS 變數
    try { updateBgDarknessCss(); } catch (e) { }
    try { showBgMask(); } catch (e) { }
    const renderCanvas = document.getElementById("render");
    const ctx = renderCanvas.getContext("2d");
    const customMenu = document.getElementById("customMenu");
    const editor = document.getElementById("editor");
    const timeDisplay = document.getElementById("nowTrackTime");
    const speedDisplay = document.getElementById("nowSpeed");
    const bgmEl = document.getElementById("bgm");

    // WebAudio-based bgm wrapper to replace <audio> playback while preserving the original API used across the codebase
    const bgm = (function () {
        const listeners = {};
        let source = null;
        let startedAt = 0; // audioCtx.currentTime when started
        let offset = 0; // seconds into buffer when started
        let playing = false;
        let _playbackRate = 1;

        const gainNode = audioCtx.createGain();
        gainNode.gain.value = 1;
        try {
            // connect to analyser if available
            if (typeof analyser !== 'undefined' && analyser) {
                gainNode.connect(analyser);
                analyser.connect(audioCtx.destination);
            } else {
                gainNode.connect(audioCtx.destination);
            }
        } catch (e) {
            try { gainNode.connect(audioCtx.destination); } catch (e2) { /* ignore */ }
        }

        function dispatch(evt) {
            const cbs = listeners[evt];
            if (cbs) cbs.forEach(cb => { try { cb.call(bgm); } catch (e) { console.error(e); } });
        }

        function createSource(startOffset) {
            if (!fullAudioBuffer) return null;
            const s = audioCtx.createBufferSource();
            s.buffer = fullAudioBuffer;
            s.playbackRate.value = _playbackRate;
            s.connect(gainNode);
            s.onended = function () {
                // natural end: set offset to duration and mark not playing
                try {
                    if (fullAudioBuffer) offset = fullAudioBuffer.duration;
                } catch (e) { /* ignore */ }
                playing = false;
                source = null;
                dispatch('ended');
            };
            return s;
        }

        function stopSource(updateOffset = true) {
            if (!source) {
                playing = false;
                return;
            }
            try {
                // detach onended to avoid double-handling
                source.onended = null;
                source.stop();
            } catch (e) { /* ignore */ }
            // update offset to reflect current play position if requested
            if (updateOffset && startedAt) {
                try {
                    offset = Math.min(fullAudioBuffer ? fullAudioBuffer.duration : 0, offset + (audioCtx.currentTime - startedAt));
                } catch (e) { /* ignore */ }
            }
            source = null;
            playing = false;
        }

        async function fetchAndDecode(url) {
            try {
                if (!url) return;
                const resp = await fetch(url);
                const ab = await resp.arrayBuffer();
                fullAudioBuffer = await audioCtx.decodeAudioData(ab);
                // notify listeners
                dispatch('loadedmetadata');
            } catch (e) {
                console.error('Error fetching/decoding bgm:', e);
            }
        }

        // Monkey-patch the original <audio> element's load() so when older code sets bgmEl.src and calls load(), we decode into AudioBuffer
        try {
            const origLoad = bgmEl.load.bind(bgmEl);
            bgmEl.load = function () {
                if (bgmEl.src) fetchAndDecode(bgmEl.src);
                return origLoad();
            };
        } catch (e) { /* ignore if bgmEl missing or non-writable */ }

        return {
            // mimic <audio> src property
            get src() { return bgmEl ? bgmEl.src : ''; },
            set src(v) { if (bgmEl) { bgmEl.src = v; fetchAndDecode(v); } },
            addEventListener(name, cb) { listeners[name] = listeners[name] || []; listeners[name].push(cb); },
            removeEventListener(name, cb) { if (!listeners[name]) return; listeners[name] = listeners[name].filter(f => f !== cb); },
            load() { if (bgmEl && bgmEl.src) fetchAndDecode(bgmEl.src); },
            play() {
                if (!fullAudioBuffer) {
                    if (bgmEl && bgmEl.src) {
                        const k = setInterval(() => {
                            if (fullAudioBuffer) {
                                this.play();
                                setTimeout(() => { clearInterval(k); }, 100);
                            }
                        }, 100);
                    } else {
                        return Promise.reject(new Error('No audio loaded'));
                    }
                }
                return ensureAudioUnlocked().then(() => {
                    // stop any existing source and capture offset
                    stopSource(true);
                    source = createSource(offset);
                    if (!source) return Promise.reject(new Error('Failed to create source'));
                    startedAt = audioCtx.currentTime;
                    try {
                        source.start(0, offset);
                        playing = true;
                        dispatch('play');
                        return Promise.resolve();
                    } catch (e) {
                        console.error('source.start error', e);
                        return Promise.reject(e);
                    }
                });
            },
            pause() {
                // stop source and keep offset
                stopSource(true);
                if (listeners['pause']) dispatch('pause');
            },
            get currentTime() { return playing ? offset + (audioCtx.currentTime - startedAt) : offset; },
            set currentTime(v) {
                const clamped = Math.max(0, Math.min(fullAudioBuffer ? fullAudioBuffer.duration : v, v));
                const wasPlaying = playing;
                // stop existing source without updating offset (we'll set offset directly)
                stopSource(false);
                offset = clamped;
                if (wasPlaying) {
                    // restart at new offset
                    source = createSource(offset);
                    if (source) {
                        startedAt = audioCtx.currentTime;
                        try {
                            source.start(0, offset);
                            playing = true;
                            dispatch('play');
                        } catch (e) { console.error('restart start error', e); }
                    }
                }
            },
            get duration() { return fullAudioBuffer ? fullAudioBuffer.duration : NaN; },
            get playbackRate() { return _playbackRate; },
            set playbackRate(v) { _playbackRate = v; if (source) try { source.playbackRate.value = v; } catch (e) { /* ignore */ } },
            get volume() { return gainNode.gain.value; },
            set volume(v) { try { gainNode.gain.setValueAtTime(Number(v) || 0, audioCtx.currentTime); } catch (e) { gainNode.gain.value = v; } },
            // expose element for advanced usages if needed
            _element: bgmEl
        };
    })();
    const bgVideo = document.getElementById('backgroundVideo');
    const bgImg = document.getElementById('bgImg');
    const debugBtn = document.createElement('div');
    const speed1x = document.getElementById('1xSpeed');
    const speedAdd = document.getElementById('+0.25xSpeed');
    const speedMinus = document.getElementById('-0.25xSpeed');
    const fullscreenBtn = document.getElementById('fullscreen');
    const lockProgressBtn = document.getElementById('lockProgress');

    if (settings.debug) {
        const a = document.getElementsByClassName('actions')[0];
        console.log("Debug mode is ON");
        debugBtn.className = 'debug-button';
        debugBtn.innerHTML = '<span>Log Debug Info</span>';
        if (a) a.appendChild(debugBtn);
    }

    speedDisplay.innerText = play.playbackSpeed.toFixed(2) + 'x';
    // --- Prevent native gestures: pinch-zoom, pull-to-refresh, and left-edge swipe ---
    (function preventNativeGestures() {
        let touchStartX = 0, touchStartY = 0;
        // pinch or multi-touch
        document.addEventListener('touchstart', function (e) {
            // If settings popup is open and touch is inside it, allow native handling (scrolling inside popup)
            try {
                const overlay = document.getElementById('settings-overlay');
                if (overlay && !overlay.classList.contains('hide')) {
                    if (e.target && e.target.closest && e.target.closest('#settings-popup')) return;
                }
            } catch (err) { /* ignore DOM errors */ }

            if (e.touches && e.touches.length > 1) {
                // prevent pinch-zoom
                e.preventDefault();
                return;
            }
            touchStartX = e.touches && e.touches[0] ? e.touches[0].clientX : 0;
            touchStartY = e.touches && e.touches[0] ? e.touches[0].clientY : 0;
        }, { passive: false });

        // iOS gesturestart
        document.addEventListener('gesturestart', function (e) {
            try {
                const overlay = document.getElementById('settings-overlay');
                if (overlay && !overlay.classList.contains('hide')) {
                    if (e.target && e.target.closest && e.target.closest('#settings-popup')) return;
                }
            } catch (err) { }
            try { e.preventDefault(); } catch (err) { }
        }, { passive: false });

        // prevent pull-to-refresh (when at top and pulling down) and left-edge swipe
        document.addEventListener('touchmove', function (e) {
            if (!e.touches || e.touches.length === 0) return;
            // If settings popup is open and touch is inside it, allow native handling (scrolling inside popup)
            try {
                const overlay = document.getElementById('settings-overlay');
                if (overlay && !overlay.classList.contains('hide')) {
                    if (e.target && e.target.closest && e.target.closest('#settings-popup')) return;
                }
            } catch (err) { /* ignore DOM errors */ }

            // multi-touch => prevent
            if (e.touches.length > 1) { e.preventDefault(); return; }
            const t = e.touches[0];
            const dx = t.clientX - touchStartX;
            const dy = t.clientY - touchStartY;

            // if at top of page and pulling down => block pull-to-refresh
            if (window.scrollY === 0 && dy > 10 && Math.abs(dy) > Math.abs(dx)) { e.preventDefault(); return; }

            // left-edge swipe heuristic: started within 30px of left edge and horizontal swipe to right
            if (touchStartX < 30 && dx > 10 && Math.abs(dx) > Math.abs(dy)) { e.preventDefault(); return; }

            // otherwise allow
        }, { passive: false });

        // Also prevent two-finger gesture via pointer events where supported
        document.addEventListener('pointerdown', function (e) {
            // For pointer events, prevent default if multiple pointers are active
            // track via navigator.maxTouchPoints if available
            if (navigator.maxTouchPoints && navigator.maxTouchPoints > 1 && e.pointerType === 'touch') {
                // nothing to do here; touchstart handler will catch multi-touch
            }
        }, { passive: true });
    })();

    // If URL contains ?zip=<url>, fetch and unpack zip and load as folder
    (async function handleZipParam() {
        try {
            const params = new URLSearchParams(window.location.search);
            const zipUrl = params.get('zip')?.replace(/"/g, "");
            if (!zipUrl) return;
            showNotification('發現 zip 參數，嘗試下載並解壓...');
            showLoading(`下載 ZIP：${zipUrl}`);
            const z = await loadZipFromUrl(zipUrl);
            hideLoading();
            const pseudoFiles = [];
            for (const f of z.files) {
                if (f.text != null) {
                    const blob = new Blob([f.text], { type: 'text/plain' });
                    const file = new File([blob], f.name, { type: 'text/plain' });
                    pseudoFiles.push(file);
                } else if (f.arrayBuffer) {
                    const blob = new Blob([f.arrayBuffer]);
                    const file = new File([blob], f.name);
                    pseudoFiles.push(file);
                }
            }
            if (pseudoFiles.length === 0) {
                showNotification('zip 內沒有可用檔案');
                return;
            }
            // Reuse the same logic as file-input fallback: process pseudoFiles array
            // Pause and reset audio
            play.pauseBoth(controls.play);
            if (bgm.src) try { URL.revokeObjectURL(bgm.src); } catch (e) { }
            bgm.src = '';
            fullAudioBuffer = null;
            isAudioSourceConnected = false;

            // find maidata/audio/pv
            let foundMaidata = null, foundAudio = null, foundPV = null;
            for (const f of pseudoFiles) {
                const name = (f.name || '').toLowerCase();
                if (!foundMaidata && (name.startsWith('maidata') || name.endsWith('.txt') || name.includes('maidata.'))) foundMaidata = f;
                if (!foundAudio && ((f.type && f.type.startsWith('audio/')) || name.startsWith('track.') || name.endsWith('.mp3') || name.endsWith('.wav') || name.endsWith('.ogg'))) foundAudio = f;
                if (!foundPV && name.startsWith('pv.')) foundPV = f;
            }

            abortBgAndVid();

            if (foundAudio) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    audioCtx.decodeAudioData(e.target.result)
                        .then(buffer => {
                            fullAudioBuffer = buffer;
                            bgm.src = URL.createObjectURL(foundAudio);
                            bgm.load();
                        })
                        .catch(err => console.error('audio decode err', err));
                };
                reader.readAsArrayBuffer(foundAudio);
            }

            try {
                const bgVideoEl = document.getElementById('backgroundVideo');
                bgVideoEl.src = '';
                if (foundPV && bgVideoEl) {
                    if (bgVideoEl.src) try { URL.revokeObjectURL(bgVideoEl.src); } catch (e) { }
                    bgVideoEl.src = URL.createObjectURL(foundPV);
                    bgVideoEl.load();
                }
            } catch (e) { console.error('pv load error', e); }

            // Check for background image file named like "bg.*" in pseudoFiles and attach to #bgImg
            try {
                const bgImgEl = document.getElementById('bgImg');
                const bgFile = pseudoFiles.find(f => {
                    const n = (f.name || '').toLowerCase();
                    return n.startsWith('bg.') || n === 'bg';
                });
                if (bgFile && bgImgEl) {
                    if (bgImgEl.src) try { URL.revokeObjectURL(bgImgEl.src); } catch (e) { }
                    bgImgEl.src = URL.createObjectURL(bgFile);
                    bgImgEl.style.display = '';
                    // If user opened a directory, try to save bg into it
                    try {
                        if (typeof directoryHandle !== 'undefined' && directoryHandle) {
                            saveBgToDirectory(bgFile, directoryHandle).then(ok => {
                                if (ok) console.log('bg file from zip saved to opened directory');
                            }).catch(() => { });
                        }
                    } catch (e) { /* ignore */ }
                }
            } catch (e) { console.warn('set bg from zip failed', e); }

            if (foundMaidata) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    maidata = e.target.result;
                    data = parseMaidataToJson(maidata);
                    settings.musicDelay = parseFloat(data.first ?? "0");
                    editor.value = getNowDiff(settings.nowDiff);
                    currentTimelineValue = 0;
                    controls.timeline.value = 0;
                    updateTimelineVisual(0);
                    startTime = Date.now();
                    processChartData();
                };
                reader.readAsText(foundMaidata);
            } else if (foundAudio) {
                maidata = "first=0\ninote=//EASY\n";
                data = parseMaidataToJson(maidata);
                settings.musicDelay = parseFloat(data.first ?? "0");
                editor.value = getNowDiff(settings.nowDiff);
                currentTimelineValue = 0;
                controls.timeline.value = 0;
                updateTimelineVisual(0);
                startTime = Date.now();
                processChartData();
                showNotification('已載入音訊並建立空譜面');
            } else {
                showNotification('Zip 內未找到 maidata 或音訊檔');
            }
        } catch (e) {
            console.error('zip param handling error', e);
            hideLoading(true);
            showNotification('處理 zip 參數失敗');
        }
    })();
    let bgVideoWasPlaying = false;
    const dropdownList = document.querySelector(".dropdownlist");
    const allDropdowns = document.querySelectorAll('.dropdown-content');
    const audioCanvas = document.getElementById("audioRender");
    const diffDisplay = document.getElementById("nowDiff");
    const diffName = [
        'EASY', 'BASIC', 'ADVANCED', 'EXPERT', 'MASTER', 'RE:MASTER', 'ORIGINAL'
    ];

    audioCanvas.addEventListener("mousedown", (e) => {
        audioRenderDragging = true;
        lastDragX = e.clientX;
    });

    audioCanvas.addEventListener("mousemove", (e) => {
        if (audioRenderDragging) {
            const deltaX = e.clientX - (lastDragX || e.clientX);
            handleAudioRenderPan(deltaX);
            lastDragX = e.clientX;
        }
    });

    // Ensure we stop dragging even if mouseup occurs outside the canvas
    window.addEventListener("mouseup", () => {
        audioRenderDragging = false;
        lastDragX = undefined;
    });

    audioCanvas.addEventListener("touchstart", (e) => {
        audioRenderDragging = true;
        lastDragX = e.touches[0].clientX;
    }, { passive: true });

    // 問題
    // touchmove 會呼叫 e.preventDefault()，因此需要 passive: false
    audioCanvas.addEventListener("touchmove", (e) => {
        if (audioRenderDragging) {
            e.preventDefault();
            const touchX = e.touches[0].clientX;
            const deltaX = touchX - lastDragX;
            handleAudioRenderPan(deltaX);
            lastDragX = touchX;
        }
    }, { passive: false });

    audioCanvas.addEventListener("touchend", () => {
        audioRenderDragging = false;
    }, { passive: true });

    function handleAudioRenderPan(deltaX) {
        // 畫面實際顯示的時間長度（秒），受 zoom 影響
        const secondsPerScreen = (0.1 * settings.audioZoom);

        // 每像素對應的時間（秒）
        const secondsPerPixel = secondsPerScreen / audioCanvas.width;

        // 拖曳距離換算成時間偏移
        const timeOffset = -deltaX * secondsPerPixel;

        // 調整 currentTimelineValue
        currentTimelineValue = Math.max(0, Math.min(maxTime / 1000, currentTimelineValue + timeOffset));

        // 同步更新音訊與視訊位置
        bgm.currentTime = currentTimelineValue;
        if (bgVideo && bgVideo.src) {
            try { bgVideo.currentTime = currentTimelineValue; } catch (e) { }
        }
        controls.timeline.value = currentTimelineValue;
        startTime = Date.now() - (currentTimelineValue * 1000) / play.playbackSpeed;

        updateTimelineVisual(currentTimelineValue);
    }

    // ***** NEW FEATURE: MINIMIZE CONTROLS (with Animation) *****
    const hideControlsBtn = document.getElementById('hideContorls');
    if (hideControlsBtn) {
        // 選取所有需要執行動畫的元素
        const elementsToAnimate = document.querySelectorAll('.actions, .preview-control, #audioRender, #editor');

        hideControlsBtn.addEventListener('click', () => {
            const isMinimized = document.body.classList.contains('layout-minimized');
            play.maximized = !isMinimized;

            if (isMinimized) {
                // --- 準備最大化 (讓元素出現) ---
                // 1. 先移除 display: none，讓元素回到文檔流中
                elementsToAnimate.forEach(el => {
                    el.style.display = ''; // 恢復預設 display 屬性
                });

                // 2. 強制瀏覽器重新渲染，確保 display 的改變生效
                // 這是個小技巧，沒有這一步，動畫可能會失效
                void hideControlsBtn.offsetWidth;

                // 3. 移除 class，觸發返回的 CSS 動畫
                document.body.classList.remove('layout-minimized');

            } else {
                // --- 準備最小化 (讓元素消失) ---
                // 1. 加上 class，觸發消失的 CSS 動畫
                document.body.classList.add('layout-minimized');

                // 2. 監聽第一個元素的 transitionend 事件
                // 當動畫結束時，才將所有元素 display: none
                elementsToAnimate[0].addEventListener('transitionend', function onTransitionEnd() {
                    // 確保只有在最小化狀態下才執行
                    if (document.body.classList.contains('layout-minimized')) {
                        elementsToAnimate.forEach(el => {
                            el.style.display = 'none';
                        });
                    }
                    // 移除監聽器，避免重複觸發
                    elementsToAnimate[0].removeEventListener('transitionend', onTransitionEnd);
                });
            }

            // 無論是最大化還是最小化，都更新按鈕外觀
            const currentlyMinimized = document.body.classList.contains('layout-minimized');
            hideControlsBtn.querySelector('.icon-minimize').style.display = currentlyMinimized ? 'none' : 'flex';
            hideControlsBtn.querySelector('.icon-maximize').style.display = currentlyMinimized ? 'flex' : 'none';

            // 重新計算畫布大小
            setTimeout(() => {
                _updCanvasRes();
                setTimeout(() => _updCanvasRes(), 120);
            }, 350);
        });
    }
    // ***** END OF NEW FEATURE *****

    window.addEventListener('keydown', function (event) {
        // 檢查是否按下 Ctrl (Windows/Linux) 或 Command (Mac)
        const isCtrlOrCmd = event.ctrlKey || event.metaKey;

        // 檢查是否按下 's' 鍵
        if (event.key.toLowerCase() === 's' && isCtrlOrCmd) {
            // 阻止瀏覽器預設的儲存頁面行為
            event.preventDefault();
            // 呼叫我們的儲存函式
            triggerSave(data);
        }

        // Undo / Redo shortcuts: Ctrl/Cmd+Z, Ctrl/Cmd+Y, Cmd+Shift+Z
        if (isCtrlOrCmd && (event.key.toLowerCase() === 'z' || event.key.toLowerCase() === 'y')) {
            // Prevent default so browser UI doesn't interfere
            event.preventDefault();
            try {
                if (event.key.toLowerCase() === 'y' || (event.key.toLowerCase() === 'z' && event.shiftKey)) {
                    // redo
                    document.execCommand('redo');
                } else {
                    // undo
                    document.execCommand('undo');
                }
            } catch (e) {
                // execCommand may not be supported everywhere; ignore errors
                console.warn('undo/redo command failed', e);
            }
        }
    });

    // --- Modular Dropdown Menu Logic ---
    document.querySelectorAll('.menu-trigger-button').forEach(button => {
        button.addEventListener('click', (event) => {
            event.stopPropagation();
            const targetSelector = button.dataset.target;
            const targetMenu = document.querySelector(targetSelector);
            if (!targetMenu) return;

            // Hide other menus
            allDropdowns.forEach(menu => {
                if (menu !== targetMenu) {
                    menu.classList.add('hide');
                }
            });

            // Toggle current menu
            targetMenu.classList.toggle('hide');
        });
    });

    function abortBgAndVid() {
        if (bgVideo.src) {
            try { URL.revokeObjectURL(bgVideo.src); } catch (e) { }
        }
        try { bgVideo.pause(); } catch (e) { }
        bgVideo.src = '';
        // reload to reset media element state
        try { bgVideo.load(); } catch (e) { }
        // 隱藏背景視訊（視覺上回復為沒有背景）
        try { bgVideo.style.display = 'none'; } catch (e) { }

        if (bgImg.src) {
            try { URL.revokeObjectURL(bgImg.src); } catch (e) { }
        }
        bgImg.src = '';
        // reload to reset media element state
        try { bgImg.load(); } catch (e) { }

        play.pauseBoth(controls.play);

        // 清除舊的音訊來源和緩衝區，為載入新音訊做準備
        if (bgm.src) { // 如果有舊的音訊來源，先釋放其 URL
            URL.revokeObjectURL(bgm.src);
        }
        bgm.src = ''; // 清空音訊來源

        fullAudioBuffer = null; // 清空緩衝區
        isAudioSourceConnected = false; // 重設音訊連接狀態
    }

    // --- File & Diff Menu Actions (Event Delegation) ---
    dropdownList.addEventListener('click', async (event) => {
        const target = event.target;
        if (target.tagName !== 'LI') return;

        allDropdowns.forEach(menu => menu.classList.add('hide'));

        if (target.dataset.action === 'new-file') {
            data = typeof {} !== 'undefined' ? {} : '';
            for (let i = 1; i <= 7; i++) {
                const key = `inote_${i}`;
                if (typeof data[key] === "undefined") data[key] = "";
            }

            data.artist = 'artist'
            data.title = 'Untitled';
            data.first = settings.musicDelay.toString();
            data.des = 'No Name';

            settings.musicDelay = 0;
            editor.value = '';
            play.pauseBoth(controls.play);
            bgm.pause();
            // 清除背景視訊（若有的話）
            try {
                abortBgAndVid();
            } catch (e) { console.error('清除背景視訊時發生錯誤', e); }
            // 如果之前有開啟的資料夾，把相關 handle 與 drag/drop handler 一併清除
            try {
                if (openFolderDropHandler) {
                    try { document.body.removeEventListener('drop', openFolderDropHandler); } catch (e) { }
                    openFolderDropHandler = null;
                }
                if (openFolderDragOverHandler) {
                    try { document.body.removeEventListener('dragover', openFolderDragOverHandler); } catch (e) { }
                    openFolderDragOverHandler = null;
                }
            } catch (e) { /* ignore */ }
            try {
                // attempt to close directory handle if API supported
                if (directoryHandle && typeof directoryHandle.close === 'function') {
                    try { const _closePromise = directoryHandle.close(); if (_closePromise && typeof _closePromise.then === 'function') { _closePromise.catch(function () {/* ignore */ }); } } catch (e) { /* ignore */ }
                }
            } catch (e) { /* ignore */ }
            directoryHandle = null;
            maidataFileHandle = null;
            audioFileHandle = null;
            currentTimelineValue = 0;
            controls.timeline.value = 0;
            updateTimelineVisual(0);
            startTime = Date.now();
            processChartData();
        } else if (target.dataset.action === 'open-maidata') {
            handleFileUpload('text/*', (files) => { // <--- 將參數名稱改為 `files`
                const file = files[0]; // <--- 從 FileList 中取出第一個檔案
                if (!file) { // 檢查是否真的有檔案被選取
                    console.warn("沒有選擇檔案。");
                    return;
                }
                const reader = new FileReader();
                reader.onload = function (e) {
                    maidata = e.target.result;
                    data = parseMaidataToJson(maidata);
                    console.log("檔案內容：", data);
                    settings.musicDelay = parseFloat(data.first ?? "0");
                    editor.value = getNowDiff(settings.nowDiff);
                    play.pauseBoth(controls.play);
                    bgm.pause();
                    currentTimelineValue = 0;
                    controls.timeline.value = 0;
                    updateTimelineVisual(0);
                    startTime = Date.now();
                    processChartData();
                    diffDisplay.innerText = 'Difficulty: ' + diffName[settings.nowDiff - 1] + (data['lv_' + settings.nowDiff] ? (", LV: " + data['lv_' + settings.nowDiff]) : "");
                };
                reader.readAsText(file); // <--- 使用正確的 `file` 物件
            });
            // 將原本 open-folder 的 branch 改成這一段：
        } else if (target.dataset.action === 'open-folder') {
            // 先隱藏選單
            allDropdowns.forEach(menu => menu.classList.add('hide'));

            // 回退檔案選擇器：建立一個可重用的 fallback 函式
            function openFilePickerFallback() {
                // Creates a hidden file input and processes selected files similarly to the existing fallback
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.multiple = true;
                fileInput.accept = '*';
                fileInput.style.display = 'none';
                document.body.appendChild(fileInput);

                fileInput.addEventListener('change', async (ev) => {
                    const files = Array.from(ev.target.files || []);
                    if (files.length === 0) {
                        showNotification('未選取任何檔案');
                        fileInput.remove();
                        return;
                    }

                    // Reuse existing processing logic from the old fallback branch
                    try {
                        abortBgAndVid();

                        let foundMaidata = null;
                        let foundAudio = null;
                        let foundPV = null;

                        for (const f of files) {
                            const name = (f.name || '').toLowerCase();
                            if (!foundMaidata && (name.startsWith('maidata') || name.endsWith('.txt') || name.includes('maidata.'))) {
                                foundMaidata = f;
                            }
                            if (!foundAudio && ((f.type && f.type.startsWith('audio/')) || name.startsWith('track.') || name.endsWith('.mp3') || name.endsWith('.wav') || name.endsWith('.ogg'))) {
                                foundAudio = f;
                            }
                            if (!foundPV && name.startsWith('pv.')) {
                                foundPV = f;
                            }
                            if (foundMaidata && foundAudio && foundPV) break;
                        }

                        if (foundAudio) {
                            const reader = new FileReader();
                            reader.onload = function (e2) {
                                audioCtx.decodeAudioData(e2.target.result)
                                    .then(buffer => {
                                        fullAudioBuffer = buffer;
                                        const objectURL = URL.createObjectURL(foundAudio);
                                        bgm.src = objectURL;
                                        bgm.load();
                                    })
                                    .catch(error => console.error('解碼音訊資料時發生錯誤:', error));
                            };
                            reader.onerror = function (err) { console.error('讀取音訊檔失敗:', err); };
                            reader.readAsArrayBuffer(foundAudio);
                        }

                        if (foundMaidata) {
                            const reader2 = new FileReader();
                            reader2.onload = function (e3) {
                                maidata = e3.target.result;
                                data = parseMaidataToJson(maidata);
                                settings.musicDelay = parseFloat(data.first ?? '0');
                                editor.value = getNowDiff(settings.nowDiff);
                                currentTimelineValue = 0;
                                controls.timeline.value = 0;
                                updateTimelineVisual(0);
                                startTime = Date.now();
                                processChartData();
                                diffDisplay.innerText = 'Difficulty: ' + diffName[settings.nowDiff - 1] + (data['lv_' + settings.nowDiff] ? (", LV: " + data['lv_' + settings.nowDiff]) : '');
                            };
                            reader2.readAsText(foundMaidata);
                        } else if (foundAudio && !foundMaidata) {
                            maidata = 'first=0\ninote=//EASY\n';
                            data = parseMaidataToJson(maidata);
                            settings.musicDelay = parseFloat(data.first ?? '0');
                            editor.value = getNowDiff(settings.nowDiff);
                            currentTimelineValue = 0;
                            controls.timeline.value = 0;
                            updateTimelineVisual(0);
                            startTime = Date.now();
                            processChartData();
                            diffDisplay.innerText = 'Difficulty: ' + diffName[settings.nowDiff - 1] + (data['lv_' + settings.nowDiff] ? (", LV: " + data['lv_' + settings.nowDiff]) : '');
                            showNotification('已載入音訊檔案，並為其創建了一個新的空譜面（回退模式）');
                        } else {
                            showNotification('未在所選檔案中找到音訊或譜面檔。請手動選取');
                        }

                        // PV
                        try {
                            const bgVideoEl = document.getElementById('backgroundVideo');
                            if (foundPV && bgVideoEl) {
                                if (bgVideoEl.src) try { URL.revokeObjectURL(bgVideoEl.src); } catch (e) { }
                                const pvUrl = URL.createObjectURL(foundPV);
                                bgVideoEl.src = pvUrl;
                                bgVideoEl.load();
                                try { bgVideoEl.play().catch(() => { bgVideoEl.muted = true; bgVideoEl.play().catch(() => { }); }); } catch (e) { }
                                bgVideoEl.style.display = '';
                            }
                        } catch (e) { console.error('回退模式：載入 PV 檔案時發生錯誤', e); }

                        // try to find bg.* and set as background
                        try {
                            const bgImgEl = document.getElementById('bgImg');
                            const bgFile = files.find(f => { const n = (f.name || '').toLowerCase(); return n.startsWith('bg.') || n === 'bg'; });
                            if (bgFile && bgImgEl) {
                                if (bgImgEl.src) try { URL.revokeObjectURL(bgImgEl.src); } catch (e) { }
                                bgImgEl.src = URL.createObjectURL(bgFile);
                                bgImgEl.style.display = '';
                            }
                        } catch (e) { console.warn('set bg from fallback files failed', e); }

                    } catch (e) {
                        console.error('fallback file handler error', e);
                    } finally {
                        fileInput.remove();
                    }
                });

                // Trigger the file picker
                fileInput.click();
            }

            if ('showDirectoryPicker' in window) {
                (async () => {
                    try {
                        directoryHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
                        maidataFileHandle = null;
                        audioFileHandle = null;
                        let pvFileHandle = null;

                        // 尋找 maidata 和音訊檔案
                        for await (const [name, handle] of directoryHandle.entries()) {
                            if (handle.kind === 'file' && name.toLowerCase().startsWith('maidata.')) {
                                maidataFileHandle = handle;
                            }
                            if (handle.kind === 'file' && name.toLowerCase().startsWith('track.')) {
                                audioFileHandle = handle;
                            }
                            // 偵測 pv.*（例如 pv.mp4）
                            if (handle.kind === 'file' && name.toLowerCase().startsWith('pv.')) {
                                pvFileHandle = handle;
                            }
                            // 只有在 audio, maidata 與 pv 都找到時，才跳出迴圈
                            if (audioFileHandle && maidataFileHandle && pvFileHandle) break;
                        }

                        abortBgAndVid();

                        // 處理音訊載入
                        if (audioFileHandle) {
                            const audioFile = await audioFileHandle.getFile();
                            const reader = new FileReader();
                            reader.onload = function (e) {
                                audioCtx.decodeAudioData(e.target.result)
                                    .then(buffer => {
                                        fullAudioBuffer = buffer;
                                        bgm.src = URL.createObjectURL(audioFile);
                                        bgm.load();
                                        console.log("音訊檔已載入。");
                                    })
                                    .catch(error => console.error("音訊解碼錯誤:", error));
                            };
                            reader.readAsArrayBuffer(audioFile);
                            console.log(`偵測到音訊檔案：${audioFileHandle.name}。`);
                        } else {
                            // If no audio found, continue but still allow drag/drop background handling
                            // 如果新資料夾中沒有音訊檔案
                            console.log("新資料夾中未找到音訊檔案。");
                        }

                        // Register drag/drop handler scoped to this opened directory
                        try {
                            const bgImgEl = document.getElementById('bgImg');
                            // remove any previous handlers to avoid duplicate prompts
                            const dropHandler = async function (ev) {
                                ev.preventDefault();
                                ev.stopPropagation();
                                const items = ev.dataTransfer && ev.dataTransfer.files ? ev.dataTransfer.files : null;
                                if (!items || items.length === 0) return;
                                // only consider first file for quick UX
                                const f = items[0];
                                if (!f.type || !f.type.startsWith('image/')) return;
                                const ok = confirm('是否將拖入的圖片設為背景並儲存到此資料夾為 bg.' + (f.name.split('.').pop() || 'png') + ' ?');
                                if (!ok) return;
                                try {
                                    // show image locally
                                    const url = URL.createObjectURL(f);
                                    if (bgImgEl) {
                                        bgImgEl.src = url;
                                        bgImgEl.style.display = '';
                                    }

                                    // attempt to write file into directory via helper
                                    if (directoryHandle) {
                                        const okSaved = await saveBgToDirectory(f, directoryHandle);
                                        if (okSaved) showNotification('Saved background to opened directory');
                                        else console.warn('Failed to save background to opened directory');
                                    } else {
                                        console.warn('Directory handle not available for writing bg file.');
                                    }
                                } catch (e) {
                                    console.error('drop handler error:', e);
                                }
                            };

                            // allow drop on body; remove any previous handlers first to avoid duplicates
                            try {
                                if (openFolderDragOverHandler) {
                                    try { document.body.removeEventListener('dragover', openFolderDragOverHandler); } catch (e) { }
                                    openFolderDragOverHandler = null;
                                }
                                if (openFolderDropHandler) {
                                    try { document.body.removeEventListener('drop', openFolderDropHandler); } catch (e) { }
                                    openFolderDropHandler = null;
                                }
                            } catch (e) { /* ignore cleanup errors */ }

                            openFolderDragOverHandler = function (e) { e.preventDefault(); };
                            openFolderDropHandler = dropHandler;
                            document.body.addEventListener('dragover', openFolderDragOverHandler, { passive: false });
                            document.body.addEventListener('drop', openFolderDropHandler, { passive: false });
                        } catch (e) {
                            console.warn('Failed to register drag/drop for background saving:', e);
                        }

                        // 處理 pv 視訊檔（優先於其他影像行為）
                        try {
                            const bgVideoEl = document.getElementById('backgroundVideo');
                            if (pvFileHandle) {
                                bgVideoEl.style.display = ''; // 顯示背景視訊元素
                                const pvFile = await pvFileHandle.getFile();
                                // 釋放舊的 URL
                                if (bgVideoEl && bgVideoEl.src) {
                                    try { URL.revokeObjectURL(bgVideoEl.src); } catch (e) { }
                                }
                                if (bgVideoEl) {
                                    const pvUrl = URL.createObjectURL(pvFile);
                                    bgVideoEl.src = pvUrl;
                                    bgVideoEl.load();
                                    console.log("PV 視訊檔已載入。");
                                }
                            } else {
                                // 如果沒有 pv 檔案，確保背景視訊被清除
                                console.log("新資料夾中未找到 PV 視訊檔案。");
                                if (bgVideoEl && bgVideoEl.src) {
                                    try { URL.revokeObjectURL(bgVideoEl.src); } catch (e) { }
                                }
                            }
                        } catch (e) {
                            console.error('載入 PV 檔案時發生錯誤:', e);
                        }

                        // 檢查資料夾內是否有 bg.* 圖片，若有則設定為背景圖
                        try {
                            const bgImgEl = document.getElementById('bgImg');
                            let bgFileHandle = null;
                            for await (const [name, handle] of directoryHandle.entries()) {
                                if (handle.kind === 'file') {
                                    const lname = name.toLowerCase();
                                    if (lname.startsWith('bg.') || lname === 'bg') { bgFileHandle = handle; break; }
                                }
                            }
                            if (bgFileHandle && bgImgEl) {
                                const bgFile = await bgFileHandle.getFile();
                                if (bgImgEl.src) try { URL.revokeObjectURL(bgImgEl.src); } catch (e) { }
                                bgImgEl.src = URL.createObjectURL(bgFile);
                                bgImgEl.style.display = '';
                            }
                        } catch (e) { console.warn('set bg from folder failed', e); }

                        // 然後處理譜面載入/創建
                        if (maidataFileHandle) {
                            const maidataFile = await maidataFileHandle.getFile();
                            const reader = new FileReader();
                            reader.onload = function (e) {
                                maidata = e.target.result;
                                data = parseMaidataToJson(maidata);
                                settings.musicDelay = parseFloat(data.first ?? "0");
                                editor.value = getNowDiff(settings.nowDiff);
                                currentTimelineValue = 0;
                                controls.timeline.value = 0;
                                updateTimelineVisual(0);
                                startTime = Date.now();
                                processChartData();
                                diffDisplay.innerText = 'Difficulty: ' + diffName[settings.nowDiff - 1] + (data['lv_' + settings.nowDiff] ? (", LV: " + data['lv_' + settings.nowDiff]) : "");
                                console.log("Maidata 檔案已載入。");
                            };
                            reader.readAsText(maidataFile);
                        } else if (audioFileHandle) { // 只有在有音訊但沒有譜面時才創建新譜面
                            console.log("未找到譜面檔案，將創建一個新的空譜面。");
                            maidata = "first=0\ninote=//EASY\n";
                            data = parseMaidataToJson(maidata);
                            settings.musicDelay = parseFloat(data.first ?? "0");
                            editor.value = getNowDiff(settings.nowDiff);
                            currentTimelineValue = 0;
                            controls.timeline.value = 0;
                            updateTimelineVisual(0);
                            startTime = Date.now();
                            processChartData();
                            diffDisplay.innerText = 'Difficulty: ' + diffName[settings.nowDiff - 1] + (data['lv_' + settings.nowDiff] ? (", LV: " + data['lv_' + settings.nowDiff]) : "");
                            showNotification("已載入音訊檔案，並為其創建了一個新的空譜面。");
                        } else { // 音訊和譜面都沒找到
                            showNotification("在選擇的資料夾中找不到有效的音訊或譜面檔案。");
                        }
                    } catch (err) {
                        // If the user cancelled the directory picker, fall back to file input picker
                        if (err && (err.name === 'AbortError' || err.name === 'NotAllowedError' || err.name === 'NotFoundError')) {
                            console.log('Directory picker aborted or permission denied by user:', err.name, err.message, err.code);
                            try { showNotification('已取消開啟資料夾，改以檔案選取'); } catch (e) { }
                            openFilePickerFallback();
                            try { openFilePickerFallback(); } catch (e) { console.warn('fallback picker failed', e); }
                            return;
                        }
                        console.error("開啟資料夾失敗:", err);
                        try { play.pauseBoth(controls.play); } catch (e) { }
                        showNotification("開啟資料夾失敗。");
                    }
                })();
            } else {
                // If showDirectoryPicker is not supported, use the fallback file picker
                openFilePickerFallback();
            }
        } else if (target.dataset.action === 'open-audio') {
            handleFileUpload('audio/*', (files) => { // <--- 將參數名稱改為 `files`
                const file = files[0]; // <--- 從 FileList 中取出第一個檔案
                if (!file) { // 檢查是否真的有檔案被選取
                    console.warn("沒有選擇檔案");
                    return;
                }
                play.pauseBoth(controls.play);
                if (bgm.src) URL.revokeObjectURL(bgm.src);
                bgm.src = '';

                const reader = new FileReader();
                reader.onload = function (event) {
                    const arrayBuffer = event.target.result;
                    audioCtx.decodeAudioData(arrayBuffer, function (audioBuffer) {
                        fullAudioBuffer = audioBuffer;
                        console.log("AudioBuffer 成功載入:", fullAudioBuffer);
                        const objectURL = URL.createObjectURL(file); // <--- 使用正確的 `file`
                        bgm.src = objectURL;
                        bgm.load();
                    }, function (error) {
                        console.error("解碼音訊資料時發生錯誤:", error);
                    });
                };
                reader.onerror = function (event) {
                    console.error("檔案讀取失敗:", event.target.error);
                };
                reader.readAsArrayBuffer(file); // <--- 使用正確的 `file` 物件
            });
        } else if (target.dataset.diff) {
            loadDiff(parseInt(target.dataset.diff, 10), data);
            diffDisplay.innerText = 'Difficulty: ' + diffName[parseInt(target.dataset.diff, 10) - 1] + (data['lv_' + parseInt(target.dataset.diff, 10)] ? (", LV: " + data['lv_' + parseInt(target.dataset.diff, 10)]) : "");
            // 在 dropdownList 的 click handler 裡面：
            try { bgVideo.pause(); } catch (e) { }
        } else if (target.dataset.action === 'download-offline') {
            // user requested to prefetch common resources for offline use
            try {
                await downloadOffline();
            } catch (e) { console.warn('downloadOffline failed', e); }
        } else if (target.dataset.action === 'save-file') {
            triggerSave(data);
        } else if (target.dataset.action === 'undo') {
            try { document.execCommand('undo'); } catch (e) { console.warn('undo failed', e); }
        } else if (target.dataset.action === 'redo') {
            try { document.execCommand('redo'); } catch (e) { console.warn('redo failed', e); }
        }
    });


    document.addEventListener('click', function (event) {
        if (!findClosest(event.target, '.actions') && !findClosest(event.target, '.dropdownlist')) {
            allDropdowns.forEach(menu => menu.classList.add('hide'));
        }
        if (!findClosest(event.target, '#customMenu')) {
            customMenu.classList.add('hide');
        }
    });


    let doc_width = document.documentElement.clientWidth;
    let doc_height = document.documentElement.clientHeight;

    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    audioWaveform_bufferLength = analyser.frequencyBinCount;
    audioWaveform_dataArray = new Uint8Array(audioWaveform_bufferLength);

    document.body.addEventListener("contextmenu", function (e) {
        if (e.target === editor) {
            e.preventDefault();
            const menuWidth = customMenu.offsetWidth;
            const menuHeight = customMenu.offsetHeight;
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;

            let left = e.pageX;
            let top = e.pageY;

            if (left + menuWidth > windowWidth) left = e.pageX - menuWidth;
            if (top + menuHeight > windowHeight) top = e.pageY - menuHeight;

            left = Math.max(0, left);
            top = Math.max(0, top);

            customMenu.style.left = left + "px";
            customMenu.style.top = top + "px";
            customMenu.classList.remove("hide");
        }
    });

    customMenu.addEventListener("click", async function (e) {
        if (!e.target.matches(".menu-item")) return;

        const action = e.target.dataset.action;
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        const selected = editor.value.substring(start, end);



        switch (action) {
            case "copy":
                await navigator.clipboard.writeText(selected);
                break;
            case "cut":
                await navigator.clipboard.writeText(selected);
                editor.setRangeText("", start, end, "start");
                break;
            case "paste":
                const pasteText = await navigator.clipboard.readText();
                editor.setRangeText(pasteText, start, end, "end");
                break;
            case "selectAll":
                editor.select();
                break;
            case "trun-left-right": {
                let result = '';
                let inParen = 0, inBrace = 0, inBrack = 0;
                // mapping for D/E tokens (1..8)
                const deMap = { 1: 1, 2: 8, 3: 7, 4: 6, 5: 5, 6: 4, 7: 3, 8: 2 };
                for (let i = 0; i < selected.length; i++) {
                    const ch = selected[i];
                    if (ch === '(') inParen++; if (ch === ')') inParen--;
                    if (ch === '{') inBrace++; if (ch === '}') inBrace--;
                    if (ch === '[') inBrack++; if (ch === ']') inBrack--;

                    // only transform when not inside any brackets
                    if (inParen === 0 && inBrack === 0 && inBrace === 0) {
                        const up = ch.toUpperCase();
                        // Handle C / C1 (leave unchanged)
                        if (up === 'C') {
                            const next = selected[i + 1];
                            if (next === '1') {
                                result += ch + next; // preserve original case of letter
                                i++; // consume digit
                                continue;
                            } else {
                                result += ch;
                                continue;
                            }
                        }

                        // Handle D/E tokens with special mapping
                        if (up === 'D' || up === 'E') {
                            const next = selected[i + 1];
                            if (next && /\d/.test(next)) {
                                const d = parseInt(next, 10);
                                if (d >= 1 && d <= 8) {
                                    const mapped = deMap[d];
                                    result += ch + mapped.toString();
                                    i++; // consume digit
                                    continue;
                                }
                            }
                            // fallback: just append the letter if no valid digit
                            result += ch;
                            continue;
                        }

                        // Default behavior for standalone digits (keep original numeric flip)
                        if (/\d/.test(ch)) {
                            result += ((8 - parseInt(ch, 10)) % 8 + 1).toString();
                            continue;
                        }

                        if (/>/.test(ch)) {
                            result += '<';
                            continue;
                        }

                        if (/</.test(ch)) {
                            result += '>';
                            continue;
                        }

                        if (/\p/.test(ch)) {
                            result += 'q';
                            continue;
                        }

                        if (/\q/.test(ch)) {
                            result += 'p';
                            continue;
                        }

                        if (/s/.test(ch)) {
                            result += 'z';
                            continue;
                        }

                        if (/\z/.test(ch)) {
                            result += 's';
                            continue;
                        }
                    }

                    // by default, copy character unchanged
                    result += ch;
                }
                editor.setRangeText(result, start, end, "end");
                break;
            }
            case "trun-upside-down": {
                let result = '';
                let inParen = 0, inBrace = 0, inBrack = 0;
                // mapping for D/E tokens (1..8)
                const deMap = { 1: 5, 2: 4, 3: 3, 4: 2, 5: 1, 6: 8, 7: 7, 8: 6 };

                for (let i = 0; i < selected.length; i++) {
                    const ch = selected[i];
                    if (ch === '(') inParen++; if (ch === ')') inParen--;
                    if (ch === '{') inBrace++; if (ch === '}') inBrace--;
                    if (ch === '[') inBrack++; if (ch === ']') inBrack--;

                    // only transform when not inside any brackets
                    if (inParen === 0 && inBrack === 0 && inBrace === 0) {
                        const up = ch.toUpperCase();
                        // Handle C / C1 (leave unchanged)
                        if (up === 'C') {
                            const next = selected[i + 1];
                            if (next === '1') {
                                result += ch + next; // preserve original case of letter
                                i++; // consume digit
                                continue;
                            } else {
                                result += ch;
                                continue;
                            }
                        }

                        // Handle D/E tokens with special mapping
                        if (up === 'D' || up === 'E') {
                            const next = selected[i + 1];
                            if (next && /\d/.test(next)) {
                                const d = parseInt(next, 10);
                                if (d >= 1 && d <= 8) {
                                    const mapped = deMap[d];
                                    result += ch + mapped.toString();
                                    i++; // consume digit
                                    continue;
                                }
                            }
                            // fallback: just append the letter if no valid digit
                            result += ch;
                            continue;
                        }

                        // Default behavior for standalone digits (keep original numeric flip)
                        if (/\d/.test(ch)) {
                            // 1 - 4
                            // 2 - 3
                            // 3 - 2
                            result += ((12 - parseInt(ch, 10)) % 8 + 1).toString();
                            continue;
                        }

                        if (/\p/.test(ch)) {
                            result += 'q';
                            continue;
                        }

                        if (/\q/.test(ch)) {
                            result += 'p';
                            continue;
                        }
                    }

                    // by default, copy character unchanged
                    result += ch;
                }
                editor.setRangeText(result, start, end, "end");
                break;
            }
            case "trun-right": {
                let result = '';
                let inParen = 0, inBrace = 0, inBrack = 0;

                for (let i = 0; i < selected.length; i++) {
                    const ch = selected[i];
                    if (ch === '(') inParen++; if (ch === ')') inParen--;
                    if (ch === '{') inBrace++; if (ch === '}') inBrace--;
                    if (ch === '[') inBrack++; if (ch === ']') inBrack--;

                    // only transform when not inside any brackets
                    if (inParen === 0 && inBrack === 0 && inBrace === 0) {
                        const up = ch.toUpperCase();
                        // Handle C / C1 (leave unchanged)
                        if (up === 'C') {
                            const next = selected[i + 1];
                            if (next === '1') {
                                result += ch + next; // preserve original case of letter
                                i++; // consume digit
                                continue;
                            } else {
                                result += ch;
                                continue;
                            }
                        }

                        // Default behavior for standalone digits (keep original numeric flip)
                        if (/\d/.test(ch)) {
                            result += (parseInt(ch, 10) % 8 + 1).toString();
                            continue;
                        }
                    }

                    // by default, copy character unchanged
                    result += ch;
                }
                editor.setRangeText(result, start, end, "end");
                break;
            }
            case "trun-left": {
                let result = '';
                let inParen = 0, inBrace = 0, inBrack = 0;

                for (let i = 0; i < selected.length; i++) {
                    const ch = selected[i];
                    if (ch === '(') inParen++; if (ch === ')') inParen--;
                    if (ch === '{') inBrace++; if (ch === '}') inBrace--;
                    if (ch === '[') inBrack++; if (ch === ']') inBrack--;

                    // only transform when not inside any brackets
                    if (inParen === 0 && inBrack === 0 && inBrace === 0) {
                        const up = ch.toUpperCase();
                        // Handle C / C1 (leave unchanged)
                        if (up === 'C') {
                            const next = selected[i + 1];
                            if (next === '1') {
                                result += ch + next; // preserve original case of letter
                                i++; // consume digit
                                continue;
                            } else {
                                result += ch;
                                continue;
                            }
                        }

                        // Default behavior for standalone digits (keep original numeric flip)
                        if (/\d/.test(ch)) {
                            result += ((parseInt(ch, 10) + 6) % 8 + 1).toString();
                            continue;
                        }
                    }

                    // by default, copy character unchanged
                    result += ch;
                }
                editor.setRangeText(result, start, end, "end");
                break;
            }
            case "trun-180": {
                let result = '';
                let inParen = 0, inBrace = 0, inBrack = 0;

                for (let i = 0; i < selected.length; i++) {
                    const ch = selected[i];
                    if (ch === '(') inParen++; if (ch === ')') inParen--;
                    if (ch === '{') inBrace++; if (ch === '}') inBrace--;
                    if (ch === '[') inBrack++; if (ch === ']') inBrack--;

                    // only transform when not inside any brackets
                    if (inParen === 0 && inBrack === 0 && inBrace === 0) {
                        const up = ch.toUpperCase();
                        // Handle C / C1 (leave unchanged)
                        if (up === 'C') {
                            const next = selected[i + 1];
                            if (next === '1') {
                                result += ch + next; // preserve original case of letter
                                i++; // consume digit
                                continue;
                            } else {
                                result += ch;
                                continue;
                            }
                        }

                        // Default behavior for standalone digits (keep original numeric flip)
                        if (/\d/.test(ch)) {
                            result += ((parseInt(ch, 10) + 3) % 8 + 1).toString();
                            continue;
                        }
                    }

                    // by default, copy character unchanged
                    result += ch;
                }
                editor.setRangeText(result, start, end, "end");
                break;
            }
            case "ad-rm-bk": {
                let result = '';
                let inParen = 0, inBrace = 0, inBrack = 0;

                for (let i = 0; i < selected.length; i++) {
                    const ch = selected[i];
                    if (ch === '(') inParen++; if (ch === ')') inParen--;
                    if (ch === '{') inBrace++; if (ch === '}') inBrace--;
                    if (ch === '[') inBrack++; if (ch === ']') inBrack--;

                    // only transform when not inside any brackets
                    if (inParen === 0 && inBrack === 0 && inBrace === 0) {
                        const up = ch.toUpperCase();
                        if (up === 'A' || up === 'B' || up === 'C' || up === 'D' || up === 'E') {
                            const next = selected[i + 1];
                            result += ch + next; // preserve original case of letter
                            i++; // consume digit
                            continue;
                        }

                        // Default behavior for standalone digits (keep original numeric flip)
                        if (/\d/.test(ch)) {
                            const next = selected[i + 1];
                            if (/b/.test(next)) {
                                result += ch;
                                i++;
                                continue;
                            } else {
                                result += ch + "b" + next;
                                i++;
                                continue;
                            }
                        }
                    }

                    // by default, copy character unchanged
                    result += ch;
                }
                editor.setRangeText(result, start, end, "end");
                break;
            }
            case "ad-rm-ex": {
                let result = '';
                let inParen = 0, inBrace = 0, inBrack = 0;

                for (let i = 0; i < selected.length; i++) {
                    const ch = selected[i];
                    if (ch === '(') inParen++; if (ch === ')') inParen--;
                    if (ch === '{') inBrace++; if (ch === '}') inBrace--;
                    if (ch === '[') inBrack++; if (ch === ']') inBrack--;

                    // only transform when not inside any brackets
                    if (inParen === 0 && inBrack === 0 && inBrace === 0) {
                        const up = ch.toUpperCase();
                        if (up === 'A' || up === 'B' || up === 'C' || up === 'D' || up === 'E') {
                            const next = selected[i + 1];
                            result += ch + next; // preserve original case of letter
                            i++; // consume digit
                            continue;
                        }

                        // Default behavior for standalone digits (keep original numeric flip)
                        if (/\d/.test(ch)) {
                            const next = selected[i + 1];
                            if (/x/.test(next)) {
                                result += ch;
                                i++;
                                continue;
                            } else {
                                result += ch + "x" + next;
                                i++;
                                continue;
                            }
                        }
                    }

                    // by default, copy character unchanged
                    result += ch;
                }
                editor.setRangeText(result, start, end, "end");
                break;
            }
        }
        data["inote_" + settings.nowDiff] = editor.value;
        processChartData();
        editor.focus();
        customMenu.classList.add('hide');
    });

    let data = typeof {} !== 'undefined' ? {} : '';
    for (let i = 1; i <= 7; i++) {
        const key = `inote_${i}`;
        if (typeof data[key] === "undefined") data[key] = "";
    }

    data.artist = 'artist'
    data.title = 'Untitled';
    data.first = settings.musicDelay.toString();

    let getNowDiff = function (e) {
        return data['inote_' + e];
    }

    const _sliderColor = ['#ff3232', '#FFFFFF60'];
    const controls = {
        'timeline': document.getElementById("timeline"),
        'play': document.getElementById('playBtn'),
        'stop': document.getElementById('stopBtn'),
        'b10': document.getElementById('back10Btn'),
        'b5': document.getElementById('back5Btn'),
        'f5': document.getElementById('fast5Btn'),
        'f10': document.getElementById('fast10Btn'),
        'zoomIn': document.getElementById('zoomIn'),
        'zoomOut': document.getElementById('zoomOut'),
    };

    function handleFileUpload(accept, callback, isDirectory = false) {
        allDropdowns.forEach(menu => menu.classList.add('hide'));
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        // Avoid display:none: on some iOS versions programmatic click on a display:none
        // input is blocked. Place it offscreen and invisible instead.
        fileInput.style.position = 'fixed';
        fileInput.style.left = '-9999px';
        fileInput.style.top = '-9999px';
        fileInput.style.opacity = '0';
        fileInput.style.zIndex = '-9999';

        // 如果需要選擇資料夾，就加上 webkitdirectory 屬性
        if (isDirectory) {
            fileInput.webkitdirectory = true;
        } else {
            fileInput.accept = accept;
        }

        document.body.appendChild(fileInput);
        fileInput.addEventListener('change', function (event) {
            // fileInput.files 會是一個 FileList 物件，包含了所有選擇的檔案
            const files = event.target.files;
            if (files && files.length > 0) {
                callback(files, event); // 將整個 FileList 傳給回呼函式
            }
            fileInput.remove();
        });
        fileInput.click();
    }

    // When our WebAudio wrapper finishes decoding into fullAudioBuffer it will dispatch 'loadedmetadata'
    bgm.addEventListener('loadedmetadata', function () {
        try { bgm.volume = soundSettings.musicVol * soundSettings.music; } catch (e) { /* ignore */ }
        try {
            const audioDurationMs = (bgm.duration + 1) * 1000;
            maxTime = Math.max(maxTime, audioDurationMs);
            controls.timeline.max = maxTime / 1000;
            bgm.playbackRate = play.playbackSpeed;
            updateTimelineVisual(currentTimelineValue);
        } catch (e) { console.warn('loadedmetadata handler failed:', e); }
    });

    function loadDiff(diff, data) {
        editor.value = getNowDiff(diff);
        settings.nowDiff = diff;
        processChartData();
    }

    function parseMaidataToJson(text) {
        const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
        const lines = normalized.split("\n");
        const result = {};
        let currentKey = null;
        let buffer = "";

        for (let rawLine of lines) {
            const line = rawLine.trimEnd();
            if (line.startsWith("&")) {
                if (currentKey !== null) {
                    result[currentKey] = buffer.replace(/^\n/, "");
                }
                const eqIndex = line.indexOf("=");
                if (eqIndex > 0) {
                    currentKey = line.substring(1, eqIndex);
                    buffer = line.substring(eqIndex + 1);
                } else {
                    currentKey = line.substring(1);
                    buffer = "";
                }
            } else {
                buffer += "\n" + (line.length > 0 ? line : "");
            }
        }
        if (currentKey !== null) {
            result[currentKey] = buffer.replace(/^\n/, "");
        }
        for (let i = 1; i <= 7; i++) {
            if (typeof result[`inote_${i}`] === "undefined") {
                result[`inote_${i}`] = "";
            }
        }

        // --- 新增：確保基礎資訊有預設值 ---
        const defaultInfo = {
            title: 'Untitled',
            artist: 'Unknown',
            first: '0', // 保持為字串，因為它通常從文本解析，並在之後轉換為浮點數
            des: 'Unknown' // 新增 designer
        };

        for (const key in defaultInfo) {
            // 如果欄位不存在、為 null 或空白字串，則賦予預設值
            if (result[key] === undefined || result[key] === null || (typeof result[key] === 'string' && result[key].trim() === '')) {
                result[key] = defaultInfo[key];
            }
        }
        // --- 新增結束 ---
        return result;
    }

    document.querySelector('.sett-menu-button').addEventListener('click', function () {
        allDropdowns.forEach(menu => menu.classList.add('hide'));
        generateSettingsForm();
        document.getElementById('settings-popup').classList.remove("hide");
        document.getElementById('settings-overlay').classList.remove("hide");
        inSettings = true;
    });

    document.querySelector('.info-menu-button').addEventListener('click', function () {
        allDropdowns.forEach(menu => menu.classList.add('hide'));
        generateInfoForm();
        document.getElementById('info-popup').classList.remove("hide");
        document.getElementById('settings-overlay').classList.remove("hide");
        inSettings = true;
    });

    document.getElementById('save-info-btn').addEventListener('click', () => {
        saveInfoFromForm(document.getElementById('info-form'));
        document.getElementById('settings-overlay').classList.add('hide');
        document.getElementById('info-popup').classList.add('hide');
    });

    document.getElementById('cancel-info-btn').addEventListener('click', () => {
        document.getElementById('settings-overlay').classList.add('hide');
        document.getElementById('info-popup').classList.add('hide');
    });

    document.getElementById('settings-overlay').addEventListener('click', () => {
        document.getElementById('settings-overlay').classList.add('hide');
        document.getElementById('info-popup').classList.add('hide');
        document.getElementById('settings-popup').classList.add("hide");
    });

    function generateSettingsForm() {
        const form = document.getElementById('settings-form');
        form.innerHTML = '';

        function createField(config, groupKey, container) {
            container = container || form;
            const fieldContainer = document.createElement('div');
            fieldContainer.className = 'setting-field';
            const fieldId = `setting-${groupKey}-${config.key}`;
            const label = document.createElement('label');
            label.htmlFor = fieldId;
            label.textContent = (config.label || config.key) + ':';
            let input;
            const currentValue = (config.target && config.target[config.key] !== undefined) ? config.target[config.key] : (settings[config.key] !== undefined ? settings[config.key] : '');

            if (config.type === 'boolean') {
                input = document.createElement('input');
                input.type = 'checkbox';
                input.checked = !!currentValue;
                label.style.marginRight = '5px';
                fieldContainer.appendChild(label);
                fieldContainer.appendChild(input);
            } else if (config.type === 'number') {
                input = document.createElement('input');
                input.type = 'number';
                input.value = currentValue;
                if (config.step !== undefined) input.step = config.step;
                if (config.min !== undefined) input.min = config.min;
                if (config.max !== undefined) input.max = config.max;
                fieldContainer.appendChild(label);
                fieldContainer.appendChild(input);
            } else if (config.type === 'color') {
                input = document.createElement('input');
                input.type = 'color';
                input.value = currentValue || '#444e5d';
                fieldContainer.appendChild(label);
                fieldContainer.appendChild(input);
            } else if (config.type === 'dropdown') {
                input = document.createElement('select');
                console.log(config);
                if (Array.isArray(config.options)) {
                    config.options.forEach((option, index) => {
                        const opt = document.createElement('option');
                        if (typeof config === 'object') {
                            opt.value = config.value[index]; opt.textContent = option;
                        } else {
                            opt.value = option; opt.textContent = option;
                        }
                        if (opt.value == currentValue) opt.selected = true;
                        input.appendChild(opt);
                    });
                }
                fieldContainer.appendChild(label);
                fieldContainer.appendChild(input);
            } else {
                input = document.createElement('input');
                input.type = 'text';
                input.value = currentValue;
                fieldContainer.appendChild(label);
                fieldContainer.appendChild(input);
            }

            if (input) {
                input.id = fieldId;
                input.name = config.key;
                container.appendChild(fieldContainer);
            }
        }

        // build bookmark layout
        const wrapper = document.createElement('div');
        wrapper.className = 'settings-bookmark-container';
        const sidebar = document.createElement('div');
        sidebar.className = 'settings-bookmark-sidebar';
        const content = document.createElement('div');
        content.className = 'settings-bookmark-content';

        settingsGroupConfig.forEach((g, idx) => {
            const btn = document.createElement('div');
            btn.className = 'bookmark-btn' + (idx === 0 ? ' active' : '');
            btn.textContent = g.title;
            btn.dataset.group = g.key;
            sidebar.appendChild(btn);

            const pane = document.createElement('div');
            pane.className = 'bookmark-pane' + (idx === 0 ? '' : ' hide');
            pane.dataset.group = g.key;
            const h3 = document.createElement('h3');
            h3.textContent = g.title; h3.style.marginTop = '0';
            pane.appendChild(h3);

            try {
                const cfgs = settingsFormConfig[g.key] || [];
                cfgs.forEach(cfg => createField(cfg, g.key, pane));
            } catch (e) { console.warn('generateSettingsForm: missing settingsConfig for', g.key); }

            content.appendChild(pane);

            btn.addEventListener('click', () => {
                sidebar.querySelectorAll('.bookmark-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                content.querySelectorAll('.bookmark-pane').forEach(p => p.classList.add('hide'));
                pane.classList.remove('hide');
            });
        });

        wrapper.appendChild(sidebar);
        wrapper.appendChild(content);
        form.appendChild(wrapper);
    }

    function generateInfoForm() {
        const form = document.getElementById('info-form');
        form.innerHTML = '';

        const fields = [
            { key: '', label: '歌曲資料', title: true, noinput: true },
            { key: 'title', label: '標題' },
            { key: 'artist', label: '作曲' },
            { key: 'des', label: '譜師 (未指定難度)' },
            { key: 'wholebpm', label: '全曲 BPM' },
            { key: '', label: 'EASY', title: true, noinput: true },
            { key: 'lv_1', label: '難度', kid: true },
            { key: 'des_1', label: '譜師', kid: true },
            { key: '', label: 'BASIC', title: true, noinput: true },
            { key: 'lv_2', label: '難度' },
            { key: 'des_2', label: '譜師' },
            { key: '', label: 'ADVANCED', title: true, noinput: true },
            { key: 'lv_3', label: '難度' },
            { key: 'des_3', label: '譜師' },
            { key: '', label: 'EXPERT', title: true, noinput: true },
            { key: 'lv_4', label: '難度' },
            { key: 'des_4', label: '譜師' },
            { key: '', label: 'MASTER', title: true, noinput: true },
            { key: 'lv_5', label: '難度' },
            { key: 'des_5', label: '譜師' },
            { key: '', label: 'RE:MASTER', title: true, noinput: true },
            { key: 'lv_6', label: '難度' },
            { key: 'des_6', label: '譜師' },
            { key: '', label: 'ORIGINAL', title: true, noinput: true },
            { key: 'lv_7', label: '難度' },
            { key: 'des_7', label: '譜師' },
        ];

        fields.forEach(f => {
            const val = data[f.key] || '';
            const label = f.title ? document.createElement('h4') : document.createElement('label');
            label.textContent = f.label;
            const input = document.createElement('input');
            input.name = f.key;
            input.value = val;
            const a = document.createElement('div');
            a.className = f.title ? 'info-title' : 'info-field';
            a.appendChild(label);
            if (!f.noinput) a.appendChild(input);
            form.appendChild(a);
        });
    }

    // 儲存譜面資訊回 data
    function saveInfoFromForm(form) {
        const inputs = form.querySelectorAll('input');
        inputs.forEach(input => {
            data[input.name] = input.value;
        });
    }

    function handleSettingsClose(save) {
        if (save) {
            try {
                ['game', 'sound', 'other'].forEach(groupKey => {
                    settingsFormConfig[groupKey].forEach(config => {
                        const input = document.getElementById(`setting-${groupKey}-${config.key}`);
                        if (!input) return;

                        let newValue;
                        if (config.type === 'boolean') {
                            newValue = input.checked;
                        } else if (config.type === 'number') {
                            newValue = parseFloat(input.value);
                            if (isNaN(newValue)) {
                                console.warn(`Invalid number for ${config.label}: ${input.value}. Using original value.`);
                                newValue = config.target[config.key];
                            }
                        } else if (config.type === 'color') {
                            newValue = input.value;
                        } else if (config.type === 'dropdown') {
                            newValue = config.value ? config.value[input.selectedIndex] : input.value;
                            console
                        } else {
                            newValue = input.value;
                        }
                        config.target[config.key] = newValue;
                    });
                });
            } catch (e) {
                showNotification("儲存設定時發生錯誤！請檢查輸入。");
                console.error("儲存設定錯誤:", e);
                return;
            }
        }
        document.getElementById('settings-popup').classList.add("hide");
        document.getElementById('settings-overlay').classList.add("hide");
        inSettings = false;
        if (bgm) {
            bgm.volume = soundSettings.musicVol * soundSettings.music;
            if (isFinite(play.playbackSpeed) && play.playbackSpeed > 0) {
                bgm.playbackRate = play.playbackSpeed;
                if (bgVideo && bgVideo.src) try { bgVideo.playbackRate = play.playbackSpeed; } catch (e) { }
            } else {
                play.playbackSpeed = 1;
                bgm.playbackRate = 1;
                if (bgVideo && bgVideo.src) try { bgVideo.playbackRate = 1; } catch (e) { }
            }
            startTime = Date.now() - (currentTimelineValue * 1000) / play.playbackSpeed;
            // Clear render caches because settings may affect geometry (noteSize, lineWidthFactor, etc.)
            try { render.clearRenderCaches(); } catch (e) { /* ignore if render not ready */ }
        }
        // 儲存或變更設定後，更新 CSS 變數
        try { updateBgDarknessCss(); } catch (e) { }
        try { updateMainColorCss(); } catch (e) { }
        // 嘗試將設定存回 localStorage
        try {
            if (window.localStore && typeof window.localStore.saveSettings === 'function') {
                const settingsToSave = JSON.parse(JSON.stringify(settings));
                settingsToSave.musicDelay = 0;
                window.localStore.saveSettings(settingsToSave);
            }
        } catch (e) { console.warn('Failed to save settings to localStorage', e); }
    }

    document.getElementById('save-settings-btn').addEventListener('click', () => handleSettingsClose(true));
    document.getElementById('cancel-settings-btn').addEventListener('click', () => handleSettingsClose(false));

    // Reset settings to initial defaults
    function resetSettingsToDefault() {
        // Overwrite existing settings keys with defaults
        Object.keys(defaultSettings).forEach(k => {
            settings[k] = defaultSettings[k];
        });

        // Update UI form if visible
        try { generateSettingsForm(); } catch (e) { /* ignore */ }

        // Persist to localStorage if available
        try {
            if (window.localStore && typeof window.localStore.saveSettings === 'function') {
                window.localStore.clearSettings(); // Clear all first to avoid stale keys
                window.localStore.saveSettings(defaultSettings);
            }
        } catch (e) { console.warn('Failed to save settings after reset', e); }

        // Update CSS variables and render
        try { updateBgDarknessCss(); } catch (e) { }
        try { updateMainColorCss(); } catch (e) { }
        try { render.clearRenderCaches(); } catch (e) { }
        // Restore sound settings defaults as well
        try {
            Object.keys(defaultSoundSettings).forEach(k => {
                soundSettings[k] = defaultSoundSettings[k];
            });
        } catch (e) { console.warn('Failed to restore sound settings defaults', e); }

        // Regenerate settings form to reflect restored sound values
        try { generateSettingsForm(); } catch (e) { }

        console.log('Settings reset to defaults :', settings === defaultSettings);
        showNotification('已重置設定為預設值');
    }

    const resetBtn = document.getElementById('reset-settings-btn');
    if (resetBtn) resetBtn.addEventListener('click', resetSettingsToDefault);

    // 清除快取（localStorage、音效緩存、影像 sprite 等）
    function clearCache() {
        try {
            // 如果有自訂的 localStore Helper，嘗試呼叫其清除方法
            if (window.localStore && typeof window.localStore.clearAll === 'function') {
                try { window.localStore.clearAll(); } catch (e) { console.warn('localStore.clearAll failed', e); }
            } else {
                // fallback: attempt to clear caches and unregister service workers directly
                (async () => {
                    try {
                        if (typeof localStorage !== 'undefined') try { localStorage.clear(); } catch (e) { }
                        if (typeof caches !== 'undefined' && caches && typeof caches.keys === 'function') {
                            const keys = await caches.keys();
                            await Promise.all(keys.map(k => caches.delete(k)));
                        }
                        if (typeof navigator !== 'undefined' && navigator.serviceWorker && typeof navigator.serviceWorker.getRegistrations === 'function') {
                            const regs = await navigator.serviceWorker.getRegistrations();
                            await Promise.all(regs.map(r => r.unregister()));
                        }
                    } catch (e) { console.warn('clearCache fallback failed', e); }
                })();
            }
            // 清除一般 localStorage（注意：若想保留其他網站設定，改為刪除特定鍵）
            try { window.localStorage.clear(); } catch (e) { console.warn('localStorage.clear failed', e); }

            // 清除已載入的 noteImages sprite 資料
            try {
                for (const k in noteImages) {
                    try { delete noteImages[k]; } catch (e) { noteImages[k] = null; }
                }
            } catch (e) { console.warn('clear noteImages failed', e); }

            // 清除音效緩存與緩衝區
            try {
                soundBuffers = {};
                fullAudioBuffer = null;
                // 若需要，可暫停並釋放 bgm
                if (bgm && bgm.src) {
                    try { URL.revokeObjectURL(bgm.src); } catch (e) { }
                    bgm.src = '';
                }
            } catch (e) { console.warn('clear audio caches failed', e); }

            // 清除 render cache（如果有實作）
            try { render.clearRenderCaches(); } catch (e) { }

            showNotification('已清除快取');
        } catch (e) {
            console.error('clearCache error', e);
            showNotification('清除快取失敗');
        }
    }

    const clearCacheBtn = document.getElementById('clear-cache-btn');
    if (clearCacheBtn) clearCacheBtn.addEventListener('click', clearCache);

    _updCanvasRes();
    controls.play.textContent = icons[0 + play.btnPause];
    controls.stop.textContent = icons[2];
    controls.b10.textContent = icons[3];
    controls.b5.textContent = icons[4];
    controls.f5.textContent = icons[5];
    controls.f10.textContent = icons[6];
    controls.timeline.max = maxTime / 1000;

    function processChartData() {
        const temp = simai_decode(getNowDiff(settings.nowDiff));
        play.combo = 0;
        play.score = 0;
        notes = temp.notes;
        notesData = temp.data;
        marks = temp.marks;
        triggered = [];
        let newMaxTime = 1000;

        const timeMap = new Map();
        notes.forEach(note => {
            if (!note) return;
            if (!timeMap.has(note.time)) timeMap.set(note.time, []);
            timeMap.get(note.time).push(note);
        });

        notes.forEach(note => {
            if (!note) return;
            const notesAtSameTime = timeMap.get(note.time) || [];
            if (note.slide) {
                note.isDoubleSlide = notesAtSameTime.filter((n, indx) => n !== note && n.slide && (!n.chain || (n.chainTarget != note.chainTarget && note.chainTarget != indx))).length > 0;
            } else if (note.touch) {
                note.isDoubleTouch = notesAtSameTime.filter(n => n !== note && !n.starTime).length > 0;
            } else {
                if (note.star) {
                    note.doubleSlide = notesAtSameTime.filter(n => n !== note && n.slide && n.slideHead == note.pos).length > 1;
                }
                note.isDoubleTapHold = notesAtSameTime.filter(n => n !== note && !n.slide).length > 0;
            }

            let noteEndTime = note.time;
            if (note.holdTime) noteEndTime = Math.max(noteEndTime, note.time + note.holdTime * 1000);
            if (note.slideTime && note.delay) noteEndTime = Math.max(noteEndTime, note.time + ((note.slideTime ?? 0) + (note.delay ?? 0)) * 1000);
            if (note.touchTime) noteEndTime = Math.max(noteEndTime, note.time + note.touchTime * 1000);
            newMaxTime = Math.max(newMaxTime, noteEndTime);

            if (note.holdTime || note.touchTime || note.slide) {
                triggered.push([false, false]);
            } else {
                triggered.push(false);
            }
        });

        maxTime = settings.musicDelay * 1000 + newMaxTime + 1000;
        if (bgm.duration) {
            maxTime = Math.max(maxTime, (bgm.duration + 1) * 1000);
        }
        maxTime = isNaN(maxTime) ? 1000 : maxTime;
        controls.timeline.max = maxTime / 1000;
        if (currentTimelineValue > maxTime) {
            currentTimelineValue = maxTime;
        }
        play.pauseBoth(controls.play);
        bgm.pause();
        controls.timeline.value = currentTimelineValue;
        updateTimelineVisual(currentTimelineValue);
        startTime = Date.now();
    }

    function beforeUnloadHandler(e) {
        e.preventDefault();
        e.returnValue = "";
    }

    editor.addEventListener("input", debounce(function () {
        data["inote_" + settings.nowDiff] = editor.value;
        processChartData();
        if (editor.value !== "") {
            window.addEventListener("beforeunload", beforeUnloadHandler);
        } else {
            window.removeEventListener("beforeunload", beforeUnloadHandler);
        }
    }, 500));

    function updateTimelineVisual(value) {
        const min = parseFloat(controls.timeline.min) || 0;
        const max = parseFloat(controls.timeline.max) || 1;
        const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
        // --- START MODIFICATION ---
        // 獲取時間軸元素的實際渲染寬度 (像素)
        const timelineWidth = controls.timeline.offsetWidth;
        // 從 CSS 中獲取滑桿按鈕的寬度
        const thumbWidth = 14;

        // 調整百分比，讓填充顏色看起來置中在滑桿按鈕下方
        // 這樣填充會延伸到滑桿按鈕的中心點
        const adjustedPercentage = ((timelineWidth - thumbWidth) * percentage / 100 + thumbWidth / 2) / timelineWidth * 100;
        // 確保調整後的百分比不超過 100%
        const cappedAdjustedPercentage = Math.min(100, adjustedPercentage);

        controls.timeline.style.background = `linear-gradient(to right ,${_sliderColor[0]} 7px,${_sliderColor[0]} ${cappedAdjustedPercentage}%,${_sliderColor[1]} ${cappedAdjustedPercentage}%, ${_sliderColor[1]} 100%)`;
        // --- END MODIFICATION ---
    }

    function onTimelineInteractionStart() {
        play.pause = true;
        if (!play.btnPause) {
            bgm.pause();
        }
        // 在使用者開始拖曳時間軸時，暫停背景影片並記錄之前是否為播放中
        try {
            if (bgVideo && bgVideo.src) {
                try { bgVideoWasPlaying = !bgVideo.paused; } catch (e) { bgVideoWasPlaying = false; }
                try { bgVideo.pause(); } catch (e) { }
            } else {
                bgVideoWasPlaying = false;
            }
        } catch (e) { bgVideoWasPlaying = false; }
        if (settings.hideBgAndVideoWhenPaused) try { updateBgVisibility(); } catch (e) { };
    }

    function onTimelineInteractionEnd(e) {
        if (settings.followText) editor.focus();
        bgm.volume = soundSettings.musicVol * soundSettings.music;
        currentTimelineValue = parseFloat(e.target.value);
        startTime = Date.now() - (currentTimelineValue * 1000) / play.playbackSpeed;
        play.pause = play.btnPause;

        bgm.playbackRate = play.playbackSpeed;
        if (!play.pause) {
            bgm.currentTime = currentTimelineValue;
            bgm.play().catch(e => console.error("BGM play error:", e));
            if (bgVideo && bgVideo.src) {
                try { bgVideo.currentTime = currentTimelineValue; } catch (e) { }
                // 只有在使用者拖曳前影片是播放中的情況下，才恢復播放
                if (bgVideoWasPlaying) {
                    bgVideo.play().catch(() => { });
                }
            }
        } else {
            bgm.currentTime = currentTimelineValue;
            if (bgVideo && bgVideo.src) try { bgVideo.currentTime = currentTimelineValue; } catch (e) { }
        }
        // 重置狀態旗標
        bgVideoWasPlaying = false;
        if (settings.hideBgAndVideoWhenPaused) try { updateBgVisibility(); } catch (e) { };
    }

    controls.timeline.addEventListener("touchstart", onTimelineInteractionStart, { passive: true });
    controls.timeline.addEventListener("mousedown", onTimelineInteractionStart);
    controls.timeline.addEventListener("touchend", onTimelineInteractionEnd);
    controls.timeline.addEventListener("mouseup", onTimelineInteractionEnd);

    controls.timeline.addEventListener("input", function (e) {
        currentTimelineValue = parseFloat(e.target.value);
        if (play.pause) {
            startTime = Date.now() - (currentTimelineValue * 1000) / play.playbackSpeed;
        }

        if (settings.followText) {
            const b = editor.value.split(",");
            const a = b.slice(0, play.nowIndex + 1).toString().length;
            editor.setSelectionRange(a, a);
        }
        updateTimelineVisual(currentTimelineValue);
        if (bgVideo && bgVideo.src) {
            try { bgVideo.currentTime = currentTimelineValue; bgVideo.pause(); } catch (e) { }
        }
    });

    controls.play.addEventListener('click', function (e) {
        bgm.volume = soundSettings.musicVol * soundSettings.music;
        play.btnPause = !play.btnPause;
        play.pause = play.btnPause;
        this.textContent = icons[0 + play.btnPause];
        currentTimelineValue = parseFloat(controls.timeline.value);
        bgm.playbackRate = play.playbackSpeed;
        startTime = Date.now() - (currentTimelineValue * 1000) / play.playbackSpeed;

        if (!play.pause) {
            bgm.currentTime = currentTimelineValue;
            // ensure audio context unlocked before playing (iOS requirement)
            ensureAudioUnlocked().then(() => {
                bgm.play().catch(e => {
                    if (e.message !== "No audio loaded") console.error('BGM play failed:', e);
                });
            }).catch(e => { console.warn('ensureAudioUnlocked failed:', e); bgm.play().catch(() => { }); });
            if (bgVideo && bgVideo.src) {
                try { bgVideo.currentTime = currentTimelineValue; } catch (e) { }
                bgVideo.play().catch(() => { });
            }
        } else {
            bgm.pause();
            if (bgVideo && bgVideo.src) try { bgVideo.pause(); } catch (e) { }
        }

        // update background visibility based on play state
        if (settings.hideBgAndVideoWhenPaused) try { updateBgVisibility(); } catch (e) { };

        _updCanvasRes();
    });

    controls.stop.addEventListener('click', function () {
        play.pauseBoth(controls.play);
        currentTimelineValue = 0;
        startTime = Date.now();
        bgm.pause();
        if (bgVideo && bgVideo.src) try { bgVideo.pause(); bgVideo.currentTime = 0; } catch (e) { }
        controls.timeline.value = 0;
        updateTimelineVisual(0);

        _updCanvasRes();
        if (settings.hideBgAndVideoWhenPaused) try { updateBgVisibility(); } catch (e) { };
    });

    function seek(seconds) {
        const maxVal = maxTime / 1000;
        currentTimelineValue = Math.max(0, Math.min(currentTimelineValue + seconds, maxVal));
        startTime = Date.now() - (currentTimelineValue * 1000) / play.playbackSpeed;

        bgm.playbackRate = play.playbackSpeed;
        bgm.currentTime = currentTimelineValue;
        if (bgVideo && bgVideo.src) {
            try { bgVideo.currentTime = currentTimelineValue; } catch (e) { }
            bgVideo.playbackRate = play.playbackSpeed;
            if (!play.btnPause) {
                bgVideo.play().catch(() => { });
            } else {
                try { bgVideo.pause(); } catch (e) { }
            }
        }
        if (!play.btnPause) { // Keep playing if it was playing
            bgm.play().catch(e => console.error("BGM play error:", e));
        }

        controls.timeline.value = currentTimelineValue;
        updateTimelineVisual(currentTimelineValue);
        if (settings.hideBgAndVideoWhenPaused) try { updateBgVisibility(); } catch (e) { };
    }

    controls.b10.addEventListener('click', () => seek(-10));
    controls.b5.addEventListener('click', () => seek(-5));
    controls.f5.addEventListener('click', () => seek(5));
    controls.f10.addEventListener('click', () => seek(10));

    controls.zoomIn.addEventListener('click', function (e) {
        settings.audioZoom -= 20;
        settings.audioZoom = Math.max(settings.audioZoom, 10)
    });

    controls.zoomOut.addEventListener('click', function (e) {
        settings.audioZoom += 20;
        settings.audioZoom = Math.min(settings.audioZoom, 750)
    });

    if (typeof masterExample !== 'undefined' && masterExample && viteDev) {
        editor.value = masterExample;
        data["inote_" + settings.nowDiff] = masterExample;
        processChartData();
    }

    startTime = Date.now();
    updateTimelineVisual(0);

    window.addEventListener("resize", debounce(function () {
        doc_width = document.documentElement.clientWidth;
        doc_height = document.documentElement.clientHeight;
        _updCanvasRes();
    }, 30));

    function _updCanvasRes() {
        const editorLeft = editor.getBoundingClientRect().left;
        const bodyWidth = document.body.clientWidth;
        ctx.canvas.width = doc_width * (settings.hires ? 2 : 1) * ((editorLeft == 0 ? bodyWidth : editorLeft) / bodyWidth);

        const controlsEl = document.querySelector('.controls');
        const actionsEl = document.querySelector('.actions');
        // Get heights only if elements are visible
        const controlsHeight = controlsEl ? controlsEl.offsetHeight : 0;
        const actionsHeight = actionsEl ? actionsEl.offsetHeight : 0;
        ctx.canvas.height = Math.max(150, (doc_height - actionsHeight) * (settings.hires ? 2 : 1));

        const audioCanvas = document.getElementById("audioRender");
        if (audioCanvas) {
            audioCanvas.width = ctx.canvas.width;
            audioCanvas.height = 100;
        }
        // Clear renderer caches because hbw (and other size-dependent geometry) changed
        try { render.clearRenderCaches(); } catch (e) { /* ignore if render not ready */ }
    }

    let filterStrength = 20;
    let frameTime = 0, lastLoop = new Date(), thisLoop;

    // --- drawAudioWaveform caches & helpers ---
    let _cachedAudioCanvas = null;
    let _cachedAudioCtx2d = null;
    let _cachedTouchGrad = null;
    let _cachedTouchGradZoom = NaN;
    const _cachedStarPathMap = new Map();
    let _drawAudioFrameCounter = 0;
    let _drawAudioTimeSum = 0;

    function getStarPath(outerRadius = 5, innerRadius = 2.5, numPoints = 5) {
        const key = `${outerRadius}_${innerRadius}_${numPoints}`;
        if (_cachedStarPathMap.has(key)) return _cachedStarPathMap.get(key);
        const p = new Path2D();
        for (let i = 0; i < numPoints * 2 + 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = Math.PI / numPoints * i - Math.PI / 2;
            const currentX = radius * Math.cos(angle);
            const currentY = radius * Math.sin(angle);
            if (i === 0) p.moveTo(currentX, currentY);
            else p.lineTo(currentX, currentY);
        }
        _cachedStarPathMap.set(key, p);
        return p;
    }

    function ensureTouchGradient(ctx, zoom, height) {
        const z = isFinite(zoom) ? zoom : 200;
        // Recreate gradient when zoom changes or canvas height changes
        if (!_cachedTouchGrad || _cachedTouchGradZoom !== z || !_cachedAudioCanvas || (_cachedAudioCanvas && _cachedAudioCanvas.height !== height)) {
            try {
                _cachedTouchGrad = ctx.createLinearGradient(0, 0, -z * 100, height || (ctx.canvas && ctx.canvas.height) || 100);
                _cachedTouchGrad.addColorStop(0, '#ff3874');
                _cachedTouchGrad.addColorStop(1, 'rgba(255, 191, 81, 0)');
                _cachedTouchGradZoom = z;
            } catch (e) {
                _cachedTouchGrad = null;
                _cachedTouchGradZoom = NaN;
            }
        }
        return _cachedTouchGrad;
    }

    function drawAudioWaveform() {
        const t0 = performance.now();
        // Guard and cache DOM/context
        const zoomRaw = Number(settings.audioZoom);
        const zoom = Math.max(1, isFinite(zoomRaw) ? zoomRaw : 200);
        const audioCanvas = document.getElementById("audioRender");
        if (!audioCanvas) return;
        if (_cachedAudioCanvas !== audioCanvas) {
            _cachedAudioCanvas = audioCanvas;
            _cachedAudioCtx2d = null;
        }
        const audioCtx2d = _cachedAudioCtx2d || (_cachedAudioCtx2d = audioCanvas.getContext("2d"));

        audioCanvas.lineJoin = 'butt';

        audioCtx2d.clearRect(0, 0, audioCanvas.width, audioCanvas.height);
        audioCtx2d.strokeStyle = "#ffffff25";
        audioCtx2d.lineWidth = 1;
        const aw = audioCanvas.width;
        const ah = audioCanvas.height;
        const ahw = Math.floor(aw / 2);
        let sampleRate = 44100;

        if (fullAudioBuffer && bgm) {
            const pcmData = fullAudioBuffer.getChannelData(0);
            sampleRate = isFinite(fullAudioBuffer.sampleRate) && fullAudioBuffer.sampleRate > 0 ? fullAudioBuffer.sampleRate : 44100;

            // Map each canvas pixel to an audio sample index (centered at currentTimelineValue)
            const samplesPerPixel = sampleRate / zoom;
            //const centerSample = Math.floor(currentTimelineValue * samplesPerPixel) * zoom;
            const downSample = 2;
            for (let px = 0; px < aw; px++) {
                const i = px - ahw;
                // const data = pcmData[(Math.floor(i + currentTimelineValue * sampleRate / zoom)) * zoom];
                const sampleIdx = Math.floor((i + currentTimelineValue * samplesPerPixel) / downSample) * downSample * zoom;
                const data = (sampleIdx >= 0 && sampleIdx < pcmData.length) ? pcmData[sampleIdx] : 0;
                audioCtx2d.beginPath();
                const y = (data + 1) * ah / 2;
                const x = px;
                audioCtx2d.moveTo(x, ah - y);
                audioCtx2d.lineTo(x, y + 1);
                audioCtx2d.stroke();
            }
        }

        for (let i = 0; i < marks.length; i++) {
            const mark = marks[i];
            switch (mark.type) {
                case "slice": {
                    for (let j = 0; j < mark.repeat; j++) {
                        const x = ahw + (mark.time / 1000 + j * (60 / ((mark.slice / 4) * mark.bpm)) - currentTimelineValue + settings.musicDelay) * sampleRate / zoom;
                        if (x > aw || x < 0) continue;
                        audioCtx2d.beginPath();
                        audioCtx2d.strokeStyle = "#ffffffbf";
                        audioCtx2d.lineWidth = (j === 0 ? 5 : 3);
                        audioCtx2d.setLineDash(j % mark.slice == 0 && j !== 0 ? [8, 8] : []);
                        audioCtx2d.moveTo(x, audioCanvas.height / (j % mark.slice == 0 ? 5 : 1.5));
                        audioCtx2d.lineTo(x, audioCanvas.height);
                        audioCtx2d.stroke();
                    }
                    break;
                }
                case "bpm": {
                    audioCtx2d.setLineDash([]);
                    const checkA = (currentTimelineValue - settings.musicDelay - mark.time / 1000) * sampleRate / zoom > ahw && (mark.repeat === undefined || mark.repeat === null);
                    const l = Math.floor(aw / ((240 / mark.bpm) * sampleRate / zoom)) + 1;
                    const fl = Math.floor(l / 2);
                    //const endp = 
                    for (let j = 0; j < ((mark.repeat === undefined || mark.repeat === null) ? l + 1 : mark.repeat); j++) {
                        let x = ahw + (
                            ((checkA ? mark.time % (240000 / mark.bpm) : mark.time) + (240000 / mark.bpm) * (j - (checkA ? fl : 0))) / 1000
                            - (currentTimelineValue % (checkA ? (240 / mark.bpm) : Infinity))
                            + settings.musicDelay) * sampleRate / zoom;

                        if ((x > aw || x < 0)/* && (x > endp)*/) continue;
                        audioCtx2d.beginPath();
                        audioCtx2d.strokeStyle = j === 0 ? "#ded300ff" : "#fff874bf";
                        audioCtx2d.lineWidth = j === 0 ? 3 : 2;
                        audioCtx2d.moveTo(x, 0);
                        audioCtx2d.lineTo(x, audioCanvas.height);
                        audioCtx2d.stroke();
                        audioCtx2d.closePath();
                    }
                    break;
                }
            }
        }
        let slideOnAudioCount = 0;

        if (!settings.disableNotePreviewAtAudio) {
            audioCtx2d.setLineDash([]);
            notes.forEach(note => {
                const x = ahw + (note.time / 1000 - currentTimelineValue + settings.musicDelay) * sampleRate / zoom;
                const y = (parseInt(note.pos) % 9 - 0.5) / 8 * audioCanvas.height;
                if (x > audioCanvas.width || x < 0 - ((note.hanabi ?? 0) * 0.3 + (note.slideTime ?? 0) + (note.holdTime ?? 0) + (note.delay ?? 0) + (note.touchTime ?? 0)) * sampleRate / zoom) return;
                audioCtx2d.strokeStyle = note.break ? '#FF6C0C' : (note.isDoubleTapHold || note.isDoubleTouch || note.isDoubleSlide ? "#FFD900" : (note.star || note.touch || note.slide ? '#0089F4' : "#FF569B"));
                audioCtx2d.lineWidth = 3;
                audioCtx2d.beginPath();
                if (note.touch) {
                    // Build gradient only when coordinates are finite
                    let d = null;
                    if (note.touchTime != null) {
                        audioCtx2d.lineWidth = 6;
                        const colorMap = ['#FA4904', '#F5EE00', '#11A769', '#008DF4'];
                        for (let t = 3; t >= 0; t--) {
                            const x_p = ((t + 1) / 4) * note.touchTime * sampleRate / zoom;
                            audioCtx2d.strokeStyle = colorMap[t];
                            audioCtx2d.beginPath();
                            audioCtx2d.moveTo(x, y);
                            audioCtx2d.lineTo(x + x_p, y);
                            audioCtx2d.closePath();
                            audioCtx2d.stroke();
                        }
                        if (note.hanabi) {
                            if (isFinite(x) && isFinite(zoom) && isFinite(sampleRate)) {
                                d = audioCtx2d.createLinearGradient(x + note.touchTime * sampleRate / zoom, 0, x + (note.touchTime + 0.3) * sampleRate / zoom, 0);
                                d.addColorStop(0, '#ff2525');
                                d.addColorStop(0.25, '#f8ff25a5');
                                d.addColorStop(0.5, '#30ff2566');
                                d.addColorStop(0.75, '#257cff34');
                                d.addColorStop(1, '#ff25f000');
                            }
                            if (d) {
                                audioCtx2d.fillStyle = d;
                                audioCtx2d.fillRect(x + note.touchTime * sampleRate / zoom, 0, x + (note.touchTime + 0.3) * sampleRate / zoom, audioCanvas.height);
                            }
                        }
                    } else {
                        if (note.hanabi) {
                            if (isFinite(x) && isFinite(zoom) && isFinite(sampleRate)) {
                                d = audioCtx2d.createLinearGradient(x, 0, x + sampleRate * 0.3 / zoom, 0);
                                d.addColorStop(0, '#ff2525');
                                d.addColorStop(0.25, '#f8ff25a5');
                                d.addColorStop(0.5, '#30ff2566');
                                d.addColorStop(0.75, '#257cff34');
                                d.addColorStop(1, '#ff25f000');
                            }
                            if (d) {
                                audioCtx2d.fillStyle = d;
                                audioCtx2d.fillRect(x, 0, sampleRate * 0.3 / zoom, audioCanvas.height);
                            }
                        }
                        audioCtx2d.rect(x - 3, y - 3, 6, 6);
                    }
                } else if (note.slide) {
                    if (slideOnAudioCount > settings.maxSlideOnScreenCount) return;
                    audioCtx2d.lineWidth = 6;
                    audioCtx2d.setLineDash([6, 6]);
                    audioCtx2d.font = "20px Arial";
                    const startY = (parseInt(note.chain ? notes[note.chainTarget].slideHead : note.slideHead) % 9 - 0.5) / 8 * audioCanvas.height;
                    //audioCtx2d.fillText(`${note.chainTarget}`, x + 20, startY+10);
                    audioCtx2d.moveTo(x + note.delay * sampleRate / zoom, startY);
                    audioCtx2d.lineTo(x + (note.slideTime + note.delay) * sampleRate / zoom, startY);
                    slideOnAudioCount++;
                } else if (note.star) {
                    const outerRadius = 5, innerRadius = 2.5, numPoints = 5;
                    const path = getStarPath(outerRadius, innerRadius, numPoints);
                    audioCtx2d.save();
                    audioCtx2d.translate(x, y);
                    try { audioCtx2d.stroke(path); } catch (e) { /* fallback to manual path */
                        for (let i = 0; i < numPoints * 2 + 2; i++) {
                            const radius = i % 2 === 0 ? outerRadius : innerRadius;
                            const angle = Math.PI / numPoints * i - Math.PI / 2;
                            const currentX = x + radius * Math.cos(angle);
                            const currentY = y + radius * Math.sin(angle);
                            if (i === 0) audioCtx2d.moveTo(currentX, currentY);
                            else audioCtx2d.lineTo(currentX, currentY);
                        }
                    }
                    audioCtx2d.restore();
                } else {
                    if (note.holdTime != null) {
                        audioCtx2d.lineWidth = 6;
                        audioCtx2d.moveTo(x, y);
                        audioCtx2d.lineTo(x + Math.max(note.holdTime * sampleRate / zoom, 5), y);
                    } else {
                        audioCtx2d.arc(x, y, 4, 0, 2 * Math.PI);
                    }
                }

                if (!(note.touch && note.touchTime != null)) {
                    //audioCtx2d.closePath();
                    audioCtx2d.stroke();
                }
                audioCtx2d.setLineDash([]);
            });
        }

        audioCtx2d.beginPath();
        audioCtx2d.strokeStyle = "red";
        audioCtx2d.lineWidth = 4;
        audioCtx2d.moveTo(ahw, 0);
        audioCtx2d.lineTo(ahw, audioCanvas.height);
        audioCtx2d.stroke();

        // Benchmark sampling: accumulate draw times and occasionally log average
        try {
            const t1 = performance.now();
            _drawAudioFrameCounter++;
            _drawAudioTimeSum += (t1 - t0);
            if (_drawAudioFrameCounter >= 120) {
                const avg = _drawAudioTimeSum / _drawAudioFrameCounter;
                if (settings.debug) console.log(`drawAudioWaveform avg ms (${_drawAudioFrameCounter} frames): ${avg.toFixed(2)}`);
                _drawAudioFrameCounter = 0;
                _drawAudioTimeSum = 0;
            }
        } catch (e) { /* ignore */ }
    }

    // Cache measurement divs per-textarea to avoid repeated DOM creation and style reads
    (function () {
        const measurementCache = new WeakMap();

        function createMeasurementDiv(textarea) {
            const div = document.createElement('div');
            const style = window.getComputedStyle(textarea);
            // copy only the properties we need for height measurement
            const props = ['fontFamily', 'fontSize', 'lineHeight', 'padding', 'border', 'boxSizing', 'letterSpacing', 'width'];
            props.forEach(prop => { try { div.style[prop] = style[prop]; } catch (e) { /* ignore read-only */ } });
            div.style.position = 'absolute';
            div.style.visibility = 'hidden';
            div.style.whiteSpace = 'pre-wrap';
            div.style.wordWrap = 'break-word';
            // place it off-screen to avoid affecting layout
            div.style.left = '-99999px';
            div.style.top = '0';
            document.body.appendChild(div);
            return div;
        }

        window.getScrollTopToCaret = function getScrollTopToCaret(textarea, position) {
            let entry = measurementCache.get(textarea);
            if (!entry) {
                const div = createMeasurementDiv(textarea);
                entry = { div };
                measurementCache.set(textarea, entry);
            }
            const div = entry.div;

            // Keep the measurement div width in sync with the textarea; only update when changed
            const widthPx = textarea.clientWidth + 'px';
            if (div.style.width !== widthPx) div.style.width = widthPx;

            // Use a zero-width space when substring is empty to ensure a height measurement > 0
            const text = textarea.value.substring(0, position) || '\u200B';
            if (div.textContent !== text) div.textContent = text;

            const caretY = div.offsetHeight;
            return caretY - textarea.clientHeight / 2;
        };
    })();

    function update() {
        const tStartFrame = performance.now();
        if (!play.pause) {
            const newTimelineVal = ((Date.now() - startTime) / 1000) * play.playbackSpeed;
            if (Math.abs(currentTimelineValue - newTimelineVal) > 0.01) {
                currentTimelineValue = newTimelineVal > maxTime / 1000 ? maxTime / 1000 : newTimelineVal;
                controls.timeline.value = currentTimelineValue;
                updateTimelineVisual(currentTimelineValue);
                if (newTimelineVal > maxTime / 1000) {
                    play.pauseBoth(controls.play);
                }
            }
        }

        const t = (currentTimelineValue - settings.musicDelay + settings.deviceAudioOffset) * 1000;
        const sVal = 1000000 / notesData.val;
        const bVal = (notesData.breakCounts === 0 ? 0 : 10000) / notesData.breakCounts;

        if (notes && notes.length > 0 && sfxReady) {
            // --- 修正開始 ---
            let foundIndexForThisFrame = false;
            // 如果當前時間比譜面中第一個音符還早，就將 index 設為 0
            if (notes.length > 0 && notes[0] && t < notes[0].time) {
                play.nowIndex = 0;
            }
            // --- 修正結束 ---

            for (let i = notes.length - 1; i >= 0; i--) {
                const note = notes[i];
                if (!note || note.invalid) continue;

                // --- 修正開始 ---
                // 這個判斷式會在每一幀重新尋找正確的 nowIndex。
                // 因為迴圈是從後往前跑，所以第一個時間點小於等於當前時間的音符，就是正確的當前音符。
                // 我們只在找到第一個符合條件的音符時更新 index。
                if (!foundIndexForThisFrame && t >= note.time && !note.slide) {
                    play.nowIndex = note.index ?? play.nowIndex;
                    foundIndexForThisFrame = true; // 標記本幀已找到，防止被更早的音符覆蓋
                }
                // --- 修正結束 ---

                const _t_note_relative = (t - note.time) / 1000;

                if (triggered[i] === undefined) continue; // Skip if no trigger state for this note

                // Tap, Star, Hold (start) logic
                if (!note.starTime && !note.touch && !note.slide) {
                    if (_t_note_relative >= 0) {
                        if (Array.isArray(triggered[i])) { // Hold note
                            if (!triggered[i][0]) {
                                _playEffect(note);
                                triggered[i][0] = true;
                                // play.nowIndex = note.index ?? play.nowIndex; // 由上方新邏輯取代
                            }
                        } else { // Tap/Star note
                            if (!triggered[i]) {
                                _playEffect(note);
                                triggered[i] = true;
                                // play.nowIndex = note.index ?? play.nowIndex; // 由上方新邏輯取代
                                play.combo++;
                                if (note.break) { play.score += sVal * 5 + bVal; }
                                else { play.score += sVal; }
                            }
                        }
                    } else { // Reset trigger if time is before note
                        if (Array.isArray(triggered[i])) {
                            triggered[i][0] = false;
                        }
                        else {
                            if (triggered[i]) {
                                play.combo--;
                                if (note.break) { play.score -= sVal * 5 + bVal; }
                                else { play.score -= sVal; }
                            }
                            triggered[i] = false;
                        }
                    }
                    // Hold (end) logic
                    if (note.holdTime && _t_note_relative >= note.holdTime) { // Use note.holdTime directly
                        if (Array.isArray(triggered[i]) && triggered[i][0] && !triggered[i][1]) {
                            if (!settings.holdEndNoSound) _playEffect(note, true);
                            triggered[i][1] = true;
                            play.combo++;
                            if (note.break) { play.score += sVal * 5 + bVal; }
                            else { play.score += sVal * 2; }
                        }
                    } else if (note.holdTime && Array.isArray(triggered[i])) { // Reset end trigger if before end time
                        if (triggered[i][1]) {
                            play.combo--;
                            if (note.break) { play.score -= sVal * 5 + bVal; }
                            else { play.score -= sVal * 2; }
                        }
                        triggered[i][1] = false;
                    }
                }
                // (後續的 slide 和 touch 邏輯保持不變，因為它們更新 index 的部分也被新邏輯取代了)
                // ... [ 其餘的 slide 和 touch 判斷程式碼 ] ...
                else if (note.slide) { // Slide
                    if (_t_note_relative >= note.delay) {
                        if (Array.isArray(triggered[i]) && !triggered[i][0]) {
                            if (!note.chain || note.firstOne) _playEffect(note);
                            triggered[i][0] = true;
                            //play.nowIndex = note.index ?? play.nowIndex;
                        }
                    } else if (Array.isArray(triggered[i])) {
                        triggered[i][0] = false;
                    }

                    if (note.slideTime && _t_note_relative >= note.slideTime + note.delay) { // Slide End
                        if (Array.isArray(triggered[i]) && triggered[i][0] && !triggered[i][1] && !settings.holdEndNoSound) {
                            if (!note.chain || note.lastOne) {
                                _playEffect(note, true);
                                play.combo++;
                                play.score += note.break ? (sVal * 5 + bVal) : (sVal * 3);
                            }
                            triggered[i][1] = true;
                        }
                    } else if (note.slideTime && Array.isArray(triggered[i]) && triggered[i][1]) { // Reset Slide End
                        if (!note.chain || note.lastOne) {
                            play.combo--;
                            play.score -= note.break ? (sVal * 5 + bVal) : (sVal * 3);
                        }
                        triggered[i][1] = false;
                    }

                } else if (note.touch) { // Touch
                    if (_t_note_relative >= 0) {
                        if (Array.isArray(triggered[i])) { // Touch Hold
                            if (!triggered[i][0]) {
                                _playEffect(note);
                                triggered[i][0] = true;
                                //play.nowIndex = note.index ?? play.nowIndex;
                            }
                        } else { // Touch Tap
                            if (!triggered[i]) {
                                _playEffect(note);
                                play.combo++;
                                play.score += sVal;
                                triggered[i] = true;
                                //play.nowIndex = note.index ?? play.nowIndex;
                            }
                        }
                    } else { // Reset
                        if (Array.isArray(triggered[i])) {
                            triggered[i][0] = false;
                        } else if (triggered[i]) {
                            triggered[i] = false;
                            play.combo--;
                            play.score -= sVal;
                        }
                    }
                    if (note.touchTime && _t_note_relative >= note.touchTime) { // Touch Hold End
                        if (Array.isArray(triggered[i]) && triggered[i][0] && !triggered[i][1] && !settings.holdEndNoSound) {
                            _playEffect(note, true);
                            play.combo++;
                            play.score += sVal * 2;
                            triggered[i][1] = true;
                        }
                    } else if (note.touchTime && Array.isArray(triggered[i]) && triggered[i][1]) { // Reset Touch Hold End
                        triggered[i][1] = false;
                        play.combo--;
                        play.score -= sVal * 2;
                    }
                }
            }
        }



        if (settings.followText && !(play.pause || inSettings || play.maximized)) {
            editor.focus();
            const b = editor.value.split(",");
            const a = b.slice(0, play.nowIndex + 1).toString().length;
            editor.setSelectionRange(a, a);
            editor.scrollTop = getScrollTopToCaret(editor, a);
        }

        // instrumentation: measure render and audio draw times
        const tAfterUpdate = performance.now();
        const tStartRender = performance.now();
        render.renderGame(ctx, notes, settings, noteImages, t, triggered, play, (1000 / frameTime).toFixed(1));
        const tAfterRender = performance.now();
        const tStartAudio = performance.now();
        drawAudioWaveform();
        const tAfterAudio = performance.now();
        const tEndFrame = performance.now();

        // supply timings to perf overlay (frame, update, render, audio)
        try { perf.tick(tEndFrame - tStartFrame, tAfterUpdate - tStartFrame, tAfterRender - tStartRender, tAfterAudio - tStartAudio); } catch (e) { /* ignore */ }

        const formatTime = (seconds) => {
            const min = Math.floor(seconds / 60);
            const sec = Math.floor(seconds % 60).toString().padStart(2, "0");
            const ms = (seconds % 1).toFixed(3).slice(1);
            return `${min}:${sec}${ms}`;
        };

        timeDisplay.textContent = `${formatTime(currentTimelineValue)} / ${formatTime(maxTime / 1000)}`;

        thisLoop = new Date();
        frameTime += (thisLoop - lastLoop - frameTime) / filterStrength;
        lastLoop = thisLoop;
        if (play.tryReinit) {
            play.tryReinit = false;
            return;
        }

        debugText();
        requestAnimationFrame(update);
    }

    speed1x.addEventListener('click', function () {
        play.playbackSpeed = 1;
        if (bgm) {
            if (play.playbackSpeed > 0) {
                bgm.playbackRate = play.playbackSpeed;
                if (bgVideo && bgVideo.src) try { bgVideo.playbackRate = play.playbackSpeed; } catch (e) { }
            } else {
                play.playbackSpeed = 1;
                bgm.playbackRate = 1;
                if (bgVideo && bgVideo.src) try { bgVideo.playbackRate = 1; } catch (e) { }
            }
        }
        startTime = Date.now() - (currentTimelineValue * 1000) / play.playbackSpeed;
        bgm.currentTime = currentTimelineValue;

        speedDisplay.innerText = play.playbackSpeed.toFixed(2) + 'x';
    });

    speedAdd.addEventListener('click', function () {
        play.playbackSpeed += 0.25;
        if (play.playbackSpeed > 2) play.playbackSpeed = 2;
        if (bgm) {
            if (play.playbackSpeed > 0) {
                bgm.playbackRate = play.playbackSpeed;
                if (bgVideo && bgVideo.src) try { bgVideo.playbackRate = play.playbackSpeed; } catch (e) { }
            } else {
                play.playbackSpeed = 1;
                bgm.playbackRate = 1;
                if (bgVideo && bgVideo.src) try { bgVideo.playbackRate = 1; } catch (e) { }
            }
        }
        startTime = Date.now() - (currentTimelineValue * 1000) / play.playbackSpeed;
        bgm.currentTime = currentTimelineValue;

        speedDisplay.innerText = play.playbackSpeed.toFixed(2) + 'x';
    });

    speedMinus.addEventListener('click', function () {
        play.playbackSpeed -= 0.25;
        if (play.playbackSpeed < 0.25) play.playbackSpeed = 0.25;
        if (bgm) {
            if (play.playbackSpeed > 0) {
                bgm.playbackRate = play.playbackSpeed;
                if (bgVideo && bgVideo.src) try { bgVideo.playbackRate = play.playbackSpeed; } catch (e) { }
            } else {
                play.playbackSpeed = 1;
                bgm.playbackRate = 1;
                if (bgVideo && bgVideo.src) try { bgVideo.playbackRate = 1; } catch (e) { }
            }
        }
        startTime = Date.now() - (currentTimelineValue * 1000) / play.playbackSpeed;
        bgm.currentTime = currentTimelineValue;

        speedDisplay.innerText = play.playbackSpeed.toFixed(2) + 'x';
    });

    fullscreenBtn.addEventListener('click', function () {
        if (!document.fullscreenElement) {
            this.innerText = 'fullscreen_exit';
            document.documentElement.requestFullscreen().catch((err) => {
                console.error('Error attempting to enable full-screen mode:', err);
                showNotification('Failed to enter fullscreen mode.');
            });
        } else {
            document.exitFullscreen();
            this.innerText = 'fullscreen';
        }
    });

    debugBtn.addEventListener('click', async function () {
        try {
            const test = await window.showDirectoryPicker({ mode: 'readwrite' });
            console.log('Directory picked:', test);
        } catch (err) {
            console.error('Error picking directory:', err);
        }
    });

    lockProgressBtn.addEventListener('click', function () {
        const isMinimized = document.body.classList.contains('layout-minimized');
        if (isMinimized) {
            settings.lockProgress = !settings.lockProgress;
            showNotification(`Progress lock ${settings.lockProgress ? 'enabled' : 'disabled'}.`);
        } else {
            showNotification('Progress lock can only be toggled in fullscreen mode.');
        }
        lockProgressBtn.querySelector('.icon-minimize').style.display = settings.lockProgress ? 'none' : 'flex';
        lockProgressBtn.querySelector('.icon-maximize').style.display = settings.lockProgress ? 'flex' : 'none';
    });

    function debugText() {

    }

    // Auto-show controls when mouse is near bottom in minimized mode
    (function setupAutoShowControls() {
        const controlsEl = document.querySelector('.controls');
        let hideTimeout = null;
        const BOTTOM_THRESHOLD = 120; // pixels from bottom to trigger show
        const HIDE_DELAY = 1000; // milliseconds to wait before hiding

        function showControls() {
            if (document.body.classList.contains('layout-minimized')) {
                controlsEl.classList.add('show-on-hover');
                // Clear any pending hide timeout
                if (hideTimeout) {
                    clearTimeout(hideTimeout);
                    hideTimeout = null;
                }
            }
        }

        function scheduleHideControls() {
            if (document.body.classList.contains('layout-minimized')) {
                // Clear any existing timeout
                if (hideTimeout) clearTimeout(hideTimeout);
                // Schedule hide after delay
                hideTimeout = setTimeout(() => {
                    controlsEl.classList.remove('show-on-hover');
                    hideTimeout = null;
                }, HIDE_DELAY);
            }
        }

        document.addEventListener('mousemove', (e) => {
            if (!document.body.classList.contains('layout-minimized')) return;

            const distanceFromBottom = window.innerHeight - e.clientY;
            if (settings.lockProgress) {
                controlsEl.classList.remove('show-on-hover');
            }
            if (distanceFromBottom <= BOTTOM_THRESHOLD && !settings.lockProgress) {
                showControls();
            } else {
                scheduleHideControls();
            }

        });

        // Also hide when mouse leaves the window
        document.addEventListener('mouseleave', () => {
            if (document.body.classList.contains('layout-minimized')) {
                scheduleHideControls();
            }
        });

        // Keep controls visible when hovering directly over them
        if (controlsEl) {
            controlsEl.addEventListener('mouseenter', () => {
                if (hideTimeout) {
                    clearTimeout(hideTimeout);
                    hideTimeout = null;
                }
            });

            controlsEl.addEventListener('mouseleave', () => {
                scheduleHideControls();
            });
        }
    })();

    update();
});

async function getImgs() {
    // Populate the exported `noteImages` object using fetch so we can control
    // loading and attach `.sprite` properties expected by render.
    const images = noteImages; // fill this shared object
    try {
        Object.entries(imgsToCreate).forEach(([i, dom]) => {
            const el = document.getElementById("img_" + dom[0]);
            if (el) { images[dom[0]] = el; }
            else { console.warn(`Image element #${dom[0]} not found.`); }
        });
        Object.entries(effects).forEach(([i, filename]) => {
            let dom = filename.split('.');
            const el = document.getElementById("img_" + dom[0]);
            if (el) { images[dom[0]] = el; }
            else { console.warn(`Image effect element #${dom[0]} not found.`); }
        });
    } catch (e) {
        console.error('Error getting images:', e);
    }
    console.log('Images loaded:', images);
    return images;
}
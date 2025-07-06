import { simai_decode } from "../Js/decode.js"; // Assuming this path is correct
import * as render from "../Js/render.js";

export let settings = { // Keep export if other modules might need direct access
    'musicDelay': 0,
    'distanceToMid': 0.3,
    'roundStroke': true,
    'noteSize': 0.09,
    'speed': 2,
    'pinkStar': false,
    'touchSpeed': 2,
    'slideSpeed': 2,
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
    'middleDisplay': 2,
    'maxSlideOnScreenCount': 500,
    'showFpsCounter': true,
};
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
};

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
let maidata; // Chart data

const settingsConfig = {
    game: [
        { target: settings, key: 'musicDelay', label: '譜面偏移 (音樂延遲)', type: 'number', step: 0.01, min: -20, max: 20 },
        { target: play, key: 'playbackSpeed', label: '回放速度', type: 'number', step: 0.01, min: 0.01, max: 4 },
        { target: settings, key: 'followText', label: '文本跟隨', type: 'boolean' },
        { target: settings, key: 'speed', label: 'Tap/Hold 速度倍率', type: 'number', step: 0.1 },
        { target: settings, key: 'pinkStar', label: '粉紅色星星', type: 'boolean' },
        { target: settings, key: 'slideSpeed', label: 'Slide 速度倍率', type: 'number', step: 0.1 },
        { target: settings, key: 'touchSpeed', label: 'Touch 速度倍率', type: 'number', step: 0.1 },
        { target: settings, key: 'middleDisplay', label: '中央顯示 (0: 無,1: COMBO,2: 分數(累加))', type: 'number', step: 1, min: 0, max: 2 },
        { target: settings, key: 'roundStroke', label: '圓滑邊緣', type: 'boolean' },
        { target: settings, key: 'showEffect', label: '顯示簡單效果', type: 'boolean' },
        { target: settings, key: 'holdEndNoSound', label: 'Hold 結尾無音效', type: 'boolean' },
        { target: settings, key: 'distanceToMid', label: 'Note 出現位置 (0-1)', type: 'number', step: 0.01, min: 0, max: 1 },
        { target: settings, key: 'noteSize', label: 'Note 大小 (0-1)', type: 'number', step: 0.01, min: 0, max: 1 },
        { target: settings, key: 'lineWidthFactor', label: 'Note 粗細 (不影響 Touch) (0-1)', type: 'number', step: 0.01, min: 0, max: 2 },
        { target: settings, key: 'showSlide', label: '顯示 Slide 軌跡', type: 'boolean' },
        { target: settings, key: 'disableSensorWhenPlaying', label: '播放時隱藏 Touch 位置文本', type: 'boolean' },
        { target: settings, key: 'noNoteArc', label: '不顯示音符弧線', type: 'boolean' },
        { target: settings, key: 'effectDecayTime', label: '效果持續時間', type: 'number', step: 0.01 },
    ],
    sound: [
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
    ]
};

let notes = [{}], notesData = {}, marks = {};
let triggered = [];
let startTime = 0;
let maxTime = 1000;
let sfxReady = false, inSettings = false;
let currentTimelineValue = 0;

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

let analyser;
let audioWaveform_dataArray;
let audioWaveform_bufferLength;
let isAudioSourceConnected = false;
let fullAudioBuffer;

const soundFiles = {
    tap: 'judge.wav', ex: 'judge_ex.wav', break: 'judge_break.wav', break_woo: 'break.wav',
    touch: 'touch.wav', hanabi: 'hanabi.wav', slide: 'slide.wav', breakSlide: 'break_slide_start.wav',
    breakSlideEnd: 'break_slide.wav', answer: 'answer.wav',
};

let soundBuffers = {};

async function loadAllSounds(list) {
    const buffers = {};
    const loadPromises = Object.entries(list).map(async ([key, url]) => {
        try {
            const resp = await fetch('Sounds/' + url);
            if (!resp.ok) throw new Error(`Failed to fetch ${url}: ${resp.statusText}`);
            const arrayBuffer = await resp.arrayBuffer();
            buffers[key] = await audioCtx.decodeAudioData(arrayBuffer);
        } catch (error) {
            console.error(`Error loading sound ${key} (${url}):`, error);
            buffers[key] = null;
        }
    });
    await Promise.all(loadPromises);
    return buffers;
}

function playSound(buffers, name, { volume = 0.1 } = {}) {
    if (audioCtx.state === 'suspended') { audioCtx.resume(); }
    const buffer = buffers[name];
    if (!buffer) return;

    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    const gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
    source.connect(gainNode).connect(audioCtx.destination);
    source.start(0);
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
    if (!sfxReady || play.pause) return;
    if (soundSettings.answer && soundBuffers.answer && !note.slide) {
        playSound(soundBuffers, 'answer', { volume: soundSettings.answerVol });
    }
    if (soundSettings.sfxs) {
        if (note.ex && soundBuffers.ex && !hold) {
            playSound(soundBuffers, 'ex', { volume: soundSettings.judgeExVol });
        }
        if (hold) {
            if (note.touchTime && note.hanabi) {
                if (soundBuffers.hanabi) playSound(soundBuffers, 'hanabi', { volume: soundSettings.hanabiVol });
            }
            if (note.break) {
                if (note.slide) {
                    if (soundBuffers.breakSlideEnd) playSound(soundBuffers, 'breakSlideEnd', { volume: soundSettings.breakSlideVol });
                }
            }
        } else {
            if (note.break) {
                if (note.slide) {
                    if (soundBuffers.breakSlide) playSound(soundBuffers, 'breakSlide', { volume: soundSettings.breakSlideVol });
                } else {
                    if (soundBuffers.break_woo) playSound(soundBuffers, 'break_woo', { volume: soundSettings.breakVol });
                    if (soundBuffers.break) playSound(soundBuffers, 'break', { volume: soundSettings.breakJudgeVol });
                }
            } else {
                if (note.slide) {
                    if (soundBuffers.slide) playSound(soundBuffers, 'slide', { volume: soundSettings.slideVol });
                } else if (note.touch) {
                    if (soundBuffers.touch) playSound(soundBuffers, 'touch', { volume: soundSettings.touchVol });
                    if (!note.touchTime && note.hanabi) {
                        if (soundBuffers.hanabi) playSound(soundBuffers, 'hanabi', { volume: soundSettings.hanabiVol });
                    }
                } else if (soundBuffers.tap) {
                    playSound(soundBuffers, 'tap', { volume: soundSettings.judgeVol });
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


document.addEventListener('DOMContentLoaded', function () {
    const renderCanvas = document.getElementById("render");
    const ctx = renderCanvas.getContext("2d");
    const customMenu = document.getElementById("customMenu");
    const editor = document.getElementById("editor");
    const timeDisplay = document.getElementById("nowTrackTime");
    const bgm = document.getElementById("bgm");
    const dropdownList = document.querySelector(".dropdownlist");
    const allDropdowns = document.querySelectorAll('.dropdown-content');

    // ***** NEW FEATURE: MINIMIZE CONTROLS (with Animation) *****
    const hideControlsBtn = document.getElementById('hideContorls');
    if (hideControlsBtn) {
        // 選取所有需要執行動畫的元素
        const elementsToAnimate = document.querySelectorAll('.controls, .actions, .preview-control, #audioRender, #editor');

        hideControlsBtn.addEventListener('click', () => {
            const isMinimized = document.body.classList.contains('layout-minimized');

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
            hideControlsBtn.querySelector('.icon-minimize').style.display = currentlyMinimized ? 'none' : 'inline';
            hideControlsBtn.querySelector('.text-minimize').style.display = currentlyMinimized ? 'none' : 'inline';
            hideControlsBtn.querySelector('.icon-maximize').style.display = currentlyMinimized ? 'inline' : 'none';
            hideControlsBtn.querySelector('.text-maximize').style.display = currentlyMinimized ? 'inline' : 'none';

            // 重新計算畫布大小
            setTimeout(() => _updCanvasRes(), 350);
        });
    }
    // ***** END OF NEW FEATURE *****


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

    // --- File & Diff Menu Actions (Event Delegation) ---
    dropdownList.addEventListener('click', (event) => {
        const target = event.target;
        if (target.tagName !== 'LI') return;

        allDropdowns.forEach(menu => menu.classList.add('hide'));

        if (target.dataset.action === 'open-maidata') {
            handleFileUpload('text/*', (file) => {
                const reader = new FileReader();
                reader.onload = function (e) {
                    maidata = e.target.result;
                    data = parseMaidataToJson(maidata);
                    console.log("檔案內容：", data);
                    let getNowDiff = function (e) {
                        return data['inote_' + e];
                    }
                    settings.musicDelay = parseFloat(data.first ?? "0");
                    editor.value = getNowDiff(settings.nowDiff);
                    play.pauseBoth(controls.play);
                    bgm.pause();
                    currentTimelineValue = 0;
                    controls.timeline.value = 0;
                    updateTimelineVisual(0);
                    startTime = Date.now();
                    processChartData();
                };
                reader.readAsText(file);
            });
        } else if (target.dataset.action === 'open-audio') {
            handleFileUpload('audio/*', (file) => {
                play.pauseBoth(controls.play);
                if (bgm.src) URL.revokeObjectURL(bgm.src);
                bgm.src = '';

                const reader = new FileReader();
                reader.onload = function (event) {
                    const arrayBuffer = event.target.result;
                    audioCtx.decodeAudioData(arrayBuffer, function (audioBuffer) {
                        fullAudioBuffer = audioBuffer;
                        console.log("AudioBuffer 成功載入:", fullAudioBuffer);
                        const objectURL = URL.createObjectURL(file);
                        bgm.src = objectURL;
                        bgm.load();
                    }, function (error) {
                        console.error("解碼音訊資料時發生錯誤:", error);
                    });
                };
                reader.onerror = function (event) {
                    console.error("檔案讀取失敗:", event.target.error);
                };
                reader.readAsArrayBuffer(file);
            });
        } else if (target.dataset.diff) {
            loadDiff(parseInt(target.dataset.diff, 10), data);
            // 在 dropdownList 的 click handler 裡面：
        } else if (target.dataset.action === 'save-file') {
            // 1. 把目前 data 物件序列化回 maidata 格式
            function serializeMaidata(dataObj) {
                console.log(dataObj);
                const lines = [];
                for (var key in dataObj) {
                    if (key.includes("inote_") && !dataObj[key]) continue;
                    lines.push(`&${key}=${dataObj[key] ?? ''}`);
                };
                return lines.join('\n');
            }
            const maidataFileName = 'maidata';
            const text = serializeMaidata(data);

            // 2. 產生 Blob 並觸發下載
            const blob = new Blob([text], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            // 這裡可以從原檔案名稱推一個預設，如 maidata.txt
            a.download = (maidataFileName || 'maidata') + '.txt';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
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
                for (let i = 0; i < selected.length; i++) {
                    const ch = selected[i];
                    if (ch === '(') inParen++; if (ch === ')') inParen--;
                    if (ch === '{') inBrace++; if (ch === '}') inBrace--;
                    if (ch === '[') inBrack++; if (ch === ']') inBrack--;
                    if (inParen === 0 && inBrack === 0 && inBrace === 0 && /\d/.test(ch)) {
                        result += (9 - parseInt(ch)).toString();
                    } else {
                        result += ch;
                    }
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
    };

    const noteImages = getImgs();

    function handleFileUpload(accept, callback) {
        allDropdowns.forEach(menu => menu.classList.add('hide'));
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.style.display = 'none';
        fileInput.accept = accept;
        document.body.appendChild(fileInput);
        fileInput.addEventListener('change', function (event) {
            const file = event.target.files[0];
            if (file) {
                callback(file, event);
            }
            fileInput.remove();
        });
        fileInput.click();
    }

    bgm.addEventListener('loadedmetadata', function () {
        bgm.volume = soundSettings.musicVol * soundSettings.music;
        const audioDurationMs = (bgm.duration + 1) * 1000;
        maxTime = Math.max(maxTime, audioDurationMs);
        controls.timeline.max = maxTime / 1000;
        bgm.playbackRate = play.playbackSpeed;
        updateTimelineVisual(currentTimelineValue);

        if (!isAudioSourceConnected) {
            try {
                const source = audioCtx.createMediaElementSource(bgm);
                source.connect(analyser);
                analyser.connect(audioCtx.destination);
                isAudioSourceConnected = true;
                console.log("Audio source connected to analyser.");
            } catch (e) {
                console.error("Error connecting media element source:", e);
            }
        }
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
        return result;
    }

    document.querySelector('.sett-menu-button').addEventListener('click', function () {
        allDropdowns.forEach(menu => menu.classList.add('hide'));
        generateSettingsForm();
        document.getElementById('settings-popup').classList.remove("hide");
        document.getElementById('settings-overlay').classList.remove("hide");
        inSettings = true;
    });

    function generateSettingsForm() {
        const form = document.getElementById('settings-form');
        form.innerHTML = '';

        function createField(config, groupKey) {
            const fieldContainer = document.createElement('div');
            fieldContainer.className = 'setting-field';
            const fieldId = `setting-${groupKey}-${config.key}`;
            const label = document.createElement('label');
            label.htmlFor = fieldId;
            label.textContent = config.label + ':';
            let input;
            const currentValue = config.target[config.key];

            if (config.type === 'boolean') {
                input = document.createElement('input');
                input.type = 'checkbox';
                input.checked = currentValue;
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
            }

            if (input) {
                input.id = fieldId;
                input.name = config.key;
                form.appendChild(fieldContainer);
            }
        }
        const h3Game = document.createElement('h3');
        h3Game.textContent = '基本';
        h3Game.style.marginTop = '0';
        form.appendChild(h3Game);
        settingsConfig.game.forEach(config => createField(config, 'game'));
        form.appendChild(document.createElement('hr'));
        const h3Sound = document.createElement('h3');
        h3Sound.textContent = '音效設定';
        form.appendChild(h3Sound);
        settingsConfig.sound.forEach(config => createField(config, 'sound'));
    }

    function handleSettingsClose(save) {
        if (save) {
            try {
                ['game', 'sound'].forEach(groupKey => {
                    settingsConfig[groupKey].forEach(config => {
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
                        } else {
                            newValue = input.value;
                        }
                        config.target[config.key] = newValue;
                    });
                });
            } catch (e) {
                alert("儲存設定時發生錯誤！請檢查輸入。");
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
            } else {
                play.playbackSpeed = 1;
                bgm.playbackRate = 1;
            }
            startTime = Date.now() - (currentTimelineValue * 1000) / play.playbackSpeed;
        }
    }

    document.getElementById('save-settings-btn').addEventListener('click', () => handleSettingsClose(true));
    document.getElementById('cancel-settings-btn').addEventListener('click', () => handleSettingsClose(false));

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
                note.isDoubleSlide = notesAtSameTime.filter((n, indx) => n !== note && n.slide && (n.chainTarget != note.chainTarget && note.chainTarget != indx)).length > 0;
            } else if (note.touch) {
                note.isDoubleTouch = notesAtSameTime.filter(n => n !== note && !n.starTime).length > 0;
            } else {
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
        controls.timeline.style.background = `linear-gradient(to right ,${_sliderColor[0]} 0%,${_sliderColor[0]} ${percentage}%,${_sliderColor[1]} ${percentage}%, ${_sliderColor[1]} 100%)`;
    }

    function onTimelineInteractionStart() {
        play.pause = true;
        if (!play.btnPause) {
            bgm.pause();
        }
    }

    function onTimelineInteractionEnd(e) {
        editor.focus();
        bgm.volume = soundSettings.musicVol * soundSettings.music;
        currentTimelineValue = parseFloat(e.target.value);
        startTime = Date.now() - (currentTimelineValue * 1000) / play.playbackSpeed;
        play.pause = play.btnPause;

        bgm.playbackRate = play.playbackSpeed;
        if (!play.pause) {
            bgm.currentTime = currentTimelineValue;
            bgm.play().catch(e => console.error("BGM play error:", e));
        } else {
            bgm.currentTime = currentTimelineValue;
        }
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
            bgm.play().catch(e => null);
        } else {
            bgm.pause();
        }
    });

    controls.stop.addEventListener('click', function () {
        play.pauseBoth(controls.play);
        currentTimelineValue = 0;
        startTime = Date.now();
        bgm.pause();
        controls.timeline.value = 0;
        updateTimelineVisual(0);
    });

    function seek(seconds) {
        const maxVal = maxTime / 1000;
        currentTimelineValue = Math.max(0, Math.min(currentTimelineValue + seconds, maxVal));
        startTime = Date.now() - (currentTimelineValue * 1000) / play.playbackSpeed;

        bgm.playbackRate = play.playbackSpeed;
        bgm.currentTime = currentTimelineValue;
        if (!play.btnPause) { // Keep playing if it was playing
            bgm.play().catch(e => console.error("BGM play error:", e));
        }

        controls.timeline.value = currentTimelineValue;
        updateTimelineVisual(currentTimelineValue);
    }

    controls.b10.addEventListener('click', () => seek(-10));
    controls.b5.addEventListener('click', () => seek(-5));
    controls.f5.addEventListener('click', () => seek(5));
    controls.f10.addEventListener('click', () => {
        const wasPaused = play.pause;
        play.pause = true; // Temporarily pause for seeking
        seek(10);
        play.pause = play.btnPause; // Restore state
        if (!play.pause && wasPaused) {
            bgm.play().catch(e => console.error("BGM play error:", e));
        }
    });


    if (typeof masterExample !== 'undefined' && masterExample) {
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
        ctx.canvas.width = doc_width * 2 * ((editorLeft == 0 ? bodyWidth : editorLeft) / bodyWidth);

        const controlsEl = document.querySelector('.controls');
        const actionsEl = document.querySelector('.actions');
        // Get heights only if elements are visible
        const controlsHeight = controlsEl ? controlsEl.offsetHeight : 0;
        const actionsHeight = actionsEl ? actionsEl.offsetHeight : 0;
        ctx.canvas.height = Math.max(150, (doc_height - actionsHeight) * 2);

        const audioCanvas = document.getElementById("audioRender");
        if (audioCanvas) {
            audioCanvas.width = ctx.canvas.width;
            audioCanvas.height = 100;
        }
    }

    let filterStrength = 20;
    let frameTime = 0, lastLoop = new Date(), thisLoop;

    function drawAudioWaveform() {
        const zoom = 200;
        const audioCanvas = document.getElementById("audioRender");
        if (!audioCanvas) return;
        const audioCtx2d = audioCanvas.getContext("2d");

        audioCanvas.lineJoin = settings.roundStroke ? 'round' : 'butt';

        audioCtx2d.clearRect(0, 0, audioCanvas.width, audioCanvas.height);
        audioCtx2d.beginPath();
        audioCtx2d.strokeStyle = "#00000060";
        audioCtx2d.lineWidth = 3;
        const a = audioCanvas.width / 2;
        let sampleRate = 44100;

        if (fullAudioBuffer && bgm) {
            const pcmData = fullAudioBuffer.getChannelData(0);
            sampleRate = fullAudioBuffer.sampleRate;

            for (let i = -a; i < a; i++) {
                const data = pcmData[(Math.floor(i + currentTimelineValue * sampleRate / zoom)) * zoom];
                const y = (data + 1) * audioCanvas.height / 2;
                const x = i + a;
                if (i === 0) audioCtx2d.moveTo(x, y);
                else audioCtx2d.lineTo(x, y);
            }
            audioCtx2d.stroke();
        }

        for (let i = 0; i < marks.length; i++) {
            const mark = marks[i];
            const find = marks.find((e) => (e.time > mark.time && e.type != "bpm")) ?? { time: Infinity };
            switch (mark.type) {
                case "bpm": {
                    const x = a + (mark.time / 1000 - currentTimelineValue + settings.musicDelay) * sampleRate / zoom;
                    audioCtx2d.beginPath();
                    audioCtx2d.strokeStyle = "#FFF200";
                    audioCtx2d.lineWidth = 4;
                    audioCtx2d.moveTo(x, 0);
                    audioCtx2d.lineTo(x, audioCanvas.height);
                    audioCtx2d.stroke();
                    break;
                }
                case "slice": {
                    let t = (find.time - mark.time) / (4000 * 60 / (mark.slice * mark.bpm));
                    t = t > 10000 ? 10000 : Math.round(t);
                    for (let j = 0; j < t; j++) {
                        const x = a + (mark.time / 1000 + j * (60 / ((mark.slice / 4) * mark.bpm)) - currentTimelineValue + settings.musicDelay) * sampleRate / zoom;
                        if (x > audioCanvas.width || x < 0) continue;
                        audioCtx2d.beginPath();
                        audioCtx2d.strokeStyle = "white";
                        audioCtx2d.lineWidth = 2;
                        audioCtx2d.moveTo(x, audioCanvas.height / 2);
                        audioCtx2d.lineTo(x, audioCanvas.height);
                        audioCtx2d.stroke();
                    }
                    break;
                }
            }
        }

        notes.forEach(note => {
            const x = a + (note.time / 1000 - currentTimelineValue + settings.musicDelay) * sampleRate / zoom;
            const y = (parseInt(note.pos) % 9 - 0.5) / 8 * audioCanvas.height;
            if (x < audioCanvas.width && x > 0 - ((note.slideTime ?? 0) + (note.holdTime ?? 0) + (note.delay ?? 0) + (note.touchTime ?? 0)) * sampleRate / zoom) {
                audioCtx2d.strokeStyle = note.break ? '#FF6C0C' : (note.isDoubleTapHold || note.isDoubleTouch || note.isDoubleSlide ? "#FFD900" : (note.star || note.touch || note.slide ? '#0089F4' : "#FF569B"));
                audioCtx2d.lineWidth = 3;
                audioCtx2d.beginPath();
                if (note.touch) {
                    audioCtx2d.rect(x - 3, y - 3, 6, 6);
                } else if (note.slide) {
                    audioCtx2d.lineWidth = 6;
                    audioCtx2d.setLineDash([8, 8]);
                    const startY = (parseInt(note.chain ? notes[note.chainTarget].slideHead : note.slideHead) % 9 - 0.5) / 8 * audioCanvas.height;
                    audioCtx2d.moveTo(x + note.delay * sampleRate / zoom, startY);
                    audioCtx2d.lineTo(x + (note.slideTime + note.delay) * sampleRate / zoom, startY);
                } else if (note.star) {
                    const outerRadius = 5, innerRadius = 2, numPoints = 5;
                    for (let i = 0; i < numPoints * 2; i++) {
                        const radius = i % 2 === 0 ? outerRadius : innerRadius;
                        const angle = Math.PI / numPoints * i - Math.PI / 2;
                        const currentX = x + radius * Math.cos(angle);
                        const currentY = y + radius * Math.sin(angle);
                        if (i === 0) audioCtx2d.moveTo(currentX, currentY);
                        else audioCtx2d.lineTo(currentX, currentY);
                    }
                } else {
                    if (note.holdTime != null) {
                        audioCtx2d.lineWidth = 6;
                        audioCtx2d.moveTo(x, y);
                        audioCtx2d.lineTo(x + note.holdTime * sampleRate / zoom, y);
                    } else {
                        audioCtx2d.arc(x, y, 4, 0, 2 * Math.PI);
                    }
                }
                audioCtx2d.closePath();
                audioCtx2d.stroke();
                audioCtx2d.setLineDash([]);
            }
        });

        audioCtx2d.beginPath();
        audioCtx2d.strokeStyle = "red";
        audioCtx2d.lineWidth = 4;
        audioCtx2d.moveTo(a, 0);
        audioCtx2d.lineTo(a, audioCanvas.height);
        audioCtx2d.stroke();
    }

    function getScrollTopToCaret(textarea, position) {
        const text = textarea.value.substring(0, position);
        const div = document.createElement('div');
        const style = window.getComputedStyle(textarea);
        ['fontFamily', 'fontSize', 'lineHeight', 'padding', 'border', 'boxSizing', 'whiteSpace', 'letterSpacing', 'wordWrap', 'overflowWrap', 'width']
            .forEach(prop => div.style[prop] = style[prop]);
        div.style.position = 'absolute';
        div.style.visibility = 'hidden';
        div.style.whiteSpace = 'pre-wrap';
        div.style.wordWrap = 'break-word';
        div.textContent = text;
        document.body.appendChild(div);
        const caretY = div.offsetHeight;
        document.body.removeChild(div);
        return caretY - textarea.clientHeight / 2;
    }

    function update() {
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

        const t = (currentTimelineValue - settings.musicDelay) * 1000;
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



        if (settings.followText && !play.pause && !inSettings) {
            editor.focus();
            const b = editor.value.split(",");
            const a = b.slice(0, play.nowIndex + 1).toString().length;
            editor.setSelectionRange(a, a);
            editor.scrollTop = getScrollTopToCaret(editor, a);
        }

        render.renderGame(ctx, notes, settings, noteImages, t, triggered, play, (1000 / frameTime).toFixed(1));
        drawAudioWaveform();

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
        requestAnimationFrame(update);
    }

    update();
});

function getImgs() {
    const Images = {};
    try {
        Images.outline = document.getElementById("outline");
        Images.sensor = document.getElementById("sensor");
        Images.sensorText = document.getElementById("sensor_text");
        if (!Images.outline || !Images.sensor || !Images.sensorText) {
            console.warn("Outline or Sensor image not found in DOM.");
        }
    } catch (e) {
        console.error("Error getting images:", e);
    }
    return Images;
}
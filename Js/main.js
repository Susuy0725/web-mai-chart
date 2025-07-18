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
    'audioZoom': 200,
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
let audioRenderDragging = false;
let directoryHandle = null;
let maidataFileHandle = null;
let audioFileHandle = null;
let lastDragX;

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

// --- 新增：顯示通知氣泡的函式 ---
let notificationTimeout; // 用於儲存計時器ID，以便取消

function showNotification(message) {
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
    // 1. 序列化文字
    function serializeMaidata(dataObj) {
        const lines = [];
        for (const key in dataObj) {
            // 忽略沒有內容的難度
            if (key.includes("inote_") && !dataObj[key]) continue;
            lines.push(`&${key}=${dataObj[key] ?? ''}`);
        };
        return lines.join('\n');
    }

    const text = serializeMaidata(data);

    console.log(text);

    // 2. 如果已經有 File System Access Handlers
    if (directoryHandle && maidataFileHandle && 'createWritable' in maidataFileHandle) {
        try {
            const writable = await maidataFileHandle.createWritable();
            await writable.write(text);
            await writable.close();
            console.log('已儲存到：', maidataFileHandle.name);
            showNotification(`已儲存到：${maidataFileHandle.name}`); // <-- 在成功儲存後顯示通知
            return;
        } catch (err) {
            console.error("寫回檔案失敗，改下載模式：", err);
            // fall-through to blob-download
            showNotification('儲存失敗，將嘗試下載。'); // <-- 儲存失敗時顯示通知
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
    const audioCanvas = document.getElementById("audioRender");
    const diffDisplay = document.getElementById("nowDiff");
    const diffName = [
        'EASY', 'BASIC', 'ADVANCED', 'EXPERT', 'MASTER', 'RE:MASTER', 'ORIGINAL'
    ];

    audioCanvas.addEventListener("mousedown", (e) => {
        audioRenderDragging = true;
    });

    audioCanvas.addEventListener("mousemove", (e) => {
        if (audioRenderDragging) {
            handleAudioRenderPan(e.movementX);
        }
    });

    audioCanvas.addEventListener("mouseup", () => {
        audioRenderDragging = false;
    });

    audioCanvas.addEventListener("touchstart", (e) => {
        audioRenderDragging = true;
        lastDragX = e.touches[0].clientX;
    });

    // 問題
    audioCanvas.addEventListener("touchmove", (e) => {
        if (audioRenderDragging) {
            e.preventDefault();
            const touchX = e.touches[0].clientX;
            const deltaX = touchX - lastDragX;
            handleAudioRenderPan(deltaX);
            lastDragX = touchX;
        }
    });

    audioCanvas.addEventListener("touchend", () => {
        audioRenderDragging = false;
    });

    function handleAudioRenderPan(deltaX) {
        // 畫面實際顯示的時間長度（秒），受 zoom 影響
        const secondsPerScreen = (0.1 * settings.audioZoom);

        // 每像素對應的時間（秒）
        const secondsPerPixel = secondsPerScreen / audioCanvas.width;

        // 拖曳距離換算成時間偏移
        const timeOffset = -deltaX * secondsPerPixel;

        // 調整 currentTimelineValue
        currentTimelineValue = Math.max(0, Math.min(maxTime / 1000, currentTimelineValue + timeOffset));

        // 同步更新
        bgm.currentTime = currentTimelineValue;
        controls.timeline.value = currentTimelineValue;
        startTime = Date.now() - (currentTimelineValue * 1000) / play.playbackSpeed;

        updateTimelineVisual(currentTimelineValue);
    }

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

    // --- File & Diff Menu Actions (Event Delegation) ---
    dropdownList.addEventListener('click', (event) => {
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

            if ('showDirectoryPicker' in window) {
                (async () => {
                    try {
                        directoryHandle = await window.showDirectoryPicker();
                        maidataFileHandle = null;
                        audioFileHandle = null;

                        // 尋找 maidata 和音訊檔案
                        for await (const [name, handle] of directoryHandle.entries()) {
                            if (handle.kind === 'file' && name.toLowerCase().startsWith('maidata.')) {
                                maidataFileHandle = handle;
                            }
                            if (handle.kind === 'file' && name.toLowerCase().startsWith('track.')) {
                                audioFileHandle = handle;
                            }
                            if (audioFileHandle && maidataFileHandle) break;
                        }

                        // --- START MODIFICATION ---
                        // 不論是否找到新音訊，都先暫停當前播放的音樂
                        play.pauseBoth(controls.play);

                        // 清除舊的音訊來源和緩衝區，為載入新音訊做準備
                        if (bgm.src) { // 如果有舊的音訊來源，先釋放其 URL
                            URL.revokeObjectURL(bgm.src);
                        }
                        bgm.src = ''; // 清空音訊來源
                        fullAudioBuffer = null; // 清空緩衝區
                        isAudioSourceConnected = false; // 重設音訊連接狀態
                        // --- END MODIFICATION ---

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
                            // 如果新資料夾中沒有音訊檔案
                            console.log("新資料夾中未找到音訊檔案。");
                        }

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
                        console.error("開啟資料夾失敗:", err);
                        // 如果選擇資料夾失敗，也要確保音訊停止並清除
                        play.pauseBoth(controls.play);
                        showNotification("開啟資料夾失敗。");
                    }
                })();
            } else {
                showNotification("您的瀏覽器不支援資料夾選擇，可使用一般開檔模式。");
            }
        } else if (target.dataset.action === 'open-audio') {
            handleFileUpload('audio/*', (files) => { // <--- 將參數名稱改為 `files`
                const file = files[0]; // <--- 從 FileList 中取出第一個檔案
                if (!file) { // 檢查是否真的有檔案被選取
                    console.warn("沒有選擇檔案。");
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
        } else if (target.dataset.action === 'save-file') {
            triggerSave(data);
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
        'zoomIn': document.getElementById('zoomIn'),
        'zoomOut': document.getElementById('zoomOut'),
    };

    const noteImages = getImgs();

    function handleFileUpload(accept, callback, isDirectory = false) {
        allDropdowns.forEach(menu => menu.classList.add('hide'));
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.style.display = 'none';

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

    function generateInfoForm() {
        const form = document.getElementById('info-form');
        form.innerHTML = '';

        const fields = [
            { key: 'title', label: '標題' },
            { key: 'artist', label: '作曲' },
            { key: 'des', label: '譜師 (未指定難度)' },
            { key: 'wholebpm', label: '全曲 BPM' },
            { key: 'lv_1', label: 'EASY 難度' },
            { key: 'des_1', label: 'EASY 譜師' },
            { key: 'lv_2', label: 'BASIC 難度' },
            { key: 'des_2', label: 'BASIC 譜師' },
            { key: 'lv_3', label: 'ADVANCED 難度' },
            { key: 'des_3', label: 'ADVANCED 譜師' },
            { key: 'lv_4', label: 'EXPERT 難度' },
            { key: 'des_4', label: 'EXPERT 譜師' },
            { key: 'lv_5', label: 'MASTER 難度' },
            { key: 'des_5', label: 'MASTER 譜師' },
            { key: 'lv_6', label: 'RE:MASTER 難度' },
            { key: 'des_6', label: 'RE:MASTER 譜師' },
            { key: 'lv_7', label: 'ORIGINAL 難度' },
            { key: 'des_7', label: 'ORIGINAL 譜師' },
        ];

        fields.forEach(f => {
            const val = data[f.key] || '';
            const label = document.createElement('label');
            label.textContent = f.label;
            const input = document.createElement('input');
            input.name = f.key;
            input.value = val;
            const a = document.createElement('div');
            a.className = 'info-field';
            a.appendChild(label);
            a.appendChild(input);
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

    controls.zoomIn.addEventListener('click', function (e) {
        settings.audioZoom -= 50;
        settings.audioZoom = Math.max(settings.audioZoom, 50)
    });

    controls.zoomOut.addEventListener('click', function (e) {
        settings.audioZoom += 50;
        settings.audioZoom = Math.min(settings.audioZoom, 750)
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
        const zoom = settings.audioZoom;
        const audioCanvas = document.getElementById("audioRender");
        if (!audioCanvas) return;
        const audioCtx2d = audioCanvas.getContext("2d");

        audioCanvas.lineJoin = settings.roundStroke ? 'round' : 'butt';

        audioCtx2d.clearRect(0, 0, audioCanvas.width, audioCanvas.height);
        audioCtx2d.strokeStyle = "#00000060";
        audioCtx2d.lineWidth = 1;
        const a = audioCanvas.width / 2;
        let sampleRate = 44100;

        if (fullAudioBuffer && bgm) {
            const pcmData = fullAudioBuffer.getChannelData(0);
            sampleRate = fullAudioBuffer.sampleRate;

            for (let i = -a; i < a; i++) {
                const data = pcmData[(Math.floor(i + currentTimelineValue * sampleRate / zoom)) * zoom];
                audioCtx2d.beginPath();
                const y = (data + 1) * audioCanvas.height / 2;
                const x = i + a;
                audioCtx2d.moveTo(x, audioCanvas.height - y);
                audioCtx2d.lineTo(x, y + 1);
                audioCtx2d.stroke();
            }

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
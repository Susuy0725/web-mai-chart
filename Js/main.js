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
    'effectDecayTime': 0.25,
    'noSensor': false,
    'disableSensorWhenPlaying': true,
    'lineWidthFactor': 0.8,
    'noNoteArc': false,
    'middleDisplay': 2,
};
// Make play and soundSettings local if not modified externally
const icons = ['pause', 'play_arrow', 'skip_previous']; // Use const

export let play = {
    'pauseBoth': function (btn) {
        play.btnPause = true;
        play.pause = true;
        $(btn).text(icons[0 + play.btnPause]);
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

let notes = [{}], notesData = {}; // Use `let` as it's reassigned
let triggered = [];
let startTime = 0; // Initialize
let maxTime = 1;
let sfxReady = false, inSettings = false;
let currentTimelineValue = 0; // JS variable to store timeline value

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

const soundFiles = {
    tap: 'judge.wav',
    ex: 'judge_ex.wav',
    break: 'judge_break.wav',
    break_woo: 'break.wav',
    touch: 'touch.wav',
    hanabi: 'hanabi.wav',
    slide: 'slide.wav',
    breakSlide: 'break_slide_start.wav',
    breakSlideEnd: 'break_slide.wav',
    answer: 'answer.wav',
};

let soundBuffers = {}; // Use `let`

async function loadAllSounds(list) {
    const buffers = {};
    // Use Promise.all for concurrent loading
    const loadPromises = Object.entries(list).map(async ([key, url]) => {
        try {
            const resp = await fetch('Sounds/' + url);
            if (!resp.ok) throw new Error(`Failed to fetch ${url}: ${resp.statusText}`);
            const arrayBuffer = await resp.arrayBuffer();
            buffers[key] = await audioCtx.decodeAudioData(arrayBuffer);
        } catch (error) {
            console.error(`Error loading sound ${key} (${url}):`, error);
            buffers[key] = null; // Or handle error appropriately
        }
    });
    await Promise.all(loadPromises);
    return buffers;
}

function playSound(buffers, name, { volume = 0.1 } = {}) {
    if (audioCtx.state === 'suspended') { // Resume AudioContext if suspended by browser policy
        audioCtx.resume();
    }
    const buffer = buffers[name];
    if (!buffer) return;

    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    const gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(volume, audioCtx.currentTime); // Use setValueAtTime
    source.connect(gainNode).connect(audioCtx.destination);
    source.start(0);
}

loadAllSounds(soundFiles).then(buffers => {
    soundBuffers = buffers;
    console.log('All sounds loaded');
    sfxReady = true;
}).catch(error => {
    console.error("Failed to load some sounds:", error);
    sfxReady = true; // Still allow playback, some sounds might be missing
});


function _playEffect(note, hold = false) {
    if (!sfxReady || play.pause) return;
    if (soundSettings.answer && soundBuffers.answer && !note.slide) {
        playSound(soundBuffers, 'answer', { volume: soundSettings.answerVol });
    }
    if (soundSettings.sfxs) {
        if (note.ex && soundBuffers.ex && !hold) { // Ensure it's not touch before playing tap
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
                } else if (soundBuffers.tap) { // Ensure it's not touch before playing tap
                    playSound(soundBuffers, 'tap', { volume: soundSettings.judgeVol });
                }
            }
        }
    }
}

// Debounce utility
function debounce(func, delay) {
    let timeout;
    return function (...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}


$(document).ready(function () {
    $('.file-menu-button').on('click', function () {
        $('.dropdownlist .diff-menu').hide();
        $('.dropdownlist .file-menu').toggle();
    });
    $('.diff-menu-button').on('click', function () {
        $('.dropdownlist .file-menu').hide();
        $('.dropdownlist .diff-menu').toggle();
    });

    $(document).on('click', function (event) {
        if (!$(event.target).closest('.actions').length && !$(event.target).closest('.dropdownlist').length) {
            $('.dropdownlist .file-menu').hide();
            $('.dropdownlist .diff-menu').hide();
        }
    });

    const $c = $("#render")[0]; // Use const
    const ctx = $c.getContext("2d");
    const $menu = $("#customMenu");
    const $editor = $("#editor");
    const textarea = $editor[0];
    let doc_width = $(document).width(); // Keep let as it's updated on resize
    let doc_height = $(document).height();

    $("body").on("contextmenu", function (e) {
        //console.log(e);
        e.preventDefault();
        if (e.target === $("#editor")[0]) {
            $menu.css({
                top: e.pageY + "px",
                left: e.pageX + "px",
                display: "block"
            });
        }
    });

    $menu.on("click", ".menu-item", async function () {
        const action = $(this).data("action");
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selected = textarea.value.substring(start, end);

        switch (action) {
            case "copy":
                await navigator.clipboard.writeText(selected);
                break;
            case "cut":
                await navigator.clipboard.writeText(selected);
                // 刪除被剪下的內容
                textarea.setRangeText("", start, end, "start");
                break;
            case "paste":
                const pasteText = await navigator.clipboard.readText();
                // 在游標處插入文字
                textarea.setRangeText(pasteText, start, end, "end");
                break;
            case "selectAll":
                textarea.select();
                break;
            case "trun-left-right": {
                let result = '';
                let inParen = 0;
                let inBrace = 0;
                let inBrack = 0;

                for (let i = 0; i < selected.length; i++) {
                    const ch = selected[i];

                    if (ch === '(') inParen++;
                    if (ch === ')') inParen--;
                    if (ch === '{') inBrace++;
                    if (ch === '}') inBrace--;
                    if (ch === '[') inBrack++;
                    if (ch === ']') inBrack--;

                    if (inParen == 0 && inBrack == 0 && inBrace == 0 && /\d/.test(ch)) {
                        // 只對不在括號內的數字做 9 - x
                        result += (9 - parseInt(ch)).toString();
                    } else {
                        // 其他原樣輸出
                        result += ch;
                    }
                }
                // 在游標處插入文字
                textarea.setRangeText(result, start, end, "end");
                break;
            }
            default:
                break;
        }

        data["inote_" + settings.nowDiff] = $editor.val();
        processChartData();

        // 更新焦點
        textarea.focus();
        $menu.hide();
    });

    // 點其他地方關閉選單
    $(document).on("click", function () {
        $menu.hide();
    });

    let data = typeof {} !== 'undefined' ? {} : '';
    for (let i = 1; i <= 7; i++) {
        const key = `inote_${i}`;
        if (typeof data[key] === "undefined") {
            data[key] = ""; // 可以換成你想要的預設值，比如 [] 或其他
        }
    }
    data.getNowDiff = function (e) {
        return data['inote_' + e];
    }

    const _sliderColor = ['#ff3232', '#FFFFFF60']; // Use const
    const controls = { // Use const
        'timeline': $("#timeline"),
        'play': $('#playBtn'),
        'stop': $('#stopBtn'),
    };

    const bgm = $("#bgm"); // Use const
    const noteImages = getImgs();

    // --- File Input Logic ---
    function handleFileUpload(accept, callback) {
        $('.dropdownlist .file-menu').hide();
        const fileInput = $('<input type="file" style="display: none;">').attr('accept', accept).removeAttr('capture'); // 防止 iOS 啟用麥克風
        $('body').append(fileInput);
        fileInput.on('change', function (event) {
            const file = event.target.files[0];
            if (file) {
                callback(file);
            }
            fileInput.remove(); // Clean up
        });
        fileInput.click();
    }

    $('.file-menu .a-btn2').on('click', function () { // Load Audio
        handleFileUpload('audio/*', (file) => {
            play.pauseBoth(controls.play);
            if (bgm.attr('src')) URL.revokeObjectURL(bgm.attr('src')); // Revoke old URL
            bgm.attr('src', '');
            const objectURL = URL.createObjectURL(file);
            bgm.attr('src', objectURL);
            bgm[0].load();
            bgm.off('loadedmetadata').on('loadedmetadata', function () { // Use .off to prevent multiple bindings
                bgm[0].volume = soundSettings.musicVol * soundSettings.music;
                const audioDurationMs = (bgm[0].duration + 1) * 1000;
                maxTime = Math.max(maxTime, audioDurationMs);
                controls.timeline.prop("max", maxTime / 1000);
                bgm[0].playbackRate = play.playbackSpeed;
                updateTimelineVisual(currentTimelineValue); // Update visual based on current time
            });
        });
    });

    $('.file-menu .a-btn1').on('click', function () { // Load Chart
        handleFileUpload('text/*', (file) => {
            const reader = new FileReader();
            reader.onload = function (e) {
                maidata = e.target.result;
                data = parseMaidataToJson(maidata);
                console.log("檔案內容：", data);
                data.getNowDiff = function (e) {
                    return data['inote_' + e];
                }
                settings.musicDelay = parseFloat(data.first ?? "0");
                $editor.val(data.getNowDiff(settings.nowDiff)); // Update editor content
                play.pauseBoth(controls.play);
                bgm[0].pause();
                currentTimelineValue = 0;
                controls.timeline.val(0); // Reset slider position
                updateTimelineVisual(0);
                startTime = Date.now(); // Reset start time for paused state
                processChartData();
            };
            reader.readAsText(file);
        });
    });

    function loadDiff(diff, data) {
        $editor.val(data.getNowDiff(diff));
        settings.nowDiff = diff;
        processChartData();
    }

    $('.diff-menu .a-btn0').on('click', function () { // Load EASY
        $('.dropdownlist .diff-menu').hide();
        loadDiff(1, data);
    });

    $('.diff-menu .a-btn1').on('click', function () { // Load BASIC
        $('.dropdownlist .diff-menu').hide();
        loadDiff(2, data);
    });

    $('.diff-menu .a-btn2').on('click', function () { // Load ADVANCED
        $('.dropdownlist .diff-menu').hide();
        loadDiff(3, data);
    });

    $('.diff-menu .a-btn3').on('click', function () { // Load EXPERT
        $('.dropdownlist .diff-menu').hide();
        loadDiff(4, data);
    });

    $('.diff-menu .a-btn4').on('click', function () { // Load MASTER
        $('.dropdownlist .diff-menu').hide();
        loadDiff(5, data);
    });

    $('.diff-menu .a-btn5').on('click', function () { // Load RE:MASTER
        $('.dropdownlist .diff-menu').hide();
        loadDiff(6, data);
    });

    $('.diff-menu .a-btn6').on('click', function () { // Load ORIGINAL
        $('.dropdownlist .diff-menu').hide();
        loadDiff(7, data);
    });

    function parseMaidataToJson(text) {
        // 1. 先把所有換行統一成 "\n"
        const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
        // 2. 以 "\n" 分行
        const lines = normalized.split("\n");

        const result = {};
        let currentKey = null;
        let buffer = ""; // 用來累積當前 key 的 value

        for (let rawLine of lines) {
            // 保留原始換行位置：
            const line = rawLine.trimEnd(); // 去除行尾可能多餘的空格或換行符

            if (line.startsWith("&")) {
                // （A）先把上一個 key + buffer 存到 result
                if (currentKey !== null) {
                    // 去除開頭可能的 '\n'
                    result[currentKey] = buffer.replace(/^\n/, "");
                }
                // （B）解析新的一行：&key=value
                //     比如 "&title=请设置标题" → key="title", value="请设置标题"
                const eqIndex = line.indexOf("=");
                if (eqIndex > 0) {
                    currentKey = line.substring(1, eqIndex);       // 看 "&" 與 "=" 之間當作 key
                    const rest = line.substring(eqIndex + 1);      // "=" 後面到行尾當作初始 value
                    buffer = rest.length > 0 ? rest : "";          // 如果有文字就放到 buffer，不然就空字串
                } else {
                    // 如果沒有 "="（極少見），就把整行（去掉 &）當 key，value 先留空
                    currentKey = line.substring(1);
                    buffer = "";
                }
            } else {
                // 這一行不是以 "&" 開頭，代表是「繼續累積到目前 currentKey 的 buffer」。
                // 我們要忠於原始文字，保留換行，所以先把 "\n" 加回去，再放本行內容：
                if (line.length > 0) {
                    buffer += "\n" + line;
                } else {
                    // 如果本行是空白行，也保留一個換行符
                    buffer += "\n";
                }
            }
        }

        // 最後一個 key 也要收尾
        if (currentKey !== null) {
            result[currentKey] = buffer.replace(/^\n/, "");
        }

        for (let i = 1; i <= 7; i++) {
            const key = `inote_${i}`;
            if (typeof result[key] === "undefined") {
                result[key] = ""; // 可以換成你想要的預設值，比如 [] 或其他
            }
        }

        return result;
    }

    $('.sett-menu-button').on('click', function () {
        $('.dropdownlist .file-menu').hide();
        generateSettingsForm();
        $('#settings-popup').show();
        $('#settings-overlay').show();
        inSettings = true;
    });

    function generateSettingsForm() {
        const $form = $('#settings-form');
        $form.empty();

        function createField(config, groupKey) {
            const $fieldContainer = $('<div>').addClass('setting-field');
            const fieldId = `setting-${groupKey}-${config.key}`;
            const $label = $('<label>').attr('for', fieldId).text(config.label + ':');
            let $input;
            const currentValue = config.target[config.key];

            if (config.type === 'boolean') {
                $input = $('<input type="checkbox">').prop('checked', currentValue);
                $label.css('margin-right', '5px'); // Keep for style
                $fieldContainer.append($input).prepend($label); // Checkbox first for alignment
            } else if (config.type === 'number') {
                $input = $('<input type="number">').val(currentValue);
                if (config.step !== undefined) $input.attr('step', config.step);
                if (config.min !== undefined) $input.attr('min', config.min);
                if (config.max !== undefined) $input.attr('max', config.max);
                $fieldContainer.append($label).append($input);
            }
            // Add other types if needed

            if ($input) {
                $input.attr('id', fieldId).attr('name', config.key);
                $form.append($fieldContainer);
            }
        }
        $form.append($('<h3>').text('基本').css('margin-top', 0));
        settingsConfig.game.forEach(config => createField(config, 'game'));
        $form.append($('<hr>'));
        $form.append($('<h3>').text('音效設定'));
        settingsConfig.sound.forEach(config => createField(config, 'sound'));
    }

    $('#save-settings-btn, #cancel-settings-btn').on('click', function () {
        if (this.id === "save-settings-btn") {
            try {
                ['game', 'sound'].forEach(groupKey => {
                    settingsConfig[groupKey].forEach(config => {
                        const fieldId = `setting-${groupKey}-${config.key}`;
                        const $input = $(`#${fieldId}`);
                        if (!$input.length) return;

                        let newValue;
                        if (config.type === 'boolean') {
                            newValue = $input.is(':checked');
                        } else if (config.type === 'number') {
                            newValue = parseFloat($input.val());
                            if (isNaN(newValue)) {
                                console.warn(`Invalid number for ${config.label}: ${$input.val()}. Using original value.`);
                                newValue = config.target[config.key];
                            }
                        } else {
                            newValue = $input.val();
                        }
                        config.target[config.key] = newValue;
                    });
                });
                // console.log("遊戲設定已儲存：", settings);
                // console.log("音效設定已儲存：", soundSettings);
            } catch (e) {
                alert("儲存設定時發生錯誤！請檢查輸入。");
                console.error("儲存設定錯誤:", e);
                return;
            }
        }
        $('#settings-popup').hide();
        $('#settings-overlay').hide();
        inSettings = false;
        if (bgm[0]) {
            bgm[0].volume = soundSettings.musicVol * soundSettings.music;
            if (isFinite(play.playbackSpeed) && play.playbackSpeed > 0) {
                bgm[0].playbackRate = play.playbackSpeed;
            } else {
                play.playbackSpeed = 1;
                bgm[0].playbackRate = 1;
            }
            startTime = Date.now() - (currentTimelineValue * 1000) / play.playbackSpeed;
        }
    });

    _updCanvasRes();
    controls.play.text(icons[0 + play.btnPause]);
    controls.stop.text(icons[2]);

    function processChartData() { // Renamed from doSomethingToDataIThink
        const temp = simai_decode(data.getNowDiff(settings.nowDiff));
        play.combo = 0;
        play.score = 0;
        notes = temp.notes, notesData = temp.data; // This now returns notes with pre-calculated path objects if possible
        triggered = [];
        let newMaxTime = 1; // Local variable for calculation

        // Pre-process notes for "double" checks and other render-time optimizations
        // This is a placeholder. Actual logic depends on how "double" is defined.
        // Example: Mark notes that occur at the exact same time for different rendering.
        const timeMap = new Map();
        notes.forEach(note => {
            if (!note) return;
            if (!timeMap.has(note.time)) timeMap.set(note.time, []);
            timeMap.get(note.time).push(note);
        });

        notes.forEach(note => {
            if (!note || note.invalid) return;
            const notesAtSameTime = timeMap.get(note.time) || [];
            if (note.slide) {
                note.isDoubleSlide = notesAtSameTime.filter((n, indx) => n !== note && n.slide && (n.chainTarget != note.chainTarget && note.chainTarget != indx)).length > 0;
            } else if (note.touch) {
                note.isDoubleTouch = notesAtSameTime.filter(n => n !== note && n.touch && !n.starTime).length > 0;
            } else { // Tap or Hold
                note.isDoubleTapHold = notesAtSameTime.filter(n => n !== note && !n.slide && !n.touch).length > 0;
            }

            let noteEndTime = note.time;
            if (note.holdTime) noteEndTime = Math.max(noteEndTime, note.time + note.holdTime * 1000);
            if (note.slideTime && note.delay) noteEndTime = Math.max(noteEndTime, note.time + (note.slideTime + note.delay) * 1000);
            if (note.touchTime) noteEndTime = Math.max(noteEndTime, note.time + note.touchTime * 1000);
            newMaxTime = Math.max(newMaxTime, noteEndTime);

            if (note.holdTime || note.touchTime || note.slide) { // Simplified condition
                triggered.push([false, false]); // For notes with duration
            } else {
                triggered.push(false); // For tap/star notes
            }
        });

        maxTime = newMaxTime + 1000; // Add 1s buffer
        if (bgm[0].duration) {
            maxTime = Math.max(maxTime, (bgm[0].duration + 1) * 1000);
        }
        maxTime = isNaN(maxTime) ? 1000 : maxTime;
        controls.timeline.prop("max", maxTime / 1000);
        if (currentTimelineValue > maxTime) {
            currentTimelineValue = maxTime;
        }
        play.pauseBoth(controls.play);
        bgm[0].pause();
        //currentTimelineValue = 0; // Reset timeline value
        controls.timeline.val(currentTimelineValue); // Reset slider position
        updateTimelineVisual(currentTimelineValue);
        startTime = Date.now(); // Reset start time for paused state
    }

    $editor.on("input", debounce(function () { // Debounced input
        data["inote_" + settings.nowDiff] = $editor.val();
        processChartData();
    }, 500)); // 500ms debounce delay

    function updateTimelineVisual(value) {
        const min = parseFloat(controls.timeline.prop('min')) || 0;
        const max = parseFloat(controls.timeline.prop('max')) || 1;
        const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
        controls.timeline.css('background', `linear-gradient(to right ,${_sliderColor[0]} 0%,${_sliderColor[0]} ${percentage}%,${_sliderColor[1]} ${percentage}%, ${_sliderColor[1]} 100%)`);
    }

    controls.timeline[0].addEventListener("touchstart", function () {
        play.pause = true;
        if (!play.btnPause) {
            bgm[0].pause();
        }
    }, { passive: true }); // 明確標示 passive

    controls.timeline
        .on("mousedown", function (e) {
            play.pause = true;
            if (!play.btnPause) {
                bgm[0].pause();
            }
        })
        .on("mouseup touchend", function (e) {
            $editor.trigger('focus');
            bgm[0].volume = soundSettings.musicVol * soundSettings.music;
            currentTimelineValue = parseFloat($(this).val());
            startTime = Date.now() - (currentTimelineValue * 1000) / play.playbackSpeed;
            play.pause = play.btnPause;

            bgm[0].playbackRate = play.playbackSpeed;
            if (!play.pause) {
                bgm[0].currentTime = currentTimelineValue;
                bgm[0].play().catch(e => console.error("BGM play error:", e));
            } else {
                bgm[0].currentTime = currentTimelineValue;
                // bgm[0].pause(); // Already paused or will be by master pause
            }
        })
        .on("input", function (e) {
            currentTimelineValue = parseFloat($(this).val());
            if (play.pause) { // Update startTime if paused to reflect drag
                startTime = Date.now() - (currentTimelineValue * 1000) / play.playbackSpeed;
            }

            if (settings.followText) {
                //$editor.trigger('focus');
                const b = textarea.value.split(",");
                const a = b.slice(0, play.nowIndex + 1);
                textarea.selectionStart = a.toString().length;
                textarea.selectionEnd = a.toString().length;
            }
            updateTimelineVisual(currentTimelineValue);
        });

    controls.play.click(function (e) {
        bgm[0].volume = soundSettings.musicVol * soundSettings.music;
        play.btnPause = !play.btnPause;
        play.pause = play.btnPause;
        $(this).text(icons[0 + play.btnPause]);
        currentTimelineValue = parseFloat(controls.timeline.val()); // Get current value from slider
        bgm[0].playbackRate = play.playbackSpeed;
        startTime = Date.now() - (currentTimelineValue * 1000) / play.playbackSpeed;

        if (!play.pause) {
            bgm[0].currentTime = currentTimelineValue;
            bgm[0].play().catch(e => null/*console.error("BGM play error:", e)*/);
        } else {
            bgm[0].pause();
        }
    });

    controls.stop.click(function (e) {
        play.pauseBoth(controls.play);
        currentTimelineValue = 0; // Get current value from slider
        startTime = Date.now();

        bgm[0].pause();
        controls.timeline.val(0);
        updateTimelineVisual(0);
    });

    if (masterExample) {
        $editor.val(masterExample);
        data["inote_" + settings.nowDiff] = masterExample;
        processChartData();
    }

    startTime = Date.now();
    updateTimelineVisual(0); // Initial timeline visual

    $(window).on("resize", debounce(function () { // Debounce resize
        doc_width = $(document).width();
        doc_height = $(document).height();
        _updCanvasRes();
    }, 30));

    function _updCanvasRes() {
        ctx.canvas.width = doc_width * 2 * ($editor.position().left / $("body").width());
        const controlsHeight = $('.controls').outerHeight(true) || 0; // Use outerHeight(true) for margins
        const actionsHeight = $('.actions').outerHeight(true) || 0;
        ctx.canvas.height = Math.max(150, (doc_height - (actionsHeight)) * 2); // Ensure min height, adjust multiplier if needed
    }

    // count method
    // https://stackoverflow.com/questions/4787431/how-do-i-check-framerate-in-javascript
    var filterStrength = 20;
    var frameTime = 0, lastLoop = new Date, thisLoop;

    function update() {
        if (!play.pause) {
            const newTimelineVal = ((Date.now() - startTime) / 1000) * play.playbackSpeed;
            // Only update if the value has changed significantly
            if (Math.abs(currentTimelineValue - newTimelineVal) > 0.01) {
                currentTimelineValue = newTimelineVal;
                controls.timeline.val(currentTimelineValue); // Update slider position
                updateTimelineVisual(currentTimelineValue); // Update visual
            }
        }

        const t = (currentTimelineValue - settings.musicDelay) * 1000; // Use JS variable
        const sVal = 1000000 / notesData.val;
        const bVal = (notesData.breakCounts == 0 ? 0 : 10000) / notesData.breakCounts;

        if (notes && notes.length > 0 && sfxReady) {
            for (let i = notes.length - 1; i >= 0; i--) {
                const note = notes[i];
                if (!note || note.invalid) continue;

                const _t_note_relative = (t - note.time) / 1000;

                if (triggered[i] === undefined) continue; // Skip if no trigger state for this note

                // Tap, Star, Hold (start) logic
                if (!note.starTime && !note.touch && !note.slide) {
                    if (_t_note_relative >= 0) {
                        if (Array.isArray(triggered[i])) { // Hold note
                            if (!triggered[i][0]) {
                                _playEffect(note);
                                triggered[i][0] = true;
                                play.nowIndex = note.index ?? play.nowIndex;
                            }
                        } else { // Tap/Star note
                            if (!triggered[i]) {
                                _playEffect(note);
                                triggered[i] = true;
                                play.nowIndex = note.index ?? play.nowIndex;
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
                        //play.nowIndex = note.index ?? play.nowIndex;
                        //console.log(note, play.nowIndex);
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
                // Slide logic (sound typically at start, if any)
                else if (note.slide) {
                    // Slides might not have a specific sound here, but visual trigger
                    if (_t_note_relative >= note.delay) {
                        if (Array.isArray(triggered[i])) { // Touch Hold note
                            if (!triggered[i][0]) {
                                if (!note.chain || note.firstOne) _playEffect(note);
                                triggered[i][0] = true;
                                play.nowIndex = note.index ?? play.nowIndex;
                            }
                        }
                    } else {
                        if (Array.isArray(triggered[i])) {
                            triggered[i][0] = false;
                        }
                    }
                    // Slide (end) logic
                    if (note.slideTime && _t_note_relative >= note.slideTime + note.delay) {
                        if (Array.isArray(triggered[i]) && triggered[i][0] && !triggered[i][1] && !settings.holdEndNoSound) {
                            if (!note.chain || note.lastOne) {
                                _playEffect(note, true);
                                play.combo++;
                                if (note.break) { play.score += sVal * 5 + bVal; }
                                else { play.score += sVal * 3; }
                            }
                            triggered[i][1] = true;
                        }
                    } else if (note.slideTime && Array.isArray(triggered[i])) {
                        if (triggered[i][1]) {
                            if (!note.chain || note.lastOne) {
                                play.combo--;
                                if (note.break) { play.score -= sVal * 5 + bVal; }
                                else { play.score -= sVal * 3; }
                            }
                        }
                        triggered[i][1] = false;
                    }
                }
                // Touch logic
                else if (note.touch) {
                    if (_t_note_relative >= 0) {
                        if (Array.isArray(triggered[i])) { // Touch Hold note
                            if (!triggered[i][0]) {
                                _playEffect(note);
                                triggered[i][0] = true;
                                play.nowIndex = note.index ?? play.nowIndex;
                            }
                        } else { // Touch Tap note
                            if (!triggered[i]) {
                                _playEffect(note);
                                play.combo++;
                                play.score += sVal;
                                triggered[i] = true;
                                play.nowIndex = note.index ?? play.nowIndex;
                            }
                        }
                    } else {
                        if (Array.isArray(triggered[i])) {
                            triggered[i][0] = false;
                        }
                        else {
                            if (triggered[i]) {
                                play.combo--;
                                play.score -= sVal;
                            }
                            triggered[i] = false;
                        }
                    }
                    // Touch Hold (end) logic
                    if (note.touchTime && _t_note_relative >= note.touchTime) {
                        if (Array.isArray(triggered[i]) && triggered[i][0] && !triggered[i][1] && !settings.holdEndNoSound) {
                            _playEffect(note, true);
                            play.combo++;
                            play.score += sVal * 2;
                            triggered[i][1] = true;
                        }
                    } else if (note.touchTime && Array.isArray(triggered[i])) {
                        if (triggered[i][1]) {
                            play.combo--;
                            play.score -= sVal * 2;
                        }
                        triggered[i][1] = false;
                    }
                } else {
                    console.log("what", note)
                }
            }
        }

        if (settings.followText && !play.pause && !inSettings) {
            $editor.trigger('focus');
            const b = textarea.value.split(",");
            const a = b.slice(0, play.nowIndex + 1);
            textarea.selectionStart = a.toString().length;
            textarea.selectionEnd = a.toString().length;
        }

        render.renderGame(ctx, notes, settings, noteImages, t, triggered, play, (1000 / frameTime).toFixed(1));

        var thisFrameTime = (thisLoop = new Date) - lastLoop;
        frameTime += (thisFrameTime - frameTime) / filterStrength;
        lastLoop = thisLoop;
        requestAnimationFrame(update);
    }

    update();
});

function getImgs() {
    // Ensure these elements exist in your HTML
    const Images = {};
    try {
        Images.outline = $("#outline")[0];
        Images.sensor = $("#sensor")[0];
        Images.sensorText = $("#sensor_text")[0];
        if (!Images.outline || !Images.sensor || !Images.sensorText) {
            console.warn("Outline or Sensor image not found in DOM. Rendering might be affected.");
        }
    } catch (e) {
        console.error("Error getting images:", e);
    }
    return Images;
}
import { simai_decode } from "../Js/decode.js";
import * as render from "../Js/render.js";

export let settings = {
    'musicDelay': 0,
    'distanceToMid': 0.28,
    'roundStroke': true,
    'noteSize': 0.09,
    'speed': 2,
    'pinkStar': false,
    'touchSpeed': 3,
    'slideSpeed': 2,
    'holdEndNoSound': false,
    //'useStroke': true,
    'showSlide': true,
    //'noEffects': true,
},
    play = {
        'pauseBoth': function (btn, icons) {
            play.btnPause = true;
            play.pause = true;
            $(btn).text(icons[0 + play.btnPause]);
        },
        'lastPauseTime': 0,
        'pause': true,
        'btnPause': true,
    },
    soundSettings = {
        'answer': true,
        'answerVol': 0.8,
        'judgeVol': 0.1,
        'breakJudgeVol': 0.1,
        'touchVol': 0.2,
        'breakVol': 0.3,
        'sfxs': true,
    },
    maidata;

// 在您的 main.js 檔案中，可以放在 settings 和 soundSettings 物件定義之後

const settingsConfig = {
    // 'target' 指向實際儲存設定值的物件 (settings 或 soundSettings)
    // 'key' 是在 target 物件中的屬性名稱
    // 'label' 是顯示在介面上的名稱
    // 'type' 是表單元素的類型
    // 其他屬性如 'step', 'min', 'max' 針對數字類型
    game: [
        { target: settings, key: 'distanceToMid', label: 'Note 出現位置 (0-1)', type: 'number', step: 0.01, min: 0, max: 1 },
        { target: settings, key: 'roundStroke', label: '圓滑邊緣 (Round Stroke)', type: 'boolean' },
        { target: settings, key: 'noteSize', label: 'Note 大小 (0-1)', type: 'number', step: 0.01, min: 0, max: 1 },
        { target: settings, key: 'speed', label: 'Tap/Hold 速度倍率', type: 'number', step: 0.1 },
        { target: settings, key: 'pinkStar', label: '粉紅色星星 (Pink Star)', type: 'boolean' },
        { target: settings, key: 'touchSpeed', label: 'Touch 速度倍率', type: 'number', step: 0.1 },
        { target: settings, key: 'slideSpeed', label: 'Slide 速度倍率', type: 'number', step: 0.1 },
        { target: settings, key: 'holdEndNoSound', label: 'Hold 結尾無音效', type: 'boolean' },
        { target: settings, key: 'showSlide', label: '顯示 Slide 軌跡', type: 'boolean' }
    ],
    sound: [
        { target: soundSettings, key: 'sfxs', label: '啟用打擊音效', type: 'boolean' },
        { target: soundSettings, key: 'answer', label: '啟用 Answer 音效', type: 'boolean' },
        { target: soundSettings, key: 'answerVol', label: 'Answer 音量 (0-1)', type: 'number', step: 0.01, min: 0, max: 1 }, // step 0.01 for finer control
        { target: soundSettings, key: 'judgeVol', label: '打擊音量 (Tap/Star/Hold) (0-1)', type: 'number', step: 0.01, min: 0, max: 1 },
        { target: soundSettings, key: 'breakJudgeVol', label: 'Break 打擊音量 (0-1)', type: 'number', step: 0.01, min: 0, max: 1 },
        { target: soundSettings, key: 'touchVol', label: 'Touch 音量 (0-1)', type: 'number', step: 0.01, min: 0, max: 1 },
        { target: soundSettings, key: 'breakVol', label: 'Break 特殊音效音量 (0-1)', type: 'number', step: 0.01, min: 0, max: 1 }
    ]
};

let notes = [{}],
    triggered = [],
    startTime,
    maxTime = 1,
    sfxReady = false;

// 1. 全域建立 AudioContext
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// 2. 定義要載入的音效列表
const soundFiles = {
    tap: 'judge.wav',
    break: 'judge_break.wav',
    break_woo: 'break.wav',
    touch: 'touch.wav',
    answer: 'answer.wav'
};

// 3. 載入並解碼所有音效，回傳一個 Promise
async function loadAllSounds(list) {
    const buffers = {};
    const entries = Object.entries(list);
    for (let [key, url] of entries) {
        const resp = await fetch('Sounds/' + url);
        const arrayBuffer = await resp.arrayBuffer();
        buffers[key] = await audioCtx.decodeAudioData(arrayBuffer);
    }
    return buffers;
}

// 4. 播放音效的函式
function playSound(buffers, name, { volume = 0.1 } = {}) {
    const buffer = buffers[name];
    if (!buffer) return;
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    // 可選：加 GainNode 控制音量
    const gainNode = audioCtx.createGain();
    gainNode.gain.value = volume;
    source.connect(gainNode).connect(audioCtx.destination);
    source.start(0);
}

// 5. 在你的程式初始化階段呼叫並存下 buffers
let soundBuffers = {};
loadAllSounds(soundFiles).then(buffers => {
    soundBuffers = buffers;
    console.log('All sounds loaded');
    sfxReady = true;
});

// 6. 把原本的 sounds.tap.play() 等，改成 playSound(soundBuffers, 'tap')
function _playEffect(note, hold = false) {
    if (soundSettings.answer) {
        playSound(soundBuffers, 'answer', { volume: soundSettings.answerVol });
    }
    if (soundSettings.sfxs) {
        if (note.break && !hold) {
            playSound(soundBuffers, 'break_woo', { volume: soundSettings.breakVol });
            playSound(soundBuffers, 'break', { volume: soundSettings.breakJudgeVol });
        } else {
            if (note.touch) {
                playSound(soundBuffers, 'touch', { volume: soundSettings.touchVol });
            } else {
                playSound(soundBuffers, 'tap', { volume: soundSettings.judgeVol });
            }
        }
    }
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

    let $c = $("#render")[0],
        ctx = $c.getContext("2d"),
        doc_width = $(document).width(),
        doc_height = $(document).height();

    let $editor = $("#editor"),
        data = typeof example !== 'undefined' ? example : ''; // Ensure example is defined or provide a default

    let _sliderColor = ['#ff3232', '#FFE9E9'],
        icons = ['\uE103', '\uE102'],
        controls = {
            'timeline': $("#timeline"),
            'play': $('#playBtn'),
        };

    let bgm = $("#bgm");
    let noteImages = getImgs(); // Moved here to be available for renderGame

    $('.file-menu .a-btn2').on('click', function () {
        $('.dropdownlist .file-menu').hide();
        let fileInput = $('<input type="file" accept="audio/*" style="display: none;">');
        $('body').append(fileInput);
        fileInput.on('change', function (event) {
            const file = event.target.files[0];
            if (file) {
                play.pauseBoth(controls.play, icons);
                bgm.attr('src', '');
                const objectURL = URL.createObjectURL(file);
                bgm.attr('src', objectURL);
                bgm[0].load();
                bgm.on('loadedmetadata', function () {
                    maxTime = maxTime >= (bgm[0].duration + 1) * 1000 ? maxTime : (bgm[0].duration + 1) * 1000;
                    controls.timeline.prop("max", maxTime / 1000 + 1);
                    controls.timeline.trigger('input');
                });
            }
            fileInput.remove();
        });
        fileInput.click();
    });

    $('.file-menu .a-btn1').on('click', function () {
        $('.dropdownlist .file-menu').hide();
        let fileInput = $('<input type="file" accept="text/*" style="display: none;">');
        $('body').append(fileInput);
        fileInput.on('change', function (event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    maidata = e.target.result;
                    console.log("檔案內容：", maidata);
                    data = maidata; // Update data with file content
                    doSomethingToDataIThink(); // Reparse the new maidata
                };
                reader.readAsText(file);
            }
            fileInput.remove();
        });
        fileInput.click();
    });

    // 處理設定按鈕點擊
    $('.sett-menu-button').on('click', function () {
        $('.dropdownlist .file-menu').hide();
        generateSettingsForm(); // 產生並填充表單
        $('#settings-popup').show();
        $('#settings-overlay').show();
    });

    // 新增函式：動態產生並填充設定表單
    function generateSettingsForm() {
        const $form = $('#settings-form');
        console.log($form);
        $form.empty(); // 清空之前的表單內容

        // 處理遊戲設定
        const $gameSettingsHeader = $('<h3>').text('基本').css('margin-top', 0);
        $form.append($gameSettingsHeader);
        settingsConfig.game.forEach(config => {
            const $fieldContainer = $('<div>').addClass('setting-field'); // 給每個設定項一個容器，方便CSS控制
            const fieldId = `setting-game-${config.key}`; // 產生唯一的 ID

            const $label = $('<label>').attr('for', fieldId).text(config.label + ':');
            $fieldContainer.append($label);

            let $input;
            const currentValue = config.target[config.key];

            if (config.type === 'boolean') {
                $input = $('<input type="checkbox">')
                    .attr('id', fieldId)
                    .attr('name', config.key) // name 可以用於表單提交，但這裡主要用 id
                    .prop('checked', currentValue);
                // 為了讓 checkbox 和 label 在同一行且有間隔
                $label.css('margin-right', '5px');
                $fieldContainer.empty().append($label).append($input); // 調整順序，checkbox 在前
            } else if (config.type === 'number') {
                $input = $('<input type="number">')
                    .attr('id', fieldId)
                    .attr('name', config.key)
                    .val(currentValue);
                if (config.step !== undefined) $input.attr('step', config.step);
                if (config.min !== undefined) $input.attr('min', config.min);
                if (config.max !== undefined) $input.attr('max', config.max);
                $fieldContainer.append($input);
            }
            // 您可以根據需要擴展其他類型，例如 'text', 'select'
            // else if (config.type === 'select') {
            //     $input = $('<select>').attr('id', fieldId).attr('name', config.key);
            //     config.options.forEach(opt => {
            //         $('<option>').val(opt.value).text(opt.label).appendTo($input);
            //     });
            //     $input.val(currentValue);
            //     $fieldContainer.append($input);
            // }

            if ($input) {
                $form.append($fieldContainer);
            }
        });

        $form.append($('<hr>'));

        // 處理音效設定
        const $soundSettingsHeader = $('<h3>').text('音效設定');
        $form.append($soundSettingsHeader);
        settingsConfig.sound.forEach(config => {
            const $fieldContainer = $('<div>').addClass('setting-field');
            const fieldId = `setting-sound-${config.key}`; // 產生唯一的 ID

            const $label = $('<label>').attr('for', fieldId).text(config.label + ':');
            $fieldContainer.append($label);

            let $input;
            const currentValue = config.target[config.key];

            if (config.type === 'boolean') {
                $input = $('<input type="checkbox">')
                    .attr('id', fieldId)
                    .attr('name', config.key)
                    .prop('checked', currentValue);
                $label.css('margin-right', '5px');
                $fieldContainer.empty().append($label).append($input);
            } else if (config.type === 'number') {
                $input = $('<input type="number">')
                    .attr('id', fieldId)
                    .attr('name', config.key)
                    .val(currentValue);
                if (config.step !== undefined) $input.attr('step', config.step);
                if (config.min !== undefined) $input.attr('min', config.min);
                if (config.max !== undefined) $input.attr('max', config.max);
                $fieldContainer.append($input);
            }
            // ... (可以擴展其他類型)

            if ($input) {
                $form.append($fieldContainer);
            }
        });
    }

    // 處理儲存和取消按鈕
    $('#save-settings-btn, #cancel-settings-btn').on('click', function () {
        if (this.id === "save-settings-btn") {
            try {
                // 遍歷 settingsConfig 來讀取表單值並更新設定物件
                ['game', 'sound'].forEach(groupKey => {
                    settingsConfig[groupKey].forEach(config => {
                        const fieldId = `setting-${groupKey}-${config.key}`;
                        const $input = $(`#${fieldId}`);

                        if ($input.length) { // 確保元素存在
                            let newValue;
                            if (config.type === 'boolean') {
                                newValue = $input.is(':checked');
                            } else if (config.type === 'number') {
                                newValue = parseFloat($input.val());
                                if (isNaN(newValue)) { // 簡單的驗證
                                    console.warn(`設定 "${config.label}" 的值不是一個有效的數字: ${$input.val()}`);
                                    // 可以選擇拋出錯誤或使用預設值
                                    // throw new Error(`設定 "${config.label}" 的值無效`);
                                    newValue = config.target[config.key]; // 保留原值或設為預設
                                }
                            }
                            // else if (config.type === 'select' || config.type === 'text') {
                            //     newValue = $input.val();
                            // }
                            else {
                                newValue = $input.val(); // 預設處理方式
                            }
                            config.target[config.key] = newValue;
                        }
                    });
                });

                console.log("新的遊戲設定：", settings);
                console.log("新的音效設定：", soundSettings);
                // (可選) localStorage.setItem('gameSettings', JSON.stringify(settings));
                // (可選) localStorage.setItem('soundSettings', JSON.stringify(soundSettings));

            } catch (e) {
                alert("儲存設定時發生錯誤！請檢查輸入。");
                console.error("儲存設定時發生錯誤:", e);
                return;
            }
        }
        $('#settings-popup').hide();
        $('#settings-overlay').hide();
    });

    // (可選) 頁面載入時從 localStorage 讀取設定
    // $(document).ready(function() {
    //     const savedGameSettings = localStorage.getItem('gameSettings');
    //     if (savedGameSettings) {
    //         Object.assign(settings, JSON.parse(savedGameSettings)); // 使用 Object.assign 更新
    //     }
    //     const savedSoundSettings = localStorage.getItem('soundSettings');
    //     if (savedSoundSettings) {
    //         Object.assign(soundSettings, JSON.parse(savedSoundSettings));
    //     }
    //     // ...
    // });

    _updCanvasRes();
    controls.play.text(icons[0 + play.btnPause]);

    function doSomethingToDataIThink() {
        try {
            maxTime = 1;
            notes = simai_decode(data);
            triggered = [];
            for (let index = 0; index < notes.length; index++) {
                if ((notes[index].holdTime ?? false) || (notes[index].touchTime ?? false) || (notes[index].slideTime ?? false)) {
                    if (maxTime < notes[index].time) maxTime = (notes[index].holdTime ?? 0) || (notes[index].touchTime ?? 0);
                    if (maxTime < notes[index].holdTime * 1000 + notes[index].time) maxTime = notes[index].holdTime * 1000 + notes[index].time;
                    if (maxTime < notes[index].slideTime * 1000 + notes[index].delay * 1000 + notes[index].time) maxTime = notes[index].slideTime * 1000 + notes[index].delay * 1000 + notes[index].time;
                    if (maxTime < notes[index].touchTime * 1000 + notes[index].time) maxTime = notes[index].touchTime * 1000 + notes[index].time;
                    triggered.push([false, false]);
                } else {
                    if (maxTime < notes[index].time) maxTime = notes[index].time;
                    triggered.push(false);
                }
            }
            maxTime += 1;
            if (bgm[0].duration) {
                maxTime = maxTime >= (bgm[0].duration + 1) * 1000 ? maxTime : (bgm[0].duration + 1) * 1000;
            }
            maxTime = isNaN(maxTime) ? 1 : maxTime;
            controls.timeline.prop("max", maxTime / 1000);
            play.pauseBoth(controls.play, icons);
            bgm[0].pause();
            controls.timeline.trigger('input'); // Reset timeline
            //startTime = Date.now(); // Reset start time
        } catch (error) {
            console.error("Error in ababab:", error);
            notes = []; // Prevent further errors if parsing fails
            triggered = [];
        }
    }

    $editor.on("input", function (e) {
        data = $editor.val();
        doSomethingToDataIThink();
    });

    controls.timeline
        .on("mousedown touchstart", function () {
            play.pause = true; // Keep game logic pause separate from button state
            if (!play.btnPause) { // Only pause BGM if it was playing
                bgm[0].pause();
            }
        })
        .on("mouseup touchend", function () {
            startTime = Date.now() - $(this).val() * 1000;
            play.pause = play.btnPause; // Sync game logic pause with button state
            if (!play.pause) {
                bgm[0].currentTime = parseFloat(controls.timeline.val());
                bgm[0].play();
            } else { // If master pause is active, ensure BGM is paused and currentTime is set
                bgm[0].currentTime = parseFloat(controls.timeline.val());
                bgm[0].pause();
            }
        })
        .on("input", function () {
            // Update startTime only if not paused by dragging
            // This is tricky because 'input' fires repeatedly during drag
            // We want startTime to reflect the new position when drag ends (mouseup/touchend)
            // or when play button is clicked.
            // For visual update during drag, this is fine:
            if (play.pause && !play.btnPause) { // If paused due to dragging
                startTime = Date.now() - $(this).val() * 1000;
            }
            let _p = $(this).val() / ($(this).prop('max') - $(this).prop('min')) * 100;
            controls.timeline.css('background', `linear-gradient(to right ,${_sliderColor[0]} 0%,${_sliderColor[0]} ${_p}%,${_sliderColor[1]} ${_p}%, ${_sliderColor[1]} 100%)`);
        });

    controls.play.click(function (e) {
        play.btnPause = !play.btnPause;
        play.pause = play.btnPause; // Sync game logic pause
        $(this).text(icons[0 + play.btnPause]);
        startTime = Date.now() - parseFloat(controls.timeline.val()) * 1000; // Crucial for correct resume time
        if (!play.pause) {
            bgm[0].currentTime = parseFloat(controls.timeline.val());
            bgm[0].play();
        } else {
            bgm[0].pause(); // No need to set currentTime again if already set by timeline input/drag
        }
    });

    if (data) { // Initialize with example data if present
        $editor.val(data); // Use val() for textarea
        doSomethingToDataIThink();
    }


    startTime = Date.now();

    $(window).on("resize", function (e) {
        doc_width = $(document).width(),
            doc_height = $(document).height(),
            _updCanvasRes();
    })

    function _updCanvasRes() {
        ctx.canvas.width = doc_width;
        // Ensure controls and actions height are calculated correctly, might need DOM to be ready
        let controlsHeight = $('.controls').height() || 0;
        let actionsHeight = $('.actions').height() || 0;
        ctx.canvas.height = (doc_height - (controlsHeight + actionsHeight)) * 2;

        // Re-calculate hw, hh, hbw if they depend on canvas dimensions for renderGame
        // These are now passed to renderGame, so no need to make them global here if not used elsewhere in update
    }

    // ====================================================================================
    // UPDATE FUNCTION - Game logic and calls renderGame
    // ====================================================================================

    function update() {
        if (!play.pause && sfxReady) {
            const newTimelineVal = (Date.now() - startTime) / 1000;
            // Only update if the value has changed significantly to avoid excessive updates
            if (Math.abs(controls.timeline.val() - newTimelineVal) > 0.01) {
                controls.timeline.val(newTimelineVal);
                // Update background based on new value
                let _p = newTimelineVal / (controls.timeline.prop('max') - controls.timeline.prop('min')) * 100;
                controls.timeline.css('background',
                    `linear-gradient(to right ,
                    ${_sliderColor[0]} 0%,
                    ${_sliderColor[0]} ${_p}%,
                    ${_sliderColor[1]} ${_p}%,
                    ${_sliderColor[1]} 100%)`
                );
            }
        }

        const t = parseFloat(controls.timeline.val()) * 1000; // Ensure t is a number

        // --- Game Logic for triggering notes and sound effects ---
        if (notes && notes.length > 0) {
            for (let i = notes.length - 1; i >= 0; i--) {
                let note = notes[i];
                if (!note) continue; // Skip if note is undefined

                const _t_note_relative = (t - note.time) / 1000; // Time relative to note's appearance

                // Tap, Star, Hold (start) logic
                if (!note.starTime && !note.touch && !note.slide) {
                    if (_t_note_relative >= 0) { // Note is active
                        if (triggered[i] !== undefined) { // Check if triggered[i] exists
                            if (!triggered[i].length) { // For tap/star
                                if (!triggered[i]) {
                                    _playEffect(note);
                                    triggered[i] = true;
                                }
                            } else { // For holds
                                if (!triggered[i][0]) {
                                    _playEffect(note);
                                    triggered[i][0] = true;
                                }
                            }
                        }
                    } else {
                        if (triggered[i] !== undefined) { // Check if triggered[i] exists
                            if (!triggered[i].length) { // For tap/star
                                triggered[i] = false;
                            } else { // For holds
                                triggered[i][0] = false;
                            }
                        }
                    }
                    // Hold (end) logic
                    if (note.holdTime && _t_note_relative >= (note.holdTime ?? 0)) {
                        if (triggered[i] && triggered[i].length && !triggered[i][1] && !settings.holdEndNoSound) {
                            _playEffect(note, true); // Play hold end sound
                            triggered[i][1] = true;
                        }
                    } else {
                        if (triggered[i] && triggered[i].length) triggered[i][1] = false;
                    }
                }
                // Slide logic (sound played at start)
                else if (note.slide) {
                    if (_t_note_relative >= 0 && triggered[i] !== undefined && !triggered[i]) {
                        // Slides typically don't have a distinct sound effect in this system like taps
                        // but if they did, it would be here.
                        // For now, just mark as triggered for rendering or other logic.
                        triggered[i] = true;
                    }
                }
                // Touch logic
                else if (note.touch) {
                    if (_t_note_relative >= 0 && triggered[i] !== undefined) {
                        if (!triggered[i].length) { // For initial touch
                            if (!triggered[i]) {
                                _playEffect(note);
                                triggered[i] = true;
                            }
                        } else { // For touch holds (if applicable, like normal holds)
                            if (!triggered[i][0]) {
                                _playEffect(note);
                                triggered[i][0] = true;
                            }
                        }
                    }
                    // Touch Hold (end) logic
                    if (note.touchTime && _t_note_relative >= (note.touchTime ?? 0)) {
                        if (triggered[i] && triggered[i].length && !triggered[i][1] && !settings.holdEndNoSound) {
                            _playEffect(note, true); // Play touch hold end sound
                            triggered[i][1] = true;
                        }
                    }
                }
            }
        }
        // --- End Game Logic ---

        // Call the render function
        // hw, hh, hbw are calculated inside renderGame based on current canvas dimensions
        render.renderGame(ctx, notes, settings, noteImages, t, triggered);

        requestAnimationFrame(update);
    }

    update(); // Start the loop
});

function getImgs() {
    let Images = {};
    Images.outline = $("#outline")[0];
    Images.sensor = $("#sensor")[0];
    // Add other images if needed by rendering logic
    // Images.tap = $("#tap")[0],
    // Images.break = $("#break")[0],
    // Images.each = $("#each")[0],
    // Images.tap_ex = $("#tap_ex")[0],
    // Images.hold = $("#hold")[0],
    // Images.hold_break = $("#hold_break")[0],
    // Images.hold_each = $("#hold_each")[0],
    // Images.hold_ex = $("#hold_ex")[0],
    // Images.star = $("#star")[0],
    // Images.star_break = $("#star_break")[0],
    // Images.star_each = $("#star_each")[0];
    return Images;
}
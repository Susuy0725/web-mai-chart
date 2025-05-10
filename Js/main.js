import { simai_decode } from "../Js/decode.js";
import * as render from "../Js/render.js";

export let settings = {
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

    let calAng = function (ang) { return { 'x': Math.sin(ang), 'y': Math.cos(ang) * -1 } };

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
        $('.dropdownlist .file-menu').hide(); // 假設這個還是需要的
        populateSettingsForm(); // 新增的函式：填充表單
        $('#settings-popup').show();
        $('#settings-overlay').show();
    });

    // 新增函式：將目前的設定值填入表單
    function populateSettingsForm() {
        // 填充 'settings' 物件的內容
        $('#setting-distanceToMid').val(settings.distanceToMid);
        $('#setting-roundStroke').prop('checked', settings.roundStroke);
        $('#setting-noteSize').val(settings.noteSize);
        $('#setting-speed').val(settings.speed);
        $('#setting-pinkStar').prop('checked', settings.pinkStar);
        $('#setting-touchSpeed').val(settings.touchSpeed);
        $('#setting-slideSpeed').val(settings.slideSpeed);
        $('#setting-holdEndNoSound').prop('checked', settings.holdEndNoSound);
        $('#setting-showSlide').prop('checked', settings.showSlide);

        // 填充 'soundSettings' 物件的內容
        $('#setting-sound-sfxs').prop('checked', soundSettings.sfxs);
        $('#setting-sound-answer').prop('checked', soundSettings.answer);
        $('#setting-sound-answerVol').val(soundSettings.answerVol);
        $('#setting-sound-judgeVol').val(soundSettings.judgeVol);
        $('#setting-sound-breakJudgeVol').val(soundSettings.breakJudgeVol);
        $('#setting-sound-touchVol').val(soundSettings.touchVol);
        $('#setting-sound-breakVol').val(soundSettings.breakVol);

        // 如果有其他設定，也在此處加入
    }

    // 處理儲存和取消按鈕
    $('#save-settings-btn, #cancel-settings-btn').on('click', function () {
        if (this.id === "save-settings-btn") {
            try {
                // 從表單讀取 'settings'
                settings.distanceToMid = parseFloat($('#setting-distanceToMid').val());
                settings.roundStroke = $('#setting-roundStroke').is(':checked');
                settings.noteSize = parseFloat($('#setting-noteSize').val());
                settings.speed = parseFloat($('#setting-speed').val());
                settings.pinkStar = $('#setting-pinkStar').is(':checked');
                settings.touchSpeed = parseFloat($('#setting-touchSpeed').val());
                settings.slideSpeed = parseFloat($('#setting-slideSpeed').val());
                settings.holdEndNoSound = $('#setting-holdEndNoSound').is(':checked');
                settings.showSlide = $('#setting-showSlide').is(':checked');

                // 從表單讀取 'soundSettings'
                soundSettings.sfxs = $('#setting-sound-sfxs').is(':checked');
                soundSettings.answer = $('#setting-sound-answer').is(':checked');
                soundSettings.answerVol = parseFloat($('#setting-sound-answerVol').val());
                soundSettings.judgeVol = parseFloat($('#setting-sound-judgeVol').val());
                soundSettings.breakJudgeVol = parseFloat($('#setting-sound-breakJudgeVol').val());
                soundSettings.touchVol = parseFloat($('#setting-sound-touchVol').val());
                soundSettings.breakVol = parseFloat($('#setting-sound-breakVol').val());


                console.log("新的遊戲設定：", settings);
                console.log("新的音效設定：", soundSettings);
                // 您可以在此處加入例如將設定儲存到 localStorage 的邏輯
                // localStorage.setItem('gameSettings', JSON.stringify(settings));
                // localStorage.setItem('soundSettings', JSON.stringify(soundSettings));

            } catch (e) {
                alert("設定值格式錯誤！請檢查數字輸入是否正確。");
                console.error("儲存設定時發生錯誤:", e);
                return; // 發生錯誤時不關閉彈出視窗
            }
        }
        $('#settings-popup').hide();
        $('#settings-overlay').hide();
    });

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
        render.renderGame(ctx, notes, settings, noteImages, t, triggered, calAng);

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
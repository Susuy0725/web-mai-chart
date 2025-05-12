import { simai_decode } from "../Js/decode.js"; // Assuming this path is correct
import * as render from "../Js/render.js";

export let settings = { // Keep export if other modules might need direct access
    'musicDelay': 0,
    'distanceToMid': 0.28,
    'roundStroke': true,
    'noteSize': 0.09,
    'speed': 2,
    'pinkStar': false,
    'touchSpeed': 3,
    'slideSpeed': 2,
    'holdEndNoSound': false,
    'showSlide': true,
};
// Make play and soundSettings local if not modified externally
let play = {
    'pauseBoth': function (btn, icons) {
        play.btnPause = true;
        play.pause = true;
        $(btn).text(icons[0 + play.btnPause]);
    },
    'lastPauseTime': 0,
    'pause': true,
    'btnPause': true,
};
let soundSettings = {
    'answer': true,
    'answerVol': 0.8,
    'judgeVol': 0.1,
    'breakJudgeVol': 0.1,
    'touchVol': 0.2,
    'breakVol': 0.3,
    'sfxs': true,
};
let maidata; // Chart data

const settingsConfig = {
    game: [
        { target: settings, key: 'distanceToMid', label: 'Note 出現位置 (0-1)', type: 'number', step: 0.01, min: 0, max: 1 },
        { target: settings, key: 'roundStroke', label: '圓滑邊緣', type: 'boolean' },
        { target: settings, key: 'noteSize', label: 'Note 大小 (0-1)', type: 'number', step: 0.01, min: 0, max: 1 },
        { target: settings, key: 'speed', label: 'Tap/Hold 速度倍率', type: 'number', step: 0.1 },
        { target: settings, key: 'pinkStar', label: '粉紅色星星', type: 'boolean' },
        { target: settings, key: 'touchSpeed', label: 'Touch 速度倍率', type: 'number', step: 0.1 },
        { target: settings, key: 'slideSpeed', label: 'Slide 速度倍率', type: 'number', step: 0.1 },
        { target: settings, key: 'holdEndNoSound', label: 'Hold 結尾無音效', type: 'boolean' },
        { target: settings, key: 'showSlide', label: '顯示 Slide 軌跡', type: 'boolean' }
    ],
    sound: [
        { target: soundSettings, key: 'sfxs', label: '啟用打擊音效', type: 'boolean' },
        { target: soundSettings, key: 'answer', label: '啟用 Answer 音效', type: 'boolean' },
        { target: soundSettings, key: 'answerVol', label: 'Answer 音量 (0-1)', type: 'number', step: 0.01, min: 0, max: 1 },
        { target: soundSettings, key: 'judgeVol', label: '打擊音量 (Tap/Star/Hold) (0-1)', type: 'number', step: 0.01, min: 0, max: 1 },
        { target: soundSettings, key: 'breakJudgeVol', label: 'Break 打擊音量 (0-1)', type: 'number', step: 0.01, min: 0, max: 1 },
        { target: soundSettings, key: 'touchVol', label: 'Touch 音量 (0-1)', type: 'number', step: 0.01, min: 0, max: 1 },
        { target: soundSettings, key: 'breakVol', label: 'Break 特殊音效音量 (0-1)', type: 'number', step: 0.01, min: 0, max: 1 }
    ]
};

let notes = [{}]; // Use `let` as it's reassigned
let triggered = [];
let startTime = 0; // Initialize
let maxTime = 1;
let sfxReady = false;
let currentTimelineValue = 0; // JS variable to store timeline value

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

const soundFiles = {
    tap: 'judge.wav',
    break: 'judge_break.wav',
    break_woo: 'break.wav',
    touch: 'touch.wav',
    answer: 'answer.wav'
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
    if (!sfxReady) return;
    if (soundSettings.answer && soundBuffers.answer) {
        playSound(soundBuffers, 'answer', { volume: soundSettings.answerVol });
    }
    if (soundSettings.sfxs) {
        if (note.break && !hold) {
            if (soundBuffers.break_woo) playSound(soundBuffers, 'break_woo', { volume: soundSettings.breakVol });
            if (soundBuffers.break) playSound(soundBuffers, 'break', { volume: soundSettings.breakJudgeVol });
        } else {
            if (note.touch && soundBuffers.touch) {
                playSound(soundBuffers, 'touch', { volume: soundSettings.touchVol });
            } else if (soundBuffers.tap) { // Ensure it's not touch before playing tap
                playSound(soundBuffers, 'tap', { volume: soundSettings.judgeVol });
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
    let doc_width = $(document).width(); // Keep let as it's updated on resize
    let doc_height = $(document).height();

    const $editor = $("#editor");
    let data = typeof example !== 'undefined' ? example : '';

    const _sliderColor = ['#ff3232', '#FFE9E9']; // Use const
    const icons = ['\uE103', '\uE102']; // Use const
    const controls = { // Use const
        'timeline': $("#timeline"),
        'play': $('#playBtn'),
    };

    const bgm = $("#bgm"); // Use const
    const noteImages = getImgs();

    // --- File Input Logic ---
    function handleFileUpload(accept, callback) {
        $('.dropdownlist .file-menu').hide();
        const fileInput = $('<input type="file" style="display: none;">').attr('accept', accept);
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
            play.pauseBoth(controls.play, icons);
            if (bgm.attr('src')) URL.revokeObjectURL(bgm.attr('src')); // Revoke old URL
            bgm.attr('src', '');
            const objectURL = URL.createObjectURL(file);
            bgm.attr('src', objectURL);
            bgm[0].load();
            bgm.off('loadedmetadata').on('loadedmetadata', function () { // Use .off to prevent multiple bindings
                const audioDurationMs = (bgm[0].duration + 1) * 1000;
                maxTime = Math.max(maxTime, audioDurationMs);
                controls.timeline.prop("max", maxTime / 1000);
                updateTimelineVisual(currentTimelineValue); // Update visual based on current time
            });
        });
    });

    $('.file-menu .a-btn1').on('click', function () { // Load Chart
        handleFileUpload('text/*', (file) => {
            const reader = new FileReader();
            reader.onload = function (e) {
                maidata = e.target.result;
                // console.log("檔案內容：", maidata);
                data = maidata;
                $editor.val(data); // Update editor content
                processChartData();
            };
            reader.readAsText(file);
        });
    });


    $('.sett-menu-button').on('click', function () {
        $('.dropdownlist .file-menu').hide();
        generateSettingsForm();
        $('#settings-popup').show();
        $('#settings-overlay').show();
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
    });

    _updCanvasRes();
    controls.play.text(icons[0 + play.btnPause]);

    function processChartData() { // Renamed from doSomethingToDataIThink
        try {
            notes = simai_decode(data); // This now returns notes with pre-calculated path objects if possible
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
                if (!note) return;
                const notesAtSameTime = timeMap.get(note.time) || [];
                if (note.slide) {
                    note.isDoubleSlide = notesAtSameTime.filter(n => n !== note && n.slide && !n.chain).length > 0;
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

                if (note.holdTime || note.touchTime || (note.slideTime && note.delay)) { // Simplified condition
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
            if(currentTimelineValue > maxTime){
                currentTimelineValue = maxTime;
            }
            play.pauseBoth(controls.play, icons);
            bgm[0].pause();
            //currentTimelineValue = 0; // Reset timeline value
            controls.timeline.val(currentTimelineValue); // Reset slider position
            updateTimelineVisual(currentTimelineValue);
            startTime = Date.now(); // Reset start time for paused state
        } catch (error) {
            console.error("Error processing chart data:", error);
            notes = [];
            triggered = [];
        }
    }

    $editor.on("input", debounce(function () { // Debounced input
        data = $editor.val();
        processChartData();
    }, 500)); // 500ms debounce delay

    function updateTimelineVisual(value) {
        const min = parseFloat(controls.timeline.prop('min')) || 0;
        const max = parseFloat(controls.timeline.prop('max')) || 1;
        const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
        controls.timeline.css('background', `linear-gradient(to right ,${_sliderColor[0]} 0%,${_sliderColor[0]} ${percentage}%,${_sliderColor[1]} ${percentage}%, ${_sliderColor[1]} 100%)`);
    }


    controls.timeline
        .on("mousedown touchstart", function () {
            play.pause = true;
            if (!play.btnPause) {
                bgm[0].pause();
            }
        })
        .on("mouseup touchend", function () {
            currentTimelineValue = parseFloat($(this).val());
            startTime = Date.now() - currentTimelineValue * 1000;
            play.pause = play.btnPause;
            if (!play.pause) {
                bgm[0].currentTime = currentTimelineValue;
                bgm[0].play().catch(e => console.error("BGM play error:", e));
            } else {
                bgm[0].currentTime = currentTimelineValue;
                // bgm[0].pause(); // Already paused or will be by master pause
            }
        })
        .on("input", function () {
            currentTimelineValue = parseFloat($(this).val());
            if (play.pause) { // Update startTime if paused to reflect drag
                startTime = Date.now() - currentTimelineValue * 1000;
            }
            updateTimelineVisual(currentTimelineValue);
        });

    controls.play.click(function (e) {
        play.btnPause = !play.btnPause;
        play.pause = play.btnPause;
        $(this).text(icons[0 + play.btnPause]);
        currentTimelineValue = parseFloat(controls.timeline.val()); // Get current value from slider
        startTime = Date.now() - currentTimelineValue * 1000;

        if (!play.pause) {
            bgm[0].currentTime = currentTimelineValue;
            bgm[0].play().catch(e => console.error("BGM play error:", e));
        } else {
            bgm[0].pause();
        }
    });

    if (data) {
        $editor.val(data);
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
        ctx.canvas.width = doc_width;
        const controlsHeight = $('.controls').outerHeight(true) || 0; // Use outerHeight(true) for margins
        const actionsHeight = $('.actions').outerHeight(true) || 0;
        ctx.canvas.height = Math.max(150, (doc_height - (controlsHeight + actionsHeight)) * 2); // Ensure min height, adjust multiplier if needed
    }


    function update() {
        if (!play.pause) {
            const newTimelineVal = (Date.now() - startTime) / 1000;
            // Only update if the value has changed significantly
            if (Math.abs(currentTimelineValue - newTimelineVal) > 0.01) {
                currentTimelineValue = newTimelineVal;
                controls.timeline.val(currentTimelineValue); // Update slider position
                updateTimelineVisual(currentTimelineValue); // Update visual
            }
        }

        const t = currentTimelineValue * 1000; // Use JS variable

        if (notes && notes.length > 0 && sfxReady) {
            for (let i = notes.length - 1; i >= 0; i--) {
                const note = notes[i];
                if (!note) continue;

                const _t_note_relative = (t - note.time) / 1000;

                if (triggered[i] === undefined) continue; // Skip if no trigger state for this note

                // Tap, Star, Hold (start) logic
                if (!note.starTime && !note.touch && !note.slide) {
                    if (_t_note_relative >= 0) {
                        if (Array.isArray(triggered[i])) { // Hold note
                            if (!triggered[i][0]) {
                                _playEffect(note);
                                triggered[i][0] = true;
                            }
                        } else { // Tap/Star note
                            if (!triggered[i]) {
                                _playEffect(note);
                                triggered[i] = true;
                            }
                        }
                    } else { // Reset trigger if time is before note
                        if (Array.isArray(triggered[i])) triggered[i][0] = false;
                        else triggered[i] = false;
                    }
                    // Hold (end) logic
                    if (note.holdTime && _t_note_relative >= note.holdTime) { // Use note.holdTime directly
                        if (Array.isArray(triggered[i]) && triggered[i][0] && !triggered[i][1] && !settings.holdEndNoSound) {
                            _playEffect(note, true);
                            triggered[i][1] = true;
                        }
                    } else if (note.holdTime && Array.isArray(triggered[i])) { // Reset end trigger if before end time
                        triggered[i][1] = false;
                    }
                }
                // Slide logic (sound typically at start, if any)
                else if (note.slide) {
                    // Slides might not have a specific sound here, but visual trigger
                    if (_t_note_relative >= 0 && !triggered[i]) {
                        // _playEffect(note); // If slides have sound
                        triggered[i] = true; // Mark as visually active
                    } else if (_t_note_relative < 0 && triggered[i]) {
                        triggered[i] = false; // Reset if time is before
                    }
                }
                // Touch logic
                else if (note.touch) {
                    if (_t_note_relative >= 0) {
                        if (Array.isArray(triggered[i])) { // Touch Hold note
                            if (!triggered[i][0]) {
                                _playEffect(note);
                                triggered[i][0] = true;
                            }
                        } else { // Touch Tap note
                            if (!triggered[i]) {
                                _playEffect(note);
                                triggered[i] = true;
                            }
                        }
                    } else {
                        if (Array.isArray(triggered[i])) triggered[i][0] = false;
                        else triggered[i] = false;
                    }
                    // Touch Hold (end) logic
                    if (note.touchTime && _t_note_relative >= note.touchTime) {
                        if (Array.isArray(triggered[i]) && triggered[i][0] && !triggered[i][1] && !settings.holdEndNoSound) {
                            _playEffect(note, true);
                            triggered[i][1] = true;
                        }
                    } else if (note.touchTime && Array.isArray(triggered[i])) {
                        triggered[i][1] = false;
                    }
                }
            }
        }

        render.renderGame(ctx, notes, settings, noteImages, t, triggered);
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
        if (!Images.outline || !Images.sensor) {
            console.warn("Outline or Sensor image not found in DOM. Rendering might be affected.");
        }
    } catch (e) {
        console.error("Error getting images:", e);
    }
    return Images;
}
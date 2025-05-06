import { simai_decode } from "../Js/decode.js";

export let settings = {
    'distanceToMid': 0.28,
    'roundStroke': true,
    'noteSpeed': 1,
    'noteSize': 0.09,
    'speed': 2,
    'pinkStar': false,
    'touchSpeed': 3,
    'slideSpeed': 2,
    'holdEndNoSound': false,
    //'useStroke': true,
    //'showSlide': true,
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

    // Optional: Hide the dropdown when clicking outside of it
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
        data = example;

    let _sliderColor = ['#ff3232', '#FFE9E9'],
        icons = ['\uE103', '\uE102'],
        controls = {
            'timeline': $("#timeline"),
            'play': $('#playBtn'),
        };

    let bgm = $("#bgm");

    // 監聽 "Open Music" 按鈕的點擊事件
    $('.file-menu .a-btn2').on('click', function () {
        // 隱藏下拉選單
        $('.dropdownlist .file-menu').hide();

        // 創建一個隱藏的檔案輸入元素
        let fileInput = $('<input type="file" accept="audio/*" style="display: none;">');
        $('body').append(fileInput); // 將輸入元素添加到 body 中

        // 監聽檔案選擇事件
        fileInput.on('change', function (event) {
            const file = event.target.files[0]; // 取得選擇的檔案
            if (file) {
                play.pauseBoth(controls.play, icons);
                bgm.attr('src', '');
                const objectURL = URL.createObjectURL(file); // 為檔案創建 Object URL
                bgm.attr('src', objectURL); // 設定 #bgm 的 src 屬性
                bgm[0].load(); // 載入新的音訊來源

                // 當音樂載入後，更新時間軸並選擇性地播放
                bgm.on('loadedmetadata', function () {
                    maxTime = maxTime >= (bgm[0].duration + 1) * 1000 ? maxTime : (bgm[0].duration + 1) * 1000; // 更新最大時間 (毫秒)
                    controls.timeline.prop("max", maxTime / 1000 + 1); // 更新時間軸的最大值 (秒)
                    controls.timeline.val(0); // 重設時間軸到開頭
                    // 更新時間軸背景
                    controls.timeline.trigger('input');
                });
            }
            fileInput.remove(); // 移除檔案輸入元素
        });

        // 觸發檔案輸入元素的點擊事件，打開檔案選擇對話框
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
                    // 你可以在這裡處理文字內容，例如 JSON.parse(content)
                };

                reader.readAsText(file); // 讀取文字內容
            }

            fileInput.remove(); // 移除輸入元素
        });

        // 觸發對話框
        fileInput.click();
    });

    $('.sett-menu-button').on('click', function () {
        $('.dropdownlist .file-menu').hide();
        $('#settings-textarea').val(JSON.stringify(settings, null, 4)); // 美化輸出
        $('#settings-popup').show();
        $('#settings-overlay').show();
    });

    $('#save-settings-btn, #cancel-settings-btn').on('click', function () {
        if (this.id === "save-settings-btn") {
            try {
                const newSettings = JSON.parse($('#settings-textarea').val());
                settings = newSettings;
                console.log(settings);
                console.log("新的設定：", settings);
            } catch (e) {
                alert("JSON 格式錯誤！");
                return; // 格式錯誤就不關閉
            }
        }
        $('#settings-popup').hide();
        $('#settings-overlay').hide();
    });

    _updCanvasRes();

    controls.play.text(icons[0 + play.btnPause]);

    function ababab() {
        try {
            notes = simai_decode(data);

            triggered = [];
            // 初始化 triggered 陣列和 maxTime（依 note 數量建立對應布林值）
            for (let index = 0; index < notes.length; index++) {
                if ((notes[index].holdTime ?? false) || (notes[index].touchTime ?? false)) {
                    if (maxTime < notes[index].time) maxTime = (notes[index].holdTime ?? 0) || (notes[index].touchTime ?? 0);
                    triggered.push([false, false]);
                } else {
                    if (maxTime < notes[index].time) maxTime = notes[index].time;
                    triggered.push(false);
                }
            }
            maxTime += 1;
            if (bgm[0].duration) {
                maxTime = maxTime >= (bgm[0].duration + 1) * 1000 ? maxTime : (bgm[0].duration + 1) * 1000; // 更新最大時間 (毫秒)
            }
            maxTime = isNaN(maxTime) ? 1 : maxTime;

            controls.timeline.prop("max", maxTime / 1000 + 1);
            play.pauseBoth(controls.play, icons);
            bgm[0].pause();
        } catch (error) {
            console.error(error);
        }
    }

    $editor.on("input", function (e) {
        data = $editor.val()
        ababab();
    });

    controls.timeline
        .on("mousedown touchstart", function () {
            play.pause = true;
            bgm[0].pause();
        })
        .on("mouseup touchend", function () {
            startTime = Date.now() - $(this).val() * 1000;
            play.pause = play.btnPause;
            if (!play.pause) {
                bgm[0].currentTime = parseFloat(controls.timeline.val());
                bgm[0].play();
            } else {
                bgm[0].currentTime = parseFloat(controls.timeline.val());
                bgm[0].pause();
            };
        })
        .on("input", function () {
            startTime = Date.now() - $(this).val() * 1000;
            let _p = $(this).val() / ($(this).prop('max') - $(this).prop('min')) * 100;
            controls.timeline.css('background', `linear-gradient(to right ,${_sliderColor[0]} 0%,${_sliderColor[0]} ${_p}%,${_sliderColor[1]} ${_p}%, ${_sliderColor[1]} 100%)`);
        });

    controls.play.click(function (e) {
        play.btnPause = !play.btnPause;
        play.pause = play.btnPause;
        $(this).text(icons[0 + play.btnPause]);
        startTime = Date.now() - parseFloat(controls.timeline.val()) * 1000;
        if (!play.pause) {
            bgm[0].currentTime = parseFloat(controls.timeline.val());
            bgm[0].play();
        } else {
            bgm[0].currentTime = parseFloat(controls.timeline.val());
            bgm[0].pause();
        };
    });

    $editor.html(example);

    ababab();

    startTime = Date.now();

    let noteImages = getImgs();

    $(window).on("resize", function (e) {
        doc_width = $(document).width(),
            doc_height = $(document).height(),
            _updCanvasRes();
    })

    function _updCanvasRes() {
        ctx.canvas.width = doc_width,
            ctx.canvas.height = (doc_height - ($('.controls').height() + $('.actions').height())) * 2;
    }

    function update() {
        if (!play.pause && sfxReady) controls.timeline.val((Date.now() - startTime) / 1000);

        const t = controls.timeline.val() * 1000;
        //_currentTime = t;
        let _p = controls.timeline.val() / (controls.timeline.prop('max') - controls.timeline.prop('min')) * 100;

        controls.timeline.css('background',
            `linear-gradient(to right ,
            ${_sliderColor[0]} 0%,
            ${_sliderColor[0]} ${_p}%,
            ${_sliderColor[1]} ${_p}%,
             ${_sliderColor[1]} 100%)`
        );

        let w = ctx.canvas.width,
            h = ctx.canvas.height,
            hw = w / 2,
            hh = h / 2;
        ctx.clearRect(0, 0, w, h);
        ctx.lineJoin = settings.roundStroke ? 'round' : 'butt';

        let bw = (h > w ? w : h),
            //bw means circle screen width
            hbw = (bw / 2)
            //hbw means half of it
            ;

        ctx.shadowColor = 'black';
        ctx.shadowBlur = 4;
        ctx.drawImage(noteImages.sensor,
            (h > w ? 0 : (w - h) / 2), (h > w ? (h - w) / 2 : 0),
            bw, bw);
        ctx.shadowColor = '#00000000';
        ctx.shadowBlur = 0;

        ctx.drawImage(noteImages.outline,
            (h > w ? 0 : (w - h) / 2), (h > w ? (h - w) / 2 : 0),
            bw, bw);


        // slide render
        for (let i = notes.length - 1; i >= 0; i--) {
            let note = notes[i];

            if (note.slide) {
                let notePosition = [];
                for (let i = 0; i < 8; i++) {
                    let ang = (i + 0.5) / 4 * Math.PI;
                    notePosition.push(calAng(ang));
                }

                let _t = ((t - note.time) / 1000);
                let color = '#5BCCFF';
                if (note.break) {
                    color = '#FF6C0C';
                } else {
                    let double = notes.findIndex((_note) => _note.time == note.time && notes.indexOf(_note) != i && _note.slide);
                    if (double != -1) {
                        color = '#FFD900';
                    }
                }

                if (_t >= -1 / settings.slideSpeed && _t <= note.delay + note.slideTime) {
                    triggered[i] = false;

                    let nang = (parseInt((note.slideHead ?? '')[0]) - 1) % 8;
                    let nang2 = note.slideEnd;
                    if (!(note.slideEnd.length > 1)) {
                        nang2 = (parseInt((note.slideEnd ?? '')[0]) - 1) % 8;
                    }
                    let np = notePosition[isNaN(nang) ? 0 : nang];
                    np.x = hw + hbw * np.x;
                    np.y = hh + hbw * np.y;
                    nang = nang < 0 ? 0 : nang;
                    if (!(note.slideEnd.length > 1)) nang2 = nang2 < 0 ? 0 : nang2;

                    if (_t >= 0) {
                        drawSlidePath(nang, nang2, note.slideType, color, _t <= 0 ? _t * settings.slideSpeed : Math.max(_t - note.delay, 0) / note.slideTime);
                        //drawStar(np.x, np.y, 1, color, (nang) / -4 * Math.PI);
                    } else {
                        drawSlidePath(nang, nang2, note.slideType, color, _t * settings.slideSpeed);
                    }
                    //ctx.font = "50px Segoe UI";
                    //ctx.fillText((Math.min(_t, 0) + (d / settings.speed)) / (d / settings.speed), np.x, np.y);
                }

                if (_t >= 0) {
                    triggered[i] = true;
                }
                if (_t >= (note.slideTime ?? 0)) {

                }
            }
        }

        //tap ,star and hold render
        for (let i = notes.length - 1; i >= 0; i--) {
            let note = notes[i];

            if (!note.starTime && !note.touch && !note.slide) {
                let notePosition = [];
                for (let i = 0; i < 8; i++) {
                    let ang = (i + 0.5) / 4 * Math.PI;
                    notePosition.push(calAng(ang));
                }

                let _t = ((t - note.time) / 1000);
                let color = '#FF50AA';
                if (note.touch) {
                    color = '#0089F4';
                }
                if (note.star && !settings.pinkStar) {
                    color = '#009FF9';
                }
                if (note.break) {
                    color = '#FF6C0C';
                } else {
                    let double = notes.findIndex((_note) => _note.time == note.time && notes.indexOf(_note) != i && !_note.slide);
                    if (double != -1) {
                        color = '#FFD900';
                    }
                }

                if (_t >= (settings.distanceToMid - 2) / settings.speed && _t < (note.holdTime ?? 0)) {
                    if (!triggered[i].length) {
                        triggered[i] = false;
                    } else {
                        if (_t < 0) {
                            triggered[i][0] = false;
                        }
                        if (_t < note.holdTime) {
                            triggered[i][1] = false;
                        }
                    }
                    let d = (1 - settings.distanceToMid);
                    let nang = (parseInt(note.pos[0]) - 1) % 8;
                    nang = nang < 0 ? 0 : nang;
                    let np = notePosition[isNaN(nang) ? 0 : nang];
                    if (_t >= -d / settings.speed) {
                        np.x = hw + hbw * np.x * (Math.min(_t, 0) * settings.speed + 1);
                        np.y = hh + hbw * np.y * (Math.min(_t, 0) * settings.speed + 1);
                        if (note.star) {
                            drawStar(np.x, np.y, 1, color, (nang) / -4 * Math.PI);
                        } else if (!!note.holdTime) {
                            drawHold(np.x, np.y, 1, color, (nang) / -4 * Math.PI,
                                (Math.min((note.holdTime - (_t > 0 ? _t : 0)) * settings.speed, (1 - settings.distanceToMid) * (Math.min(_t, 0) + (d / settings.speed)) / (d / settings.speed))) * hbw);
                        } else {
                            drawTap(np.x, np.y, 1, color);
                        }
                        //ctx.font = "50px Segoe UI";
                        //ctx.fillText(i, np.x, np.y);
                    } else {
                        np.x = hw + hbw * np.x * (1 - d);
                        np.y = hh + hbw * np.y * (1 - d);
                        if (note.star) {
                            drawStar(np.x, np.y, (_t * settings.speed + (2 - settings.distanceToMid)), color, (nang) / -4 * Math.PI);
                        } else if (!!note.holdTime) {
                            drawHold(np.x, np.y, (_t * settings.speed + (2 - settings.distanceToMid)), color, (nang) / -4 * Math.PI, 0);
                        } else {
                            drawTap(np.x, np.y, (_t * settings.speed + (2 - settings.distanceToMid)), color);
                        }
                    }
                    //ctx.font = "50px Segoe UI";
                    //ctx.fillText((Math.min(_t, 0) + (d / settings.speed)) / (d / settings.speed), np.x, np.y);
                }

                if (_t >= 0) {
                    if (!triggered[i].length) {
                        if (!triggered[i]) {
                            _playEffect(note);
                        }
                        triggered[i] = true;
                    } else {
                        if (!triggered[i][0]) {
                            _playEffect(note);
                        }
                        triggered[i][0] = true;
                    }
                }
                if (_t >= (note.holdTime ?? 0)) {
                    if (triggered[i].length) {
                        if (!triggered[i][1] && !settings.holdEndNoSound) {
                            _playEffect(note, true);
                        }
                        triggered[i][1] = true;
                    }
                }
            }
        }
        //touch render
        for (let i = notes.length - 1; i >= 0; i--) {
            let note = notes[i];

            if (note.touch) {
                let notePosition = [];
                for (let i = 0; i < 8; i++) {
                    let ang = (i + 0.5) / 4 * Math.PI;
                    notePosition.push(calAng(ang));
                }

                let _t = ((t - note.time) / 1000);
                let color = '#FF50AA';
                if (note.touch) {
                    color = '#0089F4';
                }
                if (note.star && !settings.pinkStar) {
                    color = '#009FF9';
                }
                if (note.break) {
                    color = '#FF6C0C';
                } else {
                    let double = notes.findIndex((_note) => _note.time == note.time && notes.indexOf(_note) != i && !_note.starTime);
                    if (double != -1) {
                        color = '#FFD900';
                    }
                }

                let ani1 = function (t) {
                    return Math.log(99 * (t / settings.touchSpeed) + 1) / 2;
                }

                if (_t >= -1 / settings.touchSpeed && _t <= (note.touchTime ?? 0)) {
                    if (!triggered[i].length) {
                        triggered[i] = false;
                    } else {
                        if (_t < 0) {
                            triggered[i][0] = false;
                        }
                        if (_t < note.touchTime) {
                            triggered[i][1] = false;
                        }
                    }
                    drawTouch(note.pos, 0.8, color, note.touch, ani1(_t < 0 ? -_t : 0) * 0.65, 8 - (_t / (-2 / settings.touchSpeed)) * 8, note.touchTime, _t);
                    //ctx.font = "50px Segoe UI";
                    //ctx.fillText((Math.min(_t, 0) + (d / settings.speed)) / (d / settings.speed), np.x, np.y);
                }
                if (_t >= 0) {
                    if (!triggered[i].length) {
                        if (!triggered[i]) {
                            _playEffect(note);
                        }
                        triggered[i] = true;
                    } else {
                        if (!triggered[i][0]) {
                            _playEffect(note);
                        }
                        triggered[i][0] = true;
                    }
                }

                if (_t >= (note.touchTime ?? 0)) {
                    if (triggered[i].length) {
                        if (!triggered[i][1] && !settings.holdEndNoSound) {
                            _playEffect(note, true);
                        }
                        triggered[i][1] = true;
                    }
                }
            }
        }

        function drawTap(x, y, size, color) {
            let s = hbw * settings.noteSize;
            size = size * s;
            size = Math.max(size, 0);
            ctx.shadowBlur = s * 0.2;
            ctx.shadowColor = 'black';
            ctx.lineWidth = size * 0.75;
            ctx.strokeStyle = 'white';
            _arc(x, y, size);
            ctx.shadowBlur = 0;
            ctx.shadowColor = '#00000000';
            ctx.lineWidth = size * 0.5;
            ctx.strokeStyle = color;
            _arc(x, y, size);
        }

        function drawStar(x, y, size, color, ang) {
            ang = ang - 0.125 * Math.PI;
            let s = hbw * settings.noteSize;
            size = size * s;
            size = Math.max(size, 0);
            ctx.shadowBlur = s * 0.2;
            ctx.shadowColor = 'black';
            ctx.lineWidth = size * 0.6;
            ctx.strokeStyle = 'white';
            function str() {
                ctx.beginPath();
                ctx.moveTo(x - (size) * calAng(ang).x,
                    y + (size) * calAng(ang).y);
                ctx.lineTo(x - (size / 2) * calAng(ang + 36 * Math.PI / 180).x,
                    y + (size / 2) * calAng(ang + 36 * Math.PI / 180).y);
                ctx.lineTo(x - (size) * calAng(ang + 72 * Math.PI / 180).x,
                    y + (size) * calAng(ang + 72 * Math.PI / 180).y);
                ctx.lineTo(x - (size / 2) * calAng(ang + 108 * Math.PI / 180).x,
                    y + (size / 2) * calAng(ang + 108 * Math.PI / 180).y);
                ctx.lineTo(x - (size) * calAng(ang + 144 * Math.PI / 180).x,
                    y + (size) * calAng(ang + 144 * Math.PI / 180).y);
                ctx.lineTo(x - (size / 2) * calAng(ang + Math.PI).x,
                    y + (size / 2) * calAng(ang + Math.PI).y);

                ctx.lineTo(x - (size) * calAng(ang + 216 * Math.PI / 180).x,
                    y + (size) * calAng(ang + 216 * Math.PI / 180).y);
                ctx.lineTo(x - (size / 2) * calAng(ang + 252 * Math.PI / 180).x,
                    y + (size / 2) * calAng(ang + 252 * Math.PI / 180).y);
                ctx.lineTo(x - (size) * calAng(ang + 288 * Math.PI / 180).x,
                    y + (size) * calAng(ang + 288 * Math.PI / 180).y);
                ctx.lineTo(x - (size / 2) * calAng(ang + 324 * Math.PI / 180).x,
                    y + (size / 2) * calAng(ang + 324 * Math.PI / 180).y);
                ctx.lineTo(x - (size) * calAng(ang + 2 * Math.PI).x,
                    y + (size) * calAng(ang + 2 * Math.PI).y);
                ctx.lineTo(x - (size / 2) * calAng(ang + 36 * Math.PI / 180).x,
                    y + (size / 2) * calAng(ang + 36 * Math.PI / 180).y);
                ctx.stroke();
            }
            str()
            ctx.shadowBlur = 0;
            ctx.shadowColor = '#00000000';
            ctx.lineWidth = size * 0.35;
            ctx.strokeStyle = color;
            str();
        }

        function drawSlidePath(startNp, endNp, type, color, t) {
            startNp = parseInt(startNp);
            endNp = parseInt(endNp);

            class PathRecorder {
                constructor() {
                    this.commands = [];
                    this.ctxPath = new Path2D();
                    this.lastX = null;
                    this.lastY = null;
                }

                // 格式化数字，避免太多小数位
                _fmt(v) { return +v.toFixed(4); }

                moveTo(x, y) {
                    x = this._fmt(x); y = this._fmt(y);
                    this.commands.push(`M ${x} ${y}`);
                    this.ctxPath.moveTo(x, y);
                    this.lastX = x; this.lastY = y;
                }

                lineTo(x, y) {
                    x = this._fmt(x); y = this._fmt(y);
                    this.commands.push(`L ${x} ${y}`);
                    this.ctxPath.lineTo(x, y);
                    this.lastX = x; this.lastY = y;
                }

                bezierCurveTo(c1x, c1y, c2x, c2y, x, y) {
                    [c1x, c1y, c2x, c2y, x, y] = [c1x, c1y, c2x, c2y, x, y].map(v => this._fmt(v));
                    this.commands.push(`C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x} ${y}`);
                    this.ctxPath.bezierCurveTo(c1x, c1y, c2x, c2y, x, y);
                    this.lastX = x; this.lastY = y;
                }

                arc(cx, cy, r, startAngle, endAngle, anticlockwise = false) {
                    // 画在 Canvas 上
                    this.ctxPath.arc(cx, cy, r, startAngle, endAngle, anticlockwise);

                    // 计算总旋转量，并根据方向修正到 (−2π,2π)
                    let delta = endAngle - startAngle;
                    if (!anticlockwise && delta < 0) delta += 2 * Math.PI;
                    if (anticlockwise && delta > 0) delta -= 2 * Math.PI;

                    // 拆段数量，每段 ≤ π
                    const segments = Math.ceil(Math.abs(delta) / Math.PI);
                    const segAngle = delta / segments;

                    for (let i = 0; i < segments; i++) {
                        const a0 = startAngle + segAngle * i;
                        const a1 = startAngle + segAngle * (i + 1);

                        const sx = this._fmt(cx + r * Math.cos(a0));
                        const sy = this._fmt(cy + r * Math.sin(a0));
                        const ex = this._fmt(cx + r * Math.cos(a1));
                        const ey = this._fmt(cy + r * Math.sin(a1));

                        // large‑arc‑flag: 若这一段跨越 π 就写 1，否则 0
                        const laf = Math.abs(segAngle) > Math.PI ? 1 : 0;
                        // sweep‑flag: 顺时针 1，逆时针 0
                        const sf = anticlockwise ? 0 : 1;

                        // 若上一段结束点 ≠ 本段起点，就补一个 M
                        if (this.lastX !== sx || this.lastY !== sy) {
                            this.commands.push(`M ${sx} ${sy}`);
                        }
                        this.commands.push(`A ${this._fmt(r)} ${this._fmt(r)} 0 ${laf} ${sf} ${ex} ${ey}`);

                        this.lastX = ex;
                        this.lastY = ey;
                    }
                }

                toSVGPath() {
                    return this.commands.join(" ");
                }
            }

            function drawArrow(pathRecorder, spacing, _t) {
                // 建立 SVG path 元素（離畫面可見區域外）
                const svgNS = "http://www.w3.org/2000/svg";
                const tempSvg = document.createElementNS(svgNS, "svg");
                tempSvg.setAttribute("width", 0);
                tempSvg.setAttribute("height", 0);
                const pathEl = document.createElementNS(svgNS, "path");
                pathEl.setAttribute("d", pathRecorder.toSVGPath());
                tempSvg.appendChild(pathEl);
                document.body.appendChild(tempSvg); // 插入 DOM 才能使用 getTotalLength
                function drawArrowCallback(x, y, angle) {
                    ctx.save();
                    ctx.translate(x, y);
                    ctx.rotate(angle);
                    ctx.beginPath();
                    ctx.moveTo(s * 1.1, 0); // 箭頭尖端
                    ctx.lineTo(s * 0.7, s * -0.8);
                    ctx.lineTo(0, s * -0.8);
                    ctx.lineTo(s * 0.4, 0);
                    ctx.lineTo(0, s * 0.8);
                    ctx.lineTo(s * 0.7, s * 0.8);
                    ctx.closePath();
                    ctx.fillStyle = color;
                    ctx.fill();
                    ctx.restore();
                }

                const totalLen = pathEl.getTotalLength();

                for (let len = 0; len < totalLen; len += spacing) {
                    const p1 = pathEl.getPointAtLength(len);
                    const p2 = pathEl.getPointAtLength(len + 0.01); // 用一點點微小距離取方向

                    const dx = p2.x - p1.x;
                    const dy = p2.y - p1.y;
                    const angle = Math.atan2(dy, dx); // 弧度

                    if (len / totalLen > _t) drawArrowCallback(p1.x, p1.y, angle); // 畫箭頭
                }

                // 清除臨時 SVG
                document.body.removeChild(tempSvg);
            }

            let notePosition = [];
            for (let i = 0; i < 8; i++) {
                notePosition.push(calAng(getNotePos(i, 0)));
            }

            let touchDisToMid = {
                "A": 1,
                "B": 0.475,
                "C": 0,
                "D": 1,
                "E": 0.675,
            };
            let touchAngleOffset = {
                "A": 1,
                "B": 0,
                "C": 0,
                "D": 0.5,
                "E": 0.5,
            }

            let np = [notePosition[isNaN(startNp) ? 0 : startNp % 8], notePosition[isNaN(endNp) ? 0 : (endNp > 9 ? (Math.floor(endNp / 10) - 1) : endNp) % 8]]
            np[0].x = hw + hbw * np[0].x;
            np[0].y = hh + hbw * np[0].y;
            np[1].x = hw + hbw * np[1].x;
            np[1].y = hh + hbw * np[1].y;

            let s = hbw * settings.noteSize;
            let size = s;
            ctx.shadowBlur = s * 0.2;
            ctx.shadowColor = '#000000';
            ctx.lineWidth = size * 0.75;
            ctx.font = "50px Segoe UI";
            ctx.strokeStyle = color;
            if (t < 0) {
                color = color + (Math.floor((t + 1) / 2 * 255)).toString(16).padStart(2, '0');
                ctx.shadowColor = '#000000' + (Math.floor((t + 1) / 2 * 255)).toString(16).padStart(2, '0');
            }

            let npTouch, npTouch1;

            const a = new PathRecorder();

            function getNotePos(a, offset = 0) {
                return ((a + offset) + 0.5) / 4 * Math.PI;
            }
            function getTouchPos(a, offset = 0, type) {
                return ((a + offset) % 8 - 0.5 - touchAngleOffset[type]) / 4 * Math.PI;
            }
            switch (type) {
                case '-':
                    a.moveTo(np[0].x, np[0].y);
                    a.lineTo(np[1].x, np[1].y);
                    drawArrow(a, s * 1.25, t < 0 ? 0 : t);
                    break;
                case '^':
                    a.arc(hw, hh, hbw,
                        (startNp - 1.5) / 4 * Math.PI,
                        (endNp - 1.5) / 4 * Math.PI,
                        ((endNp - startNp + 8) % 8) > 4
                    );
                    drawArrow(a, s * 1.25, t < 0 ? 0 : t);
                    break;
                case '>':
                    a.arc(hw, hh, hbw,
                        (startNp - 1.5 + 8 * (startNp == endNp && (startNp >= 2 && startNp <= 5))) / 4 * Math.PI,
                        (endNp - 1.5 + 8 * (startNp == endNp && !(startNp >= 2 && startNp <= 5))) / 4 * Math.PI,
                        false ^ (startNp >= 2 && startNp <= 5)
                    );
                    drawArrow(a, s * 1.25, t < 0 ? 0 : t);
                    break;
                case '<':
                    a.arc(hw, hh, hbw,
                        (startNp - 1.5 + 8 * (startNp == endNp && !(startNp >= 2 && startNp <= 5))) / 4 * Math.PI,
                        (endNp - 1.5 + 8 * (startNp == endNp && (startNp >= 2 && startNp <= 5))) / 4 * Math.PI,
                        true ^ (startNp >= 2 && startNp <= 5)
                    );
                    drawArrow(a, s * 1.25, t < 0 ? 0 : t);
                    break;
                case 'v':
                    a.moveTo(np[0].x, np[0].y);
                    a.lineTo(hw, hh);
                    a.lineTo(np[1].x, np[1].y);
                    drawArrow(a, s * 1.25, t < 0 ? 0 : t);
                    break;
                case 'z':
                    npTouch = calAng(getTouchPos(startNp, 3, 'B'));
                    npTouch1 = calAng(getTouchPos(startNp, 7, 'B'));

                    a.moveTo(np[0].x, np[0].y);
                    a.lineTo(hw + npTouch.x * touchDisToMid['B'] * hbw,
                        hh + npTouch.y * touchDisToMid['B'] * hbw);
                    a.lineTo(hw + npTouch1.x * touchDisToMid['B'] * hbw,
                        hh + npTouch1.y * touchDisToMid['B'] * hbw);
                    a.lineTo(np[1].x, np[1].y);
                    drawArrow(a, s * 1.25, t < 0 ? 0 : t);
                    break;
                case 's':
                    npTouch = calAng(getTouchPos(startNp, 7, 'B'));
                    npTouch1 = calAng(getTouchPos(startNp, 3, 'B'));

                    a.moveTo(np[0].x, np[0].y);
                    a.lineTo(hw + npTouch.x * touchDisToMid['B'] * hbw,
                        hh + npTouch.y * touchDisToMid['B'] * hbw);
                    a.lineTo(hw + npTouch1.x * touchDisToMid['B'] * hbw,
                        hh + npTouch1.y * touchDisToMid['B'] * hbw);
                    a.lineTo(np[1].x, np[1].y);
                    drawArrow(a, s * 1.25, t < 0 ? 0 : t);
                    break;
                case 'V':
                    a.moveTo(np[0].x, np[0].y);
                    a.lineTo(np[1].x, np[1].y);
                    a.lineTo(
                        hw + hbw * calAng(getNotePos((Math.round(endNp / 10 % 1 * 10) - 1) % 8, 0)).x,
                        hh + hbw * calAng(getNotePos((Math.round(endNp / 10 % 1 * 10) - 1) % 8, 0)).y);
                    drawArrow(a, s * 1.25, t < 0 ? 0 : t);
                    break;
                default:
                    ctx.beginPath();
                    ctx.moveTo(np[0].x, np[0].y);
                    ctx.lineTo(np[1].x, np[1].y);
                    ctx.stroke();
                    ctx.font = "30px Segoe UI";
                    ctx.fillText(startNp + '' + type + '' + endNp, np[1].x, np[1].y);
                    break;
            }
            ctx.font = "30px Segoe UI";
            ctx.fillText((startNp + 1) + '' + type + '' + (endNp + 1), np[0].x, np[0].y);
        }

        function drawHold(x, y, size, color, ang, l) {
            ang = ang - 0.125 * Math.PI;
            let s = hbw * settings.noteSize;
            size = size * s;
            size = Math.max(size, 0);
            ctx.shadowBlur = s * 0.2;
            ctx.shadowColor = 'black';
            ctx.lineWidth = size * 0.75;
            ctx.strokeStyle = 'white';
            function str() {
                ctx.beginPath();
                ctx.moveTo(x - size * calAng(ang).x,
                    y + size * calAng(ang).y);
                ctx.lineTo(x - size * calAng(ang + Math.PI / 3).x,
                    y + size * calAng(ang + Math.PI / 3).y);
                ctx.lineTo(x - size * calAng(ang + 2 * Math.PI / 3).x + l * calAng(ang).x,
                    y + size * calAng(ang + 2 * Math.PI / 3).y - l * calAng(ang).y);
                ctx.lineTo(x - size * calAng(ang + Math.PI).x + l * calAng(ang).x,
                    y + size * calAng(ang + Math.PI).y - l * calAng(ang).y);

                ctx.lineTo(x - size * calAng(ang + 4 * Math.PI / 3).x + l * calAng(ang).x,
                    y + size * calAng(ang + 4 * Math.PI / 3).y - l * calAng(ang).y);
                ctx.lineTo(x - size * calAng(ang + 5 * Math.PI / 3).x,
                    y + size * calAng(ang + 5 * Math.PI / 3).y);
                ctx.lineTo(x - size * calAng(ang).x,
                    y + size * calAng(ang).y);
                ctx.lineTo(x - size * calAng(ang + Math.PI / 3).x,
                    y + size * calAng(ang + Math.PI / 3).y);
                ctx.stroke();
            }
            str();
            ctx.shadowBlur = 0;
            ctx.shadowColor = '#00000000';
            ctx.lineWidth = size * 0.5;
            ctx.strokeStyle = color;
            str();
        }

        function drawTouch(pos, size, color, type, distance, opacity, holdtime, t = 0) {
            opacity = Math.min(Math.max(opacity, 0), 1);
            color = 'rgba(' + parseInt(color.substring(1, 3), 16) + ',' + parseInt(color.substring(3, 5), 16) + ',' + parseInt(color.substring(5, 7), 16) + ',' + opacity + ')'
            let s = hbw * settings.noteSize;
            size = size * s;
            size = Math.max(size, 0);
            let touchDisToMid = {
                "A": 1,
                "B": 0.475,
                "C": 0,
                "D": 1,
                "E": 0.675,
            };
            let touchAngleOffset = {
                "A": 1,
                "B": 0,
                "C": 0,
                "D": 0.5,
                "E": 0.5,
            }
            let ang = (pos - 0.5 - touchAngleOffset[type]) / 4 * Math.PI;
            let np = calAng(ang);
            ctx.shadowBlur = s * 0.2;
            ctx.shadowColor = 'rgba(0,0,0,' + opacity + ')';
            ctx.lineWidth = size * 0.6;
            distance += 0.6;
            ctx.strokeStyle = 'rgba(255,255,255,' + opacity + ')';
            function str() {
                ctx.beginPath();
                ctx.moveTo(
                    hw + np.x * touchDisToMid[type] * hbw,
                    hh + np.y * touchDisToMid[type] * hbw - size * distance);
                ctx.lineTo(
                    hw + np.x * touchDisToMid[type] * hbw + size,
                    hh + np.y * touchDisToMid[type] * hbw - size * (1 + distance));
                ctx.lineTo(
                    hw + np.x * touchDisToMid[type] * hbw - size,
                    hh + np.y * touchDisToMid[type] * hbw - size * (1 + distance));
                ctx.lineTo(
                    hw + np.x * touchDisToMid[type] * hbw,
                    hh + np.y * touchDisToMid[type] * hbw - size * distance);
                ctx.lineTo(
                    hw + np.x * touchDisToMid[type] * hbw + size,
                    hh + np.y * touchDisToMid[type] * hbw - size * (1 + distance));
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(
                    hw + np.x * touchDisToMid[type] * hbw - size * distance,
                    hh + np.y * touchDisToMid[type] * hbw);
                ctx.lineTo(
                    hw + np.x * touchDisToMid[type] * hbw - size * (1 + distance),
                    hh + np.y * touchDisToMid[type] * hbw - size);
                ctx.lineTo(
                    hw + np.x * touchDisToMid[type] * hbw - size * (1 + distance),
                    hh + np.y * touchDisToMid[type] * hbw + size);
                ctx.lineTo(
                    hw + np.x * touchDisToMid[type] * hbw - size * distance,
                    hh + np.y * touchDisToMid[type] * hbw);
                ctx.lineTo(
                    hw + np.x * touchDisToMid[type] * hbw - size * (1 + distance),
                    hh + np.y * touchDisToMid[type] * hbw - size);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(
                    hw + np.x * touchDisToMid[type] * hbw,
                    hh + np.y * touchDisToMid[type] * hbw + size * distance);
                ctx.lineTo(
                    hw + np.x * touchDisToMid[type] * hbw + size,
                    hh + np.y * touchDisToMid[type] * hbw + size * (1 + distance));
                ctx.lineTo(
                    hw + np.x * touchDisToMid[type] * hbw - size,
                    hh + np.y * touchDisToMid[type] * hbw + size * (1 + distance));
                ctx.lineTo(
                    hw + np.x * touchDisToMid[type] * hbw,
                    hh + np.y * touchDisToMid[type] * hbw + size * distance);
                ctx.lineTo(
                    hw + np.x * touchDisToMid[type] * hbw + size,
                    hh + np.y * touchDisToMid[type] * hbw + size * (1 + distance));
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(
                    hw + np.x * touchDisToMid[type] * hbw + size * distance,
                    hh + np.y * touchDisToMid[type] * hbw);
                ctx.lineTo(
                    hw + np.x * touchDisToMid[type] * hbw + size * (1 + distance),
                    hh + np.y * touchDisToMid[type] * hbw - size);
                ctx.lineTo(
                    hw + np.x * touchDisToMid[type] * hbw + size * (1 + distance),
                    hh + np.y * touchDisToMid[type] * hbw + size);
                ctx.lineTo(
                    hw + np.x * touchDisToMid[type] * hbw + size * distance,
                    hh + np.y * touchDisToMid[type] * hbw);
                ctx.lineTo(
                    hw + np.x * touchDisToMid[type] * hbw + size * (1 + distance),
                    hh + np.y * touchDisToMid[type] * hbw - size);
                ctx.stroke();

                _arc(hw + np.x * touchDisToMid[type] * hbw, hh + np.y * touchDisToMid[type] * hbw, size * 0.15)
            }
            function strCh(fill = false) {
                ctx.fillStyle = 'rgba(250,73,4,' + opacity + ')';
                if (fill) ctx.strokeStyle = 'rgba(250,73,4,' + opacity + ')';
                ctx.beginPath();
                ctx.moveTo(
                    hw + np.x * touchDisToMid[type] * hbw + size * distance,
                    hh + np.y * touchDisToMid[type] * hbw - size * distance);
                ctx.lineTo(
                    hw + np.x * touchDisToMid[type] * hbw + size * distance,
                    hh + np.y * touchDisToMid[type] * hbw - size * (1 + distance) * Math.sqrt(2));
                ctx.lineTo(
                    hw + np.x * touchDisToMid[type] * hbw + size * (1 + distance) * Math.sqrt(2),
                    hh + np.y * touchDisToMid[type] * hbw - size * distance);
                ctx.lineTo(
                    hw + np.x * touchDisToMid[type] * hbw + size * distance,
                    hh + np.y * touchDisToMid[type] * hbw - size * distance);
                ctx.lineTo(
                    hw + np.x * touchDisToMid[type] * hbw + size * distance,
                    hh + np.y * touchDisToMid[type] * hbw - size * (1 + distance) * Math.sqrt(2));
                if (fill) ctx.fill();
                ctx.stroke();

                ctx.fillStyle = 'rgba(0,141,244,' + opacity + ')';
                if (fill) ctx.strokeStyle = 'rgba(0,141,244,' + opacity + ')';
                ctx.beginPath();
                ctx.moveTo(
                    hw + np.x * touchDisToMid[type] * hbw - size * distance,
                    hh + np.y * touchDisToMid[type] * hbw - size * distance);
                ctx.lineTo(
                    hw + np.x * touchDisToMid[type] * hbw - size * distance,
                    hh + np.y * touchDisToMid[type] * hbw - size * (1 + distance) * Math.sqrt(2));
                ctx.lineTo(
                    hw + np.x * touchDisToMid[type] * hbw - size * (1 + distance) * Math.sqrt(2),
                    hh + np.y * touchDisToMid[type] * hbw - size * distance);
                ctx.lineTo(
                    hw + np.x * touchDisToMid[type] * hbw - size * distance,
                    hh + np.y * touchDisToMid[type] * hbw - size * distance);
                ctx.lineTo(
                    hw + np.x * touchDisToMid[type] * hbw - size * distance,
                    hh + np.y * touchDisToMid[type] * hbw - size * (1 + distance) * Math.sqrt(2));
                if (fill) ctx.fill();
                ctx.stroke();

                ctx.fillStyle = 'rgba(245,238,0,' + opacity + ')';
                if (fill) ctx.strokeStyle = 'rgba(245,238,0,' + opacity + ')';
                ctx.beginPath();
                ctx.moveTo(
                    hw + np.x * touchDisToMid[type] * hbw + size * distance,
                    hh + np.y * touchDisToMid[type] * hbw + size * distance);
                ctx.lineTo(
                    hw + np.x * touchDisToMid[type] * hbw + size * distance,
                    hh + np.y * touchDisToMid[type] * hbw + size * (1 + distance) * Math.sqrt(2));
                ctx.lineTo(
                    hw + np.x * touchDisToMid[type] * hbw + size * (1 + distance) * Math.sqrt(2),
                    hh + np.y * touchDisToMid[type] * hbw + size * distance);
                ctx.lineTo(
                    hw + np.x * touchDisToMid[type] * hbw + size * distance,
                    hh + np.y * touchDisToMid[type] * hbw + size * distance);
                ctx.lineTo(
                    hw + np.x * touchDisToMid[type] * hbw + size * distance,
                    hh + np.y * touchDisToMid[type] * hbw + size * (1 + distance) * Math.sqrt(2));
                if (fill) ctx.fill();
                ctx.stroke();

                ctx.fillStyle = 'rgba(17,167,105,' + opacity + ')';
                if (fill) ctx.strokeStyle = 'rgba(17,167,105,' + opacity + ')';
                ctx.beginPath();
                ctx.moveTo(
                    hw + np.x * touchDisToMid[type] * hbw - size * distance,
                    hh + np.y * touchDisToMid[type] * hbw + size * distance);
                ctx.lineTo(
                    hw + np.x * touchDisToMid[type] * hbw - size * distance,
                    hh + np.y * touchDisToMid[type] * hbw + size * (1 + distance) * Math.sqrt(2));
                ctx.lineTo(
                    hw + np.x * touchDisToMid[type] * hbw - size * (1 + distance) * Math.sqrt(2),
                    hh + np.y * touchDisToMid[type] * hbw + size * distance);
                ctx.lineTo(
                    hw + np.x * touchDisToMid[type] * hbw - size * distance,
                    hh + np.y * touchDisToMid[type] * hbw + size * distance);
                ctx.lineTo(
                    hw + np.x * touchDisToMid[type] * hbw - size * distance,
                    hh + np.y * touchDisToMid[type] * hbw + size * (1 + distance) * Math.sqrt(2));
                if (fill) ctx.fill();
                ctx.stroke();

                ctx.strokeStyle = color;
                _arc(hw + np.x * touchDisToMid[type] * hbw, hh + np.y * touchDisToMid[type] * hbw, size * 0.15);
            }
            function strPrg(t) {
                ctx.lineWidth = size * 0.8;
                let dis_1 = t, dis_2 = t - 0.25, dis_3 = t - 0.5, dis_4 = t - 0.75;
                dis_1 = dis_1 < 0 ? 0 : dis_1;
                dis_2 = dis_2 < 0 ? 0 : dis_2;
                dis_3 = dis_3 < 0 ? 0 : dis_3;
                dis_4 = dis_4 < 0 ? 0 : dis_4;
                if (t >= 0) {
                    dis_1 = dis_1 >= 0.25 ? 0.25 : dis_1;
                    dis_1 = dis_1 / 0.25;
                    dis_1 *= size * (3 + distance) * Math.sqrt(2);
                    dis_2 = dis_2 >= 0.25 ? 0.25 : dis_2;
                    dis_2 = dis_2 / 0.25;
                    dis_2 *= size * (3 + distance) * Math.sqrt(2);
                    dis_3 = dis_3 >= 0.25 ? 0.25 : dis_3;
                    dis_3 = dis_3 / 0.25;
                    dis_3 *= size * (3 + distance) * Math.sqrt(2);
                    dis_4 = dis_4 >= 0.25 ? 0.25 : dis_4;
                    dis_4 = dis_4 / 0.25;
                    dis_4 *= size * (3 + distance) * Math.sqrt(2);

                    ctx.strokeStyle = 'rgb(250,73,4)';
                    ctx.beginPath();
                    ctx.moveTo(
                        hw + np.x * touchDisToMid[type] * hbw,
                        hh + np.y * touchDisToMid[type] * hbw - size * (3 + distance));
                    ctx.lineTo(
                        hw + np.x * touchDisToMid[type] * hbw + calAng(Math.PI * 0.75).x * dis_1,
                        hh + np.y * touchDisToMid[type] * hbw - size * (3 + distance) + calAng(Math.PI * 0.75).y * dis_1);
                    ctx.stroke();

                    ctx.strokeStyle = 'rgb(245,238,0)';
                    ctx.beginPath();
                    ctx.moveTo(
                        hw + np.x * touchDisToMid[type] * hbw + size * (3 + distance),
                        hh + np.y * touchDisToMid[type] * hbw);
                    ctx.lineTo(
                        hw + np.x * touchDisToMid[type] * hbw + size * (3 + distance) + calAng(Math.PI * 1.25).x * dis_2,
                        hh + np.y * touchDisToMid[type] * hbw + calAng(Math.PI * 1.25).y * dis_2);
                    ctx.stroke();

                    ctx.strokeStyle = 'rgb(17,167,105)';
                    ctx.beginPath();
                    ctx.moveTo(
                        hw + np.x * touchDisToMid[type] * hbw,
                        hh + np.y * touchDisToMid[type] * hbw + size * (3 + distance));
                    ctx.lineTo(
                        hw + np.x * touchDisToMid[type] * hbw + calAng(Math.PI * 1.75).x * dis_3,
                        hh + np.y * touchDisToMid[type] * hbw + size * (3 + distance) + calAng(Math.PI * 1.75).y * dis_3);
                    ctx.stroke();

                    ctx.strokeStyle = 'rgb(0,141,244)';
                    ctx.beginPath();
                    ctx.moveTo(
                        hw + np.x * touchDisToMid[type] * hbw - size * (3 + distance),
                        hh + np.y * touchDisToMid[type] * hbw);
                    ctx.lineTo(
                        hw + np.x * touchDisToMid[type] * hbw - size * (3 + distance) + calAng(Math.PI * 0.25).x * dis_4,
                        hh + np.y * touchDisToMid[type] * hbw + calAng(Math.PI * 0.25).y * dis_4);
                    ctx.stroke();
                }
            }
            if (holdtime) {
                strPrg(t / holdtime);
                ctx.lineWidth = size * 0.6;
                ctx.strokeStyle = 'rgba(255,255,255,' + opacity + ')';
                strCh();
            } else {
                str();
            }
            ctx.shadowBlur = 0;
            ctx.shadowColor = '#00000000';
            ctx.lineWidth = size * 0.35;
            ctx.strokeStyle = color;
            if (holdtime) {
                strCh(true);
            } else {
                str();
            }
        }

        function _arc(x, y, r = 0) {
            ctx.beginPath();
            ctx.arc(x, y, r, 0, 2 * Math.PI);
            ctx.stroke();
        }

        requestAnimationFrame(update);
    }

    update();
});

function getImgs() {
    let Images = {};
    Images.outline = $("#outline")[0],
        Images.sensor = $("#sensor")[0],
        Images.tap = $("#tap")[0],
        Images.break = $("#break")[0],
        Images.each = $("#each")[0],
        Images.tap_ex = $("#tap_ex")[0],

        Images.hold = $("#hold")[0],
        Images.hold_break = $("#hold_break")[0],
        Images.hold_each = $("#hold_each")[0],
        Images.hold_ex = $("#hold_ex")[0],

        Images.star = $("#star")[0],
        Images.star_break = $("#star_break")[0],
        Images.star_each = $("#star_each")[0];
    return Images;
}
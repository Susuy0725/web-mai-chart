let settings = {
    'distanceToMid': 0.28,
    'useStroke': true,
    'noteSpeed': 1,
    'noteSize': 0.09,
    'speed': 2,
    'pinkStar': false,
    'touchSpeed': 3,
},
    play = {
        'pause': false,
        'btnPause': false,
    };

let notes = [{}],
    startTime;

$(document).ready(function () {
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

    ctx.canvas.width = doc_width;
    ctx.canvas.height = (doc_height - $('.controls').height()) * 2;

    controls.play.text(icons[0]);

    $editor.on("input", function (e) {
        data = $editor.val()
        try {
            notes = simai_decode(data);
        } catch (error) {
            console.error(error);
        }
        startTime = Date.now();
        controls.timeline.prop("max", notes[notes.length - 1].time / 1000);
    });

    controls.timeline
        .on("mousedown touchstart", function () {
            play.pause = true;
        })
        .on("mouseup touchend", function () {
            startTime = Date.now() - $(this).val() * 1000
            play.pause = play.btnPause;
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
    });

    $editor.html(example);

    try {
        notes = simai_decode(data);
    } catch (error) {
        console.error(error);
    }

    controls.timeline.prop("max", notes[notes.length - 1].time / 1000);

    startTime = Date.now();

    let noteImages = getImgs();

    $(window).on("resize", function (e) {
        doc_width = $(document).width(), doc_height = $(document).height();
    })

    function update() {
        if (!play.pause) controls.timeline.val((Date.now() - startTime) / 1000);
        const t = controls.timeline.val() * 1000;
        let _p = controls.timeline.val() / (controls.timeline.prop('max') - controls.timeline.prop('min')) * 100;
        controls.timeline.css('background',
            `linear-gradient(to right ,
            ${_sliderColor[0]} 0%,
            ${_sliderColor[0]} ${_p}%,
            ${_sliderColor[1]} ${_p}%,
             ${_sliderColor[1]} 100%)`
        ),
            ctx.canvas.width = doc_width,
            ctx.canvas.height = (doc_height - $('.controls').height()) * 2;

        let w = ctx.canvas.width,
            h = ctx.canvas.height,
            hw = w / 2,
            hh = h / 2;
        ctx.clearRect(0, 0, w, h);

        let bw = (h > w ? w : h),
            //bw means circle screen width
            hbw = (bw / 2)
            //hbw means half of it
            ;

        ctx.drawImage(noteImages.outline,
            (h > w ? -7 : (w - h) / 2), (h > w ? (h - w) / 2 - 7 : 0),
            bw * 1.0175, bw * 1.0175);

        ctx.drawImage(noteImages.sensor,
            (h > w ? 0 : (w - h) / 2), (h > w ? (h - w) / 2 : 0),
            bw, bw);

        //tap and hold render
        for (let i = notes.length - 1; i >= 0; i--) {
            let note = notes[i];

            if (!note.starTime && !note.touch) {
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

                if (_t >= (settings.distanceToMid - 2) / settings.speed && _t <= (note.holdTime ?? 0)) {
                    let d = (1 - settings.distanceToMid);
                    let nang = (parseInt(note.pos[0]) - 1) % 8;
                    nang = nang < 0 ? 0 : nang;
                    np = notePosition[isNaN(nang) ? 0 : nang];
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

                if (_t >= -2 / settings.touchSpeed && _t <= (note.touchTime ?? 0)) {
                    drawTouch(note.pos, 0.8, color, note.touch, ani1(_t < 0 ? -_t : 0) * 0.65);
                    //ctx.font = "50px Segoe UI";
                    //ctx.fillText((Math.min(_t, 0) + (d / settings.speed)) / (d / settings.speed), np.x, np.y);
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

        function drawTouch(pos, size, color, type, distance) {
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
            ctx.shadowColor = 'black';
            ctx.lineWidth = size * 0.6;
            distance += 0.6;
            ctx.strokeStyle = 'white';
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
            str();
            ctx.shadowBlur = 0;
            ctx.shadowColor = '#00000000';
            ctx.lineWidth = size * 0.35;
            ctx.strokeStyle = color;
            str();
        }

        function _arc(x, y, r = 0) {
            ctx.beginPath();
            ctx.arc(x, y, r, 0, 2 * Math.PI);
            ctx.stroke();
        }

        requestAnimationFrame(update);
    } requestAnimationFrame(update);
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

function simai_decode(_data) {
    // 先移除空白與換行
    _data = _data.replace(/(\r\n|\n|\r| )/gm, "");
    let tempNote = [],
        dataTemp = _data.split(","),
        timeSum = 0,
        slice = 1,
        bpm = 60;

    // 基本 note 解析（依據逗號分隔，每筆 note 記錄原始 pos 與時間）
    for (let i = 0; i < dataTemp.length; i++) {
        let data = dataTemp[i];
        if (data) {
            // 解析 BPM 設定：用括號包住的數字，例如 "(120)"
            while (data.includes("(") && data.includes(")")) {
                bpm = parseFloat(data.slice(data.indexOf("(") + 1, data.indexOf(")")));
                if (data.lastIndexOf("(") < data.indexOf(")")) {
                    data = data.slice(0, data.slice(0, data.indexOf(")")).lastIndexOf("(")) +
                        data.slice(data.indexOf(")") + 1);
                } else {
                    break;
                }
            }
            dataTemp[i] = data;

            // 解析切分設定：用大括號包住的數字，例如 "{2}"
            while (data.includes("{") && data.includes("}")) {
                slice = parseFloat(data.slice(data.lastIndexOf("{") + 1, data.indexOf("}")));
                data = data.slice(data.indexOf("}") + 1);
            }
            dataTemp[i] = data;

            // 若有 "/" 則表示此節拍內有多個 note
            if (data.includes("/")) {
                data = data.split("/");
                for (let j = 0; j < data.length; j++) {
                    if (data[j] === "") continue;
                    tempNote.push({ pos: data[j], time: timeSum, bpm });
                }
            }
            if (data.length > 1 && !isNaN(data)) {
                for (let j = 0; j < data.length; j++) {
                    tempNote.push({ pos: data[j], time: timeSum, bpm });
                }
            }
            data = dataTemp[i];
        }
        if (!(data.includes("/")) && data && !(data.length > 1 && !isNaN(data))) {
            tempNote.push({ pos: dataTemp[i], time: timeSum, bpm });
        }
        // 累加時間：此處公式依 slice 與 bpm 計算，4000 為單位比例，可依需求調整
        timeSum += (1 / slice) * (60 / bpm) * 4000;
    }

    // ──────────────────────────────
    // 輔助函式：解析 [參數] 部分，支援多種格式
    function parseParameter(param, currentBpm) {
        // 格式 4： x##y → BPM override 與直接秒數
        if (param.includes("##")) {
            let [bpmOverride, sec] = param.split("##");
            return { time: parseFloat(sec), bpmOverride: parseFloat(bpmOverride), type: "direct" };
        }
        // 格式 2： x#y:z → BPM override 及拍數計算（x#y:z）
        else if (param.includes("#") && param.includes(":")) {
            let parts = param.split("#");
            let bpmOverride = parseFloat(parts[0]);
            let [beatCount, noteDiv] = parts[1].split(":").map(Number);
            return { time: (60 / bpmOverride) * (beatCount / (noteDiv / 4)), bpmOverride, type: "beats" };
        }
        // 格式 3： x#y → 延遲與秒數（直接用秒數）
        else if (param.includes("#")) {
            let [delay, sec] = param.split("#");
            return { delay: parseFloat(delay), time: parseFloat(sec), type: "delay" };
        }
        // 格式 1： x:y → 以當前 bpm 及拍數計算
        else if (param.includes(":")) {
            let [noteDiv, beatCount] = param.split(":").map(Number);
            return { time: (60 / currentBpm) * (beatCount / (noteDiv / 4)), type: "beats" };
        }
        else {
            return { time: NaN, type: "unknown" };
        }
    }
    // ──────────────────────────────

    // 第二階段：針對每個 note 解析各種附加標記（hold、slide、Touch、flags、星型連線）
    for (let i = 0; i < tempNote.length; i++) {
        let data = tempNote[i];

        // ── 解析 Hold ──
        // 支援格式： xh[4:1] 與 xh[##3]
        const holdMatch1 = data.pos.match(/(\d)h\[(\d+:\d+)\]/);
        const holdMatch2 = data.pos.match(/(\d)h\[(##\d+)\]/);
        if (holdMatch1) {
            const startPos = holdMatch1[1];
            const paramStr = holdMatch1[2]; // 如 "4:1"
            const result = parseParameter(paramStr, data.bpm);
            tempNote[i] = { pos: String(startPos), time: data.time, holdTime: result.time };
        } else if (holdMatch2) {
            const startPos = holdMatch2[1];
            const paramStr = holdMatch2[2]; // 如 "##3"
            const result = parseParameter(paramStr, data.bpm);
            tempNote[i] = { pos: String(startPos), time: data.time, holdTime: result.time };
        }

        // ── 解析 Slide ──
        // 定義單一 slide 正則：起始數字、slide 類型（支援多字元 pp、qq 或單一符號）、目標位置，後面以 [參數] 表示
        const slideRegex = /^(\d)((?:pp)|(?:qq)|[-<>^vpqszVw])(\d)\[([^\]]+)\]/;
        const chainIndicator = "*";
        if (data.pos.includes(chainIndicator) && data.pos.includes("[")) {
            // 鏈式 slide 範例： 1-2[4:1]*<3[4:1]*>4[4:1]
            let parts = data.pos.split(chainIndicator);
            let mainMatch = parts[0].match(slideRegex);
            if (mainMatch) {
                let startPos = mainMatch[1],
                    slideType = mainMatch[2],
                    firstConnect = mainMatch[3],
                    paramStr = mainMatch[4];
                let result = parseParameter(paramStr, data.bpm);
                let chainSegments = [];
                chainSegments.push({
                    type: slideType,
                    connect: String(firstConnect),
                    slideTime: result.time,
                    ...(result.delay !== undefined ? { slideDelay: result.delay } : {}),
                    ...(result.bpmOverride !== undefined ? { slideBpm: result.bpmOverride } : {})
                });
                // 後續每段格式： ?{slideType}{目標}[參數]
                for (let j = 1; j < parts.length; j++) {
                    let segMatch = parts[j].match(/^((?:pp)|(?:qq)|[-<>^vpqszVw])(\d)\[([^\]]+)\]/);
                    if (segMatch) {
                        let segType = segMatch[1],
                            segConnect = segMatch[2],
                            segParam = segMatch[3];
                        let resultSeg = parseParameter(segParam, data.bpm);
                        chainSegments.push({
                            type: segType,
                            connect: String(segConnect),
                            slideTime: resultSeg.time,
                            ...(resultSeg.delay !== undefined ? { slideDelay: resultSeg.delay } : {}),
                            ...(resultSeg.bpmOverride !== undefined ? { slideBpm: resultSeg.bpmOverride } : {})
                        });
                    }
                }
                tempNote[i] = {
                    pos: String(startPos),
                    time: data.time,
                    slide: true,
                    chain: chainSegments
                };
            }
        } else if (data.pos.includes("[") && data.pos.match(slideRegex)) {
            // 單一 slide 範例： 1-2[4:1] 或 1-2[##2]
            let slideMatch = data.pos.match(slideRegex);
            if (slideMatch) {
                const startPos = slideMatch[1],
                    slideType = slideMatch[2],
                    endPos = slideMatch[3],
                    paramStr = slideMatch[4];
                let result = parseParameter(paramStr, data.bpm);
                tempNote[i] = {
                    pos: String(startPos),
                    time: data.time,
                    slide: true,
                    type: slideType,
                    connect: String(endPos),
                    slideTime: result.time,
                    ...(result.delay !== undefined ? { slideDelay: result.delay } : {}),
                    ...(result.bpmOverride !== undefined ? { slideBpm: result.bpmOverride } : {})
                };
            }
        }

        // ── 解析 Touch ──
        // Touch 格式：A1~8、B1~8、C、D1~8、E1~8，若有參數則用 h[參數] 表示
        // 例：A3h[4:1] → 起始位置 3，touch 類型 A，touchTime 依 [參數] 計算
        const touchMatch = data.pos.match(/^([ABCDE])([1-8])?(?:h\[(.+)\])?/);
        if (touchMatch) {
            let letter = touchMatch[1],
                digit = touchMatch[2] || ""; // 若無數字，例如 C，則預設後續處理
            // 當有參數括號時，解析參數；若無則 touchTime 預設為 0
            if (touchMatch[3]) {
                let paramStr = touchMatch[3];
                let result = parseParameter(paramStr, data.bpm);
                tempNote[i] = {
                    pos: digit || "1",
                    time: data.time,
                    touch: letter,
                    touchTime: result.time
                };
            } else {
                // 無參數情況下，僅標記 touch，並以數字或預設 "1" 當作 pos
                tempNote[i] = {
                    pos: digit || "1",
                    time: data.time,
                    touch: letter
                };
            }
        }

        // ── 處理其他 Flags ──
        const flags = {
            "b": "break",
            "x": "ex",
            "f": "hibana",
            "$": "star",
        };
        for (let flag in flags) {
            if (data.pos.includes(flag)) {
                tempNote[i].pos = tempNote[i].pos.replaceAll(flag, "");
                tempNote[i][flags[flag]] = true;
            }
        }

        // ── 處理星型連線 ──
        // 格式範例： 123-456[4:1] 中的 star 可透過特殊符號解析（此處維持原邏輯）
        const starMatch = data.pos.match(/(\d+)([-^v<>VqQpPszw]+)(\d+)\[(\d+):(\d+)\]/);
        if (starMatch) {
            const [, startPos, symbol, endPos, x, y] = starMatch;
            const ratio = isFinite(y / x) ? y / x : 0;
            const starTime = ratio * (60 / data.bpm) * 4;
            tempNote[i].pos = startPos;
            tempNote[i].star = true;
            tempNote.splice(i + 1, 0, {
                pos: startPos,
                time: data.time,
                starTime,
                type: symbol,
                connect: endPos,
            });
            i++;
        }

        delete tempNote[i].bpm;
    }

    // 初始化 triggered 陣列（依 note 數量建立對應布林值）
    triggered = [];
    for (let index = 0; index < tempNote.length; index++) {
        triggered.push(false);
    }

    console.log(tempNote);
    return tempNote;
}
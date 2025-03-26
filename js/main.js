let settings = {
    'distanceToMid': 0.28,
    'useStroke': true,
    'noteSpeed': 1,
    'noteSize': 0.09,
    'speed': 2,
    'pinkStar': false,
    'touchSpeed': 1,
},
    play = {
        'pause': false,
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
        data = example,
        $timeline = $("#timeline");

    ctx.canvas.width = doc_width;
    ctx.canvas.height = doc_height * 2;

    $editor.on("input", function (e) {
        data = $editor.val()
        try {
            notes = simai_decode(data);
        } catch (error) {
            console.error(error);
        }
        startTime = Date.now();
        $timeline.prop("max", notes[notes.length - 1].time / 1000);
    });

    $timeline
        .on("input", function (e) {
            startTime = Date.now() - $(this).val() * 1000;
            console.log(play);
        })
        .click(function (e) {
            play.pause = true;
        })
        .blur(function (e) {
            startTime = Date.now() - $(this).val() * 1000;
            play.pause = false;
        });

    $editor.html(example);

    try {
        notes = simai_decode(data);
    } catch (error) {
        console.error(error);
    }

    $timeline.prop("max", notes[notes.length - 1].time / 1000);

    startTime = Date.now();

    let noteImages = getImgs();

    $(window).on("resize", function (e) {
        doc_width = $(document).width(), doc_height = $(document).height();
    })

    function update() {
        if (!play.pause) $timeline.val((Date.now() - startTime) / 1000);
        const t = $timeline.val() * 1000;
        ctx.canvas.width = doc_width;
        ctx.canvas.height = doc_height * 2;
        let w = ctx.canvas.width,
            h = ctx.canvas.height,
            hw = w / 2,
            hh = h / 2;
        ctx.clearRect(0, 0, w, h);

        let bw = (h > w ? w : h),
            hbw = (bw / 2);

        ctx.drawImage(noteImages.outline,
            (h > w ? -7 : (w - h) / 2), (h > w ? (h - w) / 2 - 7 : 0),
            bw * 1.0175, bw * 1.0175);

        for (let i = notes.length - 1; i >= 0; i--) {
            let notePosition = [];
            for (let i = 0; i < 8; i++) {
                let ang = (i + 0.5) / 4 * Math.PI;
                notePosition.push(calAng(ang));
            }

            let note = notes[i];
            let _t = ((t - note.time) / 1000);
            let color = '#FF50AA';
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
            if (!note.starTime && !note.touch) {
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
    _data = _data.replace(/(\r\n|\n|\r| )/gm, "");
    let tempNote = [], dataTemp = _data.split(",");
    let timeSum = 0;
    let slice = 1;
    let bpm = 60;

    for (let i = 0; i < dataTemp.length; i++) {
        let data = dataTemp[i];

        if (data) {
            while (data.includes("(") && data.includes(")")) {
                bpm = parseFloat(data.slice(data.indexOf("(") + 1, data.indexOf(")")));
                if (data.lastIndexOf("(") < data.indexOf(")")) {
                    data = data.slice(0, data.slice(0, data.indexOf(")")).lastIndexOf("(")) + data.slice(data.indexOf(")") + 1, data.length);
                } else {
                    break;
                }
            }
            dataTemp[i] = data;

            while (data.includes("{") && data.includes("}")) {
                slice = parseFloat(data.slice(data.lastIndexOf("{") + 1, data.indexOf("}")));
                data = data.slice(data.indexOf("}") + 1, data.length);
            }
            dataTemp[i] = data;

            if (data.includes("/")) {
                data = data.split("/");
                for (let j = 0; j < data.length; j++) {
                    if (data[j] == "") {
                        continue;
                    }
                    tempNote.push({ 'pos': data[j], 'time': timeSum, bpm });
                }
            }

            if (data.length > 1 && !isNaN(data)) {
                for (let j = 0; j < data.length; j++) {
                    tempNote.push({ 'pos': data[j], 'time': timeSum, bpm });
                }
            }
            data = dataTemp[i];
        }

        if (!(data.includes("/")) && data && !(data.length > 1 && !isNaN(data))) { tempNote.push({ 'pos': dataTemp[i], 'time': timeSum, bpm }); }
        timeSum += (1 / slice) * (60 / bpm) * 4000;
    }

    for (let i = 0; i < tempNote.length; i++) {
        let data = tempNote[i];

        const holdMatch = data.pos.match(/h\[(\d+):(\d+)\]/);

        if (holdMatch) {
            const [_, x, y] = holdMatch.map(Number);
            const ratio = isFinite(y / x) ? y / x : 0;  // 防止 Infinity
            const holdTime = ratio * (60 / data.bpm) * 4;

            tempNote[i] = {
                pos: data.pos.replace(/h\[\d+:\d+\]/, ""), // 移除 hold 標記
                time: data.time,
                holdTime
            };
        }

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

        const touchTypes = ["A", "B", "C", "D", "E"];
        const firstChar = data.pos[0];

        if (touchTypes.includes(firstChar)) {
            tempNote[i].pos = data.pos.replace(firstChar, "");
            tempNote[i].touch = firstChar;

            if (tempNote[i].pos === "") {
                tempNote[i].pos = "1";  // C類型特殊處理
            }
        }

        const match = data.pos.match(/(\d+)([-^v<>VqQpPszw]+)(\d+)\[(\d+):(\d+)\]/);

        if (match) {
            const [_, startPos, symbol, endPos, x, y] = match;
            const ratio = isFinite(y / x) ? y / x : 0;
            const starTime = ratio * (60 / tempNote[i].bpm) * 4;

            // 更新原 note（起始點）
            tempNote[i].pos = startPos;
            tempNote[i].star = true;

            tempNote.splice(i + 1, 0, {
                pos: startPos,
                time: tempNote[i].time,
                starTime,
                type: symbol,
                connect: endPos,
            });
            i++;
        }

        delete tempNote[i].bpm;
    }

    triggered = [];
    for (let index = 0; index < tempNote.length; index++) { triggered.push(false); }

    console.log(tempNote);
    return tempNote;
}
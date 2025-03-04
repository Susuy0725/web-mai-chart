let c, ctx;
let data;
let note = [];
let startTime;
let triggered = []
let T = 0;
let sfxs = {
    'guide': null
}
let settings = {
    'speed': 1,
    'paused': true,
    'disToMid': 0.3,
    'noteThickness': 0.375,
    'noteSize': 2,
    'offset': 0,
    'touchSpeed': 1,
    'collaps': false
}
let noteImages = {
    'outline': null,

    'tap': null,
    'break': null,
    'each': null,
    'tap_ex': null,

    'hold': null,
    'hold_break': null,
    'hold_each': null,
}
let bgm;
let timeLine;

let example = `(203.0){1},
{8}3,2,1,8h[2:1],,7,6,5h[2:1],
{8},2,3,2h[2:1],,1,8,1,
{8}8,7,6,5h[2:1],,4,3,2h[2:1],
{8},3,4,5h[8:5],,6,7,8,
{2}2h[2:1],1h[2:1],
{2}8h[2:1],7h[2:1],
{8}6h[8:5],,,,,7h[8:1],8h[1:1],1h[8:7],{1},
{2}5h[2:1],6h[2:1],
{2}7h[2:1],8h[2:1],
{8}1h[8:5],,,,,8,1,2h[8:7]/7h[8:7],{1},
{8}8/1,7,4,6,7/3,5,2,7,
{8}8/1,7,4,6,7/3,5,2,7,
{8}1/8,2,5,3,2/6,4,7,2,
{8}1/8,2,5,3,2/6,4,7,2,
{8}5/4,6,1,7,6/2,8,3,6,
{8}5/4,6,1,7,6/2,8,3,6,
{8}4/5,3,8,2,3/7,1,6,3,
{8}4/5,3,8,2,3/7,1,6,3,
{8}8/1,7,7,7,8/1,2,2,2,
{8}5/4,6,6,6,5/4,3,3,3,
{8}4/6,5,5,5,5/3,4,4,4,
{8}7/5,6,6,6,4/2,3,3,3,
{8}1/7,2,1,2,3/7,2,3,2,
{8}8/2,7,8,7,2/6,7,6,7,
{8}7/3,4,3,4,5/7,4,5,4,
{8}3/7,6,7,6,3/5,6,5,6,
{8}4,5,2,5,1,5/1,,5/8h[8:9],
{8}6,5,,5,,5,,5,
{8}4,5,3,5,2,2/5,,5/2h[8:9],
{8}4,5,,5,,5,,5,
{8}3,4,7,4,8,4/8,,4/1h[2:1],
{8}5,4,,4,2/5,,6/1,,
{2}7-4[8:1]/8-3[8:1],1-6[8:1]/2-5[8:1],
{2}1^4[8:1]/8^5[8:1],6^3[8:1]/7^2[8:1],
{8}8,,6,7,,,5,,
{8}1,,3,2,,,8^5[8:1],,
{4}8-4[8:1],8-5[8:1],8-3[8:1],8^5[8:1],
{4}8-4[8:1],8-5[8:1],8-3[8:1],8,
{4},8,4,1,
{4}6h[2:1],,3,1-4[8:1],
{4}8-5[8:1],7-2[8:1],3-6[8:1],8-4[8:1],
{4}5^8[8:1],1^4[8:1],8-5[8:1],1,
{8}5,,2,3,,6,7,5,
{8}8,,4,5,,2,8-5[8:1],8,
{4}1-4[8:1],2-7[8:1],6-3[8:1],1-5[8:1],
{4}4^1[8:1],8^5[8:1],1-4[8:1],8,
{4},3/5,7/2,6/4,
{4}5h[8:3]/3h[8:3],,3/5,1^4[8:1]/8^5[8:1],
{8}1-4[8:1]/8-5[8:1],,1-5[8:1]/8-4[8:1],,1/8,,,6b/3b,
{16},,7b/2b,,,,8b/1b,,,,,,2b,7,2b,7,
{8}2,5/1,6,1/7,2,3/6,7,2/8,
{8}3,4/8,7,4/6,3,2/7,6,5/3,
{8}4,2/5,6,3/7,4,8/5,7,6/4,
{8}3,2/8,7,3/6,2,5/1,6,2/7,
{8}5/4,4/5,6/3,6/3,7/2,7/2,8/1,1/8,
{8}4/3,4/3,5/2,2/5,6/1,6/1,8/7,,
{2}7-4[8:1]/8-3[8:1],1-6[8:1]/2-5[8:1],
{2}1^4[8:1]/8^5[8:1],6^3[8:1]/7^2[8:1],
{8}1,2/8,7,2/6,3,7/4,6,3/5,
{8}4,3/5,4,5/3,2,1/4,5,2/6,
{8}1,8/2,7,2/8,1,8/2,7,6/2,
{8}8/1,3/5,7/2,4/6,8/3,5/1,7/4,6/2,
{8}1/3,,6/8,,5/3,6/4,,2/4,
{4},4/5,3/6,7/2,
{8}1h[2:1]/8h[2:1],,,,,7b/2b,6b/3b,4b/5b,
{4},,,5-2[1:2]/6-1[1:2],{1},,,
{4},,,1-4[1:2]/8-5[1:2],{1},,,
`;

$(document).ready(function () {
    settings.speed = parseFloat($("#speed").val());
    sfxs.guide = $("#sfx-guide")[0];
    bgm = $("#audio");
    timeLine = $("#time");
    bgm.volume = 0.75;

    $("#viewMode").prop("checked", settings.paused);
    $("#time").prop("disabled", !settings.paused);

    $("#offset").on("input", function () {
        settings.offset = parseFloat($(this).val());
        if (isNaN(settings.offset)) {
            settings.offset = 0;
        }
        if (!isNaN(bgm[0].duration)) {
            bgm[0].currentTime = T / 1000 + settings.offset;
        }
    });

    $("#music").on("input", function () {
        let file = $(this)[0].files[0];
        let reader = new FileReader();
        reader.onload = function (e) {
            bgm.attr('src', e.target.result);
        }
        reader.readAsDataURL(file);
        bgm[0].load();

        if (!settings.paused) {
            bgm[0].currentTime = T / 1000 + settings.offset;
            bgm[0].play();
        }
    });

    $("#collapse").on("click", function () {
        if (settings.collaps) {
            $("#editor").css("clip-path", "rect(0 100% 100% 0)");
            $("#render").css("width", "50%");
            $(".time-line").css("width", "50%");
            $(".bruh").css("width", "50%");
            $(this).html(">");
        } else {
            $("#editor").css("clip-path", "rect(0% 100% 100% 99.999%)");
            $("#render").css("width", "100%");
            $(".time-line").css("width", "100%");
            $(".bruh").css("width", "100%");
            $(this).html("<");
        }
        settings.collaps = !settings.collaps;

    });

    $("#editor")
        .html(example)
        .on("input", function () {
            data = $(this).val().replace(/(\r\n|\n|\r)/gm, "");
            try {
                note = simai_decode(data);
            } catch (error) {
                console.log(error);
            }
            if (!isNaN(bgm[0].duration)) {
                bgm[0].load();
                bgm[0].currentTime = T / 1000 + settings.offset;
            }
            settings.paused = true;
            $("#viewMode").prop("checked", settings.paused);
            $("#time").prop("disabled", !settings.paused);
            startTime = Date.now() - parseFloat($("#time").val());
            if (!settings.paused) {
                $("#time").val(0);
            }
        });

    $("#speed").on("input", function () {
        settings.speed = parseFloat($(this).val());
    });

    $("#viewMode").on("input", function () {
        settings.paused = $(this).prop("checked");
        $("#time").prop("disabled", !settings.paused);
        if (!isNaN(bgm[0].duration)) {
            settings.paused ? bgm[0].pause() : bgm[0].play();
        }
        startTime = Date.now() - parseFloat($("#time").val());
    });

    noteImages.outline = $("#outline")[0];
    noteImages.tap = $("#tap")[0];
    noteImages.break = $("#break")[0];
    noteImages.each = $("#each")[0];
    noteImages.tap_ex = $("#tap_ex")[0];

    noteImages.hold = $("#hold")[0];
    noteImages.hold_break = $("#hold_break")[0];
    noteImages.hold_each = $("#hold_each")[0];
    //noteImages.hold_ex = $("#hold_ex")[0];

    c = $("#render")[0];
    ctx = c.getContext("2d");
    data = $("#editor").val().replace(/(\r\n|\n|\r)/gm, "");
    try {
        note = simai_decode(data);
        startTime = Date.now();
    } catch (error) {
        console.log(error);
    }
    requestAnimationFrame(render);
});

function simai_decode(data) {
    let tempNote = [];
    triggered = []
    let dataTemp = data.split(",");
    let timeSum = 0;
    let slice = 1;
    let bpm = 60;

    for (let i = 0; i < dataTemp.length; i++) {
        let dat = dataTemp[i];

        if (dat) {
            while (dat.includes("(") && dat.includes(")")) {
                bpm = parseFloat(dat.slice(dat.indexOf("(") + 1, dat.indexOf(")")));
                if (dat.lastIndexOf("(") < dat.indexOf(")")) {
                    dat = dat.slice(0, dat.slice(0, dat.indexOf(")")).lastIndexOf("(")) + dat.slice(dat.indexOf(")") + 1, dat.length);
                } else {
                    break;
                }
            }
            dataTemp[i] = dat;

            while (dat.includes("{") && dat.includes("}")) {
                slice = parseFloat(dat.slice(dat.lastIndexOf("{") + 1, dat.indexOf("}")));
                dat = dat.slice(dat.indexOf("}") + 1, dat.length);
            }
            dataTemp[i] = dat;

            if (dat.includes("/")) {
                dat = dat.split("/");
                for (let j = 0; j < dat.length; j++) {
                    if (dat[j] == "") {
                        continue;
                    }
                    tempNote.push({ 'pos': dat[j], 'time': timeSum, bpm });
                }
            }

            if (dat.length > 1 && !isNaN(dat)) {
                for (let j = 0; j < dat.length; j++) {
                    tempNote.push({ 'pos': dat[j], 'time': timeSum, bpm });
                }
            }
            dat = dataTemp[i];
        }

        if (!(dat.includes("/")) && dat) { tempNote.push({ 'pos': dataTemp[i], 'time': timeSum, bpm }); }
        timeSum += (1 / slice) * (60 / bpm) * 4000;
    }

    for (let i = 0; i < tempNote.length; i++) {
        let dat = tempNote[i];

        if (dat.pos.indexOf("h") != -1 && dat.pos.includes("[") && dat.pos.includes("]")) {
            let temp = dat.pos.split("[");
            temp[1] = temp[1].slice(0, temp[1].indexOf("]"));
            temp[1] = temp[1].split(":");
            temp[1][0] = parseFloat(temp[1][0]);
            temp[1][1] = parseFloat(temp[1][1]);
            temp[1] = temp[1][1] / temp[1][0];
            temp[1] == Infinity ? temp[1] = 0 : null;
            temp[0] = temp[0].split("h");
            temp[0] = temp[0][0];
            tempNote[i] = ({ 'pos': temp[0], 'time': dat.time, 'holdTime': temp[1] * (60 / dat.bpm) * 4 });
            dat = tempNote[i];
        }

        if (dat.pos.includes("b")) {
            tempNote[i].pos = dat.pos.slice(0, dat.pos.indexOf("b")) + dat.pos.slice(dat.pos.indexOf("b") + 1, dat.pos.length);
            tempNote[i].break = true;
        }

        if (dat.pos.includes("x")) {
            tempNote[i].pos = dat.pos.slice(0, dat.pos.indexOf("x")) + dat.pos.slice(dat.pos.indexOf("x") + 1, dat.pos.length);
            tempNote[i].ex = true;
        }

        if (dat.pos.includes("f")) {
            tempNote[i].pos = dat.pos.slice(0, dat.pos.indexOf("f")) + dat.pos.slice(dat.pos.indexOf("f") + 1, dat.pos.length);
            tempNote[i].hibana = true;
        }

        if (dat.pos[0] == 'A') {
            tempNote[i].pos = dat.pos.slice(0, dat.pos.indexOf("A")) + dat.pos.slice(dat.pos.indexOf("A") + 1, dat.pos.length);
            tempNote[i].touch = 'A';
        }

        if (dat.pos[0] == 'B') {
            tempNote[i].pos = dat.pos.slice(0, dat.pos.indexOf("B")) + dat.pos.slice(dat.pos.indexOf("B") + 1, dat.pos.length);
            tempNote[i].touch = 'B';
        }

        if (dat.pos[0] == 'C') {
            tempNote[i].pos = dat.pos.slice(0, dat.pos.indexOf("C")) + dat.pos.slice(dat.pos.indexOf("C") + 1, dat.pos.length);
            if (tempNote[i].pos == '') {
                tempNote[i].pos = '1';
            }
            tempNote[i].touch = 'C';
        }

        if (dat.pos[0] == 'D') {
            tempNote[i].pos = dat.pos.slice(0, dat.pos.indexOf("D")) + dat.pos.slice(dat.pos.indexOf("D") + 1, dat.pos.length);
            tempNote[i].touch = 'D';
        }

        if (dat.pos[0] == 'E') {
            tempNote[i].pos = dat.pos.slice(0, dat.pos.indexOf("E")) + dat.pos.slice(dat.pos.indexOf("E") + 1, dat.pos.length);
            tempNote[i].touch = 'E';
        }

        if (dat.pos.includes("-")) {
            tempNote[i].pos = dat.pos.slice(0, dat.pos.indexOf("-")) + dat.pos.slice(dat.pos.indexOf("-") + 1, dat.pos.length);
        }

        delete tempNote[i].bpm;
    }

    for (let index = 0; index < tempNote.length; index++) {
        triggered.push(false);
    }
    if (tempNote.length != 0) {
        $("#time").prop("max", Math.max(tempNote[tempNote.length - 1].time + 1000, isNaN(bgm[0].duration) ? 0 : bgm[0].duration * 1000));
    }

    console.log(tempNote);
    return tempNote;
}

function render() {
    let tmax = parseFloat($('#time').prop('max'));
    ctx.canvas.width = $(document).width() / ($(document).width() / $("#render").width()) * 2;
    ctx.canvas.height = $(document).height() * 2;
    $("#bgm-time").html('/');

    ctx.clearRect(0, 0, c.width, c.height);
    ctx.drawImage(noteImages.outline, 0, ctx.canvas.height / 2 - ctx.canvas.width / 2, ctx.canvas.width, ctx.canvas.width);

    if (settings.paused) {
        T = parseFloat($("#time").val());
        bgm[0].currentTime = T / 1000 + settings.offset;
    } else {
        T = Date.now() - startTime;
        $("#time").val(T);
    }


    for (let i = note.length - 1; i >= 0; i--) {
        let n = note[i];
        let t = (T - n.time) / 1000;

        if (t >= 0) {
            if (!triggered[i]) {
                sfxs.guide.currentTime = 0;
                sfxs.guide.play();
            }
            triggered[i] = true;
        } else {
            triggered[i] = false;
        }

        if (!n.touch) {
            if (t >= -0.5 / (settings.speed)/* && !isNaN(n.pos)*/ && (t <= 0 || t <= n.holdTime)) {
                if (n.holdTime != null) {
                    hold(n.pos, ((- 0.5 - t * (settings.speed)) * ctx.canvas.width), n.holdTime * ctx.canvas.width * (settings.speed), ctx.canvas.width / 2 * 0.15, n);
                } else {
                    tap(n.pos, ((- 0.5 - t * (settings.speed)) * ctx.canvas.width), Math.abs(ctx.canvas.width / 2 * 0.15), n);
                }
            }
        } else {
            if (t >= -0.5 / (settings.touchSpeed) && (t <= 0 || t <= n.holdTime)) {
                if (n.holdTime != null) {
                    touch(n.pos, ((- 0.5 - t * settings.touchSpeed) * ctx.canvas.width), n.touch, n);
                } else {
                    touch(n.pos, ((- 0.5 - t * settings.touchSpeed) * ctx.canvas.width), n.touch, n);
                }
            }
        }
    }
    ctx.beginPath();
    ctx.strokeStyle = "black";
    ctx.font = "10px Arial";
    ctx.fillText("reading :" + triggered.indexOf(false), 10, 100);

    if ($("#loop").prop("checked") && !settings.paused && T >= tmax) {
        startTime = Date.now();
        T = 0;
        $("#time").val(0);
        if (!isNaN(bgm[0].duration)) {
            bgm[0].pause();
            bgm[0].currentTime = settings.offset;
            bgm[0].play();
        }
    }

    requestAnimationFrame(render);
}

function tap(pos, t, r, no) {
    pos = parseInt(pos[0]);
    if (isNaN(pos)) return;

    let ang = (0 - pos) / 8 * 2 * Math.PI + Math.PI / 8;
    let midX = ctx.canvas.width / 2;
    let midY = ctx.canvas.height / 2;
    let ax = Math.sin(ang);
    let ay = Math.cos(ang);
    let d = 0 - midX * settings.disToMid;
    let imgTemp;

    if (no.break) {
        imgTemp = noteImages.break;
    } else {
        let find = note.indexOf(note.find((element) => element.time == no.time));
        if (note[find + 1] != null) {
            if (note[find] != no || (note[find + 1].time == no.time && note[find + 1])) {
                imgTemp = noteImages.each;
            } else {
                imgTemp = noteImages.tap;
            }
        } else {
            imgTemp = noteImages.tap;
        }
    }

    if (d > t) {
        let tr = Math.max(r * settings.noteSize, 0);
        ctx.save();
        ctx.translate(midX + ax * t, midY + ay * t);
        ctx.rotate(ang + Math.PI / 4);

        ctx.drawImage(imgTemp, - tr / 2, - tr / 2, tr, tr);
        if (no.ex) {
            ctx.drawImage(noteImages.tap_ex, - tr / 2, - tr / 2, tr, tr);
        }

        ctx.restore();
    } else {
        let tr = Math.max(r * (t / d) * settings.noteSize, 0);
        ctx.save();
        ctx.translate(midX + ax * d, midY + ay * d);
        ctx.rotate(ang + Math.PI / 4);

        ctx.drawImage(imgTemp, - tr / 2, - tr / 2, tr, tr);
        if (no.ex) {
            ctx.drawImage(noteImages.tap_ex, - tr / 2, - tr / 2, tr, tr);
        }

        ctx.restore();
    }
}

function hold(pos, t, h, r, no) {
    pos = parseInt(pos[0]);
    if (isNaN(pos)) return;

    let ang = (0 - pos) / 8 * 2 * Math.PI + Math.PI / 8;
    let midX = ctx.canvas.width / 2;
    let midY = ctx.canvas.height / 2;
    let ax = Math.sin(ang);
    let ay = Math.cos(ang);
    let d = 0 - midX * settings.disToMid;
    let th = (1 - settings.noteThickness);
    let imgTemp;

    if (no.break) {
        ctx.strokeStyle = "#FF5000";
        imgTemp = noteImages.hold_break;
    } else {
        let find = note.indexOf(note.find((element) => element.time == no.time));
        if (note[find + 1] != null) {
            if (note[find] != no || (note[find + 1].time == no.time && note[find + 1])) {
                ctx.strokeStyle = "#FFDD00";
                imgTemp = noteImages.hold_each;
            } else {
                ctx.strokeStyle = "#FF00A0";
                imgTemp = noteImages.hold;
            }
        } else {
            ctx.strokeStyle = "#FF00A0";
            imgTemp = noteImages.hold;
        }
    }

    let b = { 'h': imgTemp.height, 'w': imgTemp.width };

    if (d > t) {
        ctx.lineWidth = r * settings.noteThickness;
        ctx.beginPath();
        ctx.moveTo(
            midX + ax * Math.max(t - r * th, 0 - midX - r * th),
            midY + ay * Math.max(t - r * th, 0 - midX - r * th));
        ctx.lineTo(
            midX + ax * Math.max(t - r * th, 0 - midX - r * th) + Math.sin(ang - 60 * Math.PI / 180) * (r * th),
            midY + ay * Math.max(t - r * th, 0 - midX - r * th) + Math.cos(ang - 60 * Math.PI / 180) * (r * th));
        ctx.lineTo(
            midX + ax * Math.min(t + h + r * th, d + r * th) + Math.sin(ang - 120 * Math.PI / 180) * (r * th),
            midY + ay * Math.min(t + h + r * th, d + r * th) + Math.cos(ang - 120 * Math.PI / 180) * (r * th));
        ctx.lineTo(
            midX + ax * Math.min(t + h + r * th, d + r * th),
            midY + ay * Math.min(t + h + r * th, d + r * th));
        ctx.lineTo(
            midX + ax * Math.min(t + h + r * th, d + r * th) + Math.sin(ang + 120 * Math.PI / 180) * (r * th),
            midY + ay * Math.min(t + h + r * th, d + r * th) + Math.cos(ang + 120 * Math.PI / 180) * (r * th));
        ctx.lineTo(
            midX + ax * Math.max(t - r * th, 0 - midX - r * th) + Math.sin(ang + 60 * Math.PI / 180) * (r * th),
            midY + ay * Math.max(t - r * th, 0 - midX - r * th) + Math.cos(ang + 60 * Math.PI / 180) * (r * th));
        ctx.lineTo(
            midX + ax * Math.max(t - r * th, 0 - midX - r * th),
            midY + ay * Math.max(t - r * th, 0 - midX - r * th));
        ctx.lineTo(
            midX + ax * Math.max(t - r * th, 0 - midX - r * th) + Math.sin(ang - 60 * Math.PI / 180) * (r * th),
            midY + ay * Math.max(t - r * th, 0 - midX - r * th) + Math.cos(ang - 60 * Math.PI / 180) * (r * th));
        ctx.stroke();

    } else {
        ctx.lineWidth = r * settings.noteThickness * t / d;
        ctx.beginPath();
        ctx.beginPath();
        ctx.moveTo(
            midX + ax * (d + r * th * t / d),
            midY + ay * (d + r * th * t / d));
        ctx.lineTo(
            midX + ax * (d + r * th * t / d) + Math.sin(ang + 120 * Math.PI / 180) * (r * th * t / d),
            midY + ay * (d + r * th * t / d) + Math.cos(ang + 120 * Math.PI / 180) * (r * th * t / d));
        ctx.lineTo(
            midX + ax * (d + r * th * -t / d) + Math.sin(ang + 60 * Math.PI / 180) * (r * th * t / d),
            midY + ay * (d + r * th * -t / d) + Math.cos(ang + 60 * Math.PI / 180) * (r * th * t / d));
        ctx.lineTo(
            midX + ax * (d + r * th * -t / d),
            midY + ay * (d + r * th * -t / d));
        ctx.lineTo(
            midX + ax * (d + r * th * -t / d) + Math.sin(ang - 60 * Math.PI / 180) * (r * th * t / d),
            midY + ay * (d + r * th * -t / d) + Math.cos(ang - 60 * Math.PI / 180) * (r * th * t / d));
        ctx.lineTo(
            midX + ax * (d + r * th * t / d) + Math.sin(ang - 120 * Math.PI / 180) * (r * th * t / d),
            midY + ay * (d + r * th * t / d) + Math.cos(ang - 120 * Math.PI / 180) * (r * th * t / d));
        ctx.lineTo(
            midX + ax * (d + r * th * t / d),
            midY + ay * (d + r * th * t / d));
        ctx.lineTo(
            midX + ax * (d + r * th * t / d) + Math.sin(ang + 120 * Math.PI / 180) * (r * th * t / d),
            midY + ay * (d + r * th * t / d) + Math.cos(ang + 120 * Math.PI / 180) * (r * th * t / d));
        ctx.stroke();
    }
    /*if (d > t) {
        let tr = Math.max(r * settings.noteSize, 0);
        ctx.save();
        ctx.translate(midX + ax * t, midY + ay * t);
        ctx.rotate(ang + Math.PI / 4);
        if (no.ex) {
            ctx.drawImage(noteImages.tap_ex, - tr / 2, - tr / 2, tr, tr);
        }
        ctx.drawImage(imgTemp, - tr / 2, - tr / 2, tr, tr);
        ctx.restore();
    } else {
        let tr = Math.max(r * (t / d) * settings.noteSize, 0);
        ctx.save();
        ctx.translate(midX + ax * d, midY + ay * d);
        ctx.rotate(ang + Math.PI / 4);
        if (no.ex) {
            ctx.drawImage(noteImages.tap_ex, - tr / 2, - tr / 2, tr, tr);
        }
        ctx.drawImage(imgTemp, - tr / 2, - tr / 2, tr, tr);
        ctx.restore();
    }*/
}

function touch(pos, t, typ, no) {
    let midX = ctx.canvas.width / 2;
    let midY = ctx.canvas.height / 2;
    let rs = { 'A': 2, 'B': 1, 'C': 0, 'D': 2, 'E': 1.5 };
    let ang = (4 - pos) / 8 * 2 * Math.PI + Math.PI / 8;
    if (typ == 'D' || typ == 'E') {
        ang += Math.PI / 8;
    }
    let ax = Math.sin(ang);
    let ay = Math.cos(ang);
    let l = (ctx.canvas.width / 2) * 0.2;
    let ht = 1 + Math.log(-9 * (Math.min(t / -ctx.canvas.width * 2, 1) - 1) + 1) / Math.log(10) * 0.5;

    let find = note.indexOf(note.find((element) => element.time == no.time));
    if (no.holdTime != null) {
        ctx.strokeStyle = "#FF0000";
    } else {
        if (note[find + 1] != null) {
            if (note[find] != no || (note[find + 1].time == no.time && note[find + 1])) {
                ctx.strokeStyle = "#FFDD00";
            } else {
                ctx.strokeStyle = "#00A2E8";
            }
        } else {
            ctx.strokeStyle = "#00A2E8";
        }
    }

    ctx.shadowBlur = 3;
    ctx.shadowColor = "#00000090";
    ctx.lineWidth = l * 0.25;

    ctx.beginPath();
    ctx.strokeRect(midX - (l / 2) * ht + ax * (rs[typ] / 4 * ctx.canvas.width), midY - (l / 2) * ht + ay * (rs[typ] / 4 * ctx.canvas.width), l * ht, l * ht);
    ctx.stroke();
}
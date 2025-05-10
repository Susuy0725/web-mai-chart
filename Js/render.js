// ====================================================================================
// RENDER GAME FUNCTION - All drawing logic goes here
// ====================================================================================

import { settings } from "./main.js";

export function renderGame(ctx, notesToRender, currentSettings, images, time, triggeredNotes, currentCalAng) {
    let w = ctx.canvas.width,
        h = ctx.canvas.height,
        hw = w / 2,
        hh = h / 2;

    ctx.clearRect(0, 0, w, h);
    ctx.lineJoin = currentSettings.roundStroke ? 'round' : 'butt';

    let bw = (h > w ? w : h), // circle screen width
        hbw = (bw / 2); // half of it

    ctx.shadowColor = 'black';
    ctx.shadowBlur = 4;
    images.sensor.style.fontFamily = 'monospace';
    ctx.drawImage(images.sensor,
        (h > w ? 0 : (w - h) / 2), (h > w ? (h - w) / 2 : 0),
        bw, bw);
    ctx.shadowColor = '#00000000';
    ctx.shadowBlur = 0;

    ctx.drawImage(images.outline,
        (h > w ? 0 : (w - h) / 2), (h > w ? (h - w) / 2 : 0),
        bw, bw);

    // slide render
    for (let i = notesToRender.length - 1; i >= (settings.showSlide ? 0 : notesToRender.length); i--) {
        let note = notesToRender[i];
        if (!note || typeof note.slide === 'undefined') continue;


        if (note.slide) {
            let notePosition = [];
            for (let j = 0; j < 8; j++) { // Use a different loop variable
                let ang = (j + 0.5) / 4 * Math.PI;
                notePosition.push(currentCalAng(ang));
            }

            let _t = ((time - note.time) / 1000);
            let color = '#5BCCFF';
            if (note.break) {
                color = '#FF6C0C';
            } else {
                let double = notesToRender.findIndex((_note, _idx) => _note && _note.time == note.time && _idx != i && _note.slide);
                if (double != -1) {
                    color = '#FFD900';
                }
            }

            if (_t >= -1 / currentSettings.slideSpeed && _t <= note.delay + note.slideTime) {
                // triggeredNotes[i] is handled by game logic in update()

                let nang = (parseInt((note.slideHead ?? '')[0]) - 1) % 8;
                let nang2 = note.slideEnd;
                if (!(note.slideEnd.length > 1)) {
                    nang2 = (parseInt((note.slideEnd ?? '')[0]) - 1) % 8;
                }
                let np = notePosition[isNaN(nang) ? 0 : nang];
                if (!np) { // Add a check for np
                    console.warn("np is undefined in slide render for note:", note);
                    continue;
                }
                np.x = hw + hbw * np.x;
                np.y = hh + hbw * np.y;
                nang = nang < 0 ? 0 : nang;
                if (!(note.slideEnd.length > 1)) nang2 = nang2 < 0 ? 0 : nang2;

                if (_t >= 0) {
                    drawSlidePath(nang, nang2, note.slideType, color, _t <= 0 ? _t * currentSettings.slideSpeed : Math.max(_t - note.delay, 0) / note.slideTime, ctx, hw, hh, hbw, currentSettings, currentCalAng);
                } else {
                    drawSlidePath(nang, nang2, note.slideType, color, _t * currentSettings.slideSpeed, ctx, hw, hh, hbw, currentSettings, currentCalAng);
                }
            }
        }
    }

    //tap ,star and hold render
    for (let i = notesToRender.length - 1; i >= 0; i--) {
        let note = notesToRender[i];
        if (!note) continue;


        if (!note.starTime && !note.touch && !note.slide) {
            let notePosition = [];
            for (let j = 0; j < 8; j++) { // Use a different loop variable
                let ang = (j + 0.5) / 4 * Math.PI;
                notePosition.push(currentCalAng(ang));
            }

            let _t = ((time - note.time) / 1000);
            let color = '#FF50AA';
            // Note: 'note.touch' check here might be redundant if this loop is for non-touch notes
            // if (note.touch) { color = '#0089F4'; } // This seems to be handled in another loop
            if (note.star && !currentSettings.pinkStar) {
                color = '#009FF9';
            }
            if (note.break) {
                color = '#FF6C0C';
            } else {
                let double = notesToRender.findIndex((_note, _idx) => _note && _note.time == note.time && _idx != i && !_note.slide && !_note.touch);
                if (double != -1) {
                    color = '#FFD900';
                }
            }

            if (_t >= (currentSettings.distanceToMid - 2) / currentSettings.speed && _t < (note.holdTime ?? 0)) {
                // triggeredNotes[i] handling is game logic

                let d = (1 - currentSettings.distanceToMid);
                let nang = (parseInt(note.pos[0]) - 1) % 8;
                nang = nang < 0 ? 0 : nang;
                let np = notePosition[isNaN(nang) ? 0 : nang];
                if (!np) {
                    console.warn("np is undefined in tap/star/hold for note:", note);
                    continue;
                }

                if (_t >= -d / currentSettings.speed) {
                    np.x = hw + hbw * np.x * (Math.min(_t, 0) * currentSettings.speed + 1);
                    np.y = hh + hbw * np.y * (Math.min(_t, 0) * currentSettings.speed + 1);
                    if (note.star) {
                        drawStar(np.x, np.y, 1, color, (nang) / -4 * Math.PI, ctx, hbw, currentSettings, currentCalAng);
                    } else if (!!note.holdTime) {
                        drawHold(np.x, np.y, 1, color, (nang) / -4 * Math.PI,
                            (Math.min((note.holdTime - (_t > 0 ? _t : 0)) * currentSettings.speed, (1 - currentSettings.distanceToMid) * (Math.min(_t, 0) + (d / currentSettings.speed)) / (d / currentSettings.speed))) * hbw,
                            ctx, hbw, currentSettings, currentCalAng);
                    } else {
                        drawTap(np.x, np.y, 1, color, ctx, hbw, currentSettings);
                    }
                } else {
                    np.x = hw + hbw * np.x * (1 - d);
                    np.y = hh + hbw * np.y * (1 - d);
                    if (note.star) {
                        drawStar(np.x, np.y, (_t * currentSettings.speed + (2 - currentSettings.distanceToMid)), color, (nang) / -4 * Math.PI, ctx, hbw, currentSettings, currentCalAng);
                    } else if (!!note.holdTime) {
                        drawHold(np.x, np.y, (_t * currentSettings.speed + (2 - currentSettings.distanceToMid)), color, (nang) / -4 * Math.PI, 0, ctx, hbw, currentSettings, currentCalAng);
                    } else {
                        drawTap(np.x, np.y, (_t * currentSettings.speed + (2 - currentSettings.distanceToMid)), color, ctx, hbw, currentSettings);
                    }
                }
            }
        }
    }
    //touch render
    for (let i = notesToRender.length - 1; i >= 0; i--) {
        let note = notesToRender[i];
        if (!note || typeof note.touch === 'undefined') continue;


        if (note.touch) {
            // notePosition calculation might not be needed here if drawTouch handles it internally
            // or if 'pos' directly gives coordinates or an index.
            // For now, assuming drawTouch takes what it needs.

            let _t = ((time - note.time) / 1000);
            let color = '#0089F4';
            // if (note.star && !currentSettings.pinkStar) { color = '#009FF9'; } // star notes handled above
            if (note.break) {
                color = '#FF6C0C';
            } else {
                // Assuming 'double' logic for touch notes is similar if applicable
                let double = notesToRender.findIndex((_note, _idx) => _note && _note.time == note.time && _idx != i && _note.touch && !_note.starTime);
                if (double != -1) {
                    color = '#FFD900';
                }
            }

            let ani1 = function (val_t) { // renamed t to val_t to avoid conflict
                return Math.log(99 * (val_t / currentSettings.touchSpeed) + 1) / 2;
            }

            if (_t >= -1 / currentSettings.touchSpeed && _t <= (note.touchTime ?? 0)) {
                // triggeredNotes[i] handling is game logic
                drawTouch(note.pos, 0.8, color, note.touch, ani1(_t < 0 ? -_t : 0) * 0.65, 8 - (_t / (-2 / currentSettings.touchSpeed)) * 8, note.touchTime, _t, ctx, hw, hh, hbw, currentSettings, currentCalAng);
            }
        }
    }
}

// Make sure drawing functions now accept ctx, hbw, currentSettings, etc.
// and use them instead of global ones.
// Example for drawTap:
export function drawTap(x, y, size, color, ctx, hbw, currentSettings) {
    let s = hbw * currentSettings.noteSize;
    size = size * s;
    size = Math.max(size, 0);
    ctx.shadowBlur = s * 0.2;
    ctx.shadowColor = 'black';
    ctx.lineWidth = size * 0.75;
    ctx.strokeStyle = 'white';
    _arc(x, y, size, ctx); // Pass ctx
    ctx.shadowBlur = 0;
    ctx.shadowColor = '#00000000';
    ctx.lineWidth = size * 0.5;
    ctx.strokeStyle = color;
    _arc(x, y, size, ctx); // Pass ctx
}

export function drawStar(x, y, size, color, ang, ctx, hbw, currentSettings, currentCalAng) {
    ang = ang - 0.125 * Math.PI;
    let s = hbw * currentSettings.noteSize;
    size = size * s;
    size = Math.max(size, 0);
    ctx.shadowBlur = s * 0.2;
    ctx.shadowColor = 'black';
    ctx.lineWidth = size * 0.6;
    ctx.strokeStyle = 'white';
    function str() {
        ctx.beginPath();
        ctx.moveTo(x - (size) * currentCalAng(ang).x, y + (size) * currentCalAng(ang).y);
        ctx.lineTo(x - (size / 2) * currentCalAng(ang + 36 * Math.PI / 180).x, y + (size / 2) * currentCalAng(ang + 36 * Math.PI / 180).y);
        ctx.lineTo(x - (size) * currentCalAng(ang + 72 * Math.PI / 180).x, y + (size) * currentCalAng(ang + 72 * Math.PI / 180).y);
        ctx.lineTo(x - (size / 2) * currentCalAng(ang + 108 * Math.PI / 180).x, y + (size / 2) * currentCalAng(ang + 108 * Math.PI / 180).y);
        ctx.lineTo(x - (size) * currentCalAng(ang + 144 * Math.PI / 180).x, y + (size) * currentCalAng(ang + 144 * Math.PI / 180).y);
        ctx.lineTo(x - (size / 2) * currentCalAng(ang + Math.PI).x, y + (size / 2) * currentCalAng(ang + Math.PI).y);
        ctx.lineTo(x - (size) * currentCalAng(ang + 216 * Math.PI / 180).x, y + (size) * currentCalAng(ang + 216 * Math.PI / 180).y);
        ctx.lineTo(x - (size / 2) * currentCalAng(ang + 252 * Math.PI / 180).x, y + (size / 2) * currentCalAng(ang + 252 * Math.PI / 180).y);
        ctx.lineTo(x - (size) * currentCalAng(ang + 288 * Math.PI / 180).x, y + (size) * currentCalAng(ang + 288 * Math.PI / 180).y);
        ctx.lineTo(x - (size / 2) * currentCalAng(ang + 324 * Math.PI / 180).x, y + (size / 2) * currentCalAng(ang + 324 * Math.PI / 180).y);
        ctx.lineTo(x - (size) * currentCalAng(ang + 2 * Math.PI).x, y + (size) * currentCalAng(ang + 2 * Math.PI).y);
        // ctx.lineTo(x - (size / 2) * currentCalAng(ang + 36 * Math.PI / 180).x, y + (size / 2) * currentCalAng(ang + 36 * Math.PI / 180).y); //This line seems redundant
        ctx.closePath(); // Close the path for a filled star, or ensure lines connect
        ctx.stroke();
    }
    str()
    ctx.shadowBlur = 0;
    ctx.shadowColor = '#00000000';
    ctx.lineWidth = size * 0.35;
    ctx.strokeStyle = color;
    str();
}

export function drawSlidePath(startNp, endNp, type, color, t_progress, ctx, hw, hh, hbw, currentSettings, currentCalAng) { // Renamed t to t_progress
    startNp = parseInt(startNp);
    endNp = parseInt(endNp);

    class PathRecorder {
        constructor() {
            this.commands = [];
            this.ctxPath = new Path2D();
            this.lastX = null;
            this.lastY = null;
        }
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
        arc(cx, cy, r, startAngle, endAngle, anticlockwise = false) {
            this.ctxPath.arc(cx, cy, r, startAngle, endAngle, anticlockwise);
            let delta = endAngle - startAngle;
            if (!anticlockwise && delta < 0) delta += 2 * Math.PI;
            if (anticlockwise && delta > 0) delta -= 2 * Math.PI;
            const segments = Math.ceil(Math.abs(delta) / Math.PI);
            const segAngle = delta / segments;
            for (let i = 0; i < segments; i++) {
                const a0 = startAngle + segAngle * i;
                const a1 = startAngle + segAngle * (i + 1);
                const sx = this._fmt(cx + r * Math.cos(a0));
                const sy = this._fmt(cy + r * Math.sin(a0));
                const ex = this._fmt(cx + r * Math.cos(a1));
                const ey = this._fmt(cy + r * Math.sin(a1));
                const laf = Math.abs(segAngle) > Math.PI ? 1 : 0;
                const sf = anticlockwise ? 0 : 1;
                if (this.lastX !== sx || this.lastY !== sy) {
                    this.commands.push(`M ${sx} ${sy}`);
                }
                this.commands.push(`A ${this._fmt(r)} ${this._fmt(r)} 0 ${laf} ${sf} ${ex} ${ey}`);
                this.lastX = ex; this.lastY = ey;
            }
        }
        toSVGPath() { return this.commands.join(" "); }
    }

    let s = hbw * currentSettings.noteSize; // Used for arrow size

    function drawArrow(pathRecorder, spacing, _t_arrow_progress, currentCtx, arrowColor) { // Renamed t to _t_arrow_progress, pass currentCtx, arrowColor
        const svgNS = "http://www.w3.org/2000/svg";
        const tempSvg = document.createElementNS(svgNS, "svg");
        tempSvg.setAttribute("width", "0"); // Use string for SVG attributes
        tempSvg.setAttribute("height", "0");
        const pathEl = document.createElementNS(svgNS, "path");
        pathEl.setAttribute("d", pathRecorder.toSVGPath());
        tempSvg.appendChild(pathEl);
        document.body.appendChild(tempSvg);

        function drawArrowCallback(x, y, angle) {
            currentCtx.save();
            currentCtx.translate(x, y);
            currentCtx.rotate(angle);
            currentCtx.beginPath();
            currentCtx.moveTo(s * 1.1, 0);
            currentCtx.lineTo(s * 0.7, s * -0.8);
            currentCtx.lineTo(0, s * -0.8);
            currentCtx.lineTo(s * 0.4, 0);
            currentCtx.lineTo(0, s * 0.8);
            currentCtx.lineTo(s * 0.7, s * 0.8);
            currentCtx.closePath();
            currentCtx.fillStyle = arrowColor; // Use passed arrowColor
            currentCtx.fill();
            currentCtx.restore();
        }

        const totalLen = pathEl.getTotalLength();
        if (totalLen > 0) { // Ensure totalLen is positive
            for (let len = 0; len < totalLen; len += spacing) {
                if (len / totalLen > _t_arrow_progress) { // Only draw if part of the remaining path
                    const p1 = pathEl.getPointAtLength(len);
                    // For angle, ensure p2 is within bounds or handle edge case
                    const p2_len = Math.min(len + 0.1, totalLen); // Use a slightly larger step for angle, ensure within bounds
                    const p2 = pathEl.getPointAtLength(p2_len);

                    const dx = p2.x - p1.x;
                    const dy = p2.y - p1.y;
                    let angle = (dx === 0 && dy === 0 && p2_len > len) ? (pathEl.getPointAtLength(len - 0.1) ? Math.atan2(p1.y - pathEl.getPointAtLength(len - 0.1).y, p1.x - pathEl.getPointAtLength(len - 0.1).x) : 0) : Math.atan2(dy, dx);
                    angle = isNaN(angle) ? 0 : angle; // Default angle if NaN
                    if (len / totalLen > _t_arrow_progress) drawArrowCallback(p1.x, p1.y, angle);
                }
            }
        }
        document.body.removeChild(tempSvg);
    }

    let notePositionLocal = []; // Renamed to avoid conflict
    for (let k = 0; k < 8; k++) { // Use a different loop variable
        notePositionLocal.push(currentCalAng(getNotePos(k, 0)));
    }

    let touchDisToMid = { "A": 1, "B": 0.475, "C": 0, "D": 1, "E": 0.675 };
    let touchAngleOffset = { "A": 1, "B": 0, "C": 0, "D": 0.5, "E": 0.5 };

    let np = [notePositionLocal[isNaN(startNp) ? 0 : startNp % 8], notePositionLocal[isNaN(endNp) ? 0 : (endNp > 9 ? (Math.floor(endNp / 10) - 1) : endNp) % 8]];
    np[0].x = hw + hbw * np[0].x;
    np[0].y = hh + hbw * np[0].y;
    np[1].x = hw + hbw * np[1].x;
    np[1].y = hh + hbw * np[1].y;

    let size = s; // Already calculated based on hbw and settings.noteSize
    let localColor = color; // Use a local variable for color to modify opacity
    ctx.shadowBlur = s * 0.2;
    ctx.shadowColor = '#000000'; // Default shadow color

    if (t_progress < 0) { // If note is approaching
        const alpha = Math.max(0, Math.min(1, (t_progress + 1) / 1)); // Alpha from 0 to 1 as t_progress goes from -1 to 0
        const alphaHex = Math.floor(alpha * 255).toString(16).padStart(2, '0');
        localColor = color + alphaHex;
        ctx.shadowColor = '#000000' + alphaHex;
    }
    ctx.lineWidth = size * 0.75; // Example line width
    ctx.strokeStyle = localColor;


    const a = new PathRecorder();

    function getNotePos(val_a, offset = 0) { return ((val_a + offset) + 0.5) / 4 * Math.PI; }
    function getTouchPos(val_a, offset = 0, touchType) { return ((val_a + offset) % 8 - 0.5 - touchAngleOffset[touchType]) / 4 * Math.PI; }

    switch (type) {
        case '-':
            a.moveTo(np[0].x, np[0].y); a.lineTo(np[1].x, np[1].y);
            break;
        case '^':
            a.arc(hw, hh, hbw, getNotePos(startNp - 2), getNotePos(endNp - 2), ((endNp - startNp + 8) % 8) > 4);
            break;
        case '>': {
            let turn = (startNp - 1 >= 1 && startNp - 1 <= 4);
            a.arc(hw, hh, hbw,
                getNotePos(startNp - 2 + ((startNp == endNp && turn) ? 8 : 0)), // index adjusted for 0-7
                getNotePos(endNp - 2 + ((startNp == endNp && !turn) ? 8 : 0)),
                false ^ turn // index adjusted for 0-7
            );
            break;
        }
        case '<': {
            let turn = (startNp - 1 >= 1 && startNp - 1 <= 4);
            a.arc(hw, hh, hbw,
                getNotePos(startNp - 2 + ((startNp == endNp && !turn) ? 8 : 0)),
                getNotePos(endNp - 2 + ((startNp == endNp && turn) ? 8 : 0)),
                true ^ turn  // index adjusted for 0-7
            );
            break;
        }
        case 'v':
            a.moveTo(np[0].x, np[0].y); a.lineTo(hw, hh); a.lineTo(np[1].x, np[1].y);
            break;
        case 'z': { // Use block scope for npTouch, npTouch1
            let npTouch = currentCalAng(getTouchPos(startNp, 3, 'B'));
            let npTouch1 = currentCalAng(getTouchPos(startNp, 7, 'B'));
            a.moveTo(np[0].x, np[0].y);
            a.lineTo(hw + npTouch.x * touchDisToMid['B'] * hbw, hh + npTouch.y * touchDisToMid['B'] * hbw);
            a.lineTo(hw + npTouch1.x * touchDisToMid['B'] * hbw, hh + npTouch1.y * touchDisToMid['B'] * hbw);
            a.lineTo(np[1].x, np[1].y);
            break;
        }
        case 's': { // Use block scope
            let npTouch = currentCalAng(getTouchPos(startNp, 7, 'B'));
            let npTouch1 = currentCalAng(getTouchPos(startNp, 3, 'B'));
            a.moveTo(np[0].x, np[0].y);
            a.lineTo(hw + npTouch.x * touchDisToMid['B'] * hbw, hh + npTouch.y * touchDisToMid['B'] * hbw);
            a.lineTo(hw + npTouch1.x * touchDisToMid['B'] * hbw, hh + npTouch1.y * touchDisToMid['B'] * hbw);
            a.lineTo(np[1].x, np[1].y);
            break;
        }// 
        case 'V':
            a.moveTo(np[0].x, np[0].y);
            a.lineTo(np[1].x, np[1].y);
            a.lineTo(
                hw + hbw * currentCalAng(getNotePos((Math.round(endNp / 10 % 1 * 10) - 1) % 8, 0)).x,
                hh + hbw * currentCalAng(getNotePos((Math.round(endNp / 10 % 1 * 10) - 1) % 8, 0)).y);
            break;
        default:
            // Fallback for unknown types, draw a simple line and text
            ctx.beginPath(); ctx.moveTo(np[0].x, np[0].y); ctx.lineTo(np[1].x, np[1].y); ctx.stroke();
            // ctx.font = "30px Segoe UI";
            // ctx.fillText(startNp + '' + type + '' + endNp, np[1].x, np[1].y);
            break;
    }
    // Draw arrows on the path defined in 'a'
    drawArrow(a, s * 1.25, t_progress < 0 ? 0 : t_progress, ctx, localColor);
    // Debug text:
    ctx.shadowBlur = s * 0.2;
    ctx.shadowColor = '#000000';
    ctx.font = "bold 24px Segoe UI";
    ctx.fillStyle = "white";
    ctx.fillText((startNp) + ' ' + type + ' ' + (endNp) + " t:" + t_progress.toFixed(2), np[1].x, np[1].y - 10);
}

export function drawHold(x, y, size, color, ang, l, ctx, hbw, currentSettings, currentCalAng) {
    ang = ang - 0.125 * Math.PI;
    let s = hbw * currentSettings.noteSize;
    size = size * s;
    size = Math.max(size, 0);
    ctx.shadowBlur = s * 0.2;
    ctx.shadowColor = 'black';
    ctx.lineWidth = size * 0.75;
    ctx.strokeStyle = 'white';
    function str() {
        ctx.beginPath();
        ctx.moveTo(x - size * currentCalAng(ang).x, y + size * currentCalAng(ang).y);
        ctx.lineTo(x - size * currentCalAng(ang + Math.PI / 3).x, y + size * currentCalAng(ang + Math.PI / 3).y);
        ctx.lineTo(x - size * currentCalAng(ang + 2 * Math.PI / 3).x + l * currentCalAng(ang).x, y + size * currentCalAng(ang + 2 * Math.PI / 3).y - l * currentCalAng(ang).y);
        ctx.lineTo(x - size * currentCalAng(ang + Math.PI).x + l * currentCalAng(ang).x, y + size * currentCalAng(ang + Math.PI).y - l * currentCalAng(ang).y);
        ctx.lineTo(x - size * currentCalAng(ang + 4 * Math.PI / 3).x + l * currentCalAng(ang).x, y + size * currentCalAng(ang + 4 * Math.PI / 3).y - l * currentCalAng(ang).y);
        ctx.lineTo(x - size * currentCalAng(ang + 5 * Math.PI / 3).x, y + size * currentCalAng(ang + 5 * Math.PI / 3).y);
        ctx.closePath(); // Close the path for hold notes
        ctx.stroke();
    }
    str();
    ctx.shadowBlur = 0;
    ctx.shadowColor = '#00000000';
    ctx.lineWidth = size * 0.5;
    ctx.strokeStyle = color;
    str();
}

export function drawTouch(pos, size, color, type, distance, opacity, holdtime, t_touch, ctx, hw, hh, hbw, currentSettings, currentCalAng) { // Renamed t to t_touch
    opacity = Math.min(Math.max(opacity, 0), 1);
    let localColor = 'rgba(' + parseInt(color.substring(1, 3), 16) + ',' + parseInt(color.substring(3, 5), 16) + ',' + parseInt(color.substring(5, 7), 16) + ',' + opacity + ')'; // Renamed
    let s = hbw * currentSettings.noteSize;
    size = size * s;
    size = Math.max(size, 0);

    let touchDisToMid = { "A": 0.85, "B": 0.475, "C": 0, "D": 0.85, "E": 0.675 };
    let touchAngleOffset = { "A": 0, "B": 0, "C": 0, "D": 0.5, "E": 0.5 };
    let ang = (pos - 0.5 - touchAngleOffset[type]) / 4 * Math.PI;
    let np = currentCalAng(ang);

    ctx.shadowBlur = s * 0.2;
    ctx.shadowColor = 'rgba(0,0,0,' + opacity + ')';
    ctx.lineWidth = size * 0.6;
    distance += 0.6; // Original logic
    ctx.strokeStyle = 'rgba(255,255,255,' + opacity + ')';

    function str() { // Original 'str' for non-hold touch
        // Top
        ctx.beginPath();
        ctx.moveTo(hw + np.x * touchDisToMid[type] * hbw, hh + np.y * touchDisToMid[type] * hbw - size * distance);
        ctx.lineTo(hw + np.x * touchDisToMid[type] * hbw + size, hh + np.y * touchDisToMid[type] * hbw - size * (1 + distance));
        ctx.lineTo(hw + np.x * touchDisToMid[type] * hbw - size, hh + np.y * touchDisToMid[type] * hbw - size * (1 + distance));
        ctx.closePath(); ctx.stroke();
        // Left
        ctx.beginPath();
        ctx.moveTo(hw + np.x * touchDisToMid[type] * hbw - size * distance, hh + np.y * touchDisToMid[type] * hbw);
        ctx.lineTo(hw + np.x * touchDisToMid[type] * hbw - size * (1 + distance), hh + np.y * touchDisToMid[type] * hbw - size);
        ctx.lineTo(hw + np.x * touchDisToMid[type] * hbw - size * (1 + distance), hh + np.y * touchDisToMid[type] * hbw + size);
        ctx.closePath(); ctx.stroke();
        // Bottom
        ctx.beginPath();
        ctx.moveTo(hw + np.x * touchDisToMid[type] * hbw, hh + np.y * touchDisToMid[type] * hbw + size * distance);
        ctx.lineTo(hw + np.x * touchDisToMid[type] * hbw + size, hh + np.y * touchDisToMid[type] * hbw + size * (1 + distance));
        ctx.lineTo(hw + np.x * touchDisToMid[type] * hbw - size, hh + np.y * touchDisToMid[type] * hbw + size * (1 + distance));
        ctx.closePath(); ctx.stroke();
        // Right
        ctx.beginPath();
        ctx.moveTo(hw + np.x * touchDisToMid[type] * hbw + size * distance, hh + np.y * touchDisToMid[type] * hbw);
        ctx.lineTo(hw + np.x * touchDisToMid[type] * hbw + size * (1 + distance), hh + np.y * touchDisToMid[type] * hbw - size);
        ctx.lineTo(hw + np.x * touchDisToMid[type] * hbw + size * (1 + distance), hh + np.y * touchDisToMid[type] * hbw + size);
        ctx.closePath(); ctx.stroke();

        _arc(hw + np.x * touchDisToMid[type] * hbw, hh + np.y * touchDisToMid[type] * hbw, size * 0.15, ctx);
    }

    function strCh(fill = false) { // For hold touch (colored corners)
        const corners = [
            { color: 'rgba(250,73,4,' + opacity + ')', x_offset: 1, y_offset: -1 }, // Top-Right
            { color: 'rgba(0,141,244,' + opacity + ')', x_offset: -1, y_offset: -1 }, // Top-Left
            { color: 'rgba(245,238,0,' + opacity + ')', x_offset: 1, y_offset: 1 },  // Bottom-Right
            { color: 'rgba(17,167,105,' + opacity + ')', x_offset: -1, y_offset: 1 }  // Bottom-Left
        ];
        corners.forEach(corner => {
            ctx.beginPath();
            ctx.moveTo(hw + np.x * touchDisToMid[type] * hbw + size * distance * corner.x_offset, hh + np.y * touchDisToMid[type] * hbw + size * distance * corner.y_offset);
            ctx.lineTo(hw + np.x * touchDisToMid[type] * hbw + size * distance * corner.x_offset, hh + np.y * touchDisToMid[type] * hbw + size * (1 + distance) * Math.sqrt(2) * corner.y_offset);
            ctx.lineTo(hw + np.x * touchDisToMid[type] * hbw + size * (1 + distance) * Math.sqrt(2) * corner.x_offset, hh + np.y * touchDisToMid[type] * hbw + size * distance * corner.y_offset);
            ctx.closePath();
            if (fill) {
                ctx.fillStyle = corner.color;
                ctx.fill();
                ctx.strokeStyle = corner.color;
            } else {
                ctx.strokeStyle = 'white'; // Stroke with corner color if fill is true, else use localColor
            }
            ctx.stroke();
        });
        ctx.strokeStyle = localColor; // Reset strokeStyle for the center arc
        _arc(hw + np.x * touchDisToMid[type] * hbw, hh + np.y * touchDisToMid[type] * hbw, size * 0.15, ctx);
    }


    function strPrg(t_progress_hold) { // Renamed t to t_progress_hold
        ctx.lineWidth = size * 0.8;
        let progressSegments = [t_progress_hold, t_progress_hold - 0.25, t_progress_hold - 0.5, t_progress_hold - 0.75];
        const colors = ['rgb(250,73,4)', 'rgb(245,238,0)', 'rgb(17,167,105)', 'rgb(0,141,244)'];
        const angles = [Math.PI * 0.75, Math.PI * 1.25, Math.PI * 1.75, Math.PI * 0.25]; // Angles for each bar
        const startPoints = [
            { x: 0, y: -size * (3 + distance) }, // Top
            { x: size * (3 + distance), y: 0 }, // Right
            { x: 0, y: size * (3 + distance) }, // Bottom
            { x: -size * (3 + distance), y: 0 }  // Left
        ];

        if (t_progress_hold >= 0) {
            for (let i = 0; i < 4; i++) {
                let dis = Math.max(0, progressSegments[i]);
                dis = Math.min(0.25, dis) / 0.25; // Normalize to 0-1 for 0.25 segment length
                dis *= size * (3 + distance) * Math.sqrt(2); // This might be the length of the bar

                ctx.strokeStyle = colors[i];
                ctx.beginPath();
                let baseX = hw + np.x * touchDisToMid[type] * hbw + startPoints[i].x;
                let baseY = hh + np.y * touchDisToMid[type] * hbw + startPoints[i].y;
                ctx.moveTo(baseX, baseY);
                ctx.lineTo(baseX + currentCalAng(angles[i]).x * dis, baseY + currentCalAng(angles[i]).y * dis);
                ctx.stroke();
            }
        }
    }

    if (holdtime && holdtime > 0) { // Make sure holdtime is positive
        strPrg(t_touch / holdtime);
        ctx.lineWidth = size * 0.6;
        ctx.strokeStyle = 'rgba(255,255,255,' + opacity + ')'; // White outline for strCh base
        strCh(); // Draw base structure
    } else {
        str(); // Draw simple touch
    }

    ctx.shadowBlur = 0;
    ctx.shadowColor = '#00000000';
    ctx.lineWidth = size * 0.35; // Thinner line for the colored part
    ctx.strokeStyle = localColor; // Use the opacity-adjusted color

    if (holdtime && holdtime > 0) {
        strCh(true); // Draw colored filled parts for hold
    } else {
        str();
        // For non-hold, the second str() call from original code is now part of the initial str()
        // or handled by the thinner strokeStyle above.
        // If a second distinct drawing pass is needed for non-hold, add it here.
        // For now, assume the single str() with adjusted strokeStyle is enough.
    }
}

export function _arc(x, y, r = 0, currentCtx) { // Pass currentCtx
    currentCtx.beginPath();
    currentCtx.arc(x, y, r, 0, 2 * Math.PI);
    currentCtx.stroke();
}
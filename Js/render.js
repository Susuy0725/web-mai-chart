// ====================================================================================
// RENDER GAME FUNCTION - All drawing logic goes here
// ====================================================================================

// import { settings } from "./main.js"; // Assuming settings is passed as currentSettings

// Pre-calculate angular positions if they are static
const EIGHT_POSITIONS_ANG = [];
for (let j = 0; j < 8; j++) {
    const ang = (j + 0.5) / 4 * Math.PI;
    EIGHT_POSITIONS_ANG.push({ 'x': Math.sin(ang), 'y': Math.cos(ang) * -1 });
}

export function renderGame(ctx, notesToRender, currentSettings, images, time, triggeredNotes) {
    const calAng = function (ang) { return { 'x': Math.sin(ang), 'y': Math.cos(ang) * -1 } }; // Keep if dynamic angles needed elsewhere

    const w = ctx.canvas.width,
        h = ctx.canvas.height,
        hw = w / 2,
        hh = h / 2;

    ctx.clearRect(0, 0, w, h);
    ctx.lineJoin = currentSettings.roundStroke ? 'round' : 'butt';

    const bw = (h > w ? w : h), // circle screen width
        hbw = (bw / 2); // half of it

    // Cache note base size
    const noteBaseSize = hbw * currentSettings.noteSize;

    ctx.shadowColor = 'black';
    ctx.shadowBlur = 4;
    // images.sensor.style.fontFamily = 'monospace'; // Setting style on image element directly, not canvas related for drawing
    ctx.drawImage(images.sensor,
        (h > w ? 0 : (w - h) / 2), (h > w ? (h - w) / 2 : 0),
        bw, bw);
    ctx.shadowColor = '#00000000';
    ctx.shadowBlur = 0;

    ctx.drawImage(images.outline,
        (h > w ? 0 : (w - h) / 2), (h > w ? (h - w) / 2 : 0),
        bw, bw);

    // slide render
    if (currentSettings.showSlide) {
        for (let i = notesToRender.length - 1; i >= 0; i--) {
            const note = notesToRender[i];
            if (!note || !note.slide) continue; // Simplified check

            const _t = ((time - note.time) / 1000);
            let color = '#5BCCFF';
            if (note.break) {
                color = '#FF6C0C';
            } else if (note.isDoubleSlide) { // Assuming 'isDoubleSlide' is pre-calculated
                color = '#FFD900';
            }

            if (_t >= -1 / currentSettings.slideSpeed && _t <= note.delay + note.slideTime) {
                let nang = (parseInt((note.slideHead ?? '')[0]) - 1) % 8;
                let nang2 = note.slideEnd;
                if (!(note.slideEnd.length > 1)) {
                    nang2 = (parseInt((note.slideEnd ?? '')[0]) - 1) % 8;
                }

                const notePosition = EIGHT_POSITIONS_ANG; // Use pre-calculated positions
                let np = notePosition[isNaN(nang) ? 0 : nang];
                if (!np) {
                    // console.warn("np is undefined in slide render for note:", note); // Conditional logging
                    continue;
                }
                // np.x and np.y calculation seems to be relative to slide path drawing, not direct positioning here.
                // The actual positioning is handled by drawSlidePath logic.

                nang = nang < 0 ? 0 : nang;
                if (!(note.slideEnd.length > 1)) nang2 = nang2 < 0 ? 0 : nang2;

                if (_t >= 0) {
                    drawSlidePath(nang, nang2, note.slideType, color, Math.max(_t - note.delay, 0) / note.slideTime, ctx, hw, hh, hbw, currentSettings, calAng, noteBaseSize, note);
                } else {
                    drawSlidePath(nang, nang2, note.slideType, color, _t * currentSettings.slideSpeed, ctx, hw, hh, hbw, currentSettings, calAng, noteBaseSize, note);
                }
            }
        }
    }

    //tap ,star and hold render
    for (let i = notesToRender.length - 1; i >= 0; i--) {
        const note = notesToRender[i];
        if (!note || note.starTime || note.touch || note.slide) continue; // Simplified check


        const _t = ((time - note.time) / 1000);
        let color = '#FF50AA';
        if (note.star && !currentSettings.pinkStar) {
            color = '#009FF9';
        }
        if (note.break) {
            color = '#FF6C0C';
        } else if (note.isDoubleTapHold) { // Assuming 'isDoubleTapHold' is pre-calculated
            color = '#FFD900';
        }


        if (_t >= (currentSettings.distanceToMid - 2) / currentSettings.speed && _t < (note.holdTime ?? 0)) {
            const d = (1 - currentSettings.distanceToMid);
            let nang = (parseInt(note.pos[0]) - 1) % 8;
            nang = nang < 0 ? 0 : nang;

            const notePosition = EIGHT_POSITIONS_ANG; // Use pre-calculated positions
            let np = notePosition[isNaN(nang) ? 0 : nang];
            if (!np) {
                console.warn("np is undefined in tap/star/hold for note:", note, "index:", i); // Conditional logging
                continue;
            }

            let currentX, currentY, currentSize = 1;

            if (_t >= -d / currentSettings.speed) {
                const scaleFactor = (Math.min(_t, 0) * currentSettings.speed + 1);
                currentX = hw + hbw * np.x * scaleFactor;
                currentY = hh + hbw * np.y * scaleFactor;
            } else {
                currentX = hw + hbw * np.x * (1 - d);
                currentY = hh + hbw * np.y * (1 - d);
                currentSize = (_t * currentSettings.speed + (2 - currentSettings.distanceToMid));
            }

            if (note.star) {
                drawStar(currentX, currentY, currentSize, color, note.ex ?? false, (nang) / -4 * Math.PI, ctx, hbw, currentSettings, calAng, noteBaseSize);
            } else if (note.holdTime) { // Check for truthiness (not just existence)
                let holdLength = 0;
                if (_t >= -d / currentSettings.speed) {
                    holdLength = (Math.min((note.holdTime - (_t > 0 ? _t : 0)) * currentSettings.speed, (1 - currentSettings.distanceToMid) * (Math.min(_t, 0) + (d / currentSettings.speed)) / (d / currentSettings.speed))) * hbw;
                }
                drawHold(currentX, currentY, currentSize, color, note.ex ?? false, (nang) / -4 * Math.PI, holdLength, ctx, hbw, currentSettings, calAng, noteBaseSize);
            } else {
                drawTap(currentX, currentY, currentSize, color, note.ex ?? false, ctx, hbw, currentSettings, noteBaseSize);
            }
        }
    }

    //touch render
    for (let i = notesToRender.length - 1; i >= 0; i--) {
        const note = notesToRender[i];
        if (!note || !note.touch) continue; // Simplified check

        const _t = ((time - note.time) / 1000);
        let color = '#0089F4';
        if (note.break) {
            color = '#FF6C0C';
        } else if (note.isDoubleTouch) { // Assuming 'isDoubleTouch' is pre-calculated
            color = '#FFD900';
        }

        const ani1 = function (val_t) {
            return Math.log(99 * (val_t / currentSettings.touchSpeed) + 1) / 2;
        }

        if (_t >= -1 / currentSettings.touchSpeed && _t <= (note.touchTime ?? 0)) {
            drawTouch(note.pos, 0.8, color, note.touch,
                ani1(_t < 0 ? -_t : 0) * 0.65,
                (1 - (_t / (-1 / currentSettings.touchSpeed))) * 4
                , note.touchTime, _t, ctx, hw, hh, hbw, currentSettings, calAng, noteBaseSize);
        }
    }
}


export function drawTap(x, y, sizeFactor, color, ex, ctx, hbw, currentSettings, noteBaseSize) {
    let s = noteBaseSize; // Use passed base size
    let currentSize = Math.max(sizeFactor * s, 0);

    ctx.shadowBlur = s * 0.2;
    if (ex) {
        ctx.shadowColor = 'white';
    } else {
        ctx.shadowColor = 'black';
    }
    ctx.lineWidth = currentSize * 0.75;
    ctx.strokeStyle = 'white';
    _arc(x, y, currentSize, ctx);
    ctx.shadowBlur = 0;
    ctx.shadowColor = '#00000000';
    ctx.lineWidth = currentSize * 0.5;
    ctx.strokeStyle = color;
    _arc(x, y, currentSize, ctx);
}

// Cache Star Path2D objects if possible, or simplify
const starPathCache = {}; // Simple cache example

export function drawStar(x, y, sizeFactor, color, ex, ang, ctx, hbw, currentSettings, calAng, noteBaseSize) {
    ang = ang - 0.125 * Math.PI;
    let s = noteBaseSize;
    let currentSize = Math.max(sizeFactor * s, 0);

    // Example for Path2D star - define points once
    // This is a simplified star, adjust to your exact shape
    const getStarPath = (scale) => {
        const path = new Path2D();
        // Define star points relative to (0,0) and scale
        // This is a placeholder, you need to calculate your star points
        const R = scale, r = scale / 2;
        //path.moveTo(-R, -R);
        for (let i = 0; i < 5; i++) {
            path.lineTo(Math.cos((18 + i * 72) * Math.PI / 180) * r, -Math.sin((18 + i * 72) * Math.PI / 180) * r);
            path.lineTo(Math.cos((54 + i * 72) * Math.PI / 180) * R, -Math.sin((54 + i * 72) * Math.PI / 180) * R);
        }
        path.closePath();
        return path;
    };

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang + Math.PI / 2); // Adjust rotation if needed based on your star point definition

    const starShape = getStarPath(currentSize); // Recalculate path if size changes dynamically, or cache scaled versions

    ctx.shadowBlur = s * 0.2;
    if (ex) {
        ctx.shadowColor = 'white';
    } else {
        ctx.shadowColor = 'black';
    }
    ctx.lineWidth = currentSize * 0.6; // Adjusted for Path2D
    ctx.strokeStyle = 'white';
    ctx.stroke(starShape);

    ctx.shadowBlur = 0;
    ctx.shadowColor = '#00000000';
    ctx.lineWidth = currentSize * 0.35; // Adjusted for Path2D
    ctx.strokeStyle = color;
    ctx.stroke(starShape);

    ctx.restore();
}


export class PathRecorder {
    constructor() {
        this.commands = [];
        this.ctxPath = new Path2D(); // Main use
        this.lastX = null;
        this.lastY = null;
        this.currentLength = 0; // For mathematical length calculation
        this.points = []; // Store points for mathematical processing
    }
    _fmt(v) { return +v.toFixed(4); }

    moveTo(x, y) {
        x = this._fmt(x); y = this._fmt(y);
        this.commands.push(`M ${x} ${y}`); // For SVG export if still needed for debug
        this.ctxPath.moveTo(x, y);
        this.lastX = x; this.lastY = y;
        this.points.push({ x, y, type: 'M' });
    }

    lineTo(x, y) {
        x = this._fmt(x); y = this._fmt(y);
        if (this.lastX !== null && this.lastY !== null) {
            const dx = x - this.lastX;
            const dy = y - this.lastY;
            this.currentLength += Math.sqrt(dx * dx + dy * dy);
        }
        this.commands.push(`L ${x} ${y}`);
        this.ctxPath.lineTo(x, y);
        this.lastX = x; this.lastY = y;
        this.points.push({ x, y, type: 'L' });
    }

    arc(cx, cy, r, startAngle, endAngle, anticlockwise = false) {
        // Mathematical length of arc: r * abs(endAngle - startAngle)
        let delta = endAngle - startAngle;
        if (!anticlockwise && delta < 0) delta += 2 * Math.PI;
        if (anticlockwise && delta > 0) delta -= 2 * Math.PI;
        this.currentLength += Math.abs(r * delta);

        this.ctxPath.arc(cx, cy, r, startAngle, endAngle, anticlockwise);

        // For SVG export and point tracking, approximate with line segments if needed
        // This part is complex if you need precise points from the arc for SVG.
        // For Path2D drawing, ctxPath.arc is enough.
        // For mathematical getPointAtLength on an arc, you'd use parametric equations.
        const segments = Math.ceil(Math.abs(delta) / (Math.PI / 18)); // e.g., segment per 10 degrees
        for (let i = 0; i <= segments; i++) {
            const angle = startAngle + (delta * i / segments);
            const x = this._fmt(cx + r * Math.cos(angle));
            const y = this._fmt(cy + r * Math.sin(angle));
            if (i === 0 && (this.lastX !== x || this.lastY !== y)) { // If moveTo is needed
                this.commands.push(`M ${x} ${y}`);
                this.points.push({ x, y, type: 'M_ArcStart' });
            } else if (i > 0) {
                this.commands.push(`L ${x} ${y}`); // Approximate arc with lines for SVG string
                this.points.push({ x, y, type: 'L_ArcSegment' });
            }
            this.lastX = x; this.lastY = y;
        }
        // Update lastX, lastY to the end of the arc
        this.lastX = this._fmt(cx + r * Math.cos(endAngle));
        this.lastY = this._fmt(cy + r * Math.sin(endAngle));
    }

    getTotalLength() {
        return this.currentLength;
    }

    // Implement getPointAtLength mathematically based on this.points and their types
    getPointAtLength(targetLength) {
        if (this.points.length < 2) return this.points[0] || { x: 0, y: 0, angle: 0 };

        let accumulatedLength = 0;
        for (let i = 0; i < this.points.length - 1; i++) {
            const p1 = this.points[i];
            const p2 = this.points[i + 1];

            // Skip if p2 is a moveTo, means a new subpath started by p1
            if (p2.type === 'M' || p2.type === 'M_ArcStart') {
                if (i > 0 && this.points[i - 1].type !== 'M' && this.points[i - 1].type !== 'M_ArcStart') continue; // if p1 was end of segment
            }

            let segmentLength = 0;
            let segmentAngle = 0;

            // This needs to handle arcs properly if `this.points` stores arc segments correctly
            // For now, assuming line segments for simplicity of this example
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            segmentLength = Math.sqrt(dx * dx + dy * dy);
            segmentAngle = Math.atan2(dy, dx);


            if (targetLength <= accumulatedLength + segmentLength + 0.0001) { // Add epsilon for float errors
                const remainingLength = targetLength - accumulatedLength;
                const fraction = segmentLength === 0 ? 0 : remainingLength / segmentLength;
                return {
                    x: p1.x + dx * fraction,
                    y: p1.y + dy * fraction,
                    angle: segmentAngle
                };
            }
            accumulatedLength += segmentLength;
        }
        // If targetLength exceeds path length, return the last point
        const lastP = this.points[this.points.length - 1];
        let prevP = this.points[this.points.length - 2] || { x: lastP.x, y: lastP.y };
        if (lastP.type === 'M' || lastP.type === 'M_ArcStart' && this.points.length > 1) { // If last point was a move, angle is tricky
            prevP = this.points.findLast(p => p.type !== 'M' && p.type !== 'M_ArcStart' && (p.x !== lastP.x || p.y !== lastP.y)) || lastP;
        }

        return {
            x: lastP.x,
            y: lastP.y,
            angle: Math.atan2(lastP.y - prevP.y, lastP.x - prevP.x) || 0
        };
    }

    toSVGPath() { return this.commands.join(" "); }
}

// Modified drawSlidePath - CRITICAL: drawArrow needs full rewrite to avoid DOM
export function drawSlidePath(startNp, endNp, type, color, t_progress, ctx, hw, hh, hbw, currentSettings, calAng, noteBaseSize, noteData) {
    startNp = parseInt(startNp); // Should be number already
    endNp = parseInt(endNp);   // Should be number already

    const s = noteBaseSize; // Arrow size based on noteBaseSize

    // CRITICAL REWRITE: drawArrow should not use SVG DOM elements.
    // It should calculate points mathematically using the path object.
    function drawArrow(pathObject, spacing, _t_arrow_progress, currentCtx, arrowColor, arrowSize) {
        const totalLen = pathObject.getTotalLength(); // Assumes pathObject.getTotalLength() is now mathematical
        if (totalLen <= 0) return;

        currentCtx.fillStyle = arrowColor;

        for (let len = spacing / 2; len < totalLen - spacing / 2; len += spacing) {
            if (len / totalLen >= _t_arrow_progress) { // Only draw if part of the remaining path
                // getPointAtLength should return {x, y, angle}
                const p = pathObject.getPointAtLength(len);

                currentCtx.save();
                currentCtx.translate(p.x, p.y);
                currentCtx.rotate(p.angle);
                currentCtx.beginPath();
                // Define arrow shape relative to (0,0)
                currentCtx.moveTo(arrowSize * 0.55, 0); // Tip of arrow
                currentCtx.lineTo(arrowSize * 0.35, arrowSize * -0.4);
                currentCtx.lineTo(0, arrowSize * -0.4);
                currentCtx.lineTo(arrowSize * 0.2, 0);
                currentCtx.lineTo(0, arrowSize * 0.4);
                currentCtx.lineTo(arrowSize * 0.35, arrowSize * 0.4);
                currentCtx.closePath();
                currentCtx.fill();
                currentCtx.restore();
            }
        }
    }

    let localColor = color;
    ctx.shadowBlur = s * 0.2;
    ctx.shadowColor = '#000000';

    if (t_progress < 0) {
        const alpha = Math.max(0, Math.min(1, (t_progress + 1))); // Alpha from 0 to 1
        const alphaHex = Math.floor(alpha * 255).toString(16).padStart(2, '0');
        localColor = color.length === 7 ? color + alphaHex : color.substring(0, 7) + alphaHex; // Handle existing alpha
        ctx.shadowColor = '#000000' + alphaHex;
    }
    ctx.lineWidth = s * 0.75;
    ctx.strokeStyle = localColor;

    // Path generation (assuming render.path returns a PathRecorder instance)
    // The PathRecorder instance should be generated by noteData if possible during decode.
    const a = noteData.pathObject || path(type, startNp, endNp, hw, hh, hbw, calAng); // Use pre-calculated path if available

    // Draw the path itself (the line of the slide)
    //ctx.stroke(a.ctxPath); // Stroke the Path2D object

    // Draw arrows on the path
    // Ensure `a` is a PathRecorder with mathematical getPointAtLength and getTotalLength
    drawArrow(a, s * 1.25, t_progress < 0 ? 0 : t_progress, ctx, localColor, s * 2); // Pass arrowSize

    // Debug text: (Consider removing for production)
    // ctx.shadowBlur = s * 0.2;
    // ctx.shadowColor = '#000000';
    // ctx.font = "bold 12px Segoe UI"; // Smaller font
    // ctx.fillStyle = "white";
    // const debugNp1 = calAng(getNotePos(endNp % 8, 0));
    // ctx.fillText(`${startNp} ${type} ${endNp} t:${t_progress.toFixed(2)}`, hw + hbw * debugNp1.x, hh + hbw * debugNp1.y - 10);
    ctx.shadowBlur = 0;
    ctx.shadowColor = '#00000000';
}


export function getNotePos(val_a, offset = 0) {
    return ((val_a + offset) + 0.5) / 4 * Math.PI;
}

export function getTouchPos(val_a, offset = 0, touchType) {
    const touchAngleOffset = { "A": 1, "B": 0, "C": 0, "D": 0.5, "E": 0.5 }; // Make const
    return ((val_a + offset) % 8 - 0.5 - (touchAngleOffset[touchType] || 0)) / 4 * Math.PI;
}

// This function should ideally return a PathRecorder object with its mathematical properties calculated
export function path(type, startNp, endNp, hw, hh, hbw, calAng) {
    startNp = parseInt(startNp); // ensure int
    endNp = parseInt(endNp);   // ensure int
    const touchDisToMid = { "A": 1, "B": 0.475, "C": 0, "D": 1, "E": 0.675 }; // Make const
    const notePositionLocal = EIGHT_POSITIONS_ANG; // Use pre-calculated

    const pathRec = new PathRecorder(); // Renamed to avoid conflict with window.path
    let np = [notePositionLocal[isNaN(startNp) ? 0 : startNp % 8],
    notePositionLocal[isNaN(endNp) ? 0 : (endNp > 9 ? (Math.floor(endNp / 10) - 1) : endNp) % 8]];

    np[0] = { x: hw + hbw * np[0].x, y: hh + hbw * np[0].y }; // Create new objects
    np[1] = { x: hw + hbw * np[1].x, y: hh + hbw * np[1].y };
    let turn = (startNp >= 2 && startNp <= 5);

    switch (type) {
        case '-':
            pathRec.moveTo(np[0].x, np[0].y); pathRec.lineTo(np[1].x, np[1].y);
            break;
        case '^': {
            const sAng = getNotePos(startNp - 2); // Simpler indexing if startNp is 0-7 based
            const eAng = getNotePos(endNp - 2);
            // Determine anticlockwise based on shortest path (e.g. 1 to 7 is clockwise, 1 to 3 is clockwise)
            let diff = (endNp - startNp + 8) % 8;
            pathRec.arc(hw, hh, hbw, sAng, eAng, diff > 4);
            break;
        }
        case '>': {
            pathRec.arc(hw, hh, hbw,
                getNotePos(startNp - 2 + ((startNp === endNp && turn) ? 8 : 0)),
                getNotePos(endNp - 2 + ((startNp === endNp && !turn) ? 8 : 0)),
                false ^ turn
            );
            break;
        }
        case '<': {
            pathRec.arc(hw, hh, hbw,
                getNotePos(startNp - 2 + ((startNp === endNp && !turn) ? 8 : 0)),
                getNotePos(endNp - 2 + ((startNp === endNp && turn) ? 8 : 0)),
                true ^ turn
            );
            break;
        }
        case 'v':
            pathRec.moveTo(np[0].x, np[0].y); pathRec.lineTo(hw, hh); pathRec.lineTo(np[1].x, np[1].y);
            break;
        case 'z': {
            let npTouch = calAng(getTouchPos(startNp, 3, 'B'));
            let npTouch1 = calAng(getTouchPos(startNp, 7, 'B'));
            pathRec.moveTo(np[0].x, np[0].y);
            pathRec.lineTo(hw + npTouch.x * touchDisToMid['B'] * hbw, hh + npTouch.y * touchDisToMid['B'] * hbw);
            pathRec.lineTo(hw + npTouch1.x * touchDisToMid['B'] * hbw, hh + npTouch1.y * touchDisToMid['B'] * hbw);
            pathRec.lineTo(np[1].x, np[1].y);
            break;
        }
        case 's': {
            let npTouch = calAng(getTouchPos(startNp, 7, 'B'));
            let npTouch1 = calAng(getTouchPos(startNp, 3, 'B'));
            pathRec.moveTo(np[0].x, np[0].y);
            pathRec.lineTo(hw + npTouch.x * touchDisToMid['B'] * hbw, hh + npTouch.y * touchDisToMid['B'] * hbw);
            pathRec.lineTo(hw + npTouch1.x * touchDisToMid['B'] * hbw, hh + npTouch1.y * touchDisToMid['B'] * hbw);
            pathRec.lineTo(np[1].x, np[1].y);
            break;
        }
        case 'V': {
            pathRec.moveTo(np[0].x, np[0].y);
            pathRec.lineTo(np[1].x, np[1].y);
            const endPosFraction = Math.round(endNp / 10 % 1 * 10); // e.g. 8.3 -> 3
            const thirdPointAng = calAng(getNotePos((endPosFraction - 1 + 8) % 8, 0)); // Ensure 0-7
            pathRec.lineTo(
                hw + hbw * thirdPointAng.x,
                hh + hbw * thirdPointAng.y);
            break;
        }
        case 'q': {
            pathRec.moveTo(np[0].x, np[0].y);
            pathRec.lineTo(np[0].x + calAng(Math.PI * (startNp / 4 + 1)).x * hbw * 0.9, np[0].y + calAng(Math.PI * (startNp / 4 + 1)).y * hbw * 0.9);
            pathRec.arc(hw, hh, Math.sin(Math.PI / 8) * hbw, Math.PI * (startNp / 4), Math.PI * (8 * ((endNp - startNp + 5) % 8 == 0) + (endNp + 13) % 8) / 4);
            pathRec.lineTo(np[1].x + calAng(Math.PI * (endNp / 4 + 1.25)).x * hbw * 0.9, np[1].y + calAng(Math.PI * (endNp / 4 + 1.25)).y * hbw * 0.9);
            pathRec.lineTo(np[1].x, np[1].y);
            break;
        }
        case 'p': {
            pathRec.moveTo(np[0].x, np[0].y);
            pathRec.lineTo(np[0].x + calAng(Math.PI * (startNp / 4 + 1.25)).x * hbw * 0.9, np[0].y + calAng(Math.PI * (startNp / 4 + 1.25)).y * hbw * 0.9);
            pathRec.arc(hw, hh, Math.sin(Math.PI / 8) * hbw, Math.PI * (8 * ((startNp - endNp + 5) % 8 == 0) + (startNp + 13) % 8) / 4, Math.PI * (endNp) / 4, true);
            pathRec.lineTo(np[1].x + calAng(Math.PI * (endNp / 4 + 1)).x * hbw * 0.9, np[1].y + calAng(Math.PI * (endNp / 4 + 1)).y * hbw * 0.9);
            pathRec.lineTo(np[1].x, np[1].y);
            break;
        }
        case 'qq': {
            pathRec.moveTo(np[0].x, np[0].y);
            pathRec.lineTo(hw, hh);
            break;
        }
        default:
            pathRec.moveTo(np[0].x, np[0].y); pathRec.lineTo(np[1].x, np[1].y);
            break;
    }
    return pathRec;
}


export function drawHold(x, y, sizeFactor, color, ex, ang, l, ctx, hbw, currentSettings, calAng, noteBaseSize) {
    ang = ang - 0.125 * Math.PI;
    let s = noteBaseSize;
    let currentSize = Math.max(sizeFactor * s, 0);

    // Consider creating a Path2D for the hold shape if performance is critical
    const createHoldPath = () => {
        const p = new Path2D();
        p.moveTo(x - currentSize * calAng(ang).x, y + currentSize * calAng(ang).y);
        p.lineTo(x - currentSize * calAng(ang + Math.PI / 3).x, y + currentSize * calAng(ang + Math.PI / 3).y);
        p.lineTo(x - currentSize * calAng(ang + 2 * Math.PI / 3).x + l * calAng(ang).x, y + currentSize * calAng(ang + 2 * Math.PI / 3).y - l * calAng(ang).y);
        p.lineTo(x - currentSize * calAng(ang + Math.PI).x + l * calAng(ang).x, y + currentSize * calAng(ang + Math.PI).y - l * calAng(ang).y);
        p.lineTo(x - currentSize * calAng(ang + 4 * Math.PI / 3).x + l * calAng(ang).x, y + currentSize * calAng(ang + 4 * Math.PI / 3).y - l * calAng(ang).y);
        p.lineTo(x - currentSize * calAng(ang + 5 * Math.PI / 3).x, y + currentSize * calAng(ang + 5 * Math.PI / 3).y);
        p.closePath();
        return p;
    };
    const holdPath = createHoldPath();

    ctx.shadowBlur = s * 0.2;
    if (ex) {
        ctx.shadowColor = 'white';
    } else {
        ctx.shadowColor = 'black';
    }
    ctx.lineWidth = currentSize * 0.75;
    ctx.strokeStyle = 'white';
    ctx.stroke(holdPath);

    ctx.shadowBlur = 0;
    ctx.shadowColor = '#00000000';
    ctx.lineWidth = currentSize * 0.5;
    ctx.strokeStyle = color;
    ctx.stroke(holdPath);
}

export function drawTouch(pos, sizeFactor, color, type, distance, opacity, holdtime, t_touch, ctx, hw, hh, hbw, currentSettings, calAng, noteBaseSize) {
    opacity = Math.min(Math.max(opacity, 0), 1); // Clamp opacity
    const r = parseInt(color.substring(1, 3), 16);
    const g = parseInt(color.substring(3, 5), 16);
    const b = parseInt(color.substring(5, 7), 16);
    let localColor = `rgba(${r},${g},${b},${opacity})`;

    let s = noteBaseSize;
    let currentSize = Math.max(sizeFactor * s, 0); // sizeFactor seems to be a base, not multiplier here. Original: size = size * s;

    const touchDisToMid = { "A": 0.85, "B": 0.475, "C": 0, "D": 0.85, "E": 0.675 }; // Make const
    const touchAngleOffset = { "A": 0, "B": 0, "C": 0, "D": 0.5, "E": 0.5 }; // Make const
    let ang = (pos - 0.5 - (touchAngleOffset[type] || 0)) / 4 * Math.PI;
    let np = calAng(ang);

    const centerX = hw + np.x * (touchDisToMid[type] || 0) * hbw;
    const centerY = hh + np.y * (touchDisToMid[type] || 0) * hbw;

    ctx.shadowBlur = s * 0.2;
    ctx.shadowColor = `rgba(0,0,0,${opacity})`;
    let effectiveDistance = (distance + 0.6) * currentSize; // Apply currentSize to distance scaling


    function drawTouchElement(isFill = false) {
        const outerStrokeStyle = `rgba(255,255,255,${opacity})`;
        const innerStrokeStyle = localColor;
        ctx.lineWidth = currentSize * (isFill ? 0.35 : 0.6); // Thinner for colored part

        if (!isFill) { // White outline pass
            ctx.strokeStyle = outerStrokeStyle;
        } else { // Color fill/stroke pass
            ctx.strokeStyle = innerStrokeStyle;
            ctx.shadowColor = '#00000000';
        }

        if (holdtime && holdtime > 0) {
            // strCh logic
            const corners = [
                { x_offset: 1, y_offset: -1, fill: `rgba(250,73,4,${opacity})` },
                { x_offset: -1, y_offset: -1, fill: `rgba(0,141,244,${opacity})` },
                { x_offset: 1, y_offset: 1, fill: `rgba(245,238,0,${opacity})` },
                { x_offset: -1, y_offset: 1, fill: `rgba(17,167,105,${opacity})` }
            ];
            corners.forEach(corner => {
                ctx.beginPath();
                // Recalculate points based on centerX, centerY, effectiveDistance, and currentSize
                const point1x = centerX + effectiveDistance * corner.x_offset;
                const point1y = centerY + effectiveDistance * corner.y_offset;
                const point2x = centerX + effectiveDistance * corner.x_offset;
                const point2y = centerY + (effectiveDistance + currentSize * Math.SQRT2) * corner.y_offset; // Approx
                const point3x = centerX + (effectiveDistance + currentSize * Math.SQRT2) * corner.x_offset; // Approx
                const point3y = centerY + effectiveDistance * corner.y_offset;

                ctx.moveTo(point1x, point1y);
                ctx.lineTo(point2x, point2y); // These points define triangles/quads for corners
                ctx.lineTo(point3x, point3y); // Adjust geometry for exact original shape
                ctx.closePath();

                if (isFill) {
                    ctx.fillStyle = corner.fill;
                    ctx.fill();
                    ctx.strokeStyle = corner.fill; // Match stroke to fill for filled parts
                }
                ctx.stroke();
            });
            if (isFill) ctx.strokeStyle = innerStrokeStyle; // Reset for center arc
            _arc(centerX, centerY, currentSize * 0.15, ctx);

        } else { // str logic (non-hold)
            const armLength = currentSize * (1 + distance + 0.6); // Simplified arm length
            // Top Triangle
            ctx.beginPath();
            ctx.moveTo(centerX, centerY - effectiveDistance);
            ctx.lineTo(centerX + currentSize, centerY - armLength);
            ctx.lineTo(centerX - currentSize, centerY - armLength);
            ctx.closePath(); ctx.stroke();
            // Left Triangle
            ctx.beginPath();
            ctx.moveTo(centerX - effectiveDistance, centerY);
            ctx.lineTo(centerX - armLength, centerY - currentSize);
            ctx.lineTo(centerX - armLength, centerY + currentSize);
            ctx.closePath(); ctx.stroke();
            // Bottom Triangle
            ctx.beginPath();
            ctx.moveTo(centerX, centerY + effectiveDistance);
            ctx.lineTo(centerX + currentSize, centerY + armLength);
            ctx.lineTo(centerX - currentSize, centerY + armLength);
            ctx.closePath(); ctx.stroke();
            // Right Triangle
            ctx.beginPath();
            ctx.moveTo(centerX + effectiveDistance, centerY);
            ctx.lineTo(centerX + armLength, centerY - currentSize);
            ctx.lineTo(centerX + armLength, centerY + currentSize);
            ctx.closePath(); ctx.stroke();

            _arc(centerX, centerY, currentSize * 0.15, ctx);
        }
    }


    function strPrg(t_progress_hold) {
        ctx.lineWidth = currentSize * 0.8;
        let progressSegments = [t_progress_hold, t_progress_hold - 0.25, t_progress_hold - 0.5, t_progress_hold - 0.75];
        const colors = [`rgb(250,73,4,${opacity})`, `rgb(245,238,0,${opacity})`, `rgb(17,167,105,${opacity})`, `rgb(0,141,244,${opacity})`]; // Apply opacity
        const angles = [Math.PI * 0.75, Math.PI * 1.25, Math.PI * 1.75, Math.PI * 0.25];
        const barBaseLength = currentSize * (3 + distance + 0.6); // Simplified base length

        if (t_progress_hold >= 0) {
            for (let i = 0; i < 4; i++) {
                let disPercent = Math.max(0, progressSegments[i]);
                disPercent = Math.min(0.25, disPercent) / 0.25;
                let barLength = disPercent * barBaseLength * Math.SQRT2; // Approx length of the bar segment

                ctx.strokeStyle = colors[i];
                ctx.beginPath();
                // Start points for bars need to be relative to actual center, not just np
                const startBarX = centerX + calAng(angles[i] - Math.PI * 0.75).x * (effectiveDistance + currentSize * 3); // Offset from center outwards
                const startBarY = centerY + calAng(angles[i] - Math.PI * 0.75).y * (effectiveDistance + currentSize * 3);

                ctx.moveTo(startBarX, startBarY);
                ctx.lineTo(startBarX + calAng(angles[i]).x * barLength, startBarY + calAng(angles[i]).y * barLength);
                ctx.stroke();
            }
        }
    }

    if (holdtime && holdtime > 0) {
        strPrg(t_touch / holdtime);
        drawTouchElement(false); // Draw white outline base
        drawTouchElement(true);  // Draw colored filled parts
    } else {
        drawTouchElement(false); // Draw white outline
        drawTouchElement(true);  // Draw colored center (original has two calls to str())
    }

    ctx.shadowBlur = 0;
    ctx.shadowColor = '#00000000';
}


export function _arc(x, y, r = 0, currentCtx) {
    if (r <= 0) return; // Don't draw zero or negative radius arcs
    currentCtx.beginPath();
    currentCtx.arc(x, y, r, 0, 2 * Math.PI);
    currentCtx.stroke();
}
// ====================================================================================
// RENDER GAME FUNNCTION - All drawing logic goes here
// ====================================================================================

// import { settings } from "./main.js"; // Assuming settings is passed as currentSettings

// Pre-calculate angular positions if they are static
const EIGHT_POSITIONS_ANG = [];
for (let j = 0; j < 8; j++) {
    const ang = (j + 0.5) / 4 * Math.PI;
    EIGHT_POSITIONS_ANG.push({ 'x': Math.sin(ang), 'y': Math.cos(ang) * -1 });
}

export function renderGame(ctx, notesToRender, currentSettings, images, time, triggeredNotes, play, fps) {
    const calAng = function (ang) { return { 'x': Math.sin(ang), 'y': Math.cos(ang) * -1 } }; // Keep if dynamic angles needed elsewhere

    ctx.resetTransform();
    const w = ctx.canvas.width,
        h = ctx.canvas.height,
        hw = w / 2,
        hh = h / 2;

    const factor = 0.95; // 缩小
    ctx.resetTransform();
    ctx.clearRect(0, 0, w, h);
    // 平移到中心，缩放，再平移回：
    ctx.translate(hw, h / 2);
    ctx.scale(factor, factor);
    ctx.translate(-hw, -h / 2);

    ctx.lineJoin = currentSettings.roundStroke ? 'round' : 'butt';

    const bw = (h > w ? w : h), // circle screen width
        hbw = (bw / 2); // half of it

    // Cache note base size
    const noteBaseSize = hbw * currentSettings.noteSize;
    if (currentSettings.showFpsCounter) {
        ctx.fillStyle = "black";
        ctx.strokeStyle = "white";
        ctx.textAlign = "left";
        ctx.lineWidth = Math.floor(hbw * 0.0125);
        ctx.font = "bold " + Math.floor(hbw * 0.07) + "px combo"
        ctx.strokeText(`FPS: ${Math.floor(fps)}`, hbw * 0.02, hbw * 0.02);
        ctx.fillText(`FPS: ${Math.floor(fps)}`, hbw * 0.02, hbw * 0.02);
    }

    switch (currentSettings.middleDisplay) {
        case 1:
            if (play.combo != 0) {
                ctx.fillStyle = "#FF569B";
                ctx.strokeStyle = "white";
                ctx.lineWidth = Math.floor(hbw * 0.015);
                ctx.font = "bold " + Math.floor(hbw * 0.105) + "px combo"
                ctx.textAlign = "center";
                ctx.letterSpacing = "0px";
                ctx.strokeText("COMBO", hw, hh - hbw * 0.12);
                ctx.fillText("COMBO", hw, hh - hbw * 0.12);
                ctx.letterSpacing = Math.floor(hbw * 0.025) + "px";
                ctx.font = "bold " + Math.floor(hbw * 0.16) + "px combo"
                ctx.strokeText(`${play.combo}`, hw + Math.floor(hbw * 0.0125), hh + hbw * 0.06);
                ctx.fillText(`${play.combo}`, hw + Math.floor(hbw * 0.0125), hh + hbw * 0.06);
            }
            ctx.letterSpacing = "0px";
            break;
        case 2:
            ctx.fillStyle = "#FF569B";
            ctx.strokeStyle = "white";
            ctx.lineWidth = Math.floor(hbw * 0.015);
            ctx.textAlign = "left";
            ctx.letterSpacing = "0px";
            ctx.font = "bold " + Math.floor(hbw * 0.13) + "px combo"
            const trueScore = Math.round(Math.max(play.score, 0));
            ctx.strokeText(`${((trueScore / 10000) % 1).toFixed(4).slice(1, 6)}`, hw - hbw * 0.1, hh + hbw * 0.06);
            ctx.fillText(`${((trueScore / 10000) % 1).toFixed(4).slice(1, 6)}`, hw - hbw * 0.1, hh + hbw * 0.06);
            ctx.textAlign = "right";
            ctx.letterSpacing = "0px";
            ctx.font = "bold " + Math.floor(hbw * 0.16) + "px combo"
            ctx.strokeText(`${Math.floor(trueScore / 10000)}`, hw - hbw * 0.1, hh + hbw * 0.06);
            ctx.fillText(`${Math.floor(trueScore / 10000)}`, hw - hbw * 0.1, hh + hbw * 0.06);
            break;
        default:
            break;
    }

    ctx.shadowColor = 'black';
    ctx.shadowBlur = 4;
    // images.sensor.style.fontFamily = 'monospace'; // Setting style on image element directly, not canvas related for drawing
    ctx.drawImage(images.sensor,
        (h > w ? 0 : (w - h) / 2), (h > w ? (h - w) / 2 : 0),
        bw, bw);
    if (!currentSettings.disableSensorWhenPlaying || play.pause) {
        ctx.drawImage(images.sensorText,
            (h > w ? 0 : (w - h) / 2), (h > w ? (h - w) / 2 : 0),
            bw, bw);
    }
    ctx.shadowColor = '#00000000';
    ctx.shadowBlur = 0;

    ctx.drawImage(images.outline,
        (h > w ? 0 : (w - h) / 2), (h > w ? (h - w) / 2 : 0),
        bw, bw);

    // slide render
    if (currentSettings.showSlide) {
        let currentSlideNumbersOnScreen = 0;

        for (let i = notesToRender.length - 1; i >= 0; i--) {
            if (currentSlideNumbersOnScreen > currentSettings.maxSlideOnScreenCount) continue;
            const note = notesToRender[i];
            if (!note || !note.slide || note.invalid) continue; // Simplified check

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
                    drawSlidePath(nang, nang2, note.slideType, color, (_t - note.delay) / note.slideTime, ctx, hw, hh, hbw, currentSettings, calAng, noteBaseSize, note, false);
                    currentSlideNumbersOnScreen++;
                } else {
                    drawSlidePath(nang, nang2, note.slideType, color, _t * currentSettings.slideSpeed, ctx, hw, hh, hbw, currentSettings, calAng, noteBaseSize, note, true);
                    currentSlideNumbersOnScreen++
                }
            }
        }
    }

    //tap ,star and hold render
    for (let i = notesToRender.length - 1; i >= 0; i--) {
        const note = notesToRender[i];
        if (!note || note.starTime || note.touch || note.slide || note.invalid || !note.pos) continue; // Simplified check

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

        if (currentSettings.nextNoteHighlight && play.nowIndex + 1 == note.index) color = '#220022';

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

            const scaleFactor = (Math.min(_t, 0) * currentSettings.speed + 1);
            if (_t >= -d / currentSettings.speed) {
                currentX = hw + hbw * np.x * scaleFactor;
                currentY = hh + hbw * np.y * scaleFactor;
            } else {
                currentX = hw + hbw * np.x * (1 - d);
                currentY = hh + hbw * np.y * (1 - d);
                currentSize = (_t * currentSettings.speed + (2 - currentSettings.distanceToMid));
            }
            if (!currentSettings.noNoteArc) {
                drawNoteArc(ctx, {
                    centerX: hw,
                    centerY: hh,
                    radius: Math.max(scaleFactor, (1 - d)) * hbw,
                    angle: getNoteAng(nang, 5) - Math.PI * 0.25,
                    width: Math.max(scaleFactor, (1 - d)) * hbw * 0.015,
                    strokeStyle: color,
                    transparency: currentSize * 0.55,
                });
                drawNoteDot(ctx, {
                    x: currentX,
                    y: currentY,
                    size: currentSize * hbw * 0.0075,
                    color: color,
                    transparency: currentSize,
                });
            }
            if (note.star) {
                drawStar(currentX, currentY, currentSize, color, note.ex ?? false, (nang) / -4 * Math.PI, ctx, hbw, currentSettings, calAng, noteBaseSize);
            } else if (note.holdTime != null) { // Check for truthiness (not just existence)
                note.holdTime = note.holdTime == 0 ? 1E-64 : note.holdTime;
                let holdLength = 0;
                if (_t >= -d / currentSettings.speed) {
                    holdLength = (Math.min((note.holdTime - (_t > 0 ? _t : 0)) * currentSettings.speed, (1 - currentSettings.distanceToMid) * (Math.min(_t, 0) + (d / currentSettings.speed)) / (d / currentSettings.speed))) * hbw;
                }
                drawHold(currentX, currentY, currentSize, color, note.ex ?? false, (nang) / -4 * Math.PI, holdLength, ctx, hbw, currentSettings, calAng, noteBaseSize);
            } else {
                drawTap(currentX, currentY, currentSize, color, note.ex ?? false, ctx, hbw, currentSettings, noteBaseSize);
            }
        }

        if (_t >= 0 && _t <= currentSettings.effectDecayTime + (note.holdTime ?? 0)) {
            let nang = (parseInt(note.pos[0]) - 1) % 8;
            nang = nang < 0 ? 0 : nang;

            const notePosition = EIGHT_POSITIONS_ANG; // Use pre-calculated positions
            let np = notePosition[isNaN(nang) ? 0 : nang];
            if (!np) {
                console.warn("np is undefined in tap/star/hold for note:", note, "index:", i); // Conditional logging
                continue;
            }
            const currentX = hw + hbw * np.x;
            const currentY = hh + hbw * np.y;
            if (note.holdTime) {
                if (_t <= note.holdTime) drawHoldEffect(currentX, currentY, _t, color, ctx, hbw, currentSettings, noteBaseSize);
                drawHoldEndEffect(currentX, currentY, (_t - note.holdTime) / currentSettings.effectDecayTime * 2, color, ctx, hbw, currentSettings, noteBaseSize);
            } else {
                drawSimpleEffect(currentX, currentY, _t / currentSettings.effectDecayTime * 2, color, ctx, hbw, currentSettings, noteBaseSize);
                drawStarEffect(currentX, currentY, _t / currentSettings.effectDecayTime, color, ctx, hbw, currentSettings, noteBaseSize, true);
            }

            /*ctx.fillStyle = "black";
            ctx.font = "24px monospace"
            ctx.fillText(`${_t}, ${currentSettings.effectDecayTime}`, currentX, currentY);*/
        }
    }

    //touch render
    for (let i = notesToRender.length - 1; i >= 0; i--) {
        const note = notesToRender[i];
        if (!note || !note.touch || note.invalid) continue; // Simplified check

        const _t = ((time - note.time) / 1000);
        let color = '#0089F4';
        if (note.break) {
            color = '#FF6C0C';
        } else if (note.isDoubleTouch) { // Assuming 'isDoubleTouch' is pre-calculated
            color = '#FFD900';
        }

        if (currentSettings.nextNoteHighlight && play.nowIndex + 1 == note.index) color = '#220022';

        const ani = function easeOutQuad(x) {
            return 1 - Math.pow(1 - x, 3);
        }

        if (_t >= -1 / currentSettings.touchSpeed && _t < (note.touchTime ?? 0)) {
            drawTouch(note.pos, 0.85, color, note.touch,
                ani(_t < 0 ? _t * - currentSettings.touchSpeed : 0),
                (1 - (_t / (-1 / currentSettings.touchSpeed))) * 4
                , note.touchTime, _t, ctx, hw, hh, hbw, currentSettings, calAng, noteBaseSize);
        }

        if (_t >= 0 && _t <= currentSettings.effectDecayTime + (note.touchTime ?? 0)) {
            const touchDisToMid = { "A": 0.85, "B": 0.475, "C": 0, "D": 0.85, "E": 0.675 }; // Make const
            const touchAngleOffset = { "A": 0, "B": 0, "C": 0, "D": 0.5, "E": 0.5 }; // Make const
            let ang = (note.pos - 0.5 - (touchAngleOffset[note.touch] || 0)) / 4 * Math.PI;
            let np = calAng(ang);

            const centerX = hw + np.x * (touchDisToMid[note.touch] || 0) * hbw;
            const centerY = hh + np.y * (touchDisToMid[note.touch] || 0) * hbw;

            if (note.touchTime) {
                if (_t <= note.touchTime) drawHoldEffect(centerX, centerY, _t, color, ctx, hbw, currentSettings, noteBaseSize);
                drawHoldEndEffect(centerX, centerY, (_t - note.touchTime) / currentSettings.effectDecayTime * 2, color, ctx, hbw, currentSettings, noteBaseSize);
            } else {
                drawSimpleEffect(centerX, centerY, _t / currentSettings.effectDecayTime * 2, color, ctx, hbw, currentSettings, noteBaseSize);
                drawStarEffect(centerX, centerY, _t / currentSettings.effectDecayTime, color, ctx, hbw, currentSettings, noteBaseSize);
            }
        }
    }
}


export function drawTap(x, y, sizeFactor, color, ex, ctx, hbw, currentSettings, noteBaseSize) {
    let s = noteBaseSize; // Use passed base size
    let currentSize = Math.max(sizeFactor * s, 0);

    ctx.shadowBlur = noteBaseSize * (ex ? 0.3 : 0.2);
    ctx.shadowColor = (ex ? color : '#000000');
    ctx.lineWidth = currentSize * 0.75 * currentSettings.lineWidthFactor;
    ctx.strokeStyle = 'white';
    _arc(x, y, currentSize, ctx);
    ctx.shadowBlur = 0;
    ctx.shadowColor = '#00000000';
    ctx.lineWidth = currentSize * 0.5 * currentSettings.lineWidthFactor;
    ctx.strokeStyle = color;
    ctx.fillStyle = '#00000000';
    _arc(x, y, currentSize, ctx);
}

export function drawSimpleEffect(x, y, sizeFactor, color, ctx, hbw, currentSettings, noteBaseSize) {
    if (!currentSettings.showEffect) return;

    function ani(x) {
        return 1 - Math.pow(x, 2);
    }

    function ani1(x) {
        return Math.log(99 * x + 1) / Math.log(100);
    }

    sizeFactor = Math.min(Math.max(sizeFactor, 0), 1);
    let s = noteBaseSize; // Use passed base size
    let currentSize = s * (ani1(sizeFactor) * 1.75);
    let localColor = ctx.createRadialGradient(x, y, 0, x, y, currentSize);
    localColor.addColorStop(0, '#FCFF0A00');
    localColor.addColorStop(1, hexWithAlpha('#FCFF0A', 0.75 * ani(sizeFactor)));

    ctx.shadowColor = "#00000000";
    ctx.lineWidth = currentSize * 0.75 * currentSettings.lineWidthFactor;
    ctx.fillStyle = localColor;
    ctx.beginPath();
    ctx.arc(x, y, currentSize, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.fill();
}

export function drawHoldEndEffect(x, y, sizeFactor, color, ctx, hbw, currentSettings, noteBaseSize) {
    if (!currentSettings.showEffect) return;

    function ani(x) {
        return 1 - Math.pow(x, 2);
    }

    function ani1(x) {
        return Math.log(99 * x + 1) / Math.log(100);
    }

    sizeFactor = Math.min(Math.max(sizeFactor, 0), 1);
    let s = noteBaseSize; // Use passed base size
    let currentSize = s * (ani1(sizeFactor) * 1.75);
    let localColor = ctx.createRadialGradient(x, y, 0, x, y, currentSize);
    localColor.addColorStop(0, '#FCFF0A00');
    localColor.addColorStop(1, hexWithAlpha('#FCFF0A', 0.75 * ani(sizeFactor)));

    ctx.shadowColor = "#00000000";
    ctx.lineWidth = currentSize * 0.75 * currentSettings.lineWidthFactor;
    ctx.fillStyle = localColor;
    ctx.beginPath();
    ctx.arc(x, y, currentSize, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.fill();
}

export function drawHoldEffect(x, y, sizeFactor, color, ctx, hbw, currentSettings, noteBaseSize) {
    if (!currentSettings.showEffect) return;

    function ani2(x, sp) {
        return (Math.sin(x * sp) + 1) / 2;
    }

    /*ctx.fillStyle = "black";
    ctx.font = "24px monospace"
    ctx.fillText(`${sizeFactor}, ${Math.sin(sizeFactor + Math.sin(sizeFactor / 2))}`, x + 100, y);*/
    let s = noteBaseSize; // Use passed base size
    let currentSize = s * ((ani2(sizeFactor, 20) / 2 + 0.5) * 1.75);
    let localColor = ctx.createRadialGradient(x, y, 0, x, y, currentSize);
    localColor.addColorStop(0, '#FCFF0A00');
    localColor.addColorStop(1, hexWithAlpha('#FCFF0A', 0.75 * (ani2(sizeFactor, 20) / 2 + 0.5)));

    ctx.shadowColor = "#00000000";
    ctx.lineWidth = currentSize * 0.75 * currentSettings.lineWidthFactor;
    ctx.fillStyle = localColor;
    ctx.beginPath();
    ctx.arc(x, y, currentSize, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.fill();
}

export function drawStarEffect(x, y, sizeFactor, color, ctx, hbw, currentSettings, noteBaseSize, useFiveStar = false) {
    if (!currentSettings.showEffect) return;

    color = "#EDCE10";

    const calAng = function (ang) { return { 'x': Math.sin(ang) * -1, 'y': Math.cos(ang) } };

    function ani1(x) {
        return Math.log(99 * x + 1) / Math.log(100);
    }

    function drawRoundedStar(ctx, cx, cy, r, color, rotation = 0, cornerRadius = 8) {
        const points = 5;
        const rot = -Math.PI / 2;                  // 让第一个点指向正上方
        const step = Math.PI / points;             // 36°

        // 先计算所有顶点（交替外半径 / 内半径）
        const verts = [];
        for (let i = 0; i < points * 2; i++) {
            const radius = (i % 2 === 0) ? r : r * 0.5;  // 内半径 = 外半径的一半
            const angle = rot + i * step + rotation;
            verts.push({
                x: Math.cos(angle) * radius + cx,
                y: Math.sin(angle) * radius + cy
            });
        }

        ctx.save();
        ctx.beginPath();
        // 从最后一个点开始，这样 arcTo 能正确闭合
        let prev = verts[verts.length - 1];
        let curr = verts[0];
        let next = verts[1];
        ctx.moveTo(
            prev.x + (curr.x - prev.x) * (cornerRadius / Math.hypot(curr.x - prev.x, curr.y - prev.y)),
            prev.y + (curr.y - prev.y) * (cornerRadius / Math.hypot(curr.x - prev.x, curr.y - prev.y))
        );

        // 遍历每个顶点，使用 arcTo 绘制圆角
        for (let i = 0; i < verts.length; i++) {
            prev = verts[(i - 1 + verts.length) % verts.length];
            curr = verts[i];
            next = verts[(i + 1) % verts.length];

            ctx.lineTo(
                curr.x + (prev.x - curr.x) * (cornerRadius / Math.hypot(prev.x - curr.x, prev.y - curr.y)),
                curr.y + (prev.y - curr.y) * (cornerRadius / Math.hypot(prev.x - curr.x, prev.y - curr.y))
            );
            ctx.arcTo(curr.x, curr.y,
                curr.x + (next.x - curr.x) * (cornerRadius / Math.hypot(next.x - curr.x, next.y - curr.y)),
                curr.y + (next.y - curr.y) * (cornerRadius / Math.hypot(next.x - curr.x, next.y - curr.y)),
                cornerRadius);
        }
        ctx.closePath();

        ctx.fillStyle = color;
        ctx.fill();
        ctx.restore();
    }

    function drawDiamond(ctx, cx, cy, r, color, fill, rotation = 0) {
        ctx.save();

        // 將座標原點移動到中心
        ctx.translate(cx, cy);
        // 旋轉
        ctx.rotate(rotation);
        // 回到以中心為原點的座標系
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.strokeStyle = color;

        if (!fill) ctx.lineWidth = r * 0.2;

        // 繪製菱形路徑（以原點為中心）
        ctx.moveTo(0, -r);
        ctx.quadraticCurveTo(r * 0.25, -r * 0.25, r, 0);
        ctx.quadraticCurveTo(r * 0.25, r * 0.25, 0, r);
        ctx.quadraticCurveTo(-r * 0.25, r * 0.25, -r, 0);
        ctx.quadraticCurveTo(-r * 0.25, -r * 0.25, 0, -r);

        ctx.closePath();

        if (fill) ctx.fill();
        else ctx.stroke();

        ctx.restore();
    }

    sizeFactor = Math.min(Math.max(sizeFactor, 0), 1);
    let s = noteBaseSize;
    const baseAngle = Math.PI / 8; // 初始角度
    const count = 8; // 總共 8 顆星星

    for (let i = 0; i < count; i++) {
        const ang = calAng(baseAngle + i * Math.PI / 4); // 每隔 22.5°
        const offset = (ani1(sizeFactor) + 2) * s * 0.75;
        const radius = s * ani1(1 - sizeFactor) * 0.4;
        const isFill = (i % 2 !== 0); // 偶數空心，奇數實心

        if (isFill && useFiveStar) {
            drawRoundedStar(
                ctx,
                x + offset * ang.x,
                y + offset * ang.y,
                radius * 1.25,
                color,
                baseAngle + i * Math.PI / 4,
                radius * 0.2
            );
        } else {
            drawDiamond(
                ctx,
                x + offset * ang.x,
                y + offset * ang.y,
                radius + isFill * radius * 0.15,
                color,
                isFill,
                baseAngle + i * Math.PI / 4
            );
        }

        drawDiamond(
            ctx,
            x + ang.x * 0.1 * hbw,
            y + ang.y * 0.1 * hbw,
            (radius + !isFill * radius * 0.15) * 0.5,
            color,
            !isFill,
            baseAngle + i * Math.PI / 4
        );
    }
}

// 建立一個快取來儲存不同大小的星星路徑，避免重複計算
const starCache = new Map();

function getStarPath(scale) {
    if (starCache.has(scale)) {
        return starCache.get(scale);
    }

    const path = new Path2D();
    const R = scale;       // 外圈半徑
    const r = scale * 0.5; // 內圈半徑

    const angle = -90; // 從頂部開始

    for (let i = 0; i < 5; i++) {
        // 外角
        const x = Math.cos((angle + i * 72) * Math.PI / 180) * R;
        const y = Math.sin((angle + i * 72) * Math.PI / 180) * R;

        if (i === 0) {
            path.moveTo(x, y);
        } else {
            path.lineTo(x, y);
        }

        // 內角
        const innerX = Math.cos((angle + i * 72 + 36) * Math.PI / 180) * r;
        const innerY = Math.sin((angle + i * 72 + 36) * Math.PI / 180) * r;

        path.lineTo(innerX, innerY);
    }

    path.closePath();
    starCache.set(scale, path);
    return path;
}

// 移除了未使用的參數 (hbw, currentSettings, calAng)
export function drawStar(x, y, sizeFactor, color, ex, ang, ctx, hbw, currentSettings, calAng, noteBaseSize, alpha = 1) {
    // 角度調整可以保留，這屬於視覺效果的一部分
    const currentSize = Math.max(sizeFactor * noteBaseSize, 0);

    if (currentSize === 0) return; // 大小為 0 就不用畫了

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((ang * 0.192 + 0.125) * Math.PI);

    const starShape = getStarPath(currentSize);

    // --- 顏色與透明度處理 ---
    // 修正：直接限制 alpha 在 0-1 之間
    const localAlpha = Math.max(0, Math.min(1, alpha));
    const alphaHex = Math.floor(localAlpha * 255).toString(16).padStart(2, '0');
    // 確保顏色字串長度正確，再附加透明度
    const localColor = (color.length === 7 ? color : color.substring(0, 7)) + alphaHex;

    // --- 第一次描邊：白色外框 + 陰影 (製造外發光效果) ---
    ctx.shadowBlur = noteBaseSize * (ex ? 0.3 : 0.2);
    ctx.shadowColor = (ex ? localColor : '#000000' + alphaHex)
    ctx.lineWidth = currentSize * 0.6 * currentSettings.lineWidthFactor;
    ctx.strokeStyle = '#ffffff' + alphaHex;
    ctx.stroke(starShape);

    // --- 第二次描邊：主題顏色內框 ---
    ctx.shadowBlur = 0; // 關閉陰影
    ctx.shadowColor = '#00000000';
    ctx.lineWidth = currentSize * 0.35 * currentSettings.lineWidthFactor;
    ctx.strokeStyle = localColor;
    ctx.stroke(starShape);

    ctx.restore();
}


export function drawNoteArc(ctx, options) {
    const {
        centerX = 0,
        centerY = 0,
        radius = 100,
        angle = 0,
        width = 1,
        strokeStyle = '#FF0000',
        transparency = 1,
    } = options;
    if (radius <= 0 || isNaN(radius) || isNaN(angle)) return;
    const _calAng = function (ang) { return { 'x': Math.sin(ang), 'y': Math.cos(ang) * -1 } };

    const preAng = _calAng(angle);
    const localColor = ctx.createLinearGradient(
        centerX + preAng.x * radius, centerY + preAng.y * radius,
        centerX - preAng.x * radius, centerY - preAng.y * radius);
    localColor.addColorStop(1, hexWithAlpha(strokeStyle, transparency));
    localColor.addColorStop(0, hexWithAlpha(strokeStyle, 0));
    ctx.beginPath();
    ctx.lineWidth = width;
    ctx.strokeStyle = localColor;
    ctx.arc(centerX, centerY, radius, angle, angle + Math.PI * 2);
    ctx.stroke();
}

export function drawNoteDot(ctx, options) {
    const {
        x = 0,
        y = 0,
        size = 100,
        color = "#FF0000",
        transparency = 1,
    } = options;

    const localColor = ctx.createRadialGradient(x, y, 0, x, y, size * 5);
    localColor.addColorStop(0, hexWithAlpha(color, transparency));
    localColor.addColorStop(1, hexWithAlpha(color, 0));
    ctx.beginPath();
    ctx.fillStyle = localColor;
    ctx.arc(x, y, size * 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
    ctx.beginPath();
    ctx.fillStyle = hexWithAlpha("#FFFFFF", transparency);
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
}


export class PathRecorder {
    static EPS = 1e-6;

    constructor() {
        // 公開 API 相關屬性
        this.commands = [];
        this.ctxPath = new Path2D();

        // 用於計算的內部狀態
        this._points = [];
        this._lastX = 0;
        this._lastY = 0;

        // 快取，用於優化長度和取點計算
        this._segments = [];
        this._totalLength = 0;
        this._isCacheDirty = true; // 快取是否需要更新的標記
    }

    // 將快取標記為髒，以便下次重新計算
    _invalidateCache() {
        this._isCacheDirty = true;
    }

    // 格式化數字以避免浮點數誤差
    _fmt(v) {
        return +v.toFixed(4);
    }

    /**
     * 更新內部線段快取，僅在需要時執行
     * 這是效能優化的核心
     */
    _updateCache() {
        if (!this._isCacheDirty) {
            return;
        }

        this._segments = [];
        let accumulatedLength = 0;
        let subpathStartPoint = null;

        for (let i = 0; i < this._points.length; i++) {
            const p2 = this._points[i];

            if (p2.type === 'M') {
                subpathStartPoint = p2;
                continue;
            }

            const p1 = this._points[i - 1];
            // 如果前一個點不存在或是 Z，則無法形成線段
            if (!p1 || p1.type === 'Z') {
                continue;
            }

            let targetPoint = p2;
            if (p2.type === 'Z') {
                // 如果是閉合路徑，線段的終點是當前子路徑的起點
                if (!subpathStartPoint) continue;
                targetPoint = subpathStartPoint;
            }

            const dx = targetPoint.x - p1.x;
            const dy = targetPoint.y - p1.y;
            const len = Math.hypot(dx, dy);

            if (len > PathRecorder.EPS) {
                accumulatedLength += len;
                this._segments.push({
                    p1,
                    p2: targetPoint,
                    len,
                    ang: Math.atan2(dy, dx),
                    accLen: accumulatedLength,
                });
            }
        }

        this._totalLength = accumulatedLength;
        this._isCacheDirty = false;
    }

    moveTo(x, y) {
        x = this._fmt(x); y = this._fmt(y);
        this.commands.push(`M ${x} ${y}`);
        this.ctxPath.moveTo(x, y);
        this._lastX = x; this._lastY = y;
        this._points.push({ x, y, type: 'M' });
        this._invalidateCache();
    }

    lineTo(x, y) {
        x = this._fmt(x); y = this._fmt(y);
        this.commands.push(`L ${x} ${y}`);
        this.ctxPath.lineTo(x, y);
        this._lastX = x; this._lastY = y;
        this._points.push({ x, y, type: 'L' });
        this._invalidateCache();
    }

    arc(cx, cy, r, startAngle, endAngle, anticlockwise = false) {
        // Arc to SVG command conversion logic remains the same
        let delta = endAngle - startAngle;
        if (!anticlockwise && delta < 0) delta += 2 * Math.PI;
        if (anticlockwise && delta > 0) delta -= 2 * Math.PI;

        const largeArcFlag = Math.abs(delta) > Math.PI ? 1 : 0;
        const sweepFlag = anticlockwise ? 0 : 1;
        const startX = this._fmt(cx + r * Math.cos(startAngle));
        const startY = this._fmt(cy + r * Math.sin(startAngle));
        const endX = this._fmt(cx + r * Math.cos(endAngle));
        const endY = this._fmt(cy + r * Math.sin(endAngle));

        // 如果路徑的最後一個點不是圓弧的起點，先畫一條線過去
        if (Math.abs(this._lastX - startX) > PathRecorder.EPS || Math.abs(this._lastY - startY) > PathRecorder.EPS) {
            this.lineTo(startX, startY);
        }

        this.commands.push(`A ${r} ${r} 0 ${largeArcFlag} ${sweepFlag} ${endX} ${endY}`);
        this.ctxPath.arc(cx, cy, r, startAngle, endAngle, anticlockwise);

        // 離散化圓弧為一系列的點（用於長度計算和取點）
        // 這部分邏輯不變，因為將曲線轉為密集折線是計算長度的常見且有效方法
        const segments = Math.ceil(Math.abs(delta) / (Math.PI / 18)); // 每 10 度一個點
        for (let i = 1; i <= segments; i++) {
            const angle = startAngle + delta * (i / segments);
            const x = this._fmt(cx + r * Math.cos(angle));
            const y = this._fmt(cy + r * Math.sin(angle));
            this._points.push({ x, y, type: 'L' });
        }

        this._lastX = endX; this._lastY = endY;
        this._invalidateCache();
    }

    closePath() {
        this.commands.push('Z');
        this.ctxPath.closePath();
        this._points.push({ type: 'Z' }); // 使用一個哨兵點來標記閉合
        this._invalidateCache();
    }

    toSVGPath() {
        return this.commands.join(' ');
    }

    getTotalLength() {
        this._updateCache(); // 確保快取是最新
        return this._totalLength;
    }

    /**
     * 取得在指定長度位置的點座標和切線角度
     * @param {number} targetLength 
     * @returns {{x: number, y: number, angle: number}}
     */
    getPointAtLength(targetLength) {
        this._updateCache();

        const segments = this._segments;
        const totalLength = this._totalLength;

        // 處理邊界情況
        if (targetLength <= 0) {
            const firstSeg = segments[0];
            return { x: firstSeg.p1.x, y: firstSeg.p1.y, angle: firstSeg.ang };
        }
        if (targetLength >= totalLength) {
            const lastSeg = segments[segments.length - 1];
            return { x: lastSeg.p2.x, y: lastSeg.p2.y, angle: lastSeg.ang };
        }

        // 使用二分搜尋法快速定位線段
        let low = 0, high = segments.length - 1;
        let segIndex = -1;
        while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            if (segments[mid].accLen >= targetLength) {
                segIndex = mid;
                high = mid - 1;
            } else {
                low = mid + 1;
            }
        }

        const seg = segments[segIndex];
        const prevAccLen = segIndex > 0 ? segments[segIndex - 1].accLen : 0;
        const lenInSeg = targetLength - prevAccLen;
        const t = seg.len < PathRecorder.EPS ? 0 : lenInSeg / seg.len;

        return {
            x: seg.p1.x + (seg.p2.x - seg.p1.x) * t,
            y: seg.p1.y + (seg.p2.y - seg.p1.y) * t,
            angle: seg.ang,
        };
    }

    /**
     * 以指定解析度（沿路徑等距）取樣點陣列
     * @param {number} resolution - 取樣間距（路徑長度單位）
     * @returns {Array<{x: number, y: number, angle: number, length: number}>}
     */
    getPointsAtResolution(resolution) {
        if (resolution <= PathRecorder.EPS) {
            throw new Error('Resolution must be > 0');
        }

        const total = this.getTotalLength(); // 這會觸發一次快取更新
        const samples = [];

        for (let t = 0; t < total; t += resolution) {
            const pt = this.getPointAtLength(t);
            samples.push({
                x: this._fmt(pt.x),
                y: this._fmt(pt.y),
                angle: pt.angle,
                length: this._fmt(t),
            });
        }

        // 確保包含路徑的最後一個點
        const endPt = this.getPointAtLength(total);
        samples.push({
            x: this._fmt(endPt.x),
            y: this._fmt(endPt.y),
            angle: endPt.angle,
            length: this._fmt(total),
        });

        return samples;
    }
}


// Modified drawSlidePath - CRITICAL: drawArrow needs full rewrite to avoid DOM
export function drawSlidePath(startNp, endNp, type, color, t_progress, ctx, hw, hh, hbw, currentSettings, calAng, noteBaseSize, noteData, fading) {
    startNp = parseInt(startNp); // Should be number already
    endNp = parseInt(endNp);   // Should be number already

    const s = noteBaseSize; // Arrow size based on noteBaseSize

    // CRITICAL REWRITE: drawArrow should not use SVG DOM elements.
    // It should calculate points mathematically using the path object.
    function drawArrowAndStar(pathObject, spacing, _t_arrow_progress, currentCtx, arrowColor, arrowSize, wSlide, fading, noteData) {
        const totalLen = pathObject.getTotalLength();
        if (totalLen <= 0) return;
        // 預先調整 spacing
        spacing *= (1 + wSlide / 2.5);

        // 設定填色
        currentCtx.fillStyle = arrowColor;
        //if (noteData.lastOne) { currentCtx.fillStyle = "red"; }

        // 預先計算 t_progress 下限
        const _t_arrow = t_progress < 0 ? 0 : t_progress;
        // 預先計算 wSlide 影響的 b 增量因子
        const bIncrementPer = arrowSize * (wSlide ? 0.3 : 0);

        // 計算可畫箭頭數量（視情況可用 Math.floor 以確保整數次數）
        const fin = Math.floor(totalLen / spacing + 1 * wSlide);

        const arrow = new Path2D();
        // 這邊照原本比例，改寫一個以 (0,0) 為基準的 arrow shape
        arrow.moveTo(arrowSize * 0.55, 0);
        arrow.lineTo(arrowSize * 0.35, arrowSize * -0.4);
        arrow.lineTo(0, arrowSize * -0.4);
        arrow.lineTo(arrowSize * 0.2, 0);
        arrow.lineTo(0, arrowSize * 0.4);
        arrow.lineTo(arrowSize * 0.35, arrowSize * 0.4);
        arrow.closePath();

        let b = 0;
        for (let i = 0; i < fin; i++) {
            const lenAlong = (i + 0.5) * spacing;
            // 只有當在剩餘進度區段，才繪製
            if (lenAlong / totalLen >= _t_arrow) {
                // 取得路徑上該長度位置點與角度
                const p = pathObject.getPointAtLength(lenAlong);
                const x = p.x, y = p.y, angle = p.angle;

                // 手動 translate + rotate
                currentCtx.translate(x, y);
                currentCtx.rotate(angle);
                if (wSlide) {
                    // 開始畫箭頭，相對於 (0,0) 畫法和原本近似
                    currentCtx.beginPath();
                    // Tip
                    currentCtx.moveTo(arrowSize * 0.55, 0);
                    currentCtx.lineTo(arrowSize * 0.35 - b / 2, arrowSize * -0.4 - b);
                    currentCtx.lineTo(0 - b / 2 + wSlide * arrowSize * 0.05, arrowSize * -0.4 - b + wSlide * arrowSize * 0.12);
                    currentCtx.lineTo(arrowSize * 0.2, 0);
                    currentCtx.lineTo(0 - b / 2 + wSlide * arrowSize * 0.05, arrowSize * 0.4 + b - wSlide * arrowSize * 0.12);
                    currentCtx.lineTo(arrowSize * 0.35 - b / 2, arrowSize * 0.4 + b);
                    currentCtx.closePath();
                    currentCtx.fill();
                } else {
                    currentCtx.fill(arrow);
                }
                // 手動還原：先 rotate 回去，再 translate 回去
                currentCtx.rotate(-angle);
                currentCtx.translate(-x, -y);
            }
            b += bIncrementPer;
        }
        if (!fading) {
            const k = (noteData.chain && !noteData.firstOne) ? (_t_arrow_progress > 0) + 0 : Math.min(_t_arrow_progress * noteData.slideTime / noteData.delay + 1, 1);

            const p = pathObject.getPointAtLength(_t_arrow * totalLen);
            currentCtx.save();
            currentCtx.translate(p.x, p.y);
            currentCtx.rotate(p.angle - Math.PI * 0.225);

            //ctx.font = "bold 24px Segoe UI"; // Smaller font
            //ctx.fillStyle = "black";
            //ctx.fillText(`${_t_arrow_progress * noteData.slideTime / noteData.delay}`, 0, 50);
            drawStar(0, 0, k * 1.5, color, false, 0, currentCtx, hbw, currentSettings, calAng, s, k);
            if (wSlide) drawStar(bIncrementPer * _t_arrow * (totalLen / spacing - 2 * wSlide) / 1.5, 0 - bIncrementPer * _t_arrow * (totalLen / spacing - 2 * wSlide) * 1.15, k * 1.5, color, false, 0, currentCtx, hbw, currentSettings, calAng, s, k);
            if (wSlide) drawStar(0 - bIncrementPer * _t_arrow * (totalLen / spacing - 2 * wSlide) * 1.15, bIncrementPer * _t_arrow * (totalLen / spacing - 2 * wSlide) / 1.5, k * 1.5, color, false, 0, currentCtx, hbw, currentSettings, calAng, s, k);
            currentCtx.restore();
        }
    }

    let localColor = color;
    ctx.shadowBlur = s * 0.2;
    ctx.shadowColor = '#000000';

    if (t_progress < 0 && fading) {
        const alpha = Math.max(0, Math.min(1, (t_progress + 1))); // Alpha from 0 to 1
        const alphaHex = Math.floor(alpha * 255).toString(16).padStart(2, '0');
        localColor = color.length === 7 ? color + alphaHex : color.substring(0, 7) + alphaHex; // Handle existing alpha
        ctx.shadowColor = '#000000' + alphaHex;
    }
    ctx.lineWidth = s * 0.15 * currentSettings.lineWidthFactor;
    ctx.strokeStyle = localColor;

    // Path generation (assuming render.path returns a PathRecorder instance)
    // The PathRecorder instance should be generated by noteData if possible during decode.
    const a = noteData.pathObject || path(type, startNp, endNp, hw, hh, hbw, calAng); // Use pre-calculated path if available
    // Draw the path itself (the line of the slide)
    //ctx.stroke(a.ctxPath); // Stroke the Path2D object

    // Draw arrows on the path
    // Ensure `a` is a PathRecorder with mathematical getPointAtLength and getTotalLength
    drawArrowAndStar(a, s * 1.245, t_progress, ctx, localColor, s * 2, type == "w", fading, noteData); // Pass arrowSize

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


export function getNoteAng(val_a, offset = 0) {
    return ((val_a + offset) + 0.5) / 4 * Math.PI;
}

export function getTouchAng(val_a, offset = 0, touchType) {
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
            const sAng = getNoteAng(startNp - 2); // Simpler indexing if startNp is 0-7 based
            const eAng = getNoteAng(endNp - 2);
            // Determine anticlockwise based on shortest path (e.g. 1 to 7 is clockwise, 1 to 3 is clockwise)
            let diff = (endNp - startNp + 8) % 8;
            pathRec.arc(hw, hh, hbw, sAng, eAng, diff > 4);
            break;
        }
        case '>': {
            pathRec.arc(hw, hh, hbw,
                getNoteAng(startNp - 2 + ((startNp === endNp && turn) ? 8 : 0)),
                getNoteAng(endNp - 2 + ((startNp === endNp && !turn) ? 8 : 0)),
                false ^ turn
            );
            break;
        }
        case '<': {
            pathRec.arc(hw, hh, hbw,
                getNoteAng(startNp - 2 + ((startNp === endNp && !turn) ? 8 : 0)),
                getNoteAng(endNp - 2 + ((startNp === endNp && turn) ? 8 : 0)),
                true ^ turn
            );
            break;
        }
        case 'v':
            pathRec.moveTo(np[0].x, np[0].y); pathRec.lineTo(hw, hh); pathRec.lineTo(np[1].x, np[1].y);
            break;
        case 'z': {
            let npTouch = calAng(getTouchAng(startNp, 3, 'B'));
            let npTouch1 = calAng(getTouchAng(startNp, 7, 'B'));
            pathRec.moveTo(np[0].x, np[0].y);
            pathRec.lineTo(hw + npTouch.x * touchDisToMid['B'] * hbw * 0.885, hh + npTouch.y * touchDisToMid['B'] * hbw * 0.885);
            pathRec.lineTo(hw + npTouch1.x * touchDisToMid['B'] * hbw * 0.885, hh + npTouch1.y * touchDisToMid['B'] * hbw * 0.885);
            pathRec.lineTo(np[1].x, np[1].y);
            break;
        }
        case 's': {
            let npTouch = calAng(getTouchAng(startNp, 7, 'B'));
            let npTouch1 = calAng(getTouchAng(startNp, 3, 'B'));
            pathRec.moveTo(np[0].x, np[0].y);
            pathRec.lineTo(hw + npTouch.x * touchDisToMid['B'] * hbw * 0.885, hh + npTouch.y * touchDisToMid['B'] * hbw * 0.885);
            pathRec.lineTo(hw + npTouch1.x * touchDisToMid['B'] * hbw * 0.885, hh + npTouch1.y * touchDisToMid['B'] * hbw * 0.885);
            pathRec.lineTo(np[1].x, np[1].y);
            break;
        }
        case 'V': {
            pathRec.moveTo(np[0].x, np[0].y);
            pathRec.lineTo(np[1].x, np[1].y);
            const endPosFraction = Math.round(endNp / 10 % 1 * 10); // e.g. 8.3 -> 3
            const thirdPointAng = calAng(getNoteAng((endPosFraction - 1 + 8) % 8, 0)); // Ensure 0-7
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
            pathRec.arc(
                hw + calAng(Math.PI * (startNp / 4 - 0.25)).x * hbw / 2,
                hh + calAng(Math.PI * (startNp / 4 - 0.25)).y * hbw / 2 + hbw / 16,
                hbw / 2.25,
                Math.PI * ((startNp + 9) % 8 - 0.25) / 4,
                Math.PI * (
                    1 * ((startNp - endNp + 7) % 8 == 0) +
                    8 * ((startNp - endNp + 4) % 8 == 0) +
                    0.5 * (0.5 - ((endNp - startNp + 8) % 8 > 1)) +
                    (endNp + 5) % 8) / 4,
                false);
            pathRec.lineTo(np[1].x, np[1].y);
            break;
        }
        case 'pp': {
            pathRec.moveTo(np[0].x, np[0].y);
            pathRec.arc(
                hw + calAng(Math.PI * (startNp / 4 - 1.5)).x * hbw / 2,
                hh + calAng(Math.PI * (startNp / 4 - 1.5)).y * hbw / 2 + hbw / 16,
                hbw / 2.25,
                Math.PI * (
                    8 * ((startNp - endNp + 4) % 8 == 0)
                    + (startNp + 13) % 8 - 0.25) / 4,
                Math.PI * (0 - (
                    1 * ((startNp - endNp + 8) % 8 == 0) +
                    0.5 * (0.5 - ((endNp - startNp + 7) % 8 > 1)) -
                    0.51 * ((startNp - endNp + 4) % 8 == 0)
                ) + (endNp + 8) % 8) / 4,
                true);
            pathRec.lineTo(np[1].x, np[1].y);
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

    ctx.shadowBlur = noteBaseSize * (ex ? 0.3 : 0.2);
    ctx.shadowColor = (ex ? color : '#000000')
    ctx.lineWidth = currentSize * 0.75 * currentSettings.lineWidthFactor;
    ctx.strokeStyle = 'white';
    ctx.stroke(holdPath);

    ctx.shadowBlur = 0;
    ctx.shadowColor = '#00000000';
    ctx.lineWidth = currentSize * 0.5 * currentSettings.lineWidthFactor;
    ctx.strokeStyle = color;
    ctx.stroke(holdPath);
}

export function drawTouch(pos, sizeFactor, color, type, distance, opacity, holdtime, t_touch, ctx, hw, hh, hbw, currentSettings, calAng, noteBaseSize) {
    opacity = Math.min(Math.max(opacity, 0), 1); // Clamp opacity

    const r = parseInt(color.substring(1, 3), 16);
    const g = parseInt(color.substring(3, 5), 16);
    const b = parseInt(color.substring(5, 7), 16);
    let localColor = hexWithAlpha(color, opacity);

    let s = noteBaseSize;
    let currentSize = Math.max(sizeFactor * s, 0); // sizeFactor seems to be a base, not multiplier here. Original: size = size * s;

    const touchDisToMid = { "A": 0.85, "B": 0.475, "C": 0, "D": 0.85, "E": 0.675 }; // Make const
    const touchAngleOffset = { "A": 0, "B": 0, "C": 0, "D": 0.5, "E": 0.5 }; // Make const
    let ang = (pos - 0.5 - (touchAngleOffset[type] || 0)) / 4 * Math.PI;
    let np = calAng(ang);

    const centerX = hw + np.x * (touchDisToMid[type] || 0) * hbw;
    const centerY = hh + np.y * (touchDisToMid[type] || 0) * hbw;

    let effectiveDistance = (distance + 0.5) * currentSize; // Apply currentSize to distance scaling

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
            const zs = 1;
            const armLength = effectiveDistance + currentSize * zs; // Simplified arm length

            // Top Triangle
            ctx.beginPath();
            ctx.moveTo(centerX, centerY - effectiveDistance * 1.25);
            ctx.lineTo(centerX + currentSize * zs, centerY - armLength - effectiveDistance * 0.25);
            ctx.lineTo(centerX - currentSize * zs, centerY - armLength - effectiveDistance * 0.25);
            ctx.closePath(); ctx.stroke();
            // Left Triangle
            ctx.beginPath();
            ctx.moveTo(centerX - effectiveDistance * 1.25, centerY);
            ctx.lineTo(centerX - armLength - effectiveDistance * 0.25, centerY - currentSize * zs);
            ctx.lineTo(centerX - armLength - effectiveDistance * 0.25, centerY + currentSize * zs);
            ctx.closePath(); ctx.stroke();
            // Bottom Triangle
            ctx.beginPath();
            ctx.moveTo(centerX, centerY + effectiveDistance * 1.25);
            ctx.lineTo(centerX + currentSize * zs, centerY + armLength + effectiveDistance * 0.25);
            ctx.lineTo(centerX - currentSize * zs, centerY + armLength + effectiveDistance * 0.25);
            ctx.closePath(); ctx.stroke();
            // Right Triangle
            ctx.beginPath();
            ctx.moveTo(centerX + effectiveDistance * 1.25, centerY);
            ctx.lineTo(centerX + armLength + effectiveDistance * 0.25, centerY - currentSize * zs);
            ctx.lineTo(centerX + armLength + effectiveDistance * 0.25, centerY + currentSize * zs);
            ctx.closePath(); ctx.stroke();

            _arc(centerX, centerY, currentSize * 0.15, ctx);
        }
    }

    function strPrg(t_progress_hold) {
        ctx.lineWidth = currentSize * 0.8;
        const progressSegments = [
            t_progress_hold,
            t_progress_hold - 0.25,
            t_progress_hold - 0.5,
            t_progress_hold - 0.75
        ];
        const colors = [
            `rgba(250,73,4,${opacity})`,
            `rgba(245,238,0,${opacity})`,
            `rgba(17,167,105,${opacity})`,
            `rgba(0,141,244,${opacity})`
        ];
        const angles = [
            Math.PI * 0.25,
            Math.PI * 1.75,
            Math.PI * 1.25,
            Math.PI * 0.75
        ];
        const barBaseLength = currentSize * (3 + distance + 0.6);

        if (t_progress_hold >= 0) {
            for (let i = 0; i < 4; i++) {
                let disPercent = Math.max(0, progressSegments[i]);
                disPercent = Math.min(0.25, disPercent) / 0.25;
                let barLength = Math.min(disPercent, 0.7) * barBaseLength * Math.SQRT2;
                const k = effectiveDistance - currentSize * 3;

                ctx.save();
                // === Transform 核心 ===
                ctx.translate(centerX, centerY);
                ctx.rotate(Math.PI / 2 - angles[i]);
                ctx.translate(k, k);

                ctx.beginPath();
                ctx.arc(0 - k / 2, 0 - k / 2, -k / 2, -Math.PI * 0.75, (Math.min(disPercent, 0.3) / 0.3) * (Math.PI / 4) - Math.PI * 0.75);
                if (disPercent > 0.3) ctx.lineTo(barLength, 0);
                if (disPercent > 0.7) ctx.arc(0 - k * 1.5, k * -0.5, -k / 2, -Math.PI * 0.5, ((Math.max(disPercent, 0.7) - 0.7) / 0.3) * (Math.PI / 4) - Math.PI * 0.5);

                ctx.strokeStyle = colors[i];
                ctx.stroke();

                ctx.restore();
            }
        }
    }

    if (holdtime && holdtime > 0) {
        ctx.shadowColor = `rgba(255,255,255)`;
        ctx.shadowBlur = s * 0.4;
        strPrg(t_touch / holdtime);
    }
    ctx.shadowBlur = s * 0.2;
    ctx.shadowColor = `rgba(0,0,0,${opacity})`;
    drawTouchElement(false); // Draw white outline
    drawTouchElement(true);  // Draw colored center (original has two calls to str())

    ctx.shadowBlur = 0;
    ctx.shadowColor = '#00000000';
}

export function hexWithAlpha(hex, alpha) {
    // 移除開頭的 "#"（如果有）
    hex = hex.replace(/^#/, '');
    alpha = Math.max(Math.min(alpha, 1), 0);

    // 如果是短格式（例如 #abc），轉換成長格式（#aabbcc）
    if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('');
    }

    // 將 alpha 轉為 0~255 的十六進位，並補滿兩位
    const alphaHex = Math.round(alpha * 255).toString(16).padStart(2, '0');

    return `#${hex}${alphaHex}`;
}

export function _arc(x, y, r = 0, currentCtx) {
    if (r <= 0) return; // Don't draw zero or negative radius arcs
    currentCtx.beginPath();
    currentCtx.arc(x, y, r, 0, 2 * Math.PI);
    currentCtx.stroke();
}
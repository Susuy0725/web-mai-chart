// ====================================================================================
// RENDER GAME FUNNCTION - All drawing logic goes here
// ====================================================================================

import { settings } from "./main.js";

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
                } else {
                    drawSlidePath(nang, nang2, note.slideType, color, _t * currentSettings.slideSpeed, ctx, hw, hh, hbw, currentSettings, calAng, noteBaseSize, note, true);
                }
            }
        }
    }

    //tap ,star and hold render
    for (let i = notesToRender.length - 1; i >= 0; i--) {
        const note = notesToRender[i];
        if (!note || note.starTime || note.touch || note.slide || note.invalid) continue; // Simplified check

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

        const ani1 = function (val_t) {
            return Math.log(99 * (val_t / currentSettings.touchSpeed) + 1) / 2;
        }

        if (_t >= -1 / currentSettings.touchSpeed && _t <= (note.touchTime ?? 0)) {
            drawTouch(note.pos, 0.8, color, note.touch,
                ani1(_t < 0 ? _t * - currentSettings.touchSpeed : 0) * 0.6,
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

// 建立一個快取來儲存不同大小的星星路徑，避免重複計算
const starCache = new Map();

function getStarPath(scale) {
    // 如果快取中已有同樣大小的路徑，直接回傳
    if (starCache.has(scale)) {
        return starCache.get(scale);
    }

    const path = new Path2D();
    const R = scale;
    const r = scale / 2;

    // 修正：使用 moveTo 設定第一個點
    path.moveTo(Math.cos(18 * Math.PI / 180) * r, -Math.sin(18 * Math.PI / 180) * r);

    for (let i = 0; i < 5; i++) {
        // 先畫到外角點
        path.lineTo(Math.cos((54 + i * 72) * Math.PI / 180) * R, -Math.sin((54 + i * 72) * Math.PI / 180) * R);
        // 再畫到下一個內角點
        path.lineTo(Math.cos((18 + (i + 1) * 72) * Math.PI / 180) * r, -Math.sin((18 + (i + 1) * 72) * Math.PI / 180) * r);
    }

    path.closePath();

    // 將新產生的路徑存入快取
    starCache.set(scale, path);
    return path;
}

// 移除了未使用的參數 (hbw, currentSettings, calAng)
export function drawStar(x, y, sizeFactor, color, ex, ang, ctx, hbw, currentSettings, calAng, noteBaseSize, alpha = 1) {
    // 角度調整可以保留，這屬於視覺效果的一部分
    ang = ang - 0.175 * Math.PI;
    const currentSize = Math.max(sizeFactor * noteBaseSize, 0);

    if (currentSize === 0) return; // 大小為 0 就不用畫了

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang + Math.PI / 2);

    const starShape = getStarPath(currentSize);

    // --- 顏色與透明度處理 ---
    // 修正：直接限制 alpha 在 0-1 之間
    const localAlpha = Math.max(0, Math.min(1, alpha));
    const alphaHex = Math.floor(localAlpha * 255).toString(16).padStart(2, '0');
    // 確保顏色字串長度正確，再附加透明度
    const localColor = (color.length === 7 ? color : color.substring(0, 7)) + alphaHex;

    // --- 第一次描邊：白色外框 + 陰影 (製造外發光效果) ---
    ctx.shadowBlur = noteBaseSize * 0.2;
    ctx.shadowColor = (ex ? '#ffffff' : '#000000') + alphaHex;
    ctx.lineWidth = currentSize * 0.6;
    ctx.strokeStyle = '#ffffff' + alphaHex;
    ctx.stroke(starShape);

    // --- 第二次描邊：主題顏色內框 ---
    ctx.shadowBlur = 0; // 關閉陰影
    ctx.shadowColor = '#00000000';
    ctx.lineWidth = currentSize * 0.35;
    ctx.strokeStyle = localColor;
    ctx.stroke(starShape);

    ctx.restore();
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
        const totalLen = pathObject.getTotalLength(); // Assumes pathObject.getTotalLength() is now mathematical
        if (totalLen <= 0) return;

        spacing *= ((1 + wSlide / 2));
        currentCtx.fillStyle = arrowColor;

        let b = 0;
        const _t_arrow = t_progress < 0 ? 0 : t_progress;
        for (let len = spacing / 2; len < totalLen - spacing / 2; len += spacing) {
            if (len / totalLen >= _t_arrow) { // Only draw if part of the remaining path
                // getPointAtLength should return {x, y, angle}
                const p = pathObject.getPointAtLength(len);

                currentCtx.save();
                currentCtx.translate(p.x, p.y);
                currentCtx.rotate(p.angle);
                currentCtx.beginPath();
                // Define arrow shape relative to (0,0)
                currentCtx.moveTo(arrowSize * 0.55, 0); // Tip of arrow
                currentCtx.lineTo(arrowSize * 0.35 - b / 2, arrowSize * -0.4 - b);
                currentCtx.lineTo(0 - b / 2, arrowSize * -0.4 - b);
                currentCtx.lineTo(arrowSize * 0.2, 0);
                currentCtx.lineTo(0 - b / 2, arrowSize * 0.4 + b);
                currentCtx.lineTo(arrowSize * 0.35 - b / 2, arrowSize * 0.4 + b);
                currentCtx.closePath();
                currentCtx.fill();
                currentCtx.restore();
            }
            b += arrowSize * (wSlide ? 0.3 : 0);
        }
        if (!fading) {
            const k = (noteData.chainTarget ? true : false) ? (_t_arrow_progress > 0) + 0 : Math.min(_t_arrow_progress * noteData.slideTime + 1, 1);

            const p = pathObject.getPointAtLength(_t_arrow * totalLen);
            currentCtx.save();
            currentCtx.translate(p.x, p.y);
            currentCtx.rotate(p.angle);
            drawStar(0, 0, k, color, noteData.ex ?? false, 90, currentCtx, hbw, currentSettings, calAng, s, Math.min(_t_arrow_progress + 1, 1));
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
    ctx.lineWidth = s * 0.15;
    ctx.strokeStyle = localColor;

    // Path generation (assuming render.path returns a PathRecorder instance)
    // The PathRecorder instance should be generated by noteData if possible during decode.
    const a = noteData.pathObject || path(type, startNp, endNp, hw, hh, hbw, calAng); // Use pre-calculated path if available
    // Draw the path itself (the line of the slide)
    //ctx.stroke(a.ctxPath); // Stroke the Path2D object

    // Draw arrows on the path
    // Ensure `a` is a PathRecorder with mathematical getPointAtLength and getTotalLength
    drawArrowAndStar(a, s * 1.2, t_progress, ctx, localColor, s * 2, type == "w", fading, noteData); // Pass arrowSize

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
            pathRec.lineTo(hw + npTouch.x * touchDisToMid['B'] * hbw * 0.885, hh + npTouch.y * touchDisToMid['B'] * hbw * 0.885);
            pathRec.lineTo(hw + npTouch1.x * touchDisToMid['B'] * hbw * 0.885, hh + npTouch1.y * touchDisToMid['B'] * hbw * 0.885);
            pathRec.lineTo(np[1].x, np[1].y);
            break;
        }
        case 's': {
            let npTouch = calAng(getTouchPos(startNp, 7, 'B'));
            let npTouch1 = calAng(getTouchPos(startNp, 3, 'B'));
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
                Math.PI * ((startNp + 13) % 8 - 0.25) / 4,
                Math.PI * (0 - (
                    1 * ((startNp - endNp + 8) % 8 == 0) +
                    8 * ((startNp - endNp + 4) % 8 == 0) +
                    0.5 * (0.5 - ((endNp - startNp + 7) % 8 > 1))
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
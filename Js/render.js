// ====================================================================================
// RENDER GAME FUNNCTION - All drawing logic goes here
// ====================================================================================

import { settings, noteImages } from "./main.js";

const speedFactor = 0.525;

// Helper: check if an HTMLImageElement is fully loaded and usable
function isImageReady(img) {
    try {
        return img && img.complete && typeof img.naturalWidth === 'number' && img.naturalWidth > 0;
    } catch (e) { return false; }
}

// import { settings } from "./main.js"; // Assuming settings is passed as currentSettings

// Pre-calculate angular positions if they are static
const EIGHT_POSITIONS_ANG = [];
for (let j = 0; j < 8; j++) {
    const ang = (j + 0.5) / 4 * Math.PI;
    EIGHT_POSITIONS_ANG.push({ 'x': Math.sin(ang), 'y': Math.cos(ang) * -1 });
}

// Caches to avoid reconstructing heavy objects every frame
const pathCache = new Map(); // key: `${type}_${start}_${end}_${hbw}` -> PathRecorder
const arrowShapeCache = new Map(); // key: `${arrowSize}_${wSlide}` -> Path2D
// Offscreen canvas cache for arrow sprites: key `${arrowSize}_${wSlide}_${color}` -> HTMLCanvasElement
const arrowCanvasCache = new Map();

// Offscreen static layer cache (sensor + outline + sensor_text)
const staticLayerCache = {
    canvas: null,
    width: 0,
    height: 0,
    scaleFactor: 1,
    valid: false,
};

// 建立一個快取來儲存不同大小的星星路徑，避免重複計算
const starCache = new Map();

// 回傳指定大小的星形 Path2D（以座標原點為中心），並快取以供重複使用
function getStarPath(r) {
    // 使用整數 key 減少快取碎片
    const key = Math.round(r * 100) / 100; // two-decimal precision
    let p = starCache.get(key);
    if (p) return p;
    p = new Path2D();
    const points = 5;
    const rot = -Math.PI / 2; // 讓第一個尖朝上
    const step = Math.PI / points; // 36°
    for (let i = 0; i < points * 2; i++) {
        const radius = (i % 2 === 0) ? r : r * 0.5;
        const angle = rot + i * step;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (i === 0) p.moveTo(x, y);
        else p.lineTo(x, y);
    }
    p.closePath();
    starCache.set(key, p);
    return p;
}

// 建立一個快取來儲存菱形（diamond）單位路徑，避免在每次效果時重建路徑
const diamondShapeCache = new Map();

// 回傳一個單位大小的菱形 Path2D（以 r=1 為單位），並快取以供重複使用
function getDiamondPath() {
    const key = 'unit';
    let p = diamondShapeCache.get(key);
    if (p) return p;
    p = new Path2D();
    p.moveTo(0, -1);
    p.quadraticCurveTo(0.25, -0.25, 1, 0);
    p.quadraticCurveTo(0.25, 0.25, 0, 1);
    p.quadraticCurveTo(-0.25, 0.25, -1, 0);
    p.quadraticCurveTo(-0.25, -0.25, 0, -1);
    p.closePath();
    diamondShapeCache.set(key, p);
    return p;
}

// 建立一個快取來儲存單位圓形，供 tap 使用
const circleCache = new Map();

function getUnitCirclePath() {
    const key = 'unit_circle';
    let p = circleCache.get(key);
    if (p) return p;
    p = new Path2D();
    p.arc(0, 0, 1, 0, Math.PI * 2);
    p.closePath();
    circleCache.set(key, p);
    return p;
}

// 新增：調整亮度（乘法因子）
// hex: 支援 "#RGB", "#RRGGBB"（若有 alpha 或多餘長度會忽略 alpha 部分）
// factor: 乘數（0 = 全黑，1 = 原色，>1 = 變亮）
// 回傳 "#RRGGBB"
export function adjustBrightness(hex, factor) {
    if (typeof hex !== 'string') return hex;
    factor = Number(factor);
    if (!isFinite(factor)) factor = 1;

    // 去掉開頭的 '#'
    let h = hex.replace(/^#/, '').toLowerCase();

    // 支援短格式 #abc -> aabbcc
    if (h.length === 3) h = h.split('').map(c => c + c).join('');

    // 若包含 alpha 或過長，取前 6 碼作為 RGB
    if (h.length >= 8) h = h.slice(0, 6);
    if (h.length !== 6) return hex; // 非法輸入則回傳原值

    const r = Math.min(255, Math.max(0, Math.round(parseInt(h.slice(0, 2), 16) * factor)));
    const g = Math.min(255, Math.max(0, Math.round(parseInt(h.slice(2, 4), 16) * factor)));
    const b = Math.min(255, Math.max(0, Math.round(parseInt(h.slice(4, 6), 16) * factor)));

    const out = '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
    return out;
}

export function renderGame(ctx, notesToRender, currentSettings, images, time, triggered, play, fps) {
    const calAng = function (ang) { return { 'x': Math.sin(ang), 'y': Math.cos(ang) * -1 } }; // Keep if dynamic angles needed elsewhere

    // Optional performance breakdown (very low overhead when disabled)
    const perfEnabled = !!(currentSettings && currentSettings.showPerfBreakdown);
    let __perf = null;
    if (perfEnabled) {
        __perf = {
            t0: performance.now(),
            images: 0,
            slides: 0,
            taps: 0,
            touches: 0,
            effects: 0,
            other: 0
        };
    }

    ctx.resetTransform();
    const w = ctx.canvas.width,
        h = ctx.canvas.height,
        hw = w / 2,
        hh = h / 2;

    const factor = 0.90; // 缩小
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

    // middle display
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
            const trueScore = Math.round(Math.max(play.score, 0));
            // use gamma correction for more natural progression
            ctx.fillStyle = adjustBrightness("#498BFF", (1 - settings.backgroundDarkness) ** 0.5);
            if (trueScore > 800000) {
                ctx.fillStyle = adjustBrightness("#FF6353", (1 - settings.backgroundDarkness) ** 0.5);
            }
            if (trueScore > 1000000) {
                ctx.fillStyle = adjustBrightness("#FFD559", (1 - settings.backgroundDarkness) ** 0.5);
            }
            ctx.strokeStyle = "white";
            ctx.lineWidth = Math.floor(hbw * 0.015);
            ctx.textAlign = "left";
            ctx.letterSpacing = "0px";
            ctx.font = "bold " + Math.floor(hbw * 0.13) + "px combo"
            ctx.strokeText(`${((trueScore / 10000) % 1).toFixed(4).slice(1, 6)}`, hw - hbw * 0.1, hh + hbw * 0.06);
            ctx.fillText(`${((trueScore / 10000) % 1).toFixed(4).slice(1, 6)}`, hw - hbw * 0.1, hh + hbw * 0.06);
            ctx.font = "bold " + Math.floor(hbw * 0.1) + "px combo"
            ctx.strokeText(`%`, hw + hbw * 0.3, hh + hbw * 0.06);
            ctx.fillText(`%`, hw + hbw * 0.3, hh + hbw * 0.06);
            ctx.textAlign = "right";
            ctx.letterSpacing = Math.floor(hbw * 0.01) + "px";
            ctx.font = "bold " + Math.floor(hbw * 0.18) + "px combo"
            ctx.strokeText(`${Math.floor(trueScore / 10000)}`, hw - hbw * 0.075, hh + hbw * 0.06);
            ctx.fillText(`${Math.floor(trueScore / 10000)}`, hw - hbw * 0.075, hh + hbw * 0.06);
            break;
        default:
            break;
    }
    ctx.shadowColor = '#00000000';
    ctx.shadowBlur = 0;
    ctx.save();
    // Try to use static offscreen cache for sensor/outline/sensor_text to reduce per-frame raster work
    const shouldUseStatic = isImageReady(images.sensor) && isImageReady(images.outline) && (!currentSettings.disableSensorWhenPlaying || isImageReady(images.sensor_text));
    const targetW = bw, targetH = bw;
    if (shouldUseStatic) {
        // invalidate cache if size changed or canvas missing
        if (!staticLayerCache.canvas || staticLayerCache.width !== targetW || staticLayerCache.height !== targetH || staticLayerCache.scaleFactor !== factor) {
            staticLayerCache.canvas = document.createElement('canvas');
            staticLayerCache.canvas.width = targetW;
            staticLayerCache.canvas.height = targetH;
            staticLayerCache.width = targetW;
            staticLayerCache.height = targetH;
            staticLayerCache.scaleFactor = factor;
            const sc = staticLayerCache.canvas.getContext('2d');
            sc.clearRect(0, 0, targetW, targetH);
            // draw sensor
            sc.save();
            sc.shadowColor = 'black';
            sc.shadowBlur = 4;
            sc.drawImage(images.sensor, 0, 0, targetW, targetH);
            sc.restore();
            // optionally draw sensor_text
            if (!currentSettings.disableSensorWhenPlaying || play.pause) {
                sc.drawImage(images.sensor_text, 0, 0, targetW, targetH);
            }
            // draw outline on top
            sc.translate(targetW / 2, targetH / 2);
            const outline = 1.015;
            sc.scale(outline, outline);
            sc.drawImage(images.outline, -targetW / 2, -targetH / 2, targetW, targetH);
            staticLayerCache.valid = true;
        }
        if (staticLayerCache.valid) {
            ctx.drawImage(staticLayerCache.canvas, (h > w ? 0 : (w - h) / 2), (h > w ? (h - w) / 2 : 0), bw, bw);
        }
    } else {
        if (!isImageReady(images.sensor)) {
            console.warn('Sensor image not ready');
            return;
        }
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 4;
        ctx.drawImage(images.sensor,
            (h > w ? 0 : (w - h) / 2), (h > w ? (h - w) / 2 : 0),
            bw, bw);
        if (!currentSettings.disableSensorWhenPlaying || play.pause) {
            if (!isImageReady(images.sensor_text)) return;
            ctx.drawImage(images.sensor_text,
                (h > w ? 0 : (w - h) / 2), (h > w ? (h - w) / 2 : 0),
                bw, bw);
        }
    }
    ctx.restore();

    if (play.pause && currentSettings.disablePreview) return;

    // slide render
    if (currentSettings.showSlide) {
        const __t_slide_start = perfEnabled ? performance.now() : 0;
        let currentSlideNumbersOnScreen = 0;
        // fill buffer once (reverse order preserved)
        const sbuf = noteBuffers.slides;
        sbuf.length = 0;
        for (let i = notesToRender.length - 1; i >= 0; i--) {
            const note = notesToRender[i];
            if (!note || !note.slide || note.invalid) continue;
            const _t = ((time - note.time) / 1000);
            if (!(_t >= (currentSettings.distanceToMid - 1) / (currentSettings.speed * speedFactor) && _t <= note.delay + note.slideTime)) continue;
            sbuf.push({ note, t: _t });
            if (sbuf.length >= currentSettings.maxSlideOnScreenCount) break;
        }
        // create reusable break gradient per frame to avoid allocations inside loop
        const breakColor = ctx.createLinearGradient(0, 0, 0, 1);
        breakColor.addColorStop(0, '#FF6C0C');
        breakColor.addColorStop(0.49, '#FF6C0C');
        breakColor.addColorStop(0.5, '#FFD900');
        breakColor.addColorStop(1, '#FFD900');
        for (let i = 0; i < sbuf.length; i++) {
            const { note, t: _t } = sbuf[i];
            // color 決策快取
            let color = note.break ? breakColor : (note.isDoubleSlide ? '#FFD900' : '#5BCCFF');
            let nang = (typeof note.slideHead === 'string' ? parseInt(note.slideHead[0]) : note.slideHead) - 1;
            nang = nang % 8;
            let nang2 = note.slideEnd;
            if (!(note.slideEnd.length > 1)) {
                nang2 = (typeof note.slideEnd === 'string' ? parseInt(note.slideEnd[0]) : note.slideEnd) - 1;
                nang2 = nang2 % 8;
            }
            nang = nang < 0 ? 0 : nang;
            if (!(note.slideEnd.length > 1)) nang2 = nang2 < 0 ? 0 : nang2;
            if (_t >= 0) {
                drawSlidePath(nang, nang2, note.slideType, color, (_t - note.delay) / note.slideTime, ctx, hw, hh, hbw, currentSettings, calAng, noteBaseSize, note, false);
                currentSlideNumbersOnScreen++;
            } else {
                drawSlidePath(nang, nang2, note.slideType, color, 0 - _t * (currentSettings.speed * speedFactor) / (currentSettings.distanceToMid - 1) - currentSettings.slideSpeed, ctx, hw, hh, hbw, currentSettings, calAng, noteBaseSize, note, true);
                currentSlideNumbersOnScreen++;
            }
        }
        if (perfEnabled) {
            __perf.slides = performance.now() - __t_slide_start;
        }
    }

    //tap ,star and hold render (buffered)
    const __t_tap_start = perfEnabled ? performance.now() : 0;
    const tbuf = noteBuffers.taps;
    tbuf.length = 0;
    for (let i = notesToRender.length - 1; i >= 0; i--) {
        const note = notesToRender[i];
        if (!note || note.starTime || note.touch || note.slide || note.invalid || !note.pos) continue;
        const _t = ((time - note.time) / 1000);
        // only push notes that are within the active window for rendering or effect
        if (
            _t < (currentSettings.distanceToMid - 2) / (currentSettings.speed * speedFactor) ||
            (_t > currentSettings.effectDecayTime + (note.holdTime ?? 0) && (triggered[note._id] || _t > currentSettings.effectDecayTime + (note.holdTime ?? 0) + 3))
        ) continue;
        tbuf.push({ note, t: _t });
    }
    for (let i = 0; i < tbuf.length; i++) {
        const { note, t: _t } = tbuf[i];
        // color 決策快取
        let color = note.break ? '#FF6C0C' : (note.isDoubleTapHold ? '#FFD900' : (note.star && !currentSettings.pinkStar ? '#009FF9' : '#FF50AA'));
        if (currentSettings.nextNoteHighlight && play.nowIndex + 1 == note.index) color = '#220022';
        if (_t >= (currentSettings.distanceToMid - 2) / (currentSettings.speed * speedFactor) && (_t < (note.holdTime ?? 0) || !triggered[note._id])) {
            const d = (1 - currentSettings.distanceToMid);
            let nang = (typeof note.pos === 'string' ? parseInt(note.pos[0]) : note.pos) - 1;
            nang = nang % 8;
            nang = nang < 0 ? 0 : nang;
            let np = EIGHT_POSITIONS_ANG[isNaN(nang) ? 0 : nang];
            if (!np) continue;
            let currentX, currentY, currentSize = 1;
            const scaleFactor = (note.holdTime != null ? (Math.min(_t, 0) * (currentSettings.speed * speedFactor) + 1) : (_t * (currentSettings.speed * speedFactor) + 1));
            if (_t >= -d / (currentSettings.speed * speedFactor)) {
                currentX = hw + hbw * np.x * scaleFactor;
                currentY = hh + hbw * np.y * scaleFactor;
            } else {
                currentX = hw + hbw * np.x * (1 - d);
                currentY = hh + hbw * np.y * (1 - d);
                currentSize = (_t * (currentSettings.speed * speedFactor) + (2 - currentSettings.distanceToMid));
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
                }, note);
                drawNoteDot(ctx, {
                    x: currentX,
                    y: currentY,
                    size: currentSize * hbw * 0.0075,
                    color: color,
                    transparency: currentSize,
                }, note);
            }
            if (note.star) {
                if (note.doubleSlide && !currentSettings.useImgSkin) drawStar(currentX, currentY, currentSize, color, note.ex ?? false, (nang + 1.2) / -4 * Math.PI, ctx, hbw, currentSettings, calAng, noteBaseSize, undefined, note);
                drawStar(currentX, currentY, currentSize, color, note.ex ?? false, (nang) / -4 * Math.PI, ctx, hbw, currentSettings, calAng, noteBaseSize, undefined, note);
            } else if (note.holdTime != null) {
                note.holdTime = note.holdTime == 0 ? 1E-64 : note.holdTime;
                let holdLength = 0;
                if (_t >= -d / (currentSettings.speed * speedFactor)) {
                    holdLength = (Math.min((note.holdTime - (_t > 0 ? _t : 0)) * (currentSettings.speed * speedFactor), (1 - currentSettings.distanceToMid) * (Math.min(_t, 0) + (d / (currentSettings.speed * speedFactor))) / (d / (currentSettings.speed * speedFactor)))) * hbw;
                }
                drawHold(currentX, currentY, currentSize, color, note.ex ?? false, nang / -4 * Math.PI, holdLength, ctx, hbw, currentSettings, calAng, noteBaseSize, note);
                if (!currentSettings.noNoteArc) if (_t > (note.holdTime ?? 0) - d / (currentSettings.speed * speedFactor))
                    drawNoteDot(ctx, {
                        x: currentX - holdLength * calAng((nang / -4 + 0.875) * Math.PI).x,
                        y: currentY + holdLength * calAng((nang / -4 + 0.875) * Math.PI).y,
                        size: currentSize * hbw * 0.0075,
                        color: color,
                        transparency: 1,
                    }, note);
            } else {
                drawTap(currentX, currentY, currentSize, color, note.ex ?? false, ctx, hbw, currentSettings, noteBaseSize, note);
            }
        }
        if (_t >= 0 && _t <= currentSettings.effectDecayTime + (note.holdTime ?? 0)) {
            let nang = (typeof note.pos === 'string' ? parseInt(note.pos[0]) : note.pos) - 1;
            nang = nang % 8;
            nang = nang < 0 ? 0 : nang;
            let np = EIGHT_POSITIONS_ANG[isNaN(nang) ? 0 : nang];
            if (!np) continue;
            const currentX = hw + hbw * np.x;
            const currentY = hh + hbw * np.y;
            if (note.holdTime) {
                if (_t <= note.holdTime) drawHoldEffect(currentX, currentY, _t, color, ctx, hbw, currentSettings, noteBaseSize, note);
                drawHoldEndEffect(currentX, currentY, (_t - note.holdTime) / currentSettings.effectDecayTime * 2, color, ctx, hbw, currentSettings, noteBaseSize, note);
            } else {
                drawSimpleEffect(currentX, currentY, _t / currentSettings.effectDecayTime * 2, color, ctx, hbw, currentSettings, noteBaseSize, note);
                drawStarEffect(currentX, currentY, _t / currentSettings.effectDecayTime, color, ctx, hbw, currentSettings, noteBaseSize, true, note);
            }
        }
    }
    if (perfEnabled) {
        __perf.taps = performance.now() - __t_tap_start;
    }

    //touch render
    //touch render (buffered)
    const __t_touch_start = perfEnabled ? performance.now() : 0;
    const tbuf2 = noteBuffers.touches;
    tbuf2.length = 0;
    for (let i = notesToRender.length - 1; i >= 0; i--) {
        const note = notesToRender[i];
        if (!note || !note.touch || note.invalid) continue;
        const _t = ((time - note.time) / 1000);
        if (_t > currentSettings.effectDecayTime + (note.touchTime ?? 0)) continue;
        // only collect relevant ones
        if (!(_t >= -1 / currentSettings.touchSpeed && _t < (note.touchTime ?? 0)) && !(_t >= 0 && _t <= currentSettings.effectDecayTime + (note.touchTime ?? 0))) continue;
        tbuf2.push({ note, t: _t });
    }
    const aniTouch = (x) => 1 - Math.pow(1 - x, 3);
    const touchDisToMid = { "A": 0.85, "B": 0.475, "C": 0, "D": 0.85, "E": 0.675 };
    const touchAngleOffset = { "A": 0, "B": 0, "C": 0, "D": 0.5, "E": 0.5 };
    for (let i = 0; i < tbuf2.length; i++) {
        const { note, t: _t } = tbuf2[i];
        if (_t > currentSettings.effectDecayTime + (note.touchTime ?? 0)) continue;
        let color = note.isDoubleTouch ? '#FFD900' : '#0089F4';
        if (currentSettings.nextNoteHighlight && play.nowIndex + 1 == note.index) color = '#220022';
        if (_t >= -1 / currentSettings.touchSpeed && _t < (note.touchTime ?? 0)) {
            drawTouch(note.pos, 0.85, color, note.touch,
                aniTouch(_t < 0 ? _t * - currentSettings.touchSpeed : 0),
                (1 - (_t / (-1 / currentSettings.touchSpeed))) * 4,
                note.touchTime, _t, ctx, hw, hh, hbw, currentSettings, calAng, noteBaseSize, note);
        }
        if (_t >= 0 && _t <= currentSettings.effectDecayTime + (note.touchTime ?? 0)) {
            let ang = (note.pos - 0.5 - (touchAngleOffset[note.touch] || 0)) / 4 * Math.PI;
            let np = calAng(ang);
            const centerX = hw + np.x * (touchDisToMid[note.touch] || 0) * hbw;
            const centerY = hh + np.y * (touchDisToMid[note.touch] || 0) * hbw;
            if (note.touchTime) {
                if (_t <= note.touchTime) drawHoldEffect(centerX, centerY, _t, color, ctx, hbw, currentSettings, noteBaseSize, note);
                drawHoldEndEffect(centerX, centerY, (_t - note.touchTime) / currentSettings.effectDecayTime * 2, color, ctx, hbw, currentSettings, noteBaseSize, note);
            } else {
                drawSimpleEffect(centerX, centerY, _t / currentSettings.effectDecayTime * 2, color, ctx, hbw, currentSettings, noteBaseSize, note);
                drawStarEffect(centerX, centerY, _t / currentSettings.effectDecayTime, color, ctx, hbw, currentSettings, noteBaseSize, false, note);
            }
        }
    }
    if (perfEnabled) {
        __perf.touches = performance.now() - __t_touch_start;
    }

    // draw perf summary if enabled
    if (perfEnabled) {
        __perf.other = performance.now();
        const totalElapsed = __perf.other - __perf.t0;
        // compute breakdown segments (ms)
        const draw_ms = (typeof __perf.slides === 'number' ? __perf.slides : 0) + (typeof __perf.taps === 'number' ? __perf.taps : 0) + (typeof __perf.touches === 'number' ? __perf.touches : 0);
        const system_ms = Math.max(0, totalElapsed - draw_ms);

        // Render small stats panel
        ctx.save();
        ctx.resetTransform();
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(8, 8, 260, 110);
        ctx.fillStyle = 'white';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.letterSpacing = "0px";
        ctx.lineWidth = 2;
        ctx.font = '18px monospace';
        const lines = [
            `FPS: ${Math.floor(fps)}`,
            `總耗時: ${totalElapsed.toFixed(2)} ms`,
            `繪製時間: ${draw_ms.toFixed(2)} ms`,
            `算繪時間: ${(__perf.slides || 0).toFixed(2)} ms`,
            `系統: ${system_ms.toFixed(2)} ms`,
            `繪製細項: slides ${(__perf.slides || 0).toFixed(2)} ms`,
            `tap/hold: ${(__perf.taps || 0).toFixed(2)} ms`,
            `touch: ${(__perf.touches || 0).toFixed(2)} ms`,
            `最大耗時: ${Math.max(__perf.slides || 0, __perf.taps || 0, __perf.touches || 0).toFixed(2)} ms`,
            `繪製物件數: ${tbuf.length + tbuf2.length + (currentSettings.showSlide ? currentSettings.maxSlideOnScreenCount : 0)}`
        ];
        for (let i = 0; i < lines.length; i++) ctx.fillText(lines[i], 16, 26 + i * 20);
        ctx.restore();
    }
}


export function drawTap(x, y, sizeFactor, color, ex, ctx, hbw, currentSettings, noteBaseSize, note = undefined) {
    let s = noteBaseSize; // Use passed base size
    let currentSize = Math.max(sizeFactor * s, 0);

    if (currentSize < 1E-5) return; // 避免繪製過小的tap

    // Frustum culling: skip drawing if off-canvas
    try {
        const canvas = ctx && ctx.canvas;
        if (canvas) {
            const margin = Math.max(48, noteBaseSize * 2);
            if (x + margin < 0 || x - margin > canvas.width || y + margin < 0 || y - margin > canvas.height) return;
        }
    } catch (e) { /* ignore */ }

    ctx.save();

    if (currentSettings.useImgSkin) {
        // Draw using image skin
        const imgTap = (note.break ? noteImages.tap_break : (note.isDoubleTapHold ? noteImages.tap_each : noteImages.tap));
        if (!isImageReady(imgTap)) { ctx.restore(); return; } // Image not loaded or broken
        // Only change transform if needed
        const needRotate = true;
        ctx.translate(x, y);
        if (needRotate) ctx.rotate(getNoteAng(parseInt(note.pos)) - Math.PI / 4);
        if (currentSize !== 1) ctx.scale(currentSize, currentSize);
        const imgSize = currentSettings.noteSkin === 1 ? 4.5 : 3;
        ctx.drawImage(imgTap,
            -imgSize / 2, -imgSize / 2,
            imgSize, imgSize);
        if (note.ex && isImageReady(noteImages.tap_ex)) ctx.drawImage(noteImages.tap_ex,
            -1.5, -1.5,
            3, 3);
    } else {
        const unit = getUnitCirclePath();

        ctx.shadowBlur = noteBaseSize * (ex ? 0.3 : 0.2);
        ctx.shadowColor = (ex ? color : '#000000');
        ctx.translate(x, y);
        ctx.scale(currentSize, currentSize);
        // scale-compensated: equals 0.75 * currentSettings.lineWidthFactor
        ctx.lineWidth = 0.75 * currentSettings.lineWidthFactor;
        ctx.strokeStyle = 'white';
        ctx.stroke(unit);
        //ctx.restore();

        ctx.shadowBlur = 0;
        ctx.shadowColor = '#00000000';
        //ctx.save();
        //ctx.translate(x, y);
        //ctx.scale(currentSize, currentSize);
        // scale-compensated: equals 0.5 * currentSettings.lineWidthFactor
        ctx.lineWidth = 0.5 * currentSettings.lineWidthFactor;
        ctx.strokeStyle = color;
        ctx.fillStyle = '#00000000';
        ctx.stroke(unit);
    }
    ctx.restore();
}

export function drawSimpleEffect(x, y, sizeFactor, color, ctx, hbw, currentSettings, noteBaseSize, note = undefined) {
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

export function drawHoldEndEffect(x, y, sizeFactor, color, ctx, hbw, currentSettings, noteBaseSize, note = undefined) {
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

export function drawHoldEffect(x, y, sizeFactor, color, ctx, hbw, currentSettings, noteBaseSize, note = undefined) {
    if (!currentSettings.showEffect) return;

    function ani1(x) {
        return Math.log(99 * x + 1) / Math.log(100);
    }

    function ani2(x) {
        return Math.log(9 * x + 1) / Math.log(10);
    }
    /*ctx.fillStyle = "black";
    ctx.font = "24px monospace"
    ctx.fillText(`${sizeFactor}, ${Math.sin(sizeFactor + Math.sin(sizeFactor / 2))}`, x + 100, y);*/
    let s = noteBaseSize; // Use passed base size
    let currentSize = s * 1.75;
    let localColor = ctx.createRadialGradient(x, y, 0, x, y, currentSize * ani1((sizeFactor * 4) % 1));
    localColor.addColorStop(0, '#FCFF0A00');
    localColor.addColorStop(1, hexWithAlpha('#FCFF0A', 5 * (1 - ani1((sizeFactor * 4) % 1))));

    let halo = ctx.createRadialGradient(x, y, 0, x, y, currentSize * ani1((sizeFactor * 4) % 1) * 1.5);
    halo.addColorStop(0, '#FCFF0A00');
    halo.addColorStop(0.2, '#FCFF0A00');
    halo.addColorStop(0.5, hexWithAlpha('#FCFF0A', 3 * (1 - ani2((sizeFactor * 4) % 1))));
    halo.addColorStop(0.7, hexWithAlpha('#FCFF0A', 3 * (1 - ani2((sizeFactor * 4) % 1))));
    halo.addColorStop(1, '#FCFF0A00');

    let halo1 = ctx.createRadialGradient(x, y, 0, x, y, currentSize * ani1((sizeFactor * 4 + 0.5) % 1) * 1.5);
    halo1.addColorStop(0, '#FCFF0A00');
    halo1.addColorStop(0.2, '#FCFF0A00');
    halo1.addColorStop(0.5, hexWithAlpha('#FCFF0A', 3 * (1 - ani2((sizeFactor * 4 + 0.5) % 1))));
    halo1.addColorStop(0.7, hexWithAlpha('#FCFF0A', 3 * (1 - ani2((sizeFactor * 4 + 0.5) % 1))));
    halo1.addColorStop(1, '#FCFF0A00');

    ctx.shadowColor = "#00000000";
    ctx.fillStyle = localColor;
    ctx.beginPath();
    ctx.arc(x, y, currentSize * ani1((sizeFactor * 4) % 1), 0, 2 * Math.PI);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, currentSize * 1.5, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.fillStyle = halo;
    ctx.fill();
    ctx.fillStyle = halo1;
    ctx.fill();
}

export function drawStarEffect(x, y, sizeFactor, color, ctx, hbw, currentSettings, noteBaseSize, useFiveStar = false, note = undefined) {
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

    /*function drawDiamond(ctx, cx, cy, r, color, fill, rotation = 0) {
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
    }*/

    // 使用快取的單位菱形路徑進行繪製，以減少垃圾回收與重複 Path2D 建立
    function drawDiamondUsingCache(ctx, cx, cy, r, color, fill, rotation = 0) {
        const diamond = getDiamondPath();
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rotation);
        // 縮放單位路徑到所需大小：使用 ctx.scale 可讓 Path2D 重複利用
        ctx.scale(r, r);
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        // 因為我們縮放了坐標系，實際需要的線寬在單位空間中為 (r*0.2)/r == 0.2
        if (!fill) ctx.lineWidth = 0.2;
        if (fill) ctx.fill(diamond);
        else ctx.stroke(diamond);
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
                x + offset * 1.1 * ang.x,
                y + offset * 1.1 * ang.y,
                radius * 1.5,
                color,
                baseAngle + i * Math.PI / 4,
                radius * 0.2
            );
        } else {
            drawDiamondUsingCache(
                ctx,
                x + offset * ang.x,
                y + offset * ang.y,
                radius + isFill * radius * 0.15,
                color,
                isFill,
                baseAngle + i * Math.PI / 4
            );
        }

        if (!isFill) {
            drawRoundedStar(
                ctx,
                x + ang.x * 0.1 * hbw,
                y + ang.y * 0.1 * hbw,
                (radius + !isFill * radius * 0.15) * 0.75,
                color,
                baseAngle + i * Math.PI / 4,
                radius * 0.15
            );
        } else {
            drawDiamondUsingCache(
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
}

// 移除了未使用的參數 (hbw, currentSettings, calAng)
export function drawStar(x, y, sizeFactor, color, ex, ang, ctx, hbw, currentSettings, calAng, noteBaseSize, alpha = 1, note = undefined) {
    // 角度調整可以保留，這屬於視覺效果的一部分
    const currentSize = Math.max(sizeFactor * noteBaseSize, 0);

    if (currentSize < 1E-5) return; // 避免繪製過小的星星

    ctx.save();

    if (currentSettings.useImgSkin) {
        // Draw using image skin
        const imgStar = noteImages[(note.break ? 'star_break' : ((note.isDoubleTapHold || note.isDoubleSlide) ? 'star_each' : 'star')) + (note.doubleSlide ? '_double' : '')];
        if (!isImageReady(imgStar)) return;
        ctx.translate(x, y);
        ctx.rotate((ang * 0.192 + 0.125) * Math.PI);
        ctx.scale(currentSize, currentSize);
        const imgSize = currentSettings.noteSkin === 1 ? 4.5 : 3;
        ctx.drawImage(imgStar,
            -imgSize / 2, -imgSize / 2,
            imgSize, imgSize);
        if (ex && isImageReady(noteImages.star_ex)) {
            ctx.drawImage(noteImages.star_ex,
                -imgSize / 2, -imgSize / 2,
                imgSize, imgSize);
        }
    } else {
        ctx.translate(x, y);
        ctx.rotate((ang * 0.192 + 0.125) * Math.PI);

        const starShape = getStarPath(currentSize);
        // --- 顏色與透明度處理 (使用 canvas 內建 globalAlpha) ---
        const localAlpha = Math.max(0, Math.min(1, alpha));
        // 取得不含 alpha 的基礎色碼
        //const baseColor = (typeof color === 'string' && color.length >= 7) ? color.substring(0, 7) : color;

        // 使用 save/restore 管理 globalAlpha（上方已呼叫 ctx.save()）
        ctx.globalAlpha = localAlpha;

        // --- 第一次描邊：白色外框 + 陰影 (製造外發光效果) ---
        ctx.shadowBlur = noteBaseSize * (ex ? 0.3 : 0.2);
        ctx.shadowColor = (ex ? color : 'rgba(0,0,0,1)');
        ctx.lineWidth = currentSize * 0.6 * currentSettings.lineWidthFactor;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke(starShape);

        // --- 第二次描邊：主題顏色內框 ---
        ctx.shadowBlur = 0; // 關閉陰影
        ctx.shadowColor = 'rgba(0,0,0,0)';
        ctx.lineWidth = currentSize * 0.35 * currentSettings.lineWidthFactor;
        ctx.strokeStyle = color;
        ctx.stroke(starShape);
    }
    ctx.restore();
}


export function drawNoteArc(ctx, options, note = undefined) {
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

export function drawNoteDot(ctx, options, note = undefined) {
    const {
        x = 0,
        y = 0,
        size = 100,
        color = "#FF0000",
        transparency = 1,
    } = options;
    if (size <= 0 || isNaN(size)) return;
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
    static EPS = 1e-5;

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
        // 小量級快取：針對重複呼叫 getPointAtLength 的長度位置做 memo
        this._pointCache = new Map(); // key: rounded length -> {x,y,angle}
    }

    // 將快取標記為髒，以便下次重新計算
    _invalidateCache() {
        this._isCacheDirty = true;
        // 清除點快取，確保下次查詢會使用更新後的 segments
        if (this._pointCache) this._pointCache.clear();
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

        // 使用簡單的捨入快取以避免對相近長度做重複的二分搜尋
        // 取整到 0.5 單位（可視需求調整精度）
        const cacheKey = Math.round(targetLength * 2) / 2;
        if (this._pointCache && this._pointCache.has(cacheKey)) {
            return this._pointCache.get(cacheKey);
        }
        // 處理邊界情況
        // 若沒有任何線段（例如只有一個點或空 path），直接回傳最後已知位置
        if (!segments || segments.length === 0) {
            return { x: this._lastX, y: this._lastY, angle: 0 };
        }

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

        // 如果沒找到（理論上不會發生，保險處理），取最後一段
        if (segIndex === -1) segIndex = segments.length - 1;
        const seg = segments[segIndex];
        const prevAccLen = segIndex > 0 ? segments[segIndex - 1].accLen : 0;
        const lenInSeg = targetLength - prevAccLen;
        const t = seg.len < PathRecorder.EPS ? 0 : lenInSeg / seg.len;

        return {
            x: seg.p1.x + (seg.p2.x - seg.p1.x) * t,
            y: seg.p1.y + (seg.p2.y - seg.p1.y) * t,
            angle: seg.ang,
        };

        if (this._pointCache) this._pointCache.set(cacheKey, result);

        return result;
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


        // 若總長度為 0，回傳最後已知位置（避免呼叫 getPointAtLength 導致錯誤）
        if (total <= PathRecorder.EPS) {
            samples.push({ x: this._fmt(this._lastX), y: this._fmt(this._lastY), angle: 0, length: this._fmt(0) });
            return samples;
        }

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
    function drawArrowAndStar(pathObject, spacing, _t_arrow_progress, currentCtx, arrowColor, arrowSize, wSlide, fading, note) {
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
        const fin = Math.floor(totalLen / spacing + 1 * wSlide - 1E-5 - 0.5);

        // reuse arrow shape if available to avoid allocation
        const arrowKey = `${arrowSize.toFixed(2)}_${wSlide ? 1 : 0}`;
        let arrow = arrowShapeCache.get(arrowKey);
        if (!arrow) {
            arrow = new Path2D();
            arrow.moveTo(arrowSize * 0.55, 0);
            arrow.lineTo(arrowSize * 0.35, arrowSize * -0.4);
            arrow.lineTo(0, arrowSize * -0.4);
            arrow.lineTo(arrowSize * 0.2, 0);
            arrow.lineTo(0, arrowSize * 0.4);
            arrow.lineTo(arrowSize * 0.35, arrowSize * 0.4);
            arrow.closePath();
            arrowShapeCache.set(arrowKey, arrow);
        }

        // 計算從哪個 index 開始繪製，以避免大量不必要的迴圈
        const approxStartIndex = Math.max(0, Math.floor((_t_arrow * totalLen) / spacing) - 1);
        let b = (fin - 1) * bIncrementPer;
        for (let i = fin - 1; i >= approxStartIndex; i -= 1 + wSlide * 0.25) {
            const lenAlong = (i + 0.5) * spacing * (1 - wSlide * 0.035);
            // 只有當在剩餘進度區段，才繪製
            if (lenAlong / totalLen >= _t_arrow) {
                // 取得路徑上該長度位置點與角度
                const p = pathObject.getPointAtLength(lenAlong);
                const x = p.x, y = p.y, angle = p.angle;

                // 使用 save/restore 來避免 transform 污染
                currentCtx.save();
                currentCtx.translate(x, y);
                currentCtx.rotate(angle);
                if (wSlide) {
                    currentCtx.beginPath();
                    currentCtx.moveTo(arrowSize * 0.55, 0);
                    currentCtx.lineTo(arrowSize * 0.35 - b / 2, arrowSize * -0.4 - b);
                    currentCtx.lineTo(0 - b / 2 + wSlide * arrowSize * 0.05, arrowSize * -0.4 - b + wSlide * arrowSize * 0.12);
                    currentCtx.lineTo(arrowSize * 0.2, 0);
                    currentCtx.lineTo(0 - b / 2 + wSlide * arrowSize * 0.05, arrowSize * 0.4 + b - wSlide * arrowSize * 0.12);
                    currentCtx.lineTo(arrowSize * 0.35 - b / 2, arrowSize * 0.4 + b);
                    currentCtx.closePath();
                    currentCtx.fill();
                } else {
                    if (settings.useImgSkin) {
                        if (!noteImages.slide) return;
                        currentCtx.rotate(Math.PI);
                        currentCtx.shadowColor = "#00000000";
                        currentCtx.drawImage(noteImages[note.break ? 'slide_break' : (note.isDoubleSlide ? 'slide_each' : 'slide')],
                            -arrowSize * 0.75, -arrowSize * 0.5,
                            arrowSize * 0.8, arrowSize * 1);
                    } else {
                        currentCtx.fill(arrow);
                    }
                }
                currentCtx.restore();
            }
            b -= bIncrementPer * 1.2;
        }
        if (!fading) {
            const k = (note.chain && !note.firstOne) ? (_t_arrow_progress > 0) + 0 : Math.min(_t_arrow_progress * note.slideTime / note.delay + 1, 1);

            const p = pathObject.getPointAtLength(_t_arrow * totalLen);
            currentCtx.save();
            currentCtx.translate(p.x, p.y);
            currentCtx.rotate(p.angle - Math.PI * 49 / 40);

            //ctx.font = "bold 24px Segoe UI"; // Smaller font
            //ctx.fillStyle = "black";
            //ctx.fillText(`${slidePosDiff(startNp, endNp)}`, 0, 50);
            drawStar(0, 0, k * 1.5, color, false, 0, currentCtx, hbw, currentSettings, calAng, s, k, note);
            if (wSlide) drawStar(bIncrementPer * _t_arrow * (totalLen / spacing - 2 * wSlide) / 1.5, 0 - bIncrementPer * _t_arrow * (totalLen / spacing - 2 * wSlide) * 1.15, k * 1.5, color, false, 0, currentCtx, hbw, currentSettings, calAng, s, k, note);
            if (wSlide) drawStar(0 - bIncrementPer * _t_arrow * (totalLen / spacing - 2 * wSlide) * 1.15, bIncrementPer * _t_arrow * (totalLen / spacing - 2 * wSlide) / 1.5, k * 1.5, color, false, 0, currentCtx, hbw, currentSettings, calAng, s, k, note);
            currentCtx.restore();
        }
    }

    // 預設為不含 alpha 的基底顏色
    let localColor = (typeof color === 'string' && color.length >= 7) ? color.substring(0, 7) : color;
    ctx.shadowBlur = s * 0.2;
    ctx.shadowColor = '#000000';

    // 若需要淡入/淡出，使用 canvas 內建的 globalAlpha 包覆繪製區段，避免用 8 位 hex
    let _appliedGlobalAlpha = false;
    if (t_progress < 0 && fading) {
        const alpha = Math.max(0, Math.min(1, (t_progress + 1))); // Alpha from 0 to 1
        ctx.save();
        ctx.globalAlpha = alpha;
        // shadowColor 保持純黑，globalAlpha 會影響透明度
        ctx.shadowColor = '#000000';
        _appliedGlobalAlpha = true;
    }

    ctx.lineWidth = s * 0.15 * currentSettings.lineWidthFactor;
    ctx.strokeStyle = localColor;

    // Path generation (assuming render.path returns a PathRecorder instance)
    // The PathRecorder instance should be generated by noteData if possible during decode.
    const cacheKey = `${type}_${startNp}_${endNp}_${Math.round(hbw)}_${Math.round(hw)}_${Math.round(hh)}`;
    let a = noteData.pathObject || pathCache.get(cacheKey);
    if (!a) {
        a = path(type, startNp, endNp, hw, hh, hbw, calAng);
        pathCache.set(cacheKey, a);
    }
    // Draw the path itself (the line of the slide) to preserve original visual
    /*try {
        ctx.save();
        ctx.lineWidth = s * 0.15 * currentSettings.lineWidthFactor;
        ctx.strokeStyle = ctx.strokeStyle || localColor;
        ctx.stroke(a.ctxPath);
        ctx.restore();
    } catch (e) {
        // fallback: ignore if stroke fails on older browsers
    }*/

    // Draw arrows on the path
    // Ensure `a` is a PathRecorder with mathematical getPointAtLength and getTotalLength
    drawArrowAndStar(a, s * 1.245, t_progress, ctx, localColor, s * 2, type == "w", fading, noteData); // Pass arrowSize

    if (_appliedGlobalAlpha) {
        ctx.restore();
    }

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
            pathRec.arc(hw, hh, Math.sin(Math.PI / 8) * hbw,
                Math.PI * (startNp / 4),
                Math.PI * (8 * (slidePosDiff(startNp, endNp) == 5) + (endNp + 13) % 8) / 4);
            pathRec.lineTo(np[1].x + calAng(Math.PI * (endNp / 4 + 1.25)).x * hbw * 0.9, np[1].y + calAng(Math.PI * (endNp / 4 + 1.25)).y * hbw * 0.9);
            pathRec.lineTo(np[1].x, np[1].y);
            break;
        }
        case 'p': {
            pathRec.moveTo(np[0].x, np[0].y);
            pathRec.lineTo(np[0].x + calAng(Math.PI * (startNp / 4 + 1.25)).x * hbw * 0.9, np[0].y + calAng(Math.PI * (startNp / 4 + 1.25)).y * hbw * 0.9);
            pathRec.arc(hw, hh, Math.sin(Math.PI / 8) * hbw,
                Math.PI * (8 * (slidePosDiff(startNp, endNp) == 3) + (startNp + 13) % 8) / 4,
                Math.PI * (endNp) / 4, true);
            pathRec.lineTo(np[1].x + calAng(Math.PI * (endNp / 4 + 1)).x * hbw * 0.9, np[1].y + calAng(Math.PI * (endNp / 4 + 1)).y * hbw * 0.9);
            pathRec.lineTo(np[1].x, np[1].y);
            break;
        }
        case 'qq': {
            pathRec.moveTo(np[0].x, np[0].y);
            pathRec.arc(
                hw + calAng(Math.PI * (startNp / 4 - 0.25)).x * (hbw / 2 - hbw / 40),
                hh + calAng(Math.PI * (startNp / 4 - 0.25)).y * (hbw / 2 - hbw / 40),
                hbw / 2.3,
                Math.PI * ((startNp + 9) % 8 - 0.25) / 4,
                Math.PI * (
                    1 * (slidePosDiff(startNp, endNp) == 0) +
                    1 * (slidePosDiff(startNp, endNp) == 7) +
                    0.75 * (slidePosDiff(startNp, endNp) == 6) +
                    0.5 * (slidePosDiff(startNp, endNp) == 5) +
                    8 * (slidePosDiff(startNp, endNp) == 3) +
                    1 * (slidePosDiff(startNp, endNp) == 2) +
                    1.5 * (slidePosDiff(startNp, endNp) == 1) +
                    (endNp + 4.5) % 8) / 4,
                false);
            pathRec.lineTo(np[1].x, np[1].y);
            break;
        }
        case 'pp': {
            pathRec.moveTo(np[0].x, np[0].y);
            pathRec.arc(
                hw + calAng(Math.PI * (startNp / 4 - 1.5)).x * (hbw / 2 - hbw / 40),
                hh + calAng(Math.PI * (startNp / 4 - 1.5)).y * (hbw / 2 - hbw / 40),
                hbw / 2.3,
                Math.PI * ((((startNp + 4.5) % 8) / 4) % 2),
                Math.PI * ((endNp + 8) % 8 - (
                    1 * (slidePosDiff(startNp, endNp) == 0) +
                    1 * (slidePosDiff(startNp, endNp) == 7) +
                    0.25 * (slidePosDiff(startNp, endNp) == 6) +
                    7.5 * (slidePosDiff(startNp, endNp) == 5) +
                    7.5 * (slidePosDiff(startNp, endNp) == 4) +
                    7.5 * (slidePosDiff(startNp, endNp) == 3) +
                    0.5 * (slidePosDiff(startNp, endNp) == 1)
                ) - 7.5 * (startNp == 4 && endNp == 7)
                    + 8 * (startNp == 3 && endNp == 0)
                    - 0.75 * (startNp == 4 && endNp == 7)) / 4
                ,
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

function slidePosDiff(startNp, endNp) { return (startNp - endNp + 8) % 8; }

export function drawHold(x, y, sizeFactor, color, ex, ang, l, ctx, hbw, currentSettings, calAng, noteBaseSize, note = undefined) {
    ang = ang - 0.125 * Math.PI;
    let s = noteBaseSize;
    let currentSize = Math.max(sizeFactor * s, 0);
    // Use cached Path2D for hold shapes to reduce allocations
    if (currentSettings.useImgSkin) {
        if (!(noteImages.hold && noteImages.hold_ex && noteImages.hold_each && noteImages.hold_break)) return;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(-ang);
        const noteImage = noteImages[note.break ? 'hold_break' : (note.isDoubleTapHold ? 'hold_each' : 'hold')];
        ctx.drawImage(noteImage,
            0, 0,
            122, 50,
            0 - currentSize * 1.5, 0 - currentSize * 1.75,
            currentSize * 3, currentSize * 1.25);
        // 122 x 200
        ctx.drawImage(noteImage,
            0, 50,
            122, 95,
            0 - currentSize * 1.5, 0 - currentSize * 0.5,
            currentSize * 3, currentSize * (0.85 + l / noteBaseSize));
        ctx.drawImage(noteImage,
            0, 145,
            122, 50,
            0 - currentSize * 1.5, currentSize * (0.35 + l / noteBaseSize),
            currentSize * 3, currentSize * 1.25);
        if (note.ex) {
            ctx.drawImage(noteImages.hold_ex,
                0, 0,
                122, 50,
                0 - currentSize * 1.5, 0 - currentSize * 1.75,
                currentSize * 3, currentSize * 1.25);
            ctx.drawImage(noteImages.hold_ex,
                0, 50,
                122, 95,
                0 - currentSize * 1.5, 0 - currentSize * 0.5,
                currentSize * 3, currentSize * (0.85 + l / noteBaseSize));
            ctx.drawImage(noteImages.hold_ex,
                0, 145,
                122, 50,
                0 - currentSize * 1.5, currentSize * (0.35 + l / noteBaseSize),
                currentSize * 3, currentSize * 1.25);
        }
    } else {
        const holdShapeCache = drawHold.holdShapeCache || (drawHold.holdShapeCache = new Map());

        function getHoldPath(size, length) {
            const sizeKey = Math.round(size * 100) / 100;
            const lenKey = Math.round(length * 100) / 100;
            const key = `${sizeKey}_${lenKey}`;
            let p = holdShapeCache.get(key);
            if (p) return p;

            // Build path in local coordinates centered at origin and oriented for ang = 0.
            p = new Path2D();
            const calAngLocal = (a) => ({ x: Math.sin(a), y: -Math.cos(a) });
            const offsets = [0, Math.PI / 3, 2 * Math.PI / 3, Math.PI, 4 * Math.PI / 3, 5 * Math.PI / 3];
            // length displacement in local space is along calAngLocal(0)
            const lenDisp = calAngLocal(0);

            // Point 0
            const p0 = { x: -size * calAngLocal(offsets[0]).x, y: size * calAngLocal(offsets[0]).y };
            p.moveTo(p0.x, p0.y);

            // Point 1
            const p1 = { x: -size * calAngLocal(offsets[1]).x, y: size * calAngLocal(offsets[1]).y };
            p.lineTo(p1.x, p1.y);

            // Point 2 (with length displacement)
            const p2 = { x: -size * calAngLocal(offsets[2]).x + length * lenDisp.x, y: size * calAngLocal(offsets[2]).y - length * lenDisp.y };
            p.lineTo(p2.x, p2.y);

            // Point 3
            const p3 = { x: -size * calAngLocal(offsets[3]).x + length * lenDisp.x, y: size * calAngLocal(offsets[3]).y - length * lenDisp.y };
            p.lineTo(p3.x, p3.y);

            // Point 4
            const p4 = { x: -size * calAngLocal(offsets[4]).x + length * lenDisp.x, y: size * calAngLocal(offsets[4]).y - length * lenDisp.y };
            p.lineTo(p4.x, p4.y);

            // Point 5
            const p5 = { x: -size * calAngLocal(offsets[5]).x, y: size * calAngLocal(offsets[5]).y };
            p.lineTo(p5.x, p5.y);

            p.closePath();
            holdShapeCache.set(key, p);
            return p;
        }

        const holdPath = getHoldPath(currentSize, l);

        // Simple frustum culling: skip if center is far outside canvas bounds
        try {
            const canvas = ctx && ctx.canvas;
            if (canvas) {
                const margin = Math.max(64, noteBaseSize * 3);
                if (x + margin < 0 || x - margin > canvas.width || y + margin < 0 || y - margin > canvas.height) return;
            }
        } catch (e) { /* ignore */ }

        ctx.shadowBlur = noteBaseSize * (ex ? 0.3 : 0.2);
        ctx.shadowColor = (ex ? color : '#000000');
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(-ang);
        ctx.lineWidth = currentSize * 0.75 * currentSettings.lineWidthFactor;
        ctx.strokeStyle = 'white';
        ctx.stroke(holdPath);
        ctx.restore();

        ctx.shadowBlur = 0;
        ctx.shadowColor = '#00000000';
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(-ang);
        ctx.lineWidth = currentSize * 0.5 * currentSettings.lineWidthFactor;
        ctx.strokeStyle = color;
        ctx.stroke(holdPath);
    }
    ctx.restore();
}

export function drawTouch(pos, sizeFactor, color, type, distance, opacity, holdtime, t_touch, ctx, hw, hh, hbw, currentSettings, calAng, noteBaseSize, note = undefined) {
    opacity = Math.min(Math.max(opacity, 0), 1); // Clamp opacity

    let localColor = hexWithAlpha(color, opacity);

    let s = noteBaseSize * 1.1;
    let currentSize = Math.max(sizeFactor * s, 0); // sizeFactor seems to be a base, not multiplier here. Original: size = size * s;

    const touchDisToMid = { "A": 0.85, "B": 0.475, "C": 0, "D": 0.85, "E": 0.675 }; // Make const
    const touchAngleOffset = { "A": 0, "B": 0, "C": 0, "D": 0.5, "E": 0.5 }; // Make const
    let ang = (pos - 0.5 - (touchAngleOffset[type] || 0)) / 4 * Math.PI;
    let np = calAng(ang);

    const centerX = hw + np.x * (touchDisToMid[type] || 0) * hbw;
    const centerY = hh + np.y * (touchDisToMid[type] || 0) * hbw;

    let effectiveDistance = (distance + 0.32) * currentSize; // Apply currentSize to distance scaling

    // drawTouchElement now draws relative to supplied center (cx, cy)
    function drawTouchElement(cx, cy, isFill = false, stage = 0) {
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
            /*const corners = [
                { x_offset: 1, y_offset: -1, fill: `rgba(250,73,4,${opacity})` },
                { x_offset: -1, y_offset: -1, fill: `rgba(0,141,244,${opacity})` },
                { x_offset: 1, y_offset: 1, fill: `rgba(245,238,0,${opacity})` },
                { x_offset: -1, y_offset: 1, fill: `rgba(17,167,105,${opacity})` }
            ];
            corners.forEach(corner => {
                ctx.beginPath();
                // Recalculate points based on cx, cy, effectiveDistance, and currentSize
                const point1x = cx + effectiveDistance * corner.x_offset;
                const point1y = cy + effectiveDistance * corner.y_offset;
                const point2x = cx + effectiveDistance * corner.x_offset;
                const point2y = cy + (effectiveDistance + currentSize * Math.SQRT2) * corner.y_offset; // Approx
                const point3x = cx + (effectiveDistance + currentSize * Math.SQRT2) * corner.x_offset; // Approx
                const point3y = cy + effectiveDistance * corner.y_offset;

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
            });*/

            const color4 = [
                `rgba(250,73,4,${opacity})`,
                `rgba(0,141,244,${opacity})`,
                `rgba(245, 238, 0, ${opacity})`,
                `rgba(17, 167, 105, ${opacity})`,
            ];

            ctx.beginPath();
            // Recalculate points based on cx, cy, effectiveDistance, and currentSize
            const point1x = cx + effectiveDistance * 1;
            const point1y = cy + effectiveDistance * -1;
            const point2x = cx + effectiveDistance * 1;
            const point2y = cy + (effectiveDistance + currentSize * Math.SQRT2) * -1; // Approx
            const point3x = cx + (effectiveDistance + currentSize * Math.SQRT2) * 1; // Approx
            const point3y = cy + effectiveDistance * -1;

            ctx.moveTo(point1x, point1y);
            ctx.lineTo(point2x, point2y); // These points define triangles/quads for corners
            ctx.lineTo(point3x, point3y); // Adjust geometry for exact original shape
            ctx.closePath();

            if (isFill) {
                ctx.fillStyle = color4[stage];
                ctx.fill();
                ctx.strokeStyle = color4[stage]; // Match stroke to fill for filled parts
            }
            ctx.stroke();

            if (isFill) ctx.strokeStyle = innerStrokeStyle; // Reset for center arc
            if (stage === 3) _arc(cx, cy, currentSize * 0.15, ctx);

        } else { // str logic (non-hold)
            if (currentSettings.useImgSkin) {
                // use canvas built-in alpha handling for image opacity
                if (!(noteImages.touch && noteImages.touch_each && noteImages.touch_point_each && noteImages.touch_point)) return;
                const touchImg = noteImages[note.isDoubleTouch ? 'touch_each' : 'touch'];
                ctx.globalAlpha = opacity;
                ctx.drawImage(touchImg, cx - currentSize * 1.5, cy - currentSize * 0.8 + effectiveDistance * 1.25, currentSize * 3, currentSize * 2);
                if (stage === 3) ctx.drawImage(noteImages[note.isDoubleTouch ? 'touch_point_each' : 'touch_point'], cx - currentSize * 0.5, cy - currentSize * 0.5, currentSize, currentSize);
            } else {
                const zs = 1;
                const armLength = effectiveDistance + currentSize * zs; // Simplified arm length

                // Top Triangle
                ctx.beginPath();
                ctx.moveTo(cx, cy - effectiveDistance * 1.25);
                ctx.lineTo(cx + currentSize * zs, cy - armLength - effectiveDistance * 0.25);
                ctx.lineTo(cx - currentSize * zs, cy - armLength - effectiveDistance * 0.25);
                ctx.closePath(); ctx.stroke();
                /*// Left Triangle
                ctx.beginPath();
                ctx.moveTo(cx - effectiveDistance * 1.25, cy);
                ctx.lineTo(cx - armLength - effectiveDistance * 0.25, cy - currentSize * zs);
                ctx.lineTo(cx - armLength - effectiveDistance * 0.25, cy + currentSize * zs);
                ctx.closePath(); ctx.stroke();
                // Bottom Triangle
                ctx.beginPath();
                ctx.moveTo(cx, cy + effectiveDistance * 1.25);
                ctx.lineTo(cx + currentSize * zs, cy + armLength + effectiveDistance * 0.25);
                ctx.lineTo(cx - currentSize * zs, cy + armLength + effectiveDistance * 0.25);
                ctx.closePath(); ctx.stroke();
                // Right Triangle
                ctx.beginPath();
                ctx.moveTo(cx + effectiveDistance * 1.25, cy);
                ctx.lineTo(cx + armLength + effectiveDistance * 0.25, cy - currentSize * zs);
                ctx.lineTo(cx + armLength + effectiveDistance * 0.25, cy + currentSize * zs);
                ctx.closePath(); ctx.stroke();*/

                if (stage === 3) _arc(cx, cy, currentSize * 0.15, ctx);
            }
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
            `rgba(250, 73, 4, ${opacity})`,
            `rgba(245, 238, 0, ${opacity})`,
            `rgba(17, 167, 105, ${opacity})`,
            `rgba(0, 141, 244, ${opacity})`
        ];
        const angles = [
            Math.PI * 0.25,
            Math.PI * 1.75,
            Math.PI * 1.25,
            Math.PI * 0.75
        ];
        const barBaseLength = currentSize * (2.65 + distance + 0.32);

        if (t_progress_hold >= 0) {
            for (let i = 0; i < 4; i++) {
                let disPercent = Math.max(0, progressSegments[i]);
                disPercent = Math.min(0.25, disPercent) / 0.25;
                let barLength = Math.min(disPercent, 0.7) * barBaseLength * Math.SQRT2;
                const k = effectiveDistance - currentSize * 2.65;

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
        ctx.shadowColor = `rgba(255, 255, 255)`;
        ctx.shadowBlur = s * 0.4;
        strPrg(t_touch / holdtime);
    }
    ctx.shadowBlur = s * 0.2;
    ctx.shadowColor = `rgba(0, 0, 0, ${opacity})`;
    // Draw 4 rotated copies (0, 90, 180, 270 degrees)
    for (let i = 0; i < 4; i++) {
        const rot = i * (Math.PI / 2);
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(rot);
        // draw relative to origin (0,0) after transform
        drawTouchElement(0, 0, false, i);
        drawTouchElement(0, 0, true, i);
        ctx.restore();
    }

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

    return `#${hex}${alphaHex} `;
}

export function _arc(x, y, r = 0, currentCtx) {
    if (r <= 0) return; // Don't draw zero or negative radius arcs
    currentCtx.beginPath();
    currentCtx.arc(x, y, r, 0, 2 * Math.PI);
    currentCtx.stroke();
}

// Expose cache management so host can clear on resize/settings change
export function clearRenderCaches() {
    pathCache.clear();
    arrowShapeCache.clear();
}

// Reusable per-frame note buffers to avoid allocating arrays each frame
const noteBuffers = {
    slides: [],
    taps: [],
    touches: []
};
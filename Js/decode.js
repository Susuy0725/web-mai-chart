import * as render from "./render.js";

export function simai_decode(_data) {
    // 註解
    _data = _data.replace(/\|\|.*$/gm, "");
    // 先移除空白與換行
    _data = _data.replace(/(\r\n|\n|\r| )/gm, "");
    let tempNote = [],
        marks = [],
        dataTemp = _data.split(","),
        timeSum = 0,
        lastbpm,
        lastslice,
        slice = 1,
        bpm = 60,
        tapCounts = 0,
        holdCounts = 0,
        touchCounts = 0,
        slideCounts = 0,
        breakCounts = 0;

    // 基本 note 解析（依據逗號分隔，每筆 note 記錄原始 pos 與時間）
    for (let i = 0; i < dataTemp.length; i++) {
        let data = dataTemp[i];
        if (data) {
            // 解析 BPM 設定：用括號包住的數字，例如 "(120)"
            //let match = [data.match(/\(\d+\)|\(\d+.\d+\)/g), data.match(/\{\d+\}|\{\d+.\d+\}/g)];
            //console.log(match);
            while (data.includes("(") && data.includes(")")) {
                bpm = parseFloat(data.slice(data.indexOf("(") + 1, data.indexOf(")")));
                if (data.lastIndexOf("(") < data.lastIndexOf(")")) {
                    data = data.slice(0, data.slice(0, data.indexOf(")")).lastIndexOf("(")) +
                        data.slice(data.indexOf(")") + 1);
                } else {
                    break;
                }
            }
            if (isNaN(bpm)) {
                bpm = 60;
                console.error("Invaild BPM!")
            }
            if (lastbpm !== bpm) {
                marks.push({ bpm, time: timeSum, type: "bpm" });
                marks.push({ slice, bpm, time: timeSum, type: "slice" });
                lastbpm = bpm;
            }
            dataTemp[i] = data;

            // 解析切分設定：用大括號包住的數字，例如 "{2}"
            while (data.includes("{") && data.includes("}")) {
                slice = parseFloat(data.slice(data.lastIndexOf("{") + 1, data.indexOf("}")));
                data = data.slice(data.indexOf("}") + 1);
            }
            if (lastslice !== slice) {
                marks.push({ slice, bpm, time: timeSum, type: "slice" });
                lastslice = slice;
            }
            dataTemp[i] = data;

            // 若有 "/" 則表示此節拍內有多個 note
            if (data.includes("/")) {
                data = data.split("/");
                for (let j = 0; j < data.length; j++) {
                    if (data[j] === "") continue;
                    tempNote.push({ pos: data[j], time: timeSum, bpm, index: i });
                }
            }

            if (data.length > 1 && !isNaN(data)) {
                for (let j = 0; j < data.length; j++) {
                    tempNote.push({ pos: data[j], time: timeSum, bpm, index: i });
                }
            }
            data = dataTemp[i];
        }
        if (!(data.includes("/")) && data && !(data.length > 1 && !isNaN(data))) {
            tempNote.push({ pos: dataTemp[i], time: timeSum, bpm, index: i });
        }
        // 累加時間：此處公式依 slice 與 bpm 計算，4000 為單位比例，可依需求調整
        timeSum += (1 / slice) * (60 / bpm) * 4000;
    }
    console.log(marks);

    for (let i = 0; i < tempNote.length; i++) {
        let data = tempNote[i];

        if (data) {
            if (data.pos.includes("`")) {
                data = data.pos.split("`");
                for (let j = 0; j < data.length; j++) {
                    if (data[j] === "") continue;
                    if (j == 0) { tempNote[i] = { pos: data[j], time: tempNote[i].time + j * 10, bpm: tempNote[i].bpm, index: tempNote[i].index }; continue; }
                    tempNote.push({ pos: data[j], time: tempNote[i].time + j * 10, bpm: tempNote[i].bpm, index: tempNote[i].index });
                }
            }
        }
    }

    for (let i = 0; i < tempNote.length; i++) {
        if (tempNote[i]) {
            const propertyMatch = tempNote[i].pos.match(/^<([a-zA-Z0-9\_\*\.\-]+)>(.*)/);
            if (propertyMatch) {
                tempNote[i].property = propertyMatch[1]; // 將 "<prop>" 中的 "prop" 儲存為 property
                tempNote[i].pos = propertyMatch[2]; // 更新 pos，移除 "<prop>" 部分
            }
        }
    }

    for (let i = 0; i < tempNote.length; i++) {
        let data = tempNote[i];
        if (data) {
            if (data.pos.includes("*")) {
                data = data.pos.split("*");
                for (let j = 0; j < data.length; j++) {
                    if (data[j] === "") continue;
                    if (j == 0) { tempNote[i] = { pos: data[j], time: tempNote[i].time, bpm: tempNote[i].bpm, index: tempNote[i].index, property: tempNote[i].property }; continue; }
                    tempNote.push({ pos: data[j], time: tempNote[i].time, bpm: tempNote[i].bpm, head: data[0][0], index: tempNote[i].index, property: tempNote[i].property });
                }
            }
        }
    }

    // ──────────────────────────────
    // 輔助函式：解析 [參數] 部分，支援多種格式
    function parseParameter(param, currentBpm) { // 確保函式是 export 的
        let delay = 1; // 延遲時間，初始化為 1000 毫秒
        let durationStr = param; // 用於解析持續時間的部分
        let duration = 0; // 持續時間，初始化為 0 毫秒
        delay = (60 / currentBpm);

        // 1. 檢查是否包含延遲 (## 分隔)
        if (param.includes("##")) {
            const parts = param.split("##");
            if (parts.length === 2) {
                const delayInSeconds = parseFloat(parts[0]);
                if (!isNaN(delayInSeconds)) {
                    delay = delayInSeconds; // 將秒轉換為毫秒
                } else {
                    console.warn(`解析延遲時間失敗: ${parts[0]} (參數: ${param})`);
                    delay = 0; // 解析失敗則延遲為 0
                }
                durationStr = parts[1]; // ## 後面的部分是持續時間參數
            } else {
                // 如果 ## 格式不符合預期，發出警告並將整個參數視為持續時間
                console.warn(`## 格式不符合預期，將整個參數視為持續時間: ${param}`);
                delay = 0;
                durationStr = param;
            }
        }

        let bpmOverride = undefined; // 記錄是否有指定的 BPM

        // 2. 解析持續時間參數 (durationStr) - 判斷順序很重要！
        if (durationStr.includes("#") && durationStr.includes(":")) {
            // 格式: BPM#拍數:音符單位 (例如 160#8:3) - 最優先檢查
            const parts = durationStr.split("#");
            if (parts.length === 2) {
                const bpmOverrideVal = parseFloat(parts[0]);
                const beatsParts = parts[1].split(":");
                if (beatsParts.length === 2) {
                    const noteDiv = parseFloat(beatsParts[0]);
                    const beatCount = parseFloat(beatsParts[1]);
                    if (!isNaN(bpmOverrideVal) && !isNaN(beatCount) && !isNaN(noteDiv) && noteDiv !== 0) {
                        bpmOverride = bpmOverrideVal;
                        delay = (60 / bpmOverride);
                        duration = (60 / bpmOverride) * (beatCount / (noteDiv / 4)); // 計算持續時間 (毫秒)
                    } else {
                        console.warn(`解析 BPM#拍數:音符單位 格式失敗: ${durationStr} (參數: ${param})`);
                    }
                } else {
                    console.warn(`#後面的拍數:音符單位格式不符預期: ${parts[1]} (參數: ${param})`);
                }
            } else {
                console.warn(`包含 # 和 : 的持續時間格式不符預期: ${durationStr} (參數: ${param})`);
            }

        } else if (durationStr.includes("#") && !durationStr.startsWith("#")) {
            // 格式: 拍數:音符單位 (例如 180#3) - 使用目前的 BPM 計算
            const parts = durationStr.split("#");
            if (parts.length === 2) {
                const bpmOverrideVal = parseFloat(parts[0]);
                const secondsStr = parseFloat(parts[1]);
                if (!isNaN(bpmOverrideVal) && !isNaN(secondsStr)) {
                    bpmOverride = bpmOverrideVal;
                    delay = (60 / bpmOverride);
                    duration = secondsStr; // 計算持續時間 (毫秒)
                } else {
                    console.warn(`解析 拍數:音符單位 格式失敗: ${durationStr} (參數: ${param})`);
                }
            } else {
                console.warn(`包含 : 的持續時間格式不符預期: ${durationStr} (參數: ${param})`);
            }
        } else if (durationStr.includes(":")) {
            // 格式: 拍數:音符單位 (例如 8:3) - 使用目前的 BPM 計算
            const parts = durationStr.split(":");
            if (parts.length === 2) {
                const noteDiv = parseFloat(parts[0]);
                const beatCount = parseFloat(parts[1]);
                if (!isNaN(noteDiv) && !isNaN(beatCount) && noteDiv !== 0) {
                    duration = (60 / currentBpm) * (beatCount / (noteDiv / 4)); // 計算持續時間 (毫秒)
                } else {
                    console.warn(`解析 拍數:音符單位 格式失敗: ${durationStr} (參數: ${param})`);
                }
            } else {
                console.warn(`包含 : 的持續時間格式不符預期: ${durationStr} (參數: ${param})`);
            }
        } else if (durationStr.startsWith("#")) {
            // 格式: #秒數 (例如 #2) - 新增的格式
            const secondsStr = durationStr.substring(1); // 移除開頭的 '#'
            const durationInSeconds = parseFloat(secondsStr);
            if (!isNaN(durationInSeconds)) {
                duration = durationInSeconds; // 將秒轉換為毫秒
            } else {
                console.warn(`解析 #秒數 格式失敗: ${durationStr} (參數: ${param})`);
            }
        } else if (!isNaN(parseFloat(durationStr)) && isFinite(durationStr)) {
            // 格式: 直接秒數 (例如 1.5) - 作為最終數字格式的檢查
            const durationInSeconds = parseFloat(durationStr);
            duration = durationInSeconds; // 將持續時間轉換為毫秒
        } else {
            // 未知的持續時間格式
            console.warn(`未知的持續時間格式: ${durationStr} (參數: ${param})`);
            duration = -1; // 確保持續時間為 NaN
        }

        const effectiveBpm = bpmOverride !== undefined ? bpmOverride : currentBpm;

        return {
            delay: delay, // 延遲時間，單位為毫秒
            duration: duration, // 持續時間，單位為毫秒
            bpm: effectiveBpm, // 計算時使用的 BPM (如果指定) 或目前的 BPM
        };
    }
    // ──────────────────────────────

    for (let i = 0; i < tempNote.length; i++) {
        try {
            let data = tempNote[i];

            // ── 處理其他 Flags ──
            const flags = {
                "b": "break",
                "x": "ex",
                "f": "hanabi",
                "$": "star",
            };

            const slideMatch = data.pos.match(/((?:pp)|(?:qq)|[-<>^vpqszVw])/g);
            if (!slideMatch) {
                for (let flag in flags) {
                    if ((data.pos ?? '').includes(flag)) {
                        //tempNote[i].pos = tempNote[i].pos.replaceAll(flag, "");
                        //tempNote[i][flags[flag]] = true;
                        data.pos = data.pos.replaceAll(flag, "");
                        data[flags[flag]] = true;
                    }
                }
            }

            const holdMatch = data.pos.match(/h\[([ -~]+?)\]/);
            const miniHold = data.pos.match(/\dh$/);
            const touchMatch = data.pos.match(/([ABCDE])(\d)|(C)/);

            if (holdMatch) {
                const result = parseParameter(holdMatch[1], data.bpm);
                tempNote[i].holdTime = result.duration;
            }

            if (miniHold) {
                tempNote[i].holdTime = 1E-64;
                tempNote[i].pos = tempNote[i].pos[0];
            }

            if (touchMatch) {
                if (touchMatch[0] == 'C') {
                    tempNote[i].pos = '1';
                    tempNote[i].touch = 'C';
                    if (tempNote[i].holdTime) {
                        tempNote[i].touchTime = tempNote[i].holdTime;
                        delete tempNote[i].holdTime;
                    }
                } else {
                    tempNote[i].pos = touchMatch[2];
                    tempNote[i].touch = touchMatch[1];
                    if (tempNote[i].holdTime) {
                        tempNote[i].touchTime = tempNote[i].holdTime;
                        delete tempNote[i].holdTime;
                    }
                }
            }

            if (holdMatch && !touchMatch) {
                tempNote[i].pos = tempNote[i].pos[0];
            }

            if (slideMatch) {
                let temp = data.pos;
                let sp = { data: [], slideInfo: [] };
                let skip = 0;
                for (let j = 0; j < slideMatch.length; j++) {
                    const e = slideMatch[j];
                    //const l = ((slideMatch[j - 1] ?? " ").length - 1) + (data.head ? 0 : 1) + skip;
                    //let a = temp.indexOf(e, l);
                    let a = temp.indexOf(e, skip);
                    sp.data.push(temp.slice(0, a));
                    temp = temp.slice(a);
                    skip = slideMatch[j].length;
                }
                sp.data.push(temp);

                for (let j = 0; j < sp.data.length; j++) {
                    if (sp.data[0] && j == 0) {
                        sp.head = sp.data[0];
                    }

                    const slideMatch = sp.data[j].match(/(?:pp)|(?:qq)|[-<>^vpqszVw]/);
                    if (slideMatch && sp.data[j]) {
                        let g = sp.data[j].split(slideMatch[0])[1];

                        if (g) {
                            sp.data[j] = [slideMatch[0], g];
                            g = g.match(/\[([ -~]+?)\]/);
                            if (g) {
                                sp.slideInfo[j] = parseParameter(g[1], data.bpm);
                                sp.data[j][1] = sp.data[j][1].slice(0, sp.data[j][1].indexOf("[")) + sp.data[j][1].slice(sp.data[j][1].indexOf("]") + 1);
                            }
                        } else {
                            console.warn("找不到時間：[]");
                        }
                    }

                    if (!sp.slideInfo[j]) {
                        sp.slideInfo[j] = {};
                    }
                }
                console.groupEnd();

                function getSlideLen(type, startNp, endNp, hw, hh, hbw) {
                    let len = render.path(
                        type,
                        startNp,
                        endNp,
                        hw, hh, hbw,
                        // 傳入一個角度旋轉函式，如果 render.path 裡面要用的話
                        ang => ({ x: Math.sin(ang), y: Math.cos(ang) * -1 })
                    ).getTotalLength();

                    return len;
                }

                for (let flag in flags) {
                    if (sp.data[0].includes(flag)) {
                        sp.data[0] = sp.data[0].replaceAll(flag, "");
                        sp.slideInfo[0][flags[flag]] = true;
                    }

                    let shouldApplyToAll = false;
                    for (let j = 1; j < sp.data.length; j++) {
                        const element = sp.data[j];
                        if (!element) continue;
                        if (element[1].includes(flag)) {
                            element[1] = element[1].replaceAll(flag, "");
                            shouldApplyToAll = true; // 發現任何一段有 flag，就標記
                        }
                    }

                    // 套用 break 給全部 slideInfo
                    if (shouldApplyToAll) {
                        for (let j = 1; j < sp.slideInfo.length; j++) {
                            if (!sp.slideInfo[j]) continue;
                            sp.slideInfo[j][flags[flag]] = true;
                        }
                    }
                }

                if (sp.data.length > 2) {
                    sp.slideInfo[sp.data.length - 1].lastOne = true;
                    sp.slideInfo[1].firstOne = true;
                }

                if (sp.head) {
                    if (sp.head.includes("?") || sp.head.includes("!")) {
                        tempNote[i].delete = true;
                    }
                    tempNote[i].pos = sp.head;
                    tempNote[i].star = true;
                }

                if (!sp.data[0]) {
                    sp.data[0] = tempNote[i].head;
                    tempNote[i].delete = true;
                }

                // --- 1. 先把每一段 slide 長度一次算好，存到 slideLens 陣列 ---
                const slideCount = sp.data.length - 1; // 因為 sp.data[0] 只是 slideHead，真正有 slide 段的是從 index=1 開始到最後
                const slideLens = new Array(slideCount + 1).fill(0);
                // slideLens[j] 代表從 sp.data[j-1]→sp.data[j] 這段的長度；index 0 不用
                let wholeLen = 0;

                for (let j = 1; j <= slideCount; j++) {
                    const prev = sp.data[j - 1];
                    let headIndex = parseInt(Array.isArray(prev)
                        ? Array.isArray(prev[1]) ? prev[1][1] : prev[1]
                        : prev).toString();
                    const startNp = parseInt(headIndex.length >= 2 ? headIndex[headIndex.length - 1] : headIndex);
                    const curr = sp.data[j];
                    const endIndex = (Array.isArray(curr[1]) ? curr[1] : curr[1]);
                    const endNp = parseInt(endIndex) - 1;

                    // 1.3. 呼叫一次 getSlideLen
                    const len = getSlideLen(
                        sp.data[j][0],   // slideType
                        startNp - 1,
                        endNp,
                        100, 100, 100     // 你的 hw, hh, hbw 實參
                    );

                    slideLens[j] = len;
                    wholeLen += len;
                }

                // --- 2. 逆向掃一遍 slideInfo，先把「下一個有 delay 的 index」存到 nextDelayIndex 陣列 ---
                const nextDelayIndex = new Array(slideCount + 2).fill(-1);
                // 我們讓 nextDelayIndex[j] = k，代表 k 是第一個 k>j 而 sp.slideInfo[k].delay 已有值
                let lastIdxWithDelay = -1;
                for (let j = slideCount; j >= 1; j--) {
                    if (sp.slideInfo[j] && sp.slideInfo[j].delay != null) {
                        lastIdxWithDelay = j;
                    }
                    nextDelayIndex[j] = lastIdxWithDelay;
                }
                // 最後 nextDelayIndex 裡就有 O(1) 拿到下一個有 delay 的 index

                // --- 3. 逐段計算每段的 delay / duration，並把重組好的物件放到 qqq ---
                const tempData = [];

                for (let j = 1; j <= slideCount; j++) {
                    // 3.1. 拷貝原本的 sp.slideInfo[j]（可能是空物件）
                    const base = sp.slideInfo[j] || {};

                    // 3.2. 如果這一段還沒計算 delay，就去拿「下一個有 delay 的 index」
                    if (base.delay == null) {
                        const k = nextDelayIndex[j]; // 下一個有 .delay 的位置
                        if (k > 0) {
                            // 3.2.1 將 sp.slideInfo[j].delay 設成 sp.slideInfo[k].delay
                            base.delay = sp.slideInfo[k].delay;

                            // 3.2.2 重新計算 sp.slideInfo[j].duration：按比例分攤
                            //       per = slideLens[j] / wholeLen
                            const per = slideLens[j] / wholeLen;
                            //       這裡 set 新的 duration = sp.slideInfo[k].duration * per
                            base.duration = sp.slideInfo[k].duration * per;

                            // 3.2.3 判斷：如果下一段 (j+1) 恰好就是 k，也就是 k = j+1，代表要同時重算 j+1 的 duration
                            if (k === j + 1) {
                                const nextBase = sp.slideInfo[j + 1];
                                nextBase.duration = sp.slideInfo[k].duration * (slideLens[j + 1] / wholeLen);
                            }
                        }
                    }

                    // 3.3. 如果 j>1，基於前一段的 delay+duration 設置本段 delay
                    if (j > 1 && sp.slideInfo[j - 1] && sp.slideInfo[j - 1].duration != null) {
                        base.delay = sp.slideInfo[j - 1].duration + sp.slideInfo[j - 1].delay;
                    }

                    // 3.4. 用解構把新的屬性打進去，做成一筆要插入 tempNote 的物件
                    const prev = sp.data[j - 1];
                    let headIndex = parseInt(Array.isArray(prev)
                        ? Array.isArray(prev[1]) ? prev[1][1] : prev[1]
                        : prev).toString();
                    headIndex = headIndex.length >= 2 ? headIndex[headIndex.length - 1] : headIndex;
                    const curr = sp.data[j];
                    const endIndex = (Array.isArray(curr[1]) ? curr[1] : curr[1]);

                    let newNote = {
                        ...base,
                        time: tempNote[i].time,
                        slide: true,
                        slideHead: headIndex,
                        slideType: curr[0],
                        slideEnd: (endIndex ?? "").toString(),
                        slideTime: base.duration,              // 計算後的這段 duration
                        chain: sp.data.length > 2,
                        chainTarget: i + 1,
                        delay: base.delay,
                        // 若原本 sp.slideInfo[j] 有其他不想保留的欄位，這裡就只挑必要的塞
                    };
                    delete newNote.duration;

                    // 把 newNote 推到 qqq 裡
                    tempData.push(newNote);

                    // 同步更新 sp.slideInfo[j] 回質算好的 base（如果需要後續再用）
                    //sp.slideInfo[j] = base;
                }

                // --- 4. 一次性把 qqq 全部插入 tempNote，就不用一筆筆 splice 了 ---
                if (tempData.length > 0) {
                    // i 是原本外面那個迴圈的索引
                    // 把「從 i+1 開始」一次插入所有 newNote
                    tempNote.splice(i + 1, 0, ...tempData);
                }

                // --- 5. 處理原本要刪除的情況，再調整外層的 i 指標 ---
                if (tempNote[i].delete) {
                    tempNote.splice(i, 1);
                    i--;
                }

                // 原本最後要 i += sp.data.length - 1，這裡改成：
                i += slideCount; // 直接跳過整組 slide 段
            }

            for (let flag in flags) {
                if ((data.pos ?? '').includes(flag)) {
                    //tempNote[i].pos = tempNote[i].pos.replaceAll(flag, "");
                    //tempNote[i][flags[flag]] = true;
                    data.pos = data.pos.replaceAll(flag, "");
                    data[flags[flag]] = true;
                }
            }

            if (isNaN(tempNote[i].pos) && tempNote[i].pos) {
                throw new Error("pos is not number");
            }
        } catch (error) {
            console.error(`at index: ${i}, data: ${JSON.stringify(tempNote[i])}`, error);
            tempNote[i].invalid = true;
            continue;
        }
    }
    tempNote.sort(function (a, b) {
        return a.time - b.time;
    });

    marks.sort(function (a, b) {
        return a.time - b.time;
    });

    tempNote.forEach((e) => {
        if (!e.invalid) {
            if (e.slideTime) {
                if (!e.chain || e.lastOne) {
                    if (e.break) breakCounts++;
                    else slideCounts++;
                }
            } else if (e.touch) {
                if (e.touchTime) holdCounts++;
                else touchCounts++;
            } else if (e.holdTime) {
                if (e.break) breakCounts++;
                else holdCounts++;
            } else {
                if (e.break) breakCounts++;
                else tapCounts++;
            }
        }
    });

    let combo = (tapCounts + holdCounts + slideCounts + touchCounts + breakCounts);
    console.log(tempNote);
    console.log(`tap: ${tapCounts}`);
    console.log(`hold: ${holdCounts}`);
    console.log(`slide: ${slideCounts}`);
    console.log(`touch: ${touchCounts}`);
    console.log(`break: ${breakCounts}`);
    console.log(`combo: ${combo}`);
    return {
        notes: tempNote, data: {
            tapCounts,
            holdCounts,
            slideCounts,
            touchCounts,
            breakCounts,
            combo,
            val: (tapCounts + holdCounts * 2 + slideCounts * 3 + touchCounts + breakCounts * 5)
        }, marks
    };
}
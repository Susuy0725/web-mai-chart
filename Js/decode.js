export function simai_decode(_data) {
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
            //let match = [data.match(/\(\d+\)|\(\d+.\d+\)/), data.match(/\{\d+\}|\{\d+.\d+\}/)];
            //console.log(match);
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

            if (data.includes("`")) {
                const split = 256;
                data = data.split("`");
                for (let j = 0; j < data.length; j++) {
                    if (data[j] === "") continue;
                    tempNote.push({ pos: data[j], time: timeSum + j / split * (60 / bpm) * 4000, bpm });
                }
            }

            // 1-2[4:1]*-3[4:1]*-4[4:1]
            if (data.includes("*")) {
                data = data.split("*");
                //1-2[4:1]
                //-3[4:1]
                //-4[4:1]
                for (let j = 0; j < data.length; j++) {
                    if (data[j] === "") continue;
                    tempNote.push({ pos: data[j], time: timeSum, bpm, head: data[0][0] });
                }
            }

            if (data.length > 1 && !isNaN(data)) {
                for (let j = 0; j < data.length; j++) {
                    tempNote.push({ pos: data[j], time: timeSum, bpm });
                }
            }
            data = dataTemp[i];
        }
        if (!(data.includes("`")) && !(data.includes("*")) && !(data.includes("/")) && data && !(data.length > 1 && !isNaN(data))) {
            tempNote.push({ pos: dataTemp[i], time: timeSum, bpm });
        }
        // 累加時間：此處公式依 slice 與 bpm 計算，4000 為單位比例，可依需求調整
        timeSum += (1 / slice) * (60 / bpm) * 4000;
    }

    // ──────────────────────────────
    // 輔助函式：解析 [參數] 部分，支援多種格式
    function parseParameter(param, currentBpm) { // 確保函式是 export 的
        let delay = 0; // 延遲時間，初始化為 0 毫秒
        let durationStr = param; // 用於解析持續時間的部分
        let duration = NaN; // 持續時間，初始化為 NaN 毫秒
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
                    const beatCount = parseFloat(beatsParts[0]);
                    const noteDiv = parseFloat(beatsParts[1]);
                    if (!isNaN(bpmOverrideVal) && !isNaN(beatCount) && !isNaN(noteDiv) && noteDiv !== 0) {
                        bpmOverride = bpmOverrideVal;
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
            duration = NaN; // 確保持續時間為 NaN
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
        let data = tempNote[i];

        // ── 處理其他 Flags ──
        const flags = {
            "b": "break",
            "x": "ex",
            "f": "hanabi",
            "$": "star",
        };

        const timeMatch = data.pos.match(/h\[([ -~]+?)\]/);
        if (timeMatch) {
            const result = parseParameter(timeMatch[1], data.bpm);
            tempNote[i].holdTime = result.duration;
        }

        const miniHold = data.pos.match(/\dh$/);
        if (miniHold) {
            tempNote[i].holdTime = 1E-64;
        }

        const touchMatch = data.pos.match(/([ABCDE])(\d)|(C)/);
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

        if (timeMatch && !touchMatch) {
            tempNote[i].pos = tempNote[i].pos[0];
        }

        const slideMatch = data.pos.match(/((?:pp)|(?:qq)|[-<>^vpqszVw])/g);
        if (slideMatch) {
            let temp = data.pos;
            let sp = { data: [], slideInfo: [] };
            for (let i = 0; i < slideMatch.length; i++) {
                const e = slideMatch[i];
                let a = temp.indexOf(e, (i != 0));
                sp.data.push(temp.slice(0, a));
                temp = temp.slice(a);
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

            for (let flag in flags) {
                if (sp.data[0].includes(flag)) {
                    sp.data[0] = sp.data[0].replaceAll(flag, "");
                    sp.slideInfo[0][flags[flag]] = true;
                }

                for (let j = 1; j < sp.data.length; j++) {
                    const element = sp.data[j];
                    if (element[1].includes(flag)) {
                        element[1] = element[1].replaceAll(flag, "");
                        sp.slideInfo[j][flags[flag]] = true;
                    }
                }
            }

            if (sp.head) {
                tempNote[i].pos = sp.head;
                tempNote[i].star = true;
            }

            if (!sp.data[0]) {
                sp.data[0] = tempNote[i].head;
                delete tempNote[i].head;
            }

            console.log(sp);
            let qqq = [];
            for (let j = 1; j < sp.data.length; j++) {
                qqq.push({
                    time: tempNote[i].time + ((j - 1) < 1 ? 0 : (sp.slideInfo[j - 1].duration) * 1000),
                    bpm: (sp.slideInfo[j] ?? '').bpm,
                    break: (sp.slideInfo[j] ?? '').break,
                    delay: (sp.slideInfo[j] ?? '').delay,
                    slide: true,
                    slideHead: (j - 1) < 1 ? sp.data[0] : sp.data[j - 1][1],
                    slideType: sp.data[j][0],
                    slideEnd: sp.data[j][1],
                    slideTime: (sp.slideInfo[j] ?? '').duration,
                    chain: (j > 1),
                    chainTarget: j > 1 ? i + 1 : null,
                });
            }

            for (let j = 0; j < qqq.length; j++) {
                const e = qqq[j];
                tempNote.splice(i + j + 1, 0, e);
            }

            i += sp.data.length - 1;
        }

        for (let flag in flags) {
            if ((data.pos ?? '').includes(flag)) {
                //tempNote[i].pos = tempNote[i].pos.replaceAll(flag, "");
                //tempNote[i][flags[flag]] = true;
                data.pos = data.pos.replaceAll(flag, "");
                data[flags[flag]] = true;
            }
        }
    }

    console.log(tempNote);
    return tempNote;
}

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
            let match = [data.match(/\(\d+\)|\(\d+.\d+\)/), data.match(/\{\d+\}|\{\d+.\d+\}/)];
            console.log(match);
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

        // ── 處理其他 Flags ──
        const flags = {
            "b": "break",
            "x": "ex",
            "f": "hanabi",
            "$": "star",
        };
        for (let flag in flags) {
            if (data.pos.includes(flag)) {
                //tempNote[i].pos = tempNote[i].pos.replaceAll(flag, "");
                //tempNote[i][flags[flag]] = true;
                data.pos = data.pos.replaceAll(flag, "");
                data[flags[flag]] = true;
            }
        }

        // ── 解析 Hold ──
        // 支援格式： xh[4:1] 與 xh[##3]
        console.log(data.pos.match(/\[[\w:#]*\]/g));
        const holdMatch1 = data.pos.match(/(\d)h\[(\d+:\d+)\]/);
        const holdMatch2 = data.pos.match(/(\d)h\[(##\d+)\]/);
        if (holdMatch1) {
            const startPos = holdMatch1[1];
            const paramStr = holdMatch1[2]; // 如 "4:1"
            const result = parseParameter(paramStr, data.bpm);
            tempNote[i].holdTime = result.time;
        } else if (holdMatch2) {
            const startPos = holdMatch2[1];
            const paramStr = holdMatch2[2]; // 如 "##3"
            const result = parseParameter(paramStr, data.bpm);
            tempNote[i].holdTime = result.time;
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

    console.log(tempNote);
    return tempNote;
}

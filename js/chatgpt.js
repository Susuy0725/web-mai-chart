/**
 * 解析 simai 譜面並標註時間（以秒為單位）
 *
 * 譜面字串由逗號分隔，其中可能包含：
 * - BPM 設定：格式 "(BPM){subdivisions}" 例：(60){4}
 * - TAP / HOLD / TOUCH 等事件，如 "1", "5h[2:1]" 等
 * - SLIDE 事件（基本處理版）：例如 "1-4[8:3]"
 * - EACH 事件：使用 "/" 分隔多個同時發生的節點
 * - 結束符號 "E"
 *
 * 若 token 為空字串（例如連續逗號），則只會推進時間但不產生事件。
 *
 * @param {string} input simai 譜面原始字串（可含空白與換行）
 * @returns {Array} 事件物件陣列，每個物件都有 time 屬性（單位：秒）
 */
function parseSimaiWithTime(input) {
    // 去除換行、空白與 tab，但保留逗號之間的空 token（代表空白時間）
    const cleanInput = input.replace(/[\r\n\t]/g, '');
    const tokens = cleanInput.split(","); // 不過濾空字串，空 token代表沒有事件但仍要進時間

    const events = [];
    let currentTime = 0;
    // 初始預設值（若譜面未先設定 BPM，則採預設 120 BPM、4 subdivisions）
    let currentBPM = 120;
    let subdivisions = 4; // 每拍切分成幾個單位

    // 依序處理每個 token
    tokens.forEach(token => {
        // 為每個 token 標註當前的絕對時間
        const eventTime = currentTime;

        // 如果 token 為空（代表該時間點沒有事件），也進行時間累加
        if (token !== '') {
            let event;

            // BPM 設定：格式 "(60){4}"
            if (token.startsWith('(')) {
                const bpmRegex = /^\(([\d.]+)\)\{([\d.]+)\}$/;
                const m = token.match(bpmRegex);
                if (m) {
                    const bpmVal = parseFloat(m[1]);
                    const subdiv = parseFloat(m[2]);
                    event = { type: 'bpm', bpm: bpmVal, subdivisions: subdiv };
                    // 更新 BPM 與 subdivisions，影響後續 token 的 dt
                    currentBPM = bpmVal;
                    subdivisions = subdiv;
                } else {
                    event = { type: 'unknown', raw: token };
                }
            }
            // 固定秒數設定：例如 {#0.35}
            else if (token.startsWith('{')) {
                const fixedMatch = token.match(/^\{#([\d.]+)\}$/);
                if (fixedMatch) {
                    const duration = parseFloat(fixedMatch[1]);
                    event = { type: 'fixedDuration', duration: duration };
                }
            }
            // 結束符號
            else if (token === 'E') {
                event = { type: 'end' };
            }
            // EACH：同一時間點有多個事件，以 "/" 分隔
            else if (token.includes('/')) {
                const subTokens = token.split('/');
                const notes = subTokens.map(st => parseSimaiTapOrHold(st));
                event = { type: 'each', notes: notes };
            }
            // SLIDE 事件：如果 token 中含有連接符號（例如 -、>、<、^ 等），簡單使用 slide 解析函式
            else if (/[-><\^vpqszVw\?!@\$`]/.test(token)) {
                event = parseSimaiSlide(token);
            }
            // 其他視為 TAP / HOLD / TOUCH 類型
            else {
                event = parseSimaiTapOrHold(token);
            }

            // 標註時間
            event.time = eventTime;
            events.push(event);
        }

        // 根據當前 BPM 與 subdivisions 計算此 token 所佔的時間（秒）
        const dt = (60 / currentBPM) / subdivisions;
        currentTime += dt;
    });

    return events;
}

/**
 * 解析 TAP 或 HOLD 等基本事件
 *
 * 範例：
 *   TAP → "1", "B1", "C"
 *   HOLD → "5h[2:1]", "4h[#5.678]"
 * 支援附加修飾符（例如 h 表示 HOLD, b 表示 BREAK, x 表示 EX 等）
 *
 * @param {string} token 單一事件記法
 * @returns {object} 解析後的事件物件
 */
function parseSimaiTapOrHold(token) {
    // 正規表達式說明：
    //   ([0-9A-Z]+) 取出節點編號，例如 "1", "B1", "C"
    //   ([$@bxh!?`]*) 取出可能的修飾符號（順序不拘）
    //   (?:\[([^]]+)\])? 取出可選的中括號內參數（例如時間長度設定）
    const regex = /^([0-9A-Z]+)([$@bxh!?`]*)(?:\[([^]]+)\])?$/;
    const match = token.match(regex);
    if (!match) {
        return { type: 'unknown', raw: token };
    }
    const note = match[1];
    const modifiers = match[2] || '';
    const duration = match[3] || null;

    // 預設類型為 TAP，若包含 "h" 則視為 HOLD
    let type = 'tap';
    if (modifiers.includes('h')) {
        type = 'hold';
    }

    return { type, note, modifiers, duration, raw: token };
}

/**
 * 解析 SLIDE 事件（簡易版）
 *
 * 範例：
 *   "1-4[8:3]" 代表從 1 連到 4，並設定移動時間參數
 *   若 token 中包含 BREAK 標記（例如 "b"），則設置 break 屬性
 *
 * @param {string} token SLIDE 事件記法
 * @returns {object} 解析後的 slide 事件物件
 */
function parseSimaiSlide(token) {
    let duration = null;
    const durationMatch = token.match(/\[([^]]+)\]/);
    if (durationMatch) {
        duration = durationMatch[1];
    }

    // 判斷是否為 BREAK SLIDE：檢查中括號後是否有 "b"
    const breakSlide = /\][b]+$/.test(token);

    // 若含有同始點分支符號 "*"，這裡只取第一分支處理
    const branch = token.split('*')[0];

    // 移除中括號內容
    const branchWithoutDuration = branch.replace(/\[[^]]+\]/, '');

    // 取出所有節點（由數字和字母構成）
    const pointRegex = /([0-9A-Z]+)/g;
    const points = [];
    let m;
    while ((m = pointRegex.exec(branchWithoutDuration)) !== null) {
        points.push(m[1]);
    }

    // 取出節點間的連接符號（例如 "-"、">" 等）
    const shapeRegex = /[^\dA-Z]+/g;
    const shapes = [];
    while ((m = shapeRegex.exec(branchWithoutDuration)) !== null) {
        shapes.push(m[0]);
    }

    return {
        type: 'slide',
        points,     // 起點與後續的經由點／終點
        shapes,     // 各段的連接符號
        duration,   // 時間參數字串（例如 "8:3"）
        break: breakSlide,
        raw: token
    };
}

//----------------------------------------
// 測試用範例
//----------------------------------------

const simaiChart = `(60){4}1,2,3,4,5,6,7,8,`;
// 依據 (60){4}，dt = (60/60)/4 = 0.25 秒
// 預期 BPM 設定事件在 time 0，其後各 TAP 事件分別在 0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75 秒

const result = parseSimaiWithTime(simaiChart);
console.log(JSON.stringify(result, null, 2));

/*
 預期輸出：
 [
   {
     "type": "bpm",
     "bpm": 60,
     "subdivisions": 4,
     "time": 0
   },
   {
     "type": "tap",
     "note": "1",
     "modifiers": "",
     "duration": null,
     "raw": "1",
     "time": 0.25
   },
   {
     "type": "tap",
     "note": "2",
     "modifiers": "",
     "duration": null,
     "raw": "2",
     "time": 0.5
   },
   {
     "type": "tap",
     "note": "3",
     "modifiers": "",
     "duration": null,
     "raw": "3",
     "time": 0.75
   },
   {
     "type": "tap",
     "note": "4",
     "modifiers": "",
     "duration": null,
     "raw": "4",
     "time": 1.0
   },
   {
     "type": "tap",
     "note": "5",
     "modifiers": "",
     "duration": null,
     "raw": "5",
     "time": 1.25
   },
   {
     "type": "tap",
     "note": "6",
     "modifiers": "",
     "duration": null,
     "raw": "6",
     "time": 1.5
   },
   {
     "type": "tap",
     "note": "7",
     "modifiers": "",
     "duration": null,
     "raw": "7",
     "time": 1.75
   },
   {
     "type": "tap",
     "note": "8",
     "modifiers": "",
     "duration": null,
     "raw": "8",
     "time": 2.0
   }
 ]
*/

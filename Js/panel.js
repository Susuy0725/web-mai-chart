import * as flipfunc from "./flipFunction.js";

const quickPanel = document.getElementById("quick-panel");
const selectUp = document.getElementById("select-up");
const selectLeft = document.getElementById("select-left");
const selectRight = document.getElementById("select-right");
const selectDown = document.getElementById("select-down");

let ctrlDown = false;
let startPos = { x: 0, y: 0 };
let mousePos = { x: 0, y: 0 };
let mousedir = "none";

/* ---------- 表驅動 ---------- */

const dirs = [
    { name: "right", check: a => a >= -45 && a < 45, el: selectRight },
    { name: "down", check: a => a >= 45 && a < 135, el: selectDown },
    { name: "left", check: a => a >= 135 || a < -135, el: selectLeft },
    { name: "up", check: a => a >= -135 && a < -45, el: selectUp },
];

function setActive(dirName) {
    [selectRight, selectLeft, selectUp, selectDown]
        .forEach(el => el.style.background = "#ffffff00");

    const dir = dirs.find(d => d.name === dirName);
    if (dir) dir.el.style.background = "#cacaca80";
}

const actions = {
    up: flipfunc.verticalFlip,
    down: flipfunc.anticlockwiseFlip,
    left: flipfunc.horizontalFlip,
    right: flipfunc.clockwiseFlip,
};

/* ---------- editor selection ---------- */

function getEditorSelection() {
    const editor = document.getElementById("editor");
    if (!editor) return null;

    const start = editor.selectionStart ?? 0;
    const end = editor.selectionEnd ?? 0;
    const selected = editor.value.substring(start, end);

    return { editor, selected, start, end };
}

/* ---------- keyboard ---------- */

window.addEventListener("keydown", (e) => {
    if (!(e.ctrlKey && e.shiftKey)) return;

    mousedir = "none";
    if (ctrlDown) return;
    ctrlDown = true;

    startPos = { x: mousePos.x, y: mousePos.y };

    quickPanel.style.display = "block";
    quickPanel.style.left = startPos.x + "px";
    quickPanel.style.top = startPos.y + "px";
    quickPanel.style.transform = `translate(-50%, -50%) rotate(0deg)`;
});

window.addEventListener("keyup", (e) => {
    if (!(e.key === "Control" || e.key === "Shift")) return;
    if (e.ctrlKey && e.shiftKey) return;

    ctrlDown = false;
    quickPanel.style.display = "none";

    const dx = mousePos.x - startPos.x;
    const dy = mousePos.y - startPos.y;
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    const length = Math.hypot(dx, dy);

    if (length >= 50) {
        const dir = dirs.find(d => d.check(angle));
        mousedir = dir?.name ?? "none";
    }

    const sel = getEditorSelection();
    if (!sel || !sel.selected) return;

    actions[mousedir]?.(sel.editor, sel.selected, sel.start, sel.end);
    setActive(null);
});

/* ---------- mouse ---------- */

window.addEventListener("mousemove", (e) => {
    mousePos = { x: e.clientX, y: e.clientY };
    if (!ctrlDown) return;

    const dx = mousePos.x - startPos.x;
    const dy = mousePos.y - startPos.y;

    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    const length = Math.hypot(dx, dy);

    if (length < 50) {
        mousedir = "none";
        setActive(null);
        return;
    }

    const dir = dirs.find(d => d.check(angle));
    mousedir = dir?.name ?? "none";
    setActive(mousedir);
});

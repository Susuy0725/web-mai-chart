import { simai_decode } from "./decode.js";

document.addEventListener("DOMContentLoaded", function () {
    const canvas = document.getElementById("render");
    const ctx = canvas.getContext("2d");

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
     
    function gameLoop() {
        render(ctx);
        requestAnimationFrame(gameLoop);
    }

    gameLoop();
});

function render(ctx) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}


const canvas = document.getElementById("drawing");
const ctx = canvas.getContext("2d");
const message = document.getElementById("message");

let tool = "pencil";
let color = "#333333";
let drawing = false;
let history = [];

const colors = [
    "#333333", "#808080", "#932d38", "#e35d65",
    "#f2a45e", "#e8d75b", "#82ad76", "#6097bb",
    "#7774ba", "#b47eaf", "#fffefd", "#c6c6c6",
    "#dda5ae", "#fac0ca", "#ffcfab", "#fffab3",
    "#c5dfa0", "#afdbe5", "#c8bfea", "#ecc2df"
];

colors.forEach(c => {
    const button = document.createElement("button");
    button.style.background = c;
    button.title = c;
    button.setAttribute("aria-label", "Color " + c);

    button.onclick = () => {
        color = c;
        message.style.color = c;

        document.querySelectorAll("#colors button")
            .forEach(b => b.classList.remove("selected"));

        button.classList.add("selected");
    };

    document.getElementById("colors").appendChild(button);
});

document.querySelectorAll("[data-tool]").forEach(button => {
    button.onclick = () => {
        tool = button.dataset.tool;

        document.querySelectorAll("[data-tool]")
            .forEach(b => b.classList.remove("selected"));

        button.classList.add("selected");

        if (tool === "text") {
            message.style.pointerEvents = "auto";
            message.focus();
        } else {
            message.style.pointerEvents = "none";
            message.blur();
        }
    };
});

function saveDrawing() {
    history.push(ctx.getImageData(
        0, 0, canvas.width, canvas.height
    ));

    if (history.length > 20) {
        history.shift();
    }
}

function position(event) {
    const rect = canvas.getBoundingClientRect();

    return {
        x: (event.clientX - rect.left)
            * canvas.width / rect.width,
        y: (event.clientY - rect.top)
            * canvas.height / rect.height
    };
}

canvas.addEventListener("pointerdown", event => {
    if (tool === "text") return;

    saveDrawing();

    const p = position(event);

    if (["heart", "star", "circle", "square"].includes(tool)) {
        const shapes = {
            heart: "♡",
            star: "☆",
            circle: "○",
            square: "□"
        };

        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = color;
        ctx.font = "65px sans-serif";
        ctx.fillText(shapes[tool], p.x - 25, p.y + 25);
        return;
    }

    canvas.setPointerCapture(event.pointerId);
    drawing = true;

    ctx.globalCompositeOperation =
        tool === "eraser" ? "destination-out" : "source-over";

    ctx.strokeStyle = color;
    ctx.lineWidth = tool === "eraser" ? 28 : 5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + .1, p.y);
    ctx.stroke();
});

canvas.addEventListener("pointermove", event => {
    if (!drawing) return;

    const p = position(event);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
});

function stopDrawing() {
    drawing = false;
    ctx.beginPath();
}

canvas.addEventListener("pointerup", stopDrawing);
canvas.addEventListener("pointercancel", stopDrawing);
canvas.addEventListener("lostpointercapture", stopDrawing);

document.getElementById("undo").onclick = () => {
    if (history.length) {
        ctx.putImageData(history.pop(), 0, 0);
    }
};

document.getElementById("clear").onclick = () => {
    saveDrawing();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    message.value = "";
};

document.querySelector('[data-tool="pencil"]')
    .classList.add("selected");

document.getElementById("status").textContent =
    "Draw or write a little note! Email delivery coming soon.";

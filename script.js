
const canvas = document.getElementById("drawing");
const ctx = canvas.getContext("2d");
const message = document.getElementById("message");
const send = document.getElementById("send");
const status = document.getElementById("status");

let tool = "text";
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

function selectTool(name) {
    tool = name;
    message.style.pointerEvents =
        name === "text" ? "auto" : "none";

    document.querySelectorAll("[data-tool]")
        .forEach(button => {
            button.classList.toggle(
                "selected",
                button.dataset.tool === name
            );
        });

    if (name !== "text") {
        message.blur();
    }
}

colors.forEach(c => {
    const button = document.createElement("button");

    button.style.backgroundColor = c;
    button.title = c;
    button.setAttribute("aria-label", "Color " + c);

    button.onclick = () => {
        color = c;

        if (tool === "text") {
            message.style.color = c;
        }

        document.querySelectorAll("#colors button")
            .forEach(b => b.classList.remove("selected"));

        button.classList.add("selected");
    };

    document.getElementById("colors").appendChild(button);
});

document.querySelectorAll("[data-tool]").forEach(button => {
    button.onclick = () => {
        selectTool(button.dataset.tool);

        if (tool === "text") {
            message.focus();
        }
    };
});

function saveDrawing() {
    history.push(
        ctx.getImageData(0, 0, canvas.width, canvas.height)
    );

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

    const shapes = {
        heart: "♡",
        star: "☆",
        circle: "○",
        square: "□"
    };

    if (shapes[tool]) {
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = color;
        ctx.font = "65px sans-serif";
        ctx.fillText(shapes[tool], p.x - 25, p.y + 25);
        return;
    }

    canvas.setPointerCapture(event.pointerId);
    drawing = true;

    ctx.globalCompositeOperation =
        tool === "eraser"
        ? "destination-out"
        : "source-over";

    ctx.strokeStyle = color;
    ctx.lineWidth = tool === "eraser" ? 28 : 5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + 0.1, p.y);
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

selectTool("text");

status.textContent = "Draw or write a little note! ♡";

send.disabled = true;

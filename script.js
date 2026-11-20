
const canvas = document.getElementById("drawing");
const ctx = canvas.getContext("2d");

const message = document.getElementById("message");
const send = document.getElementById("send");
const status = document.getElementById("status");

let tool = "text";
let color = "#333333";
let drawing = false;
let history = [];
let savedRange = null;



document.addEventListener("selectionchange", () => {
    const selection = window.getSelection();

    if (
        selection.rangeCount &&
        message.contains(selection.anchorNode) &&
        message.contains(selection.focusNode)
    ) {
        savedRange = selection.getRangeAt(0).cloneRange();
    }
});

function restoreCursor() {
    message.focus();

    const selection = window.getSelection();
    selection.removeAllRanges();

    if (
        savedRange &&
        message.contains(savedRange.commonAncestorContainer)
    ) {
        selection.addRange(savedRange);
    } else {
        const range = document.createRange();
        range.selectNodeContents(message);
        range.collapse(false);
        selection.addRange(range);
    }
}



function selectTool(name) {
    tool = name;

    message.contentEditable =
        name === "text" ? "true" : "false";

    message.style.pointerEvents =
        name === "text" ? "auto" : "none";

    canvas.style.cursor =
        name === "eraser" ? "cell" : "crosshair";

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

document.querySelectorAll("[data-tool]")
    .forEach(button => {

        button.addEventListener("mousedown", event => {
            event.preventDefault();
        });

        button.onclick = () => {
            selectTool(button.dataset.tool);

            if (tool === "text") {
                restoreCursor();

                document.execCommand(
                    "foreColor", false, color
                );
            }
        };
    });


/* Color palette */

const colors = [
    "#333333",
    "#808080",
    "#932d38",
    "#e35d65",
    "#f2a45e",
    "#e8d75b",
    "#82ad76",
    "#6097bb",
    "#7774ba",
    "#b47eaf",
    "#ffffff",
    "#c6c6c6",
    "#dda5ae",
    "#fac0ca",
    "#ffcfab",
    "#fffab3",
    "#c5dfa0",
    "#afdbe5",
    "#c8bfea",
    "#ecc2df"
];

colors.forEach((c, index) => {

    const button = document.createElement("button");

    button.type = "button";
    button.style.backgroundColor = c;
    button.title = c;
    button.setAttribute("aria-label", "Color " + c);

    if (index === 0) {
        button.classList.add("selected");
    }

    button.addEventListener("mousedown", event => {
        event.preventDefault();
    });

    button.onclick = () => {

        color = c;

        document.querySelectorAll("#colors button")
            .forEach(b => b.classList.remove("selected"));

        button.classList.add("selected");

        if (tool === "text") {

            restoreCursor();

            document.execCommand(
                "foreColor",
                false,
                color
            );

            const selection = window.getSelection();

            if (selection.rangeCount) {
                savedRange =
                    selection.getRangeAt(0).cloneRange();
            }
        }
    };

    document.getElementById("colors")
        .appendChild(button);
});


/* Paste plain text only */

message.addEventListener("paste", event => {
    event.preventDefault();

    const text = event.clipboardData.getData("text/plain");

    document.execCommand("insertText", false, text);
});


/* Drawing history */

function saveDrawing() {

    history.push(
        ctx.getImageData(
            0, 0, canvas.width, canvas.height
        )
    );

    if (history.length > 20) {
        history.shift();
    }
}


/* Get drawing position */

function position(event) {

    const rect = canvas.getBoundingClientRect();

    return {
        x: (event.clientX - rect.left)
            * canvas.width / rect.width,

        y: (event.clientY - rect.top)
            * canvas.height / rect.height
    };
}


/* Pencil, eraser and shapes */

canvas.addEventListener("pointerdown", event => {

    if (tool === "text") return;

    event.preventDefault();
    saveDrawing();

    const p = position(event);

    
const shapes = {
    heart: "♡",
    star: "☆",
    circle: "○",
    rectangle: "▭",
    arrow: "➝"
};


    if (shapes[tool]) {

        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = color;
        ctx.font = "65px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.fillText(shapes[tool], p.x, p.y);

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


/* Undo */

document.getElementById("undo").onclick = () => {

    if (tool === "text") {

        restoreCursor();
        document.execCommand("undo");

    } else if (history.length) {

        ctx.putImageData(history.pop(), 0, 0);

    }
};


/* Clear */

document.getElementById("clear").onclick = () => {

    saveDrawing();

    ctx.clearRect(
        0, 0, canvas.width, canvas.height
    );

    message.innerHTML = "";
    savedRange = null;

    selectTool("text");

};


/* Starting settings */

selectTool("text");

send.disabled = true;

status.textContent =
    "Draw or write a little note! Email delivery coming soon.";

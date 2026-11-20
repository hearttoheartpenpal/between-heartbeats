
const canvas = document.getElementById("drawing");
const ctx = canvas.getContext("2d");

const message = document.getElementById("message");
const send = document.getElementById("send");
const status = document.getElementById("status");

const senderName = document.getElementById("sender-name");
const senderEmail = document.getElementById("sender-email");

const formEndpoint =
    "https://formspree.io/f/mwloqdnb";

const defaultStatus = "Leave a doodle! ♡";

let tool = "text";
let color = "#333333";
let drawing = false;
let history = [];
let savedRange = null;


/* Remember text cursor */

document.addEventListener("selectionchange", () => {

    const selection = window.getSelection();

    if (
        selection.rangeCount &&
        message.contains(selection.anchorNode) &&
        message.contains(selection.focusNode)
    ) {

        savedRange =
            selection.getRangeAt(0).cloneRange();

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


/* Select Paint tool */

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


/* Original 20-color palette */

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
            .forEach(b => {
                b.classList.remove("selected");
            });

        button.classList.add("selected");

        if (tool === "text") {

            restoreCursor();

            document.execCommand(
                "foreColor", false, color
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

    const text =
        event.clipboardData.getData("text/plain");

    document.execCommand(
        "insertText", false, text
    );

});


/* Restore placeholder */

message.addEventListener("input", () => {

    if (!message.innerText.trim()) {

        message.innerHTML = "";
        savedRange = null;

    }

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


/* Drawing position */

function position(event) {

    const rect = canvas.getBoundingClientRect();

    return {

        x: (event.clientX - rect.left)
            * canvas.width / rect.width,

        y: (event.clientY - rect.top)
            * canvas.height / rect.height

    };

}


/* Shape tools */

const shapes = {

    heart: "♡",
    star: "☆",
    circle: "○",
    square: "□",
    rectangle: "▭",
    arrow: "➝"

};


/* Pencil, eraser and shapes */

canvas.addEventListener("pointerdown", event => {

    if (tool === "text") return;

    event.preventDefault();

    saveDrawing();

    const p = position(event);

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

    ctx.lineWidth =
        tool === "eraser" ? 28 : 5;

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

canvas.addEventListener(
    "lostpointercapture", stopDrawing
);


/* Undo */

document.getElementById("undo").onclick = () => {

    if (tool === "text") {

        restoreCursor();

        document.execCommand("undo");

    } else if (history.length) {

        ctx.putImageData(
            history.pop(), 0, 0
        );

    }

};


/* Clear Paint window */

document.getElementById("clear").onclick = () => {

    saveDrawing();

    ctx.clearRect(
        0, 0, canvas.width, canvas.height
    );

    message.innerHTML = "";

    savedRange = null;

    selectTool("text");

    status.textContent = defaultStatus;

};


/* Starting settings */

selectTool("text");

message.innerHTML = "";

send.disabled = false;

status.textContent = defaultStatus;


/* Send message through Formspree */

send.onclick = async () => {

    if (send.disabled) return;


    /* Read the message and sender details */

    const note = message.innerText.trim();

    const name = senderName.value.trim();

    const email = senderEmail.value.trim();


    /* Validate message */

    if (!note) {

        status.textContent =
            "Write a little message first! ♡";

        return;

    }


    /* Validate optional email */

    if (email && !senderEmail.checkValidity()) {

        status.textContent =
            "Double-check your email! ♡";

        senderEmail.reportValidity();

        return;

    }


    /* Detect unsent drawings */

    const pixels = ctx.getImageData(
        0, 0, canvas.width, canvas.height
    ).data;

    let hasDrawing = false;

    for (let i = 3; i < pixels.length; i += 4) {

        if (pixels[i] !== 0) {

            hasDrawing = true;
            break;

        }

    }

    if (hasDrawing) {

        const proceed = window.confirm(
            "I haven't figured out how to send " +
            "drawings yet! Only your written note " +
            "will be sent. Send anyway?"
        );

        if (!proceed) return;

    }


    /* Sending */

    send.disabled = true;

    send.textContent = "Sending...";

    status.textContent =
        "Sending your little note...";


    try {

        /* Prepare sender information */

        const formData = new FormData();

        formData.append(
            "name",
            name || "Anonymous"
        );

        if (email) {

            formData.append("email", email);

        }


        /* Include details directly in message */

        const fullMessage =
            "From: " + (name || "Anonymous") + "\n" +
            "Email: " + (email || "Not provided") + "\n\n" +
            "Message:\n" + note;

        formData.append(
            "message",
            fullMessage
        );

        formData.append(
            "_subject",
            "A little note from Between Heartbeats!"
        );


        /* Deliver to Formspree */

        const response = await fetch(

            formEndpoint,

            {

                method: "POST",

                body: formData,

                headers: {

                    "Accept": "application/json"

                }

            }

        );


        /* Check response */

        if (!response.ok) {

            const errorData =
                await response.json().catch(() => ({}));

            console.error(
                "Formspree error:",
                response.status,
                errorData
            );

            throw new Error("Submission failed");

        }


        /* Reset after successful submission */

        message.innerHTML = "";

        senderName.value = "";

        senderEmail.value = "";

        ctx.clearRect(
            0, 0, canvas.width, canvas.height
        );

        history = [];

        savedRange = null;

        selectTool("text");


        /* Success notification */

        status.textContent =
            "Your little note made it! ♡";


    } catch (error) {

        console.error(error);

        status.textContent =
            "Oh no! Give it another try ♡";


    } finally {

        send.disabled = false;

        send.textContent = "Send ♡";

    }

};

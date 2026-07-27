let ws = null;
let myId = "";

window.onload = function() {
    const enterBtn = document.getElementById("enterChatBtn");
    if (enterBtn) {
        enterBtn.addEventListener("click", startChat);
    }
    
    const sendBtn = document.getElementById("sendBtn");
    if (sendBtn) {
        sendBtn.addEventListener("click", sendMessage);
    }

    const messageInput = document.getElementById("messageInput");
    if (messageInput) {
        messageInput.addEventListener("keypress", function(event) {
            if (event.key === "Enter") {
                sendMessage();
            }
        });
    }
    
    const idInput = document.getElementById("myIdInput");
    if (idInput) {
        idInput.addEventListener("keypress", function(event) {
            if (event.key === "Enter") {
                startChat();
            }
        });
    }
};

function startChat() {
    const inputField = document.getElementById("myIdInput");
    const inputVal = inputField ? inputField.value.trim() : "";
    
    if (inputVal === "") {
        alert("Musisz wpisać swój numer telefonu lub ID!");
        return;
    }
    
    myId = inputVal;
    
    document.getElementById("setup-screen").style.display = "none";
    document.getElementById("chat-screen").style.display = "flex";
    document.getElementById("currentIdDisplay").textContent = myId;

    connectWebSocket();
}

function connectWebSocket() {
    ws = new WebSocket('wss://socketsbay.com/wss/v2/1/demo/');

    ws.onopen = () => {
        appendSystemMessage("Połączono z siecią! (Szyfrowanie aktywne)");
    };

    ws.onmessage = (event) => {
        if (!event.data) return;
        
        let decryptedData = decrypt(event.data);
        let parts = decryptedData.split("|");
        
        if (parts.length >= 2) {
            let sender = parts[0];
            let text = parts.slice(1).join("|");

            if (sender !== myId) {
                appendMessage(text, sender, false);
            }
        }
    };

    ws.onclose = () => {
        appendSystemMessage("Utracono połączenie z serwerem.");
    };
}

function encrypt(text) {
    let result = [];
    for (let i = 0; i < text.length; i++) {
        result.push(text.charCodeAt(i));
    }
    return result.join(',');
}

function decrypt(encryptedText) {
    try {
        let codes = encryptedText.split(',');
        let result = '';
        for (let i = 0; i < codes.length; i++) {
            result += String.fromCharCode(parseInt(codes[i]));
        }
        return result;
    } catch (e) {
        return "";
    }
}

function sendMessage() {
    const textInput = document.getElementById("messageInput");
    const text = textInput.value.trim();
    
    if (text === "" || !ws || ws.readyState !== WebSocket.OPEN) return;

    let packageData = myId + "|" + text;
    let encryptedPackage = encrypt(packageData);
    
    ws.send(encryptedPackage);
    appendMessage(text, "Ty", true);
    textInput.value = "";
}

function appendMessage(text, senderName, isMine) {
    const chatBox = document.getElementById("chat-box");
    const div = document.createElement("div");
    div.className = "msg " + (isMine ? "my-msg" : "");

    if (!isMine) {
        const senderTag = document.createElement("span");
        senderTag.className = "sender-tag";
        senderTag.textContent = senderName;
        div.appendChild(senderTag);
    }

    const textSpan = document.createElement("span");
    textSpan.textContent = text;
    div.appendChild(textSpan);

    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function appendSystemMessage(text) {
    const chatBox = document.getElementById("chat-box");
    const div = document.createElement("div");
    div.className = "msg system-msg";
    div.textContent = text;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}
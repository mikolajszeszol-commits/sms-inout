let ws = null;
let myPhone = localStorage.getItem("chat_myPhone") || "";
let targetPhone = localStorage.getItem("chat_targetPhone") || "";

window.onload = function() {
    if (myPhone) {
        showMainScreen();
    }

    document.getElementById("authBtn").addEventListener("click", handleAuth);
    document.getElementById("logoutBtn").addEventListener("click", handleLogout);
    document.getElementById("saveContactBtn").addEventListener("click", handleSaveContact);
    document.getElementById("sendBtn").addEventListener("click", sendMessage);

    document.getElementById("messageInput").addEventListener("keypress", function(e) {
        if (e.key === "Enter") sendMessage();
    });
};

function handleAuth() {
    const phone = document.getElementById("authPhone").value.trim();
    const pass = document.getElementById("authPassword").value.trim();

    if (!phone || !pass) {
        alert("Podaj numer telefonu i hasło!");
        return;
    }

    myPhone = phone;
    localStorage.setItem("chat_myPhone", myPhone);
    showMainScreen();
}

function handleLogout() {
    localStorage.removeItem("chat_myPhone");
    localStorage.removeItem("chat_targetPhone");
    if (ws) ws.close();
    location.reload();
}

function handleSaveContact() {
    const target = document.getElementById("targetPhoneInput").value.trim();
    if (!target) {
        alert("Wpisz numer docelowy!");
        return;
    }
    targetPhone = target;
    localStorage.setItem("chat_targetPhone", targetPhone);
    document.getElementById("targetLabel").textContent = targetPhone;
    alert("Zapisano kontakt: " + targetPhone);
}

function showMainScreen() {
    document.getElementById("auth-screen").style.display = "none";
    document.getElementById("main-screen").style.display = "flex";
    document.getElementById("myPhoneLabel").textContent = myPhone;

    if (targetPhone) {
        document.getElementById("targetPhoneInput").value = targetPhone;
        document.getElementById("targetLabel").textContent = targetPhone;
    }

    connectWebSocket();
}

function connectWebSocket() {
    // Używamy profesjonalnego węzła WebSocket działającego na standardowym porcie 443 (nigdy nieblokowanym)
    appendSystemMessage("Łączenie z serwerem...");

    ws = new WebSocket('wss://free.blr2.piesocket.com/v3/1?api_id=oGRVUnMIjvWqKlg6D0Z8zG4A9C1V9c8H&release=latest');

    ws.onopen = () => {
        appendSystemMessage("Połączono pomyślnie!");
    };

    ws.onmessage = (event) => {
        try {
            let decrypted = decrypt(event.data);
            let parts = decrypted.split("|");
            let recipient = parts[0];
            let sender = parts[1];
            let text = parts.slice(2).join("|");

            // Odbieramy tylko wiadomości skierowane do nas od wybranego kontaktu
            if (recipient === myPhone && sender === targetPhone) {
                appendMessage(text, false);
            }
        } catch (e) {
            console.error("Błąd dekodowania");
        }
    };

    ws.onclose = () => {
        appendSystemMessage("Utracono połączenie. Ponawiam...");
        setTimeout(connectWebSocket, 2000);
    };

    ws.onerror = () => {
        appendSystemMessage("Błąd sieci.");
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
    const input = document.getElementById("messageInput");
    const text = input.value.trim();

    if (!text) return;
    if (!targetPhone) {
        alert("Najpierw wpisz i zapisz numer osoby, do której chcesz pisać!");
        return;
    }
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        alert("Brak połączenia z siecią. Poczekaj chwilę...");
        return;
    }

    // Pakiet: Odbiorca | Nadawca | Treść
    let packageData = targetPhone + "|" + myPhone + "|" + text;
    let encrypted = encrypt(packageData);

    ws.send(encrypted);
    appendMessage(text, true);
    input.value = "";
}

function appendMessage(text, isMine) {
    const chatBox = document.getElementById("chat-box");
    const div = document.createElement("div");
    div.className = "msg " + (isMine ? "my-msg" : "");
    div.textContent = text;
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

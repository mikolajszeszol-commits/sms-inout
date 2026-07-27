let ws = null;
let myPhone = "";
let myPassword = "";
let targetPhone = "";
let generatedCode = "";

window.onload = function() {
    document.getElementById("registerBtn").addEventListener("click", handleRegister);
    document.getElementById("verifyBtn").addEventListener("click", handleVerify);
    document.getElementById("startChatBtn").addEventListener("click", handleStartChat);
    document.getElementById("sendBtn").addEventListener("click", sendMessage);

    document.getElementById("messageInput").addEventListener("keypress", function(e) {
        if (e.key === "Enter") sendMessage();
    });
};

// KROK 1: Rejestracja numeru i hasła
function handleRegister() {
    const phone = document.getElementById("regPhone").value.trim();
    const pass = document.getElementById("regPassword").value.trim();

    if (!phone || !pass) {
        alert("Wypełnij numer telefonu i hasło!");
        return;
    }

    myPhone = phone;
    myPassword = pass;

    // Generujemy losowy 2-cyfrowy kod "SMS" (np. od 10 do 99)
    generatedCode = Math.floor(10 + Math.random() * 90).toString();
    
    // Pokazujemy ten kod na ekranie jako symulację nadejścia SMS-a
    document.getElementById("codeDisplayBox").textContent = "[SYMULACJA SMS] Twój kod to: " + generatedCode;

    // Przechodzimy do ekranu weryfikacji
    document.getElementById("register-screen").style.display = "none";
    document.getElementById("verify-screen").style.display = "flex";
}

// KROK 2: Weryfikacja 2-cyfrowego kodu
function handleVerify() {
    const enteredCode = document.getElementById("verifyInput").value.trim();

    if (enteredCode !== generatedCode) {
        alert("Błędny kod weryfikacyjny!");
        return;
    }

    // Sukces weryfikacji – przechodzimy do wyboru rozmówcy
    document.getElementById("verify-screen").style.display = "none";
    document.getElementById("contact-screen").style.display = "flex";
    document.getElementById("myPhoneDisplay").textContent = myPhone;

    // Łączymy się z siecią WebSocket
    connectWebSocket();
}

// KROK 3: Wybór numeru osoby, do której chcemy pisać
function handleStartChat() {
    const target = document.getElementById("targetPhoneInput").value.trim();

    if (!target) {
        alert("Wpisz numer telefonu osoby, do której chcesz napisać!");
        return;
    }

    if (target === myPhone) {
        alert("Nie możesz pisać sam do siebie!");
        return;
    }

    targetPhone = target;

    // Przechodzimy do okna czatu
    document.getElementById("contact-screen").style.display = "none";
    document.getElementById("chat-screen").style.display = "flex";
    document.getElementById("targetDisplay").textContent = targetPhone;
}

// Połączenie sieciowe
function connectWebSocket() {
    ws = new WebSocket('wss://socketsbay.com/wss/v2/1/demo/');

    ws.onopen = () => {
        appendSystemMessage("Połączono z siecią komunikatora.");
    };

    ws.onmessage = (event) => {
        if (!event.data) return;

        let decrypted = decrypt(event.data);
        // Oczekiwany format: "OD_KOGO|DO_KOGO|TREŚĆ"
        let parts = decrypted.split("|");

        if (parts.length >= 3) {
            let sender = parts[0];
            let recipient = parts[1];
            let text = parts.slice(2).join("|");

            // Wiadomość jest dla nas I pochodzi od wybranego przez nas rozmówcy
            if (recipient === myPhone && sender === targetPhone) {
                appendMessage(text, false);
            }
        }
    };

    ws.onclose = () => {
        appendSystemMessage("Utracono połączenie z siecią.");
    };
}

// Szyfrowanie tekstowe na liczby
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

// KROK 4: Wysyłanie wiadomości do wybranego numeru
function sendMessage() {
    const input = document.getElementById("messageInput");
    const text = input.value.trim();

    if (!text || !ws || ws.readyState !== WebSocket.OPEN) return;

    // Tworzymy paczkę: Nadawca | Odbiorca | Treść
    let packageData = myPhone + "|" + targetPhone + "|" + text;
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
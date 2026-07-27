let client = null;
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
    if (client) client.end();
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

    connectBroker();
}

function connectBroker() {
    // Używamy stabilnego, publicznego brokera MQTT przez WebSocket (HiveMQ)
    const brokerUrl = 'wss://broker.hivemq.com:8884/mqtt';
    
    appendSystemMessage("Łączenie z siecią...");

    client = mqtt.connect(brokerUrl);

    client.on('connect', function () {
        appendSystemMessage("Połączono pomyślnie z siecią!");
        
        // Nasz unikalny kanał odbiorczy oparty o nasz numer telefonu
        let myChannel = "chat/user/" + myPhone;
        client.subscribe(myChannel, function (err) {
            if (!err) {
                appendSystemMessage("Nasłuch wiadomości aktywny.");
            }
        });
    });

    client.on('message', function (topic, message) {
        try {
            let decrypted = decrypt(message.toString());
            let parts = decrypted.split("|");
            let sender = parts[0];
            let text = parts.slice(1).join("|");

            // Jeśli wiadomość pochodzi od osoby, z którą obecnie rozmawiamy
            if (sender === targetPhone) {
                appendMessage(text, false);
            }
        } catch (e) {
            console.error("Błąd przetwarzania wiadomości");
        }
    });

    client.on('error', function (err) {
        appendSystemMessage("Błąd połączenia sieciowego.");
        console.error(err);
    });
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
    if (!client || !client.connected) {
        alert("Brak połączenia z siecią. Poczekaj chwilę...");
        return;
    }

    // Pakiet: MójNumer | Treść
    let packageData = myPhone + "|" + text;
    let encrypted = encrypt(packageData);

    // Wysyłamy wiadomość dokładnie na kanał docelowego użytkownika
    let targetChannel = "chat/user/" + targetPhone;
    client.publish(targetChannel, encrypted);

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
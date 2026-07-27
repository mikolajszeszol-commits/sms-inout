// Konfiguracja Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBrrYxm7r2b1GCY3GbVuHUSZ7jt6vTr2YA",
    authDomain: "moj-komunikator-47f85.firebaseapp.com",
    projectId: "moj-komunikator-47f85",
    storageBucket: "moj-komunikator-47f85.firebasestorage.app",
    messagingSenderId: "193983565879",
    appId: "1:193983565879:web:38293cd3d0bfffe369afb2",
    measurementId: "G-0KK6YR068E"
};

// Inicjalizacja Firebase (starsza, stabilna metoda globalna)
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let myPhone = localStorage.getItem("chat_myPhone") || "";
let targetPhone = localStorage.getItem("chat_targetPhone") || "";
let unsubscribe = null;

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
    if (unsubscribe) unsubscribe();
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
    
    startListening();
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

    appendSystemMessage("Połączono z bazą Firebase!");
    startListening();
}

function startListening() {
    if (unsubscribe) unsubscribe();
    if (!targetPhone) return;

    unsubscribe = db.collection("messages").orderBy("timestamp", "asc").onSnapshot((snapshot) => {
        const chatBox = document.getElementById("chat-box");
        chatBox.innerHTML = "";
        appendSystemMessage("Połączono z bazą Firebase!");

        snapshot.forEach((doc) => {
            let data = doc.data();
            let isRelevant = (data.sender === myPhone && data.recipient === targetPhone) ||
                             (data.sender === targetPhone && data.recipient === myPhone);

            if (isRelevant) {
                let isMine = (data.sender === myPhone);
                appendMessage(data.text, isMine);
            }
        });
    });
}

async function sendMessage() {
    const input = document.getElementById("messageInput");
    const text = input.value.trim();

    if (!text) return;
    if (!targetPhone) {
        alert("Najpierw wpisz i zapisz numer osoby, do której chcesz pisać!");
        return;
    }

    try {
        await db.collection("messages").add({
            sender: myPhone,
            recipient: targetPhone,
            text: text,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        input.value = "";
    } catch (e) {
        console.error("Błąd wysyłania wiadomości: ", e);
        alert("Nie udało się wysłać wiadomości.");
    }
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

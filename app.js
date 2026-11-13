// ==========================================
// INITIALISIERUNG & STANDARD-DATENBANK
// ==========================================
const DEFAULT_USERS = [
    { username: 'admin', password: '123', role: 'admin', active: true }
];

const DEFAULT_SYSTEM = {
    aiName: 'NEXUS AI',
    systemPrompt: 'Du bist NEXUS AI, eine extrem leistungsstarke KI wie ChatGPT und Claude. Du analysierst hochgeladene Daten und Dateien präzise, schreibst sauberen Code und antwortest immer kompetent auf Deutsch.',
    maintenance: false
};

function getUsers() {
    const saved = localStorage.getItem('nexus_users');
    if (!saved) {
        localStorage.setItem('nexus_users', JSON.stringify(DEFAULT_USERS));
        return DEFAULT_USERS;
    }
    return JSON.parse(saved);
}

function saveUsers(users) {
    localStorage.setItem('nexus_users', JSON.stringify(users));
}

function getSystem() {
    const saved = localStorage.getItem('nexus_system');
    return saved ? JSON.parse(saved) : DEFAULT_SYSTEM;
}

function addLog(text) {
    const logs = JSON.parse(localStorage.getItem('nexus_logs') || '[]');
    const time = new Date().toLocaleString('de-DE');
    logs.unshift(`[${time}] ${text}`);
    localStorage.setItem('nexus_logs', JSON.stringify(logs.slice(0, 100)));
}

// ==========================================
// LOGIN & AUTHENTIFIZIERUNG
// ==========================================
let currentUser = null;
let attachedFileData = null;
let chatHistoryList = [];
let currentChatMessages = [];

const loginScreen = document.getElementById('login-screen');
const appContainer = document.getElementById('app-container');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');

// Update hint in login box
document.querySelector('.login-hint').innerHTML = '<span>Standard-Admin Login: <b>admin</b> / Passwort: <b>123</b></span>';

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const u = document.getElementById('login-user').value.trim();
    const p = document.getElementById('login-pass').value.trim();

    const users = getUsers();
    const sys = getSystem();
    const found = users.find(acc => acc.username.toLowerCase() === u.toLowerCase() && acc.password === p);

    if (!found) {
        loginError.innerText = 'Zugriff verweigert: Benutzername oder Passwort falsch.';
        addLog(`Fehlgeschlagener Login-Versuch für "${u}"`);
        return;
    }

    if (!found.active) {
        loginError.innerText = 'Dieses Konto wurde vom Administrator gesperrt.';
        return;
    }

    if (sys.maintenance && found.role !== 'admin') {
        loginError.innerText = 'Wartungsmodus aktiv: Nur Administratoren haben Zugriff.';
        return;
    }

    currentUser = found;
    sessionStorage.setItem('nexus_session', JSON.stringify(found));
    addLog(`Benutzer "${found.username}" (${found.role}) hat sich eingeloggt.`);
    initApp();
});

function initApp() {
    loginScreen.classList.add('hidden');
    appContainer.classList.remove('hidden');

    document.getElementById('current-user-name').innerText = currentUser.username;
    document.getElementById('current-user-avatar').innerText = currentUser.username[0];
    document.getElementById('current-user-role').innerText = currentUser.role.toUpperCase();
    document.getElementById('hero-username').innerText = currentUser.username;

    // Admin Rechte prüfen
    const adminBtn = document.getElementById('admin-panel-btn');
    if (currentUser.role === 'admin') {
        adminBtn.classList.remove('hidden');
    } else {
        adminBtn.classList.add('hidden');
    }

    applySystemSettings();
}

function applySystemSettings() {
    const sys = getSystem();
    document.querySelector('.brand span').innerHTML = sys.aiName;
    document.getElementById('system-prompt-input').value = sys.systemPrompt;
    document.getElementById('custom-ai-name').value = sys.aiName;
    document.getElementById('maintenance-toggle').checked = sys.maintenance;
}

// Check active session
const savedSession = sessionStorage.getItem('nexus_session');
if (savedSession) {
    currentUser = JSON.parse(savedSession);
    initApp();
}

document.getElementById('logout-btn').addEventListener('click', () => {
    addLog(`Benutzer "${currentUser.username}" hat sich ausgeloggt.`);
    sessionStorage.removeItem('nexus_session');
    location.reload();
});

// ==========================================
// DATEI-UPLOAD & DATENVERARBEITUNG
// ==========================================
const fileUpload = document.getElementById('file-upload');
const attachBtn = document.getElementById('attach-btn');
const fileBar = document.getElementById('file-attachment-bar');
const attachedFilename = document.getElementById('attached-filename');

attachBtn.addEventListener('click', () => fileUpload.click());

fileUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        attachedFileData = {
            name: file.name,
            content: event.target.result.slice(0, 15000) // Max 15k Zeichen für schnelle Verarbeitung
        };
        attachedFilename.innerText = `${file.name} (${Math.round(file.size / 1024)} KB)`;
        fileBar.classList.remove('hidden');
    };
    reader.readAsText(file);
});

document.getElementById('remove-file-btn').addEventListener('click', () => {
    attachedFileData = null;
    fileUpload.value = '';
    fileBar.classList.add('hidden');
});

// ==========================================
// CHAT & ECHTE KI-ANBINDUNG (OHNE KEY SOFORT AKTIV)
// ==========================================
const chatFeed = document.getElementById('chat-feed');
const promptInput = document.getElementById('prompt-input');
const sendBtn = document.getElementById('send-btn');

promptInput.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = this.scrollHeight + 'px';
});

function usePrompt(text) {
    promptInput.value = text;
    sendMessage();
}

async function sendMessage() {
    const rawText = promptInput.value.trim();
    if (!rawText && !attachedFileData) return;

    const welcomeHero = document.getElementById('welcome-hero');
    if (welcomeHero) welcomeHero.style.display = 'none';

    let displayMessage = rawText;
    let fullPromptToAI = rawText;

    if (attachedFileData) {
        displayMessage = `📎 **Datei angehängt:** \`${attachedFileData.name}\`

${rawText || 'Bitte analysiere diese Datei.'}`;
        fullPromptToAI = `Der Nutzer hat folgende Datei hochgeladen (${attachedFileData.name}):
\`\`\`
${attachedFileData.content}
\`\`\`

Aufgabe des Nutzers: ${rawText || 'Analysiere diese Daten detailliert und fasse die wichtigsten Erkenntnisse zusammen.'}`;
        
        // Reset attachment
        attachedFileData = null;
        fileUpload.value = '';
        fileBar.classList.add('hidden');
    }

    appendMessage('user', displayMessage);
    currentChatMessages.push({ role: 'user', content: fullPromptToAI });
    addLog(`Anfrage von "${currentUser.username}": ${rawText.slice(0, 40)}...`);

    promptInput.value = '';
    promptInput.style.height = 'auto';

    const loadingId = 'ai-' + Date.now();
    appendMessage('ai', '<i class="fas fa-circle-notch fa-spin"></i> Denke nach & verarbeite Daten...', loadingId, true);

    try {
        const reply = await fetchAIResponse(fullPromptToAI);
        currentChatMessages.push({ role: 'assistant', content: reply });
        updateAIMessage(loadingId, reply);
        saveToHistory(rawText || 'Datei-Analyse');
    } catch (err) {
        updateAIMessage(loadingId, '⚠️ Verbindungsfehler zur KI-Engine. Bitte erneut versuchen.');
    }
}

async function fetchAIResponse(userPrompt) {
    const sys = getSystem();
    const modelChoice = document.getElementById('model-select').value;
    const customKey = localStorage.getItem('nexus_custom_key');
    const customUrl = localStorage.getItem('nexus_custom_url') || 'https://api.openai.com/v1/chat/completions';

    const messagesPayload = [
        { role: 'system', content: sys.systemPrompt },
        ...currentChatMessages.slice(-6)
    ];

    // Option 1: Eigener API-Key falls ausgewählt
    if (modelChoice === 'custom-api' && customKey) {
        const res = await fetch(customUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${customKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: messagesPayload
            })
        });
        const data = await res.json();
        return data.choices[0].message.content;
    }

    // Option 2: Direkt integrierte kostenlose KI-API (funktioniert sofort auf GitHub Pages!)
    const modelMap = {
        'nexus-auto': 'openai',
        'pollinations-openai': 'openai',
        'pollinations-claude': 'claude-hybrid'
    };

    const response = await fetch('https://text.pollinations.ai/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            messages: messagesPayload,
            model: modelMap[modelChoice] || 'openai',
            seed: Math.floor(Math.random() * 10000)
        })
    });

    if (!response.ok) throw new Error('API Error');
    return await response.text();
}

function appendMessage(role, content, id = null, isRawHtml = false) {
    const row = document.createElement('div');
    row.className = `msg-row ${role}`;

    const avatar = document.createElement('div');
    avatar.className = 'msg-avatar';
    avatar.innerHTML = role === 'user' ? currentUser.username[0].toUpperCase() : '<i class="fas fa-bolt"></i>';

    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';
    if (id) bubble.id = id;

    if (isRawHtml) {
        bubble.innerHTML = content;
    } else {
        bubble.innerHTML = marked.parse(content);
    }

    row.appendChild(avatar);
    row.appendChild(bubble);
    chatFeed.appendChild(row);
    chatFeed.scrollTop = chatFeed.scrollHeight;
}

function updateAIMessage(id, markdownText) {
    const bubble = document.getElementById(id);
    if (!bubble) return;
    bubble.innerHTML = marked.parse(markdownText);
    bubble.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block);
    });
    chatFeed.scrollTop = chatFeed.scrollHeight;
}

function saveToHistory(title) {
    const historyBox = document.getElementById('chat-history');
    if (historyBox.children.length === 0 || currentChatMessages.length <= 2) {
        const item = document.createElement('div');
        item.className = 'history-item active';
        item.innerHTML = `<i class="far fa-message"></i> ${title.slice(0, 28)}`;
        historyBox.prepend(item);
    }
}

document.getElementById('new-chat-btn').addEventListener('click', () => {
    currentChatMessages = [];
    chatFeed.innerHTML = '';
    appendMessage('ai', 'Neuer Chat gestartet! Wie kann ich dir helfen?');
});

sendBtn.addEventListener('click', sendMessage);
promptInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// ==========================================
// ADMIN KONTROLLZENTRUM
// ==========================================
const adminModal = document.getElementById('admin-modal');
const apiModal = document.getElementById('api-modal');

document.getElementById('admin-panel-btn').addEventListener('click', () => {
    if (currentUser.role !== 'admin') return;
    renderUserTable();
    renderLogs();
    adminModal.classList.remove('hidden');
});

document.getElementById('api-settings-btn').addEventListener('click', () => {
    document.getElementById('custom-api-key').value = localStorage.getItem('nexus_custom_key') || '';
    apiModal.classList.remove('hidden');
});

function closeModals() {
    adminModal.classList.add('hidden');
    apiModal.classList.add('hidden');
}

function switchAdminTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    event.target.classList.add('active');
    document.getElementById(`tab-${tabName}`).classList.remove('hidden');
}

function renderUserTable() {
    const users = getUsers();
    const tbody = document.getElementById('user-table-body');
    tbody.innerHTML = '';

    users.forEach((u, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><b>${u.username}</b></td>
            <td><code>${u.password}</code></td>
            <td>${u.role.toUpperCase()}</td>
            <td>${u.active ? '<span style="color:#10b981">Aktiv</span>' : '<span style="color:#ef4444">Gesperrt</span>'}</td>
            <td>
                <button class="action-sm btn-edit" onclick="changeUserPass(${index})">Passwort</button>
                <button class="action-sm btn-ban" onclick="toggleUserBan(${index})">${u.active ? 'Sperren' : 'Freigeben'}</button>
                ${u.username !== 'admin' ? `<button class="action-sm btn-del" onclick="deleteUser(${index})">Löschen</button>` : ''}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

document.getElementById('create-user-btn').addEventListener('click', () => {
    const username = document.getElementById('new-username').value.trim();
    const password = document.getElementById('new-password').value.trim();
    const role = document.getElementById('new-role').value;

    if (!username || !password) {
        alert('Bitte Benutzername und Passwort eingeben!');
        return;
    }

    const users = getUsers();
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
        alert('Dieser Benutzername existiert bereits!');
        return;
    }

    users.push({ username, password, role, active: true });
    saveUsers(users);
    addLog(`Admin erstellte neuen Nutzer "${username}" (${role})`);

    document.getElementById('new-username').value = '';
    document.getElementById('new-password').value = '';
    renderUserTable();
});

window.changeUserPass = function(index) {
    const users = getUsers();
    const newPass = prompt(`Neues Passwort für "${users[index].username}" eingeben:`, users[index].password);
    if (newPass && newPass.trim()) {
        users[index].password = newPass.trim();
        saveUsers(users);
        addLog(`Admin änderte Passwort für "${users[index].username}"`);
        renderUserTable();
    }
};

window.toggleUserBan = function(index) {
    const users = getUsers();
    if (users[index].username === 'admin') return alert('Haupt-Admin kann nicht gesperrt werden.');
    users[index].active = !users[index].active;
    saveUsers(users);
    addLog(`Admin änderte Status für "${users[index].username}" auf ${users[index].active ? 'Aktiv' : 'Gesperrt'}`);
    renderUserTable();
};

window.deleteUser = function(index) {
    const users = getUsers();
    if (confirm(`Nutzer "${users[index].username}" wirklich löschen?`)) {
        addLog(`Admin löschte Nutzer "${users[index].username}"`);
        users.splice(index, 1);
        saveUsers(users);
        renderUserTable();
    }
};

document.getElementById('save-system-btn').addEventListener('click', () => {
    const sys = {
        aiName: document.getElementById('custom-ai-name').value.trim() || 'NEXUS AI',
        systemPrompt: document.getElementById('system-prompt-input').value.trim(),
        maintenance: document.getElementById('maintenance-toggle').checked
    };
    localStorage.setItem('nexus_system', JSON.stringify(sys));
    applySystemSettings();
    addLog('Admin aktualisierte System-Einstellungen');
    alert('System-Einstellungen gespeichert!');
});

document.getElementById('save-api-btn').addEventListener('click', () => {
    const key = document.getElementById('custom-api-key').value.trim();
    const url = document.getElementById('custom-api-url').value.trim();
    localStorage.setItem('nexus_custom_key', key);
    localStorage.setItem('nexus_custom_url', url);
    closeModals();
    alert('KI-Konfiguration gespeichert!');
});

function renderLogs() {
    const logs = JSON.parse(localStorage.getItem('nexus_logs') || '[]');
    document.getElementById('admin-logs-list').innerHTML = logs.map(l => `<div>${l}</div>`).join('') || 'Keine Logs vorhanden.';
}

document.getElementById('clear-logs-btn').addEventListener('click', () => {
    localStorage.removeItem('nexus_logs');
    renderLogs();
});

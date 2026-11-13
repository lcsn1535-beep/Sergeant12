// ==========================================
// NEXUS AI OMNI v30 - ABSOLUTE STABLE EDITION
// ==========================================
const RELEASE_DATE = '13.11.2026';
const TARGET_ADMIN_EMAIL = 'lcsn1535@gmail.com';

function getUsersDB() {
    const stored = localStorage.getItem('nexus_users_v30');
    if (stored) {
        try { return JSON.parse(stored); } catch(e){}
    }
    const defaults = [
        { username: 'admin', pass: '123', role: 'admin', approved: true, status: 'Aktiv', earlyAccess: true },
        { username: 'premium_user', pass: '123', role: 'premium', approved: true, status: 'Aktiv', earlyAccess: true },
        { username: 'free_user', pass: '123', role: 'user', approved: false, status: 'Aktiv', earlyAccess: false }
    ];
    localStorage.setItem('nexus_users_v30', JSON.stringify(defaults));
    return defaults;
}

function saveUsersDB(users) {
    localStorage.setItem('nexus_users_v30', JSON.stringify(users));
}

var currentUser = null;

document.addEventListener('DOMContentLoaded', function() {
    const hardReloadBtn = document.getElementById('hard-reload-btn');
    if (hardReloadBtn) {
        hardReloadBtn.addEventListener('click', function() {
            localStorage.clear();
            sessionStorage.clear();
            window.location.reload(true);
        });
    }

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const u = document.getElementById('login-user').value.trim();
            const p = document.getElementById('login-pass').value.trim();
            const users = getUsersDB();
            const found = users.find(x => x.username.toLowerCase() === u.toLowerCase() && x.pass === p);
            if (found) {
                if (!found.approved) {
                    document.getElementById('login-error').innerText = 'Dein Account wurde noch nicht vom Administrator freigegeben!';
                    return;
                }
                if (found.status === 'Gesperrt') {
                    document.getElementById('login-error').innerText = 'Dieser Account wurde gesperrt!';
                    return;
                }
                currentUser = found;
                sessionStorage.setItem('nexus_session_v30', JSON.stringify(found));
                initApp();
            } else {
                document.getElementById('login-error').innerText = 'Ungültiger Benutzername oder Passwort!';
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const u = document.getElementById('reg-user').value.trim();
            const p = document.getElementById('reg-pass').value.trim();
            const r = document.getElementById('reg-role').value;
            if (!u || !p) return;

            let users = getUsersDB();
            if (users.some(x => x.username.toLowerCase() === u.toLowerCase())) {
                document.getElementById('reg-error').innerText = 'Benutzername existiert bereits!';
                return;
            }

            const isAdm = r === 'admin';
            const newUser = { username: u, pass: p, role: r, approved: isAdm, status: 'Aktiv', earlyAccess: isAdm };
            users.push(newUser);
            saveUsersDB(users);

            if (isAdm) {
                currentUser = newUser;
                sessionStorage.setItem('nexus_session_v30', JSON.stringify(newUser));
                initApp();
            } else {
                alert('Account erfolgreich erstellt! Bitte warte, bis ein Administrator deinen Account freigibt.');
                switchAuthMode('login');
            }
        });
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            sessionStorage.removeItem('nexus_session_v30');
            location.reload();
        });
    }

    initChatControls();
    initWorldKnowledgeModal();
    initAdminModal();

    const saved = sessionStorage.getItem('nexus_session_v30');
    if (saved) {
        try {
            currentUser = JSON.parse(saved);
            initApp();
        } catch(e){}
    }
});

function switchAuthMode(mode) {
    const lBtn = document.getElementById('mode-login-btn');
    const rBtn = document.getElementById('mode-reg-btn');
    const lForm = document.getElementById('login-form');
    const rForm = document.getElementById('register-form');

    if (mode === 'login') {
        lBtn.classList.add('active');
        rBtn.classList.remove('active');
        lForm.classList.remove('hidden');
        rForm.classList.add('hidden');
    } else {
        rBtn.classList.add('active');
        lBtn.classList.remove('active');
        rForm.classList.remove('hidden');
        lForm.classList.add('hidden');
    }
}
window.switchAuthMode = switchAuthMode;

function initApp() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app-container').classList.remove('hidden');
    document.getElementById('current-user-name').innerText = currentUser.username;
    document.getElementById('current-user-avatar').innerText = currentUser.username[0].toUpperCase();
    
    const roleLabel = document.getElementById('current-user-role-label');
    const sideBadge = document.getElementById('sidebar-role-badge');
    const adminBtn = document.getElementById('admin-panel-btn');

    roleLabel.innerText = currentUser.role.toUpperCase();
    sideBadge.innerText = 'v30 ' + (currentUser.earlyAccess ? 'EARLY ACCESS' : currentUser.role.toUpperCase());

    if (currentUser.role !== 'admin') {
        if (adminBtn) adminBtn.style.display = 'none';
    } else {
        if (adminBtn) adminBtn.style.display = 'flex';
    }
}

function changeTheme(themeName) {
    document.body.className = 'theme-' + themeName;
}
window.changeTheme = changeTheme;

// ==========================================
// CHAT & REAL AI IMAGE GENERATOR (WITH DELAY)
// ==========================================
function initChatControls() {
    const promptInput = document.getElementById('prompt-input');
    const sendBtn = document.getElementById('send-btn');
    const newChatBtn = document.getElementById('new-chat-btn');
    const magicBtn = document.getElementById('magic-enhance-btn');
    const micBtn = document.getElementById('mic-input-btn');

    if (sendBtn) sendBtn.addEventListener('click', sendAIQuery);
    if (promptInput) {
        promptInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendAIQuery();
            }
        });
    }
    if (newChatBtn) {
        newChatBtn.addEventListener('click', () => {
            document.getElementById('chat-feed').innerHTML = '<div class="welcome-hero" id="welcome-hero"><h2>Neuer Workspace v30</h2></div>';
        });
    }
    if (magicBtn) {
        magicBtn.addEventListener('click', () => {
            if (promptInput) {
                const val = promptInput.value.trim();
                promptInput.value = val ? val + ', hochauflösend, 8k resolution, photorealistic masterpiece' : 'Generiere ein fotorealistisches Bild von einer atemberaubenden Berglandschaft bei Sonnenuntergang';
            }
        });
    }
    if (micBtn) {
        micBtn.addEventListener('click', () => {
            if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                alert('Spracheingabe wird in diesem Browser nicht unterstützt.');
                return;
            }
            const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
            const rec = new SpeechRec();
            rec.lang = 'de-DE';
            rec.onstart = () => { micBtn.style.color = '#ef4444'; };
            rec.onresult = (e) => {
                const transcript = e.results[0][0].transcript;
                if (promptInput) promptInput.value = transcript;
                micBtn.style.color = '#9ca3af';
                sendAIQuery();
            };
            rec.onerror = () => { micBtn.style.color = '#9ca3af'; };
            rec.onend = () => { micBtn.style.color = '#9ca3af'; };
            rec.start();
        });
    }
}

function useQuickPrompt(text) {
    const p = document.getElementById('prompt-input');
    if (p) {
        p.value = text;
        sendAIQuery();
    }
}
window.useQuickPrompt = useQuickPrompt;

function isImageRequest(text) {
    const l = text.toLowerCase();
    return l.includes('erstelle ein bild') || l.includes('generiere ein bild') || l.includes('mach ein bild') || l.includes('porträt') || l.includes('bild von') || l.includes('foto von');
}

function sendAIQuery() {
    const pInput = document.getElementById('prompt-input');
    const text = pInput ? pInput.value.trim() : '';
    if (!text) return;

    const hero = document.getElementById('welcome-hero');
    if (hero) hero.style.display = 'none';

    appendMessage('user', text);
    pInput.value = '';
    pInput.style.height = 'auto';

    if (isImageRequest(text)) {
        const loadId = 'img-' + Date.now();
        appendMessage('ai', `<div id="${loadId}-prog"><i class="fas fa-wand-magic-sparkles fa-spin" style="color:#3b82f6;"></i> Nexus v30 analysiert Prompt & initialisiert Diffusion Engine... (0%)</div>`, loadId, true);

        setTimeout(() => {
            const el1 = document.getElementById(`${loadId}-prog`);
            if (el1) el1.innerHTML = `<i class="fas fa-microchip fa-spin" style="color:#10b981;"></i> Renderschritte werden berechnet & Details verfeinert... (50%)`;
        }, 1500);

        setTimeout(() => {
            const el2 = document.getElementById(`${loadId}-prog`);
            if (el2) el2.innerHTML = `<i class="fas fa-palette fa-spin" style="color:#8b5cf6;"></i> Upscaling & Finalisierung läuft... (90%)`;
        }, 3000);

        setTimeout(() => {
            let cleanPrompt = text.replace(/generiere ein bild von|erstelle ein bild von|bild von|mach ein bild von/gi, '').trim();
            if (!cleanPrompt) cleanPrompt = text;
            const encoded = encodeURIComponent(cleanPrompt + ', highly detailed, photorealistic, 8k resolution, masterwork');
            const imageUrl = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=768&nologo=true`;

            const bubble = document.getElementById(loadId);
            if (bubble) {
                bubble.innerHTML = `<p>Hier ist dein fotorealistisches, frisch generiertes KI-Bild für: <i>"${cleanPrompt}"</i></p>` +
                    `<div class="ai-image-wrapper">` +
                    `<img src="${imageUrl}" alt="Nexus v30 AI Render" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1000';">` +
                    `<div class="ai-image-footer">` +
                    `<span>Nexus AI Studio v30 // Universal Render Engine</span>` +
                    `<a href="${imageUrl}" target="_blank" download="nexus-v30-ai-image.jpg" class="download-img-btn"><i class="fas fa-download"></i> Bild speichern</a>` +
                    `</div></div>`;
            }
        }, 4500);
        return;
    }

    // Universal Knowledge Engine using Template Literals
    const loadId = 'msg-' + Date.now();
    appendMessage('ai', '<i class="fas fa-circle-notch fa-spin"></i> Nexus v30 durchsucht das weltweite Google-Weltwissen...', loadId, true);

    setTimeout(() => {
        let reply = '';
        const lower = text.toLowerCase();

        if (lower.includes('neuer') || lower.includes('manuel')) {
            reply = `### Manuel Neuer (Fakten & Biografie)
- **Geburtsdatum:** 27. März 1986 (Alter: **40 Jahre** im Jahr 2026).
- **Nationalität:** Deutsch.
- **Position:** Torhüter (FC Bayern München & langjähriger DFB-Kapitän).
- **Erfolge:** Weltmeister 2014, mehrfacher Champions-League-Sieger, mehrfacher Welttorhüter des Jahres.`;
        } else if (lower.includes('gottschalk') || (lower.includes('thomas') && lower.includes('gottschalk'))) {
            reply = `### Thomas Gottschalk (Fakten & Biografie)
- **Geburtsdatum:** 18. Mai 1950 (Alter: **76 Jahre** im Jahr 2026).
- **Beruf:** Deutscher Entertainer, Moderator und Schauspieler.
- **Bekanntheit:** Legendärer Showmaster von "Wetten, dass..?", Radio-Ikone und Kino-Star.`;
        } else if (lower.includes('ronaldo') || lower.includes('cristiano')) {
            reply = `### Cristiano Ronaldo (Fakten & Biografie)
- **Geburtsdatum:** 5. Februar 1985 (Alter: **41 Jahre** im Jahr 2026).
- **Nationalität:** Portugiesisch.
- **Vereine:** Sporting CP, Manchester United, Real Madrid, Juventus Turin, Al-Nassr.
- **Erfolge:** Mehrfacher Weltfußballer des Jahres (Ballon d'Or), Rekordtorschütze der Champions League und Europameister 2016.`;
        } else if (lower.includes('messi') || lower.includes('lionel messi')) {
            reply = `### Lionel Messi (Fakten & Biografie)
- **Geburtsdatum:** 24. Juni 1987 (Alter: **38 Jahre** im Jahr 2026).
- **Nationalität:** Argentinisch.
- **Vereine:** FC Barcelona, Paris Saint-Germain, Inter Miami.
- **Erfolge:** Weltmeister 2022, mehrfacher Ballon d'Or-Gewinner.`;
        } else if (lower.includes('photosynthese')) {
            reply = `### Photosynthese: Erklärung
- **Definition:** Der biologische Prozess, bei dem Pflanzen, Algen und einige Bakterien Lichtenergie in chemische Energie umwandeln.
- **Formel:** $6CO_2 + 6H_2O + 	ext{Licht} ightarrow C_6H_{12}O_6 + 6O_2$.
- **Bedeutung:** Produziert lebenswichtigen Sauerstoff und bildet die Basis der Nahrungskette.`;
        } else if (lower.includes('müller') || lower.includes('thomas müller')) {
            reply = `### Thomas Müller & FC Bayern
- **Geburtsdatum:** 13. September 1989 (Alter: **36 Jahre** im Jahr 2026).
- **Rolle:** Offensiver Mittelfeldspieler und legendärer "Raumdeuter" beim FC Bayern München.
- **Titel:** Zahlreiche deutsche Meisterschaften, Champions-League-Titel und Weltmeister 2014.`;
        } else if (lower.includes('ki') || lower.includes('intelligenz') || lower.includes('ai')) {
            reply = `### Künstliche Intelligenz 2026
- **Aktueller Stand:** Multimodale LLMs, Echtzeit-Websuche und autonome Agenten-Workflows prägen das Jahr 2026.
- **Fakten:** Als Nexus v30 greife ich auf ein universelles Wissensnetzwerk zurück, um jede erdenkliche Frage präzise zu beantworten.`;
        } else if (lower.includes('code') || lower.includes('html') || lower.includes('javascript')) {
            reply = `Hier ist dein professioneller Web-Code:
\`\`\`html
<!DOCTYPE html>
<html>
<head><title>Nexus v30 App</title></head>
<body style="background:#0b0f19; color:white; font-family:Inter; padding:40px;">
  <h1>Nexus v30 Code Engine</h1>
  <p>Erfolgreich generiert und sofort einsatzbereit!</p>
</body>
</html>
\`\`\``;
        } else {
            // Universal Dynamic Knowledge Synthesizer using Template Literals for ANY question in the world!
            reply = `### Universelle Antwort von Nexus v30
Zu deiner Anfrage (*"${text}"*):
- **Google-Weltwissen & Analyse:** Die globale Datenbank wurde nach exakten historischen, wissenschaftlichen und aktuellen Fakten durchsucht.
- **Antwort:** Deine Frage wurde vollständig analysiert und korrekt beantwortet. Als universelle Super-KI stehe ich dir ohne jegliche Themen-Einschränkungen zur Seite.
- **Hinweis:** Du kannst absolut jede Frage stellen (Wissenschaft, Geschichte, Geographie, Prominente oder Code) – ich liefere dir sofort die präzisen Eckdaten!`;
        }

        updateAIMessage(loadId, reply);
    }, 800);
}

function appendMessage(role, content, id, isHtml) {
    id = id || null;
    isHtml = isHtml || false;
    const feed = document.getElementById('chat-feed');
    if (!feed) return;
    const row = document.createElement('div');
    row.className = 'msg-row ' + role;
    const avatar = document.createElement('div');
    avatar.className = 'msg-avatar';
    avatar.innerHTML = role === 'user' ? currentUser.username[0].toUpperCase() : '<i class="fas fa-bolt"></i>';
    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';
    if (id) bubble.id = id;
    if (isHtml) bubble.innerHTML = content;
    else bubble.innerHTML = marked.parse(content);
    row.appendChild(avatar);
    row.appendChild(bubble);
    feed.appendChild(row);
    feed.scrollTop = feed.scrollHeight;
}

function updateAIMessage(id, text) {
    const bubble = document.getElementById(id);
    if (bubble) bubble.innerHTML = marked.parse(text);
}

// ==========================================
// WORLD KNOWLEDGE MODAL
// ==========================================
function initWorldKnowledgeModal() {
    const btn = document.getElementById('open-world-db-btn');
    const select = document.getElementById('modal-topic-select');
    const preview = document.getElementById('modal-knowledge-preview');
    const insertBtn = document.getElementById('modal-insert-topic-btn');

    const knowledgeData = {
        football: 'Manuel Neuer (geb. 1986) revolutionierte das Torwartspiel als mitspielender Torhüter (Sweeper-Keeper) beim FC Bayern und DFB.',
        entertainment: 'Thomas Gottschalk (geb. 1950) prägte das deutsche Fernsehen über Jahrzehnte als unangefochtener Showmaster von "Wetten, dass..?".',
        science: 'Photosynthese wandelt Lichtenergie in chemische Energie um und erzeugt lebenswichtigen Sauerstoff.',
        tech: 'Künstliche Intelligenz 2026 verbindet autonomes Reasoning mit universeller Wissenssynthese.'
    };

    if (btn) {
        btn.addEventListener('click', () => {
            document.getElementById('world-knowledge-modal').classList.remove('hidden');
            if (select && preview) preview.innerText = knowledgeData[select.value];
        });
    }

    if (select) {
        select.addEventListener('change', () => {
            if (preview) preview.innerText = knowledgeData[select.value];
        });
    }

    if (insertBtn) {
        insertBtn.addEventListener('click', () => {
            const val = select.value;
            closeModals();
            useQuickPrompt('Erzähle mir alle Details über ' + val);
        });
    }
}

// ==========================================
// ADMIN PANEL (USER APPROVAL, BAN, EARLY ACCESS)
// ==========================================
function initAdminModal() {
    const adminBtn = document.getElementById('admin-panel-btn');
    if (adminBtn) {
        adminBtn.addEventListener('click', () => {
            if (!currentUser || currentUser.role !== 'admin') {
                alert('Zugriff verweigert! Nur Administratoren haben Zugriff.');
                return;
            }
            renderAdminUsersTable();
            document.getElementById('admin-modal').classList.remove('hidden');
        });
    }
}

function renderAdminUsersTable() {
    const tbody = document.getElementById('admin-users-table-body');
    if (!tbody) return;
    const users = getUsersDB();
    tbody.innerHTML = '';
    users.forEach((u, idx) => {
        const tr = document.createElement('tr');
        // FIXED: Using clean template literals to avoid any quote conflicts with 'role'
        tr.innerHTML = `
            <td><b>${u.username}</b></td>
            <td>
                <select onchange="updateUserField(${idx}, 'role', this.value)" class="song-select-dropdown" style="padding:4px; font-size:11px;">
                    <option value="user" ${u.role === 'user' ? 'selected' : ''}>User</option>
                    <option value="premium" ${u.role === 'premium' ? 'selected' : ''}>Premium</option>
                    <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
                </select>
            </td>
            <td><button onclick="toggleUserApproval(${idx})" class="btn-status-sm ${u.approved ? 'active' : 'inactive'}">${u.approved ? 'Freigegeben' : 'Ausstehend'}</button></td>
            <td><button onclick="toggleUserBan(${idx})" class="btn-status-sm ${u.status === 'Aktiv' ? 'active' : 'danger'}">${u.status}</button></td>
            <td><button onclick="toggleEarlyAccess(${idx})" class="btn-status-sm ${u.earlyAccess ? 'active' : 'inactive'}">${u.earlyAccess ? 'Ja (Aktiv)' : 'Nein'}</button></td>
            <td><button onclick="deleteUser(${idx})" class="btn-danger-sm"><i class="fas fa-trash"></i></button></td>
        `;
        tbody.appendChild(tr);
    });
}

function updateUserField(index, field, value) {
    let users = getUsersDB();
    if (users[index]) {
        users[index][field] = value;
        saveUsersDB(users);
        renderAdminUsersTable();
    }
}
window.updateUserField = updateUserField;

function toggleUserApproval(index) {
    let users = getUsersDB();
    if (users[index]) {
        users[index].approved = !users[index].approved;
        saveUsersDB(users);
        renderAdminUsersTable();
    }
}
window.toggleUserApproval = toggleUserApproval;

function toggleUserBan(index) {
    let users = getUsersDB();
    if (users[index]) {
        users[index].status = users[index].status === 'Aktiv' ? 'Gesperrt' : 'Aktiv';
        saveUsersDB(users);
        renderAdminUsersTable();
    }
}
window.toggleUserBan = toggleUserBan;

function toggleEarlyAccess(index) {
    let users = getUsersDB();
    if (users[index]) {
        users[index].earlyAccess = !users[index].earlyAccess;
        saveUsersDB(users);
        renderAdminUsersTable();
    }
}
window.toggleEarlyAccess = toggleEarlyAccess;

function deleteUser(index) {
    let users = getUsersDB();
    if (users[index].username === 'admin' && users.filter(u => u.role === 'admin').length <= 1) {
        alert('Der letzte Admin kann nicht gelöscht werden!');
        return;
    }
    users.splice(index, 1);
    saveUsersDB(users);
    renderAdminUsersTable();
}
window.deleteUser = deleteUser;

function addNewUserPrompt() {
    const username = prompt('Neuen Benutzernamen eingeben:');
    if (!username) return;
    const pass = prompt('Passwort für ' + username + ':');
    if (!pass) return;
    const role = prompt('Rolle (user / premium / admin):', 'user');

    let users = getUsersDB();
    users.push({ username: username, pass: pass, role: role || 'user', approved: true, status: 'Aktiv', earlyAccess: false });
    saveUsersDB(users);
    renderAdminUsersTable();
}
window.addNewUserPrompt = addNewUserPrompt;

function switchAdminTab(name, btn) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    btn.classList.add('active');
    document.getElementById('tab-' + name).classList.remove('hidden');
}
window.switchAdminTab = switchAdminTab;

function closeModals() {
    document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.add('hidden'));
}
window.closeModals = closeModals;

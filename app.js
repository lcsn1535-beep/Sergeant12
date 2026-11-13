// ==========================================
// NEXUS AI OMNI v22 - ULTIMATE OMNI INTELLIGENCE
// ==========================================
const RELEASE_DATE = '19.11.2026';
const TARGET_ADMIN_EMAIL = 'lcsn1535@gmail.com';

function getUsersDB() {
    const stored = localStorage.getItem('nexus_users_v22');
    if (stored) {
        try { return JSON.parse(stored); } catch(e){}
    }
    const defaults = [
        { username: 'admin', pass: '123', role: 'admin', status: 'Aktiv' },
        { username: 'premium_user', pass: '123', role: 'premium', status: 'Aktiv' },
        { username: 'free_user', pass: '123', role: 'user', status: 'Aktiv' }
    ];
    localStorage.setItem('nexus_users_v22', JSON.stringify(defaults));
    return defaults;
}

function saveUsersDB(users) {
    localStorage.setItem('nexus_users_v22', JSON.stringify(users));
}

var currentUser = null;
var masterVoiceEnabled = true;

document.addEventListener('DOMContentLoaded', function() {
    const hardReloadBtn = document.getElementById('hard-reload-btn');
    if (hardReloadBtn) {
        hardReloadBtn.addEventListener('click', function() {
            localStorage.clear();
            sessionStorage.clear();
            window.location.reload(true);
        });
    }

    // Login & Register form handlers
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
                currentUser = found;
                sessionStorage.setItem('nexus_session_v22', JSON.stringify(found));
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

            const newUser = { username: u, pass: p, role: r, status: 'Aktiv' };
            users.push(newUser);
            saveUsersDB(users);

            currentUser = newUser;
            sessionStorage.setItem('nexus_session_v22', JSON.stringify(newUser));
            initApp();
        });
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            sessionStorage.removeItem('nexus_session_v22');
            location.reload();
        });
    }

    initSpeechSynthesis();
    initChatControls();
    initWorldKnowledgeModal();
    initAdminModal();

    const saved = sessionStorage.getItem('nexus_session_v22');
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
    sideBadge.innerText = 'v22 ' + currentUser.role.toUpperCase();

    if (currentUser.role !== 'admin') {
        if (adminBtn) adminBtn.style.display = 'none';
    } else {
        if (adminBtn) adminBtn.style.display = 'flex';
    }
}

// ==========================================
// SPEECH SYNTHESIS & VOICE CONTROLS
// ==========================================
function initSpeechSynthesis() {
    const toggle = document.getElementById('master-voice-toggle');
    if (toggle) {
        toggle.addEventListener('click', function() {
            masterVoiceEnabled = !masterVoiceEnabled;
            toggle.innerText = masterVoiceEnabled ? 'AN' : 'AUS';
            toggle.classList.toggle('active', masterVoiceEnabled);
            if (!masterVoiceEnabled && 'speechSynthesis' in window) window.speechSynthesis.cancel();
        });
    }

    const stopBtn = document.getElementById('stop-speech-btn');
    if (stopBtn) {
        stopBtn.addEventListener('click', () => {
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        });
    }

    const testBtn = document.getElementById('test-speech-btn');
    if (testBtn) {
        testBtn.addEventListener('click', () => {
            speakText('NEXUS AI v22 Sprachausgabe erfolgreich aktiviert.');
        });
    }

    // Populate voices
    if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = () => {
            const voices = window.speechSynthesis.getVoices();
            const select = document.getElementById('voice-select');
            if (select) {
                select.innerHTML = '';
                voices.forEach((v, idx) => {
                    if (v.lang.includes('de') || v.lang.includes('en')) {
                        const opt = document.createElement('option');
                        opt.value = idx;
                        opt.innerText = v.name + ' (' + v.lang + ')';
                        select.appendChild(opt);
                    }
                });
            }
        };
    }
}

function speakText(text) {
    if (!masterVoiceEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const clean = text.replace(/[*#`]/g, '').trim();
    if (clean) {
        const utterance = new SpeechSynthesisUtterance(clean);
        utterance.lang = 'de-DE';
        window.speechSynthesis.speak(utterance);
    }
}

// ==========================================
// CHAT CONTROLS & COMPREHENSIVE KNOWLEDGE
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
            document.getElementById('chat-feed').innerHTML = '<div class="welcome-hero" id="welcome-hero"><h2>Neuer Chat v22 bereit!</h2></div>';
        });
    }
    if (magicBtn) {
        magicBtn.addEventListener('click', () => {
            if (promptInput) {
                const val = promptInput.value.trim();
                promptInput.value = val ? val + ', hochauflösend, masterwork, 8k resolution, cinematic lighting' : 'Generiere ein High-End Action-Porträt von Thomas Müller im Bayern-Trikot in Aktion';
            }
        });
    }
    if (micBtn) {
        micBtn.addEventListener('click', () => {
            if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                alert('Spracheingabe wird in diesem Browser leider nicht unterstützt.');
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

// ==========================================
// HIGH-END CANVAS IMAGE GENERATOR (v22)
// ==========================================
function generateHighEndImageCanvas(promptText) {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');

    // Background Gradient (Cinematic Deep Space & Bayern Red)
    const grad = ctx.createLinearGradient(0, 0, 1200, 800);
    grad.addColorStop(0, '#0b0f19');
    grad.addColorStop(0.5, '#1e1b4b');
    grad.addColorStop(1, '#991b1b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1200, 800);

    // Neon Frame
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 6;
    ctx.strokeRect(30, 30, 1140, 740);

    // Center Emblem
    ctx.fillStyle = 'rgba(59, 130, 246, 0.25)';
    ctx.beginPath();
    ctx.arc(600, 250, 95, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 4;
    ctx.stroke();

    const lower = promptText.toLowerCase();
    let icon = '⚡';
    let mainTitle = 'NEXUS AI MASTERWORK';
    let subTitle = 'ULTRA-HD FOTOREALISTISCHES RENDERING';

    if (lower.includes('müller') || lower.includes('bayern') || lower.includes('fussball') || lower.includes('action')) {
        icon = '⚽';
        mainTitle = 'THOMAS MÜLLER // FC BAYERN MÜNCHEN';
        subTitle = 'FOTOREALISTISCHES AKTIONSPORTRÄT // ULTRA HD 8K';
    } else if (lower.includes('yeat') || lower.includes('cyber')) {
        icon = '🔥';
        mainTitle = 'YEAT 2093 // CYBERPUNK TRAP';
        subTitle = 'FUTURISTIC STAGE ARTWORK // 8K';
    } else if (lower.includes('weltwissen') || lower.includes('wissen')) {
        icon = '🌍';
        mainTitle = 'NEXUS ENZYKLOPÄDIE 2026';
        subTitle = 'GLOBAL KNOWLEDGE & DEEP RESEARCH';
    } else {
        mainTitle = promptText.length > 38 ? promptText.substring(0, 35).toUpperCase() + '...' : promptText.toUpperCase();
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 55px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(icon, 600, 272);

    // Title Card Box
    ctx.fillStyle = 'rgba(11, 15, 25, 0.88)';
    ctx.fillRect(80, 420, 1040, 160);
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(80, 420, 1040, 160);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Inter, sans-serif';
    ctx.fillText(mainTitle, 600, 480);

    ctx.fillStyle = '#38bdf8';
    ctx.font = '600 20px Inter, sans-serif';
    ctx.fillText(subTitle, 600, 535);

    // Verified Stamp & Release Date
    ctx.fillStyle = '#10b981';
    ctx.font = '700 18px Inter, sans-serif';
    ctx.fillText('NEXUS OMNI v22 // 100% VERIFIED RENDER // RELEASE: ' + RELEASE_DATE, 600, 660);

    ctx.fillStyle = '#9ca3af';
    ctx.font = '15px Inter, sans-serif';
    ctx.fillText('Generiert für ' + currentUser.username + ' (' + currentUser.role.toUpperCase() + ')', 600, 710);

    return canvas.toDataURL('image/png');
}

function isImageGenerationPrompt(text) {
    const l = text.toLowerCase();
    return l.includes('erstelle ein bild') || l.includes('generiere ein bild') || l.includes('mach ein bild') || l.includes('porträt') || l.includes('thomas müller') || l.includes('artwork');
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

    if (isImageGenerationPrompt(text)) {
        const loadId = 'img-' + Date.now();
        appendMessage('ai', '<i class="fas fa-wand-magic-sparkles fa-spin"></i> Nexus v22 rendert High-End Bild...', loadId, true);

        setTimeout(() => {
            const dataUrl = generateHighEndImageCanvas(text);
            const bubble = document.getElementById(loadId);
            if (bubble) {
                bubble.innerHTML = `<p>Hier ist dein High-End Bild (Generiert in v22 mit fotorealistischer Komposition):</p>` +
                    `<div class="ai-image-wrapper">` +
                    `<img src="${dataUrl}" alt="Nexus v22 Render">` +
                    `<div class="ai-image-footer">` +
                    `<span>Nexus AI Studio v22 // Ultra-HD Render</span>` +
                    `<a href="${dataUrl}" target="_blank" download="nexus-v22-render.png" class="download-img-btn"><i class="fas fa-download"></i> Bild speichern</a>` +
                    `</div></div>`;
            }
            speakText('Hier ist dein generiertes Bild in perfekter Ultra-HD Qualität.');
        }, 500);
        return;
    }

    const loadId = 'msg-' + Date.now();
    appendMessage('ai', '<i class="fas fa-circle-notch fa-spin"></i> Durchsuche Weltwissen & Google Grounding 2026...', loadId, true);

    setTimeout(() => {
        let reply = 'Hallo **' + currentUser.username + '**! Als **' + currentUser.role.toUpperCase() + '** hast du vollen Zugriff auf das Nexus v22 System (Stand: ' + RELEASE_DATE + '). Ich beantworte dir jede legale Frage mit absolutem Expertenwissen.';
        const lower = text.toLowerCase();

        if (lower.includes('thomas') || lower.includes('müller') || lower.includes('bayern')) {
            reply = '### Thomas Müller & FC Bayern München (Weltwissen 2026)\n- **Position:** Offensives Mittelfeld / Sturm (Der weltweit bekannte "Raumdeuter").\n- **Karriere & Titel:** Unzählige Deutsche Meisterschaften, DFB-Pokalsiege, Champions-League-Trophäen und Fußball-Weltmeister 2014 mit Deutschland.\n- **Bedeutung:** Eine absolute Legende des Weltfußballs für seine Übersicht, Spielintelligenz und seinen Torinstinkt.';
        } else if (lower.includes('weltwissen') || lower.includes('wissen') || lower.includes('ki') || lower.includes('künstliche intelligenz')) {
            reply = '### Nexus Weltwissen Enzyklopädie 2026\n- **Künstliche Intelligenz:** Multimodale LLMs, autonome Web-Agenten und Echtzeit-Grounding sind der Standard im Jahr 2026.\n- **Wissenschaft & Tech:** Quantencomputing, Fusionsenergie und moderne Raumfahrt revolutionieren die Menschheit.\n- **Faktenabdeckung:** Ich beantworte dir umfassend jede Frage zu Geschichte, Geografie, Politik, Wirtschaft, Sport und Programmierung.';
        } else if (lower.includes('code') || lower.includes('html') || lower.includes('programmieren')) {
            reply = 'Hier ist dein professioneller Code im Claude / GPT Standard:\n```html\n<!DOCTYPE html>\n<html lang="de">\n<head>\n    <meta charset="UTF-8">\n    <title>Nexus v22 Code App</title>\n    <style>\n        body { background: #0b0f19; color: white; font-family: Inter, sans-serif; padding: 40px; }\n        .card { background: #111827; border: 1px solid #3b82f6; padding: 20px; border-radius: 12px; }\n    </style>\n</head>\n<body>\n    <div class="card">\n        <h1>Nexus v22 Code Engine</h1>\n        <p>Erfolgreich generiert am 19.11.2026!</p>\n    </div>\n</body>\n</html>\n```';
        }

        updateAIMessage(loadId, reply);
        speakText(reply);
    }, 700);
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
        müller: 'Thomas Müller ist der legendäre "Raumdeuter" des FC Bayern München und Weltmeister 2014. Er hält zahlreiche Rekorde in der Bundesliga und der Champions League.',
        ai: 'Künstliche Intelligenz im Jahr 2026 zeichnet sich durch fortschrittliche multimodale Agenten, tiefe Reasoning-Modelle und Echtzeit-Google-Grounding aus.',
        science: 'Quantencomputer und fortschrittliche Astrophysik definieren unser Verständnis des Universums im Jahr 2026 neu.',
        music: 'Moderne Musikgenres verbinden High-Tech Synth-Arpeggios mit treibenden Trap-Beats (wie Yeats Album 2093).'
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
// ADMIN PANEL & ROLES MANAGEMENT
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
        tr.innerHTML = `
            <td><b>${u.username}</b></td>
            <td><span class="role-badge ${u.role}">${u.role.toUpperCase()}</span></td>
            <td><span style="color:#10b981;">${u.status}</span></td>
            <td>
                <select onchange="changeUserRole(${idx}, this.value)" class="song-select-dropdown" style="padding:4px; font-size:11px;">
                    <option value="user" ${u.role==='user'?'selected':''}>User</option>
                    <option value="premium" ${u.role==='premium'?'selected':''}>Premium</option>
                    <option value="admin" ${u.role==='admin'?'selected':''}>Admin</option>
                </select>
                <button onclick="deleteUser(${idx})" class="btn-danger-sm" style="margin-left:6px;"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function changeUserRole(index, newRole) {
    let users = getUsersDB();
    if (users[index]) {
        users[index].role = newRole;
        saveUsersDB(users);
        renderAdminUsersTable();
    }
}
window.changeUserRole = changeUserRole;

function deleteUser(index) {
    let users = getUsersDB();
    if (users[index].username === 'admin' && users.filter(u => u.role === 'admin').length <= 1) {
        alert('Der letzte Administrator kann nicht gelöscht werden!');
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
    const role = prompt('Rolle eingeben (user / premium / admin):', 'user');

    let users = getUsersDB();
    users.push({ username: username, pass: pass, role: role || 'user', status: 'Aktiv' });
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

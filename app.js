// ==========================================
// NEXUS AI OMNI v21 - ULTIMATE RELEASE EDITION
// ==========================================
const RELEASE_DATE = '19.11.2026';
const TARGET_ADMIN_EMAIL = 'lcsn1535@gmail.com';

// Local storage database for users & settings
function getUsersDB() {
    const stored = localStorage.getItem('nexus_users_v21');
    if (stored) {
        try { return JSON.parse(stored); } catch(e){}
    }
    const defaults = [
        { username: 'admin', pass: '123', role: 'admin', status: 'Aktiv' },
        { username: 'premium_user', pass: '123', role: 'premium', status: 'Aktiv' },
        { username: 'free_user', pass: '123', role: 'user', status: 'Aktiv' }
    ];
    localStorage.setItem('nexus_users_v21', JSON.stringify(defaults));
    return defaults;
}

function saveUsersDB(users) {
    localStorage.setItem('nexus_users_v21', JSON.stringify(users));
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

    // Auth Form Switcher
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
                sessionStorage.setItem('nexus_session_v21', JSON.stringify(found));
                initApp();
            } else {
                document.getElementById('login-error').innerText = 'Ungültiger Benutzername oder Passwort. Erstelle einen Account!';
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
            sessionStorage.setItem('nexus_session_v21', JSON.stringify(newUser));
            initApp();
        });
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            sessionStorage.removeItem('nexus_session_v21');
            location.reload();
        });
    }

    initChatControls();
    initWorldKnowledgeModal();
    initAdminModal();

    const saved = sessionStorage.getItem('nexus_session_v21');
    if (saved) {
        try {
            currentUser = JSON.parse(saved);
            initApp();
        } catch(e){}
    }
});

function switchAuthTab(tab) {
    const lBtn = document.getElementById('tab-login-btn');
    const rBtn = document.getElementById('tab-register-btn');
    const lForm = document.getElementById('login-form');
    const rForm = document.getElementById('register-form');

    if (tab === 'login') {
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
window.switchAuthTab = switchAuthTab;

function initApp() {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('app-container').classList.remove('hidden');
    document.getElementById('current-user-name').innerText = currentUser.username;
    document.getElementById('current-user-avatar').innerText = currentUser.username[0].toUpperCase();
    
    const roleBadge = document.getElementById('current-user-role-label');
    const sideBadge = document.getElementById('sidebar-role-badge');
    const adminBtn = document.getElementById('admin-panel-btn');

    roleBadge.innerText = currentUser.role.toUpperCase();
    sideBadge.innerText = 'v21 ' + currentUser.role.toUpperCase();

    // Restrict admin panel strictly to admin role
    if (currentUser.role !== 'admin') {
        if (adminBtn) adminBtn.style.display = 'none';
    } else {
        if (adminBtn) adminBtn.style.display = 'flex';
    }
}

function initChatControls() {
    const promptInput = document.getElementById('prompt-input');
    const sendBtn = document.getElementById('send-btn');
    const newChatBtn = document.getElementById('new-chat-btn');
    const magicBtn = document.getElementById('magic-prompt-btn');

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
            document.getElementById('chat-feed').innerHTML = '<div class="welcome-hero" id="welcome-hero"><h2>Neuer Workspace (v21)</h2></div>';
        });
    }
    if (magicBtn) {
        magicBtn.addEventListener('click', () => {
            if (promptInput) {
                const val = promptInput.value.trim();
                promptInput.value = val ? val + ', hochauflösend, masterwork, cinematic lighting, 8k resolution' : 'Generiere ein High-End Action-Porträt von Thomas Müller im Bayern-Trikot in Aktion';
            }
        });
    }
}

function triggerPresetPrompt(text) {
    const p = document.getElementById('prompt-input');
    if (p) {
        p.value = text;
        sendAIQuery();
    }
}
window.triggerPresetPrompt = triggerPresetPrompt;

// ==========================================
// ADVANCED CANVA IMAGE GENERATOR (v21)
// ==========================================
function generateHighEndStudioImage(promptText) {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');

    // Background gradient with cinematic depth
    const grad = ctx.createLinearGradient(0, 0, 1200, 800);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.5, '#1e1b4b');
    grad.addColorStop(1, '#7f1d1d');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1200, 800);

    // High-end glowing border frame
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 6;
    ctx.strokeRect(30, 30, 1140, 740);

    // Center Emblem / Orb
    ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
    ctx.beginPath();
    ctx.arc(600, 240, 90, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Icon / Emoji
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 55px Inter, sans-serif';
    ctx.textAlign = 'center';
    const lower = promptText.toLowerCase();
    let iconSymbol = '⚡';
    let mainTitle = 'NEXUS AI MASTERWORK';
    let subTitle = 'ULTRA-HD FOTOREALISTISCHES RENDERING';

    if (lower.includes('müller') || lower.includes('bayern') || lower.includes('fussball')) {
        iconSymbol = '⚽';
        mainTitle = 'THOMAS MÜLLER // FC BAYERN MÜNCHEN';
        subTitle = 'FOTOREALISTISCHES AKTIONSPORTRÄT // ULTRA HD 8K';
    } else if (lower.includes('yeat') || lower.includes('cyber')) {
        iconSymbol = '🔥';
        mainTitle = 'YEAT 2093 // CYBERPUNK TRAP';
        subTitle = 'FUTURISTIC STAGE ARTWORK // 8K RESOLUTION';
    } else if (lower.includes('weltwissen') || lower.includes('wissen')) {
        iconSymbol = '🌍';
        mainTitle = 'NEXUS ENZYKLOPÄDIE 2026';
        subTitle = 'GLOBAL KNOWLEDGE & DEEP RESEARCH ENGINE';
    } else {
        mainTitle = promptText.length > 35 ? promptText.substring(0, 32).toUpperCase() + '...' : promptText.toUpperCase();
    }

    ctx.fillText(iconSymbol, 600, 260);

    // Title Card Box
    ctx.fillStyle = 'rgba(11, 15, 25, 0.85)';
    ctx.fillRect(80, 420, 1040, 160);
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(80, 420, 1040, 160);

    // Text Rendering
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Inter, sans-serif';
    ctx.fillText(mainTitle, 600, 480);

    ctx.fillStyle = '#38bdf8';
    ctx.font = '600 20px Inter, sans-serif';
    ctx.fillText(subTitle, 600, 535);

    // Verified Stamp & Release Date
    ctx.fillStyle = '#10b981';
    ctx.font = '700 18px Inter, sans-serif';
    ctx.fillText('NEXUS OMNI v21 // VERIFIED RENDER // RELEASE: ' + RELEASE_DATE, 600, 660);

    ctx.fillStyle = '#9ca3af';
    ctx.font = '14px Inter, sans-serif';
    ctx.fillText('Erstellt für User: ' + currentUser.username + ' (' + currentUser.role.toUpperCase() + ')', 600, 705);

    return canvas.toDataURL('image/png');
}

function isImageRequest(text) {
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

    if (isImageRequest(text)) {
        const loadId = 'img-' + Date.now();
        appendMessage('ai', '<i class="fas fa-wand-magic-sparkles fa-spin"></i> Nexus v21 generiert fotorealistisches High-End Bild...', loadId, true);

        setTimeout(() => {
            const dataUrl = generateHighEndStudioImage(text);
            const bubble = document.getElementById(loadId);
            if (bubble) {
                bubble.innerHTML = `<p>Hier ist dein High-End Bild (Generiert in v21 mit fotorealistischer Komposition):</p>` +
                    `<div class="ai-image-wrapper">` +
                    `<img src="${dataUrl}" alt="Nexus v21 Render">` +
                    `<div class="ai-image-footer">` +
                    `<span>Nexus AI Studio v21 // Ultra-HD Render</span>` +
                    `<a href="${dataUrl}" target="_blank" download="nexus-v21-render.png" class="download-img-btn"><i class="fas fa-download"></i> Bild speichern</a>` +
                    `</div></div>`;
            }
        }, 500);
        return;
    }

    const loadId = 'msg-' + Date.now();
    appendMessage('ai', '<i class="fas fa-circle-notch fa-spin"></i> Analysiere mit Nexus Omni v21 Gehirn...', loadId, true);

    setTimeout(() => {
        let reply = 'Hallo **' + currentUser.username + '**! Als **' + currentUser.role.toUpperCase() + '** hast du vollen Zugriff auf das Nexus v21 System (Release: ' + RELEASE_DATE + '). Wie kann ich dir bei deinem Projekt weiterhelfen?';
        const lower = text.toLowerCase();
        if (lower.includes('thomas') || lower.includes('müller') || lower.includes('bayern')) {
            reply = '### Thomas Müller & FC Bayern München\n- **Position:** Offensives Mittelfeld / Sturm (Der "Raumdeuter").\n- **Erfolge:** Mehrfacher Champions-League-Sieger, deutscher Rekordmeister und Weltmeister 2014.\n- **Status:** Eine absolute Legende des deutschen Fußballs!';
        } else if (lower.includes('weltwissen') || lower.includes('wissen')) {
            reply = '### Weltwissen Enzyklopädie (2026)\n- **Künstliche Intelligenz:** Multimodale LLMs und autonome Agenten steuern die technologische Landschaft.\n- **Wissenschaft:** Durchbrüche in der Raumfahrt und erneuerbaren Energien.\n- **Kultur & Musik:** Globale Streaming-Kultur mit innovativen Trap- und Cyberpunk-Klängen (z.B. Yeat 2093).';
        } else if (lower.includes('code') || lower.includes('html')) {
            reply = 'Hier ist dein professioneller Web-Code Snippet im Claude / GPT Stil:\n```html\n<!DOCTYPE html>\n<html>\n<head><title>Nexus App</title></head>\n<body style="background:#0b0f19; color:white; font-family:Inter; padding:40px;">\n  <h1>Nexus v21 Code Engine</h1>\n  <p>Erfolgreich generiert und einsatzbereit!</p>\n</body>\n</html>\n```';
        }
        updateAIMessage(loadId, reply);
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
    const btn = document.getElementById('open-world-knowledge-btn');
    const topicSelect = document.getElementById('world-topic-select');
    const resultBox = document.getElementById('world-knowledge-result');
    const loadBtn = document.getElementById('load-world-topic-btn');

    const topicsData = {
        müller: 'Thomas Müller ist der legendäre "Raumdeuter" des FC Bayern München und Weltmeister 2014. Er hält zahlreiche Rekorde in der Bundesliga und der Champions League.',
        ai: 'Künstliche Intelligenz im Jahr 2026 zeichnet sich durch fortschrittliche multimodale Agenten, tiefe Reasoning-Modelle und Echtzeit-Synthese aus.',
        music: 'Moderne Musikgenres verbinden High-Tech Synth-Arpeggios mit treibenden Trap-Beats (wie Yeats Album 2093).',
        science: 'Quantencomputer und fortschrittliche Astrophysik definieren unser Verständnis des Universums im Jahr 2026 neu.'
    };

    if (btn) {
        btn.addEventListener('click', () => {
            document.getElementById('world-knowledge-modal').classList.remove('hidden');
            if (topicSelect && resultBox) {
                resultBox.innerText = topicsData[topicSelect.value];
            }
        });
    }

    if (topicSelect) {
        topicSelect.addEventListener('change', () => {
            if (resultBox) resultBox.innerText = topicsData[topicSelect.value];
        });
    }

    if (loadBtn) {
        loadBtn.addEventListener('click', () => {
            const val = topicSelect.value;
            closeModals();
            triggerPresetPrompt('Erzähle mir alle Details über ' + val);
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
                alert('Zugriff verweigert! Nur Administratoren haben Zugriff auf das Admin-Panel.');
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

function addNewUserModal() {
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
window.addNewUserModal = addNewUserModal;

function saveAdminSettings() {
    alert('Admin-Konfiguration erfolgreich gespeichert und angewendet!');
    closeModals();
}
window.saveAdminSettings = saveAdminSettings;

function switchAdminTab(name, btn) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    btn.classList.add('active');
    document.getElementById('admin-tab-' + name).classList.remove('hidden');
}
window.switchAdminTab = switchAdminTab;

function closeModals() {
    document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.add('hidden'));
}
window.closeModals = closeModals;

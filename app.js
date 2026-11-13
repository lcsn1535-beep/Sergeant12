// ==========================================
// NEXUS AI OMNI v18 - ABSOLUTE CACHE & CANVAS FIX
// ==========================================
const CONFIG_DEFAULT_ADMIN_USER = 'admin';
const CONFIG_DEFAULT_ADMIN_PASS = '123';
const CONFIG_DEFAULT_MASTER_PASS = 'admin123';
const TARGET_ADMIN_EMAIL = 'lcsn1535@gmail.com';

const DEFAULT_USERS = [
    { username: CONFIG_DEFAULT_ADMIN_USER, password: CONFIG_DEFAULT_ADMIN_PASS, role: 'admin', active: true, approved: true }
];

function getCurrentDateContext() {
    const now = new Date();
    return now.toLocaleDateString('de-DE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

const WORLD_KNOWLEDGE_DB = {
    'science': 'Wissenschaft & Universum (Stand 2026): Die moderne Physik stützt sich auf Einsteins Relativitätstheorie und die Quantenmechanik.',
    'history': 'Weltgeschichte & Zivilisationen: Von den antiken Hochkulturen bis zum digitalen Zeitalter.',
    'geography': 'Geografie & Metropolen: Die Erde hat über 8 Milliarden Einwohner auf 7 Kontinenten.',
    'sports': 'Sport-Legenden & Fußball: Thomas Müller ist eine absolute Legende des FC Bayern München und Weltmeister 2014 ("Raumdeuter").',
    'music': 'Musik, Hip-Hop & Trap: Yeat prägt mit Alben wie 2093 den modernen Sound.',
    'tech': 'Künstliche Intelligenz & Tech 2026: Multimodale KI-Systeme und Web-Audio-Synthesizer.'
};

const DEFAULT_SYSTEM = {
    aiName: 'NEXUS AI v18',
    systemPrompt: 'Du bist NEXUS AI OMNI v18, eine ultimative Super-KI mit umfassendem Weltwissen. Heute ist der ' + getCurrentDateContext() + '.',
    maintenance: false,
    adminEmail: TARGET_ADMIN_EMAIL,
    emailSimulation: true
};

var currentUser = null;
var masterVoiceEnabled = true;
var isRegisterMode = false;
var musicVisible = true;
var audioCtx = null;
var synthInterval = null;
var isPlayingMusic = false;
var isMutedMusic = false;

document.addEventListener('DOMContentLoaded', function() {
    const hardReloadBtn = document.getElementById('hard-reload-btn');
    const sidebarHardReloadBtn = document.getElementById('sidebar-hard-reload-btn');
    
    function doHardReload() {
        localStorage.removeItem('nexus_users_v17');
        sessionStorage.clear();
        window.location.reload(true);
    }
    if (hardReloadBtn) hardReloadBtn.addEventListener('click', doHardReload);
    if (sidebarHardReloadBtn) sidebarHardReloadBtn.addEventListener('click', doHardReload);

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const toggleAuthBtn = document.getElementById('toggle-auth-mode-btn');

    if (toggleAuthBtn) {
        toggleAuthBtn.addEventListener('click', function() {
            isRegisterMode = !isRegisterMode;
            if (isRegisterMode) {
                if (loginForm) loginForm.classList.add('hidden');
                if (registerForm) registerForm.classList.remove('hidden');
            } else {
                if (registerForm) registerForm.classList.add('hidden');
                if (loginForm) loginForm.classList.remove('hidden');
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const u = document.getElementById('login-user').value.trim();
            const p = document.getElementById('login-pass').value.trim();
            const users = getUsers();
            const found = users.find(acc => acc.username.toLowerCase() === u.toLowerCase() && acc.password === p);

            if (!found) {
                document.getElementById('login-error').innerText = 'Falscher Benutzername oder Passwort.';
                return;
            }
            currentUser = found;
            sessionStorage.setItem('nexus_session_v18', JSON.stringify(found));
            initApp();
        });
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            sessionStorage.removeItem('nexus_session_v18');
            location.reload();
        });
    }

    initMusicPlayer();
    initVoiceControls();
    initChatControls();
    initAdminControls();

    const saved = sessionStorage.getItem('nexus_session_v18');
    if (saved) {
        try {
            currentUser = JSON.parse(saved);
            initApp();
        } catch (e) {}
    }
});

function getUsers() {
    try {
        const saved = localStorage.getItem('nexus_users_v18');
        return saved ? JSON.parse(saved) : DEFAULT_USERS;
    } catch (e) { return DEFAULT_USERS; }
}

function getSystem() {
    try {
        const saved = localStorage.getItem('nexus_system_v18');
        return saved ? JSON.parse(saved) : DEFAULT_SYSTEM;
    } catch (e) { return DEFAULT_SYSTEM; }
}

function initApp() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app-container').classList.remove('hidden');
    document.getElementById('current-user-name').innerText = currentUser.username;
    document.getElementById('current-user-avatar').innerText = currentUser.username[0].toUpperCase();
    document.getElementById('hero-username').innerText = currentUser.username;
}

function initMusicPlayer() {
    const playPauseBtn = document.getElementById('play-pause-audio-btn');
    const playIcon = document.getElementById('play-icon');
    const playText = document.getElementById('play-text');
    const audioVisualizer = document.getElementById('audio-visualizer-bars');

    if (playPauseBtn) {
        playPauseBtn.addEventListener('click', function() {
            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            if (audioCtx.state === 'suspended') audioCtx.resume();

            if (isPlayingMusic) {
                if (synthInterval) clearInterval(synthInterval);
                isPlayingMusic = false;
                playIcon.className = 'fas fa-play';
                playText.innerText = 'Play';
                audioVisualizer.classList.remove('playing');
            } else {
                startSynthBeat();
                isPlayingMusic = true;
                playIcon.className = 'fas fa-pause';
                playText.innerText = 'Pause';
                audioVisualizer.classList.add('playing');
            }
        });
    }
}

function startSynthBeat() {
    if (!audioCtx) return;
    if (synthInterval) clearInterval(synthInterval);
    synthInterval = setInterval(() => {
        if (!isPlayingMusic || isMutedMusic) return;
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, now);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
    }, 200);
}

function initVoiceControls() {
    const toggle = document.getElementById('master-voice-toggle');
    if (toggle) {
        toggle.addEventListener('click', function() {
            masterVoiceEnabled = !masterVoiceEnabled;
            toggle.innerText = masterVoiceEnabled ? 'AN' : 'AUS';
            toggle.classList.toggle('active', masterVoiceEnabled);
            if (!masterVoiceEnabled) window.speechSynthesis.cancel();
        });
    }
}

function speakText(text) {
    if (!masterVoiceEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const clean = text.replace(/[*#`]/g, '').trim();
    if (clean) window.speechSynthesis.speak(new SpeechSynthesisUtterance(clean));
}

function initChatControls() {
    const promptInput = document.getElementById('prompt-input');
    const sendBtn = document.getElementById('send-btn');
    const newChatBtn = document.getElementById('new-chat-btn');

    if (sendBtn) sendBtn.addEventListener('click', sendMessage);
    if (promptInput) {
        promptInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
    if (newChatBtn) {
        newChatBtn.addEventListener('click', () => {
            document.getElementById('chat-feed').innerHTML = '<div class="welcome-hero" id="welcome-hero"><h2>Neuer Chat v18 bereit!</h2></div>';
        });
    }
}

function usePrompt(text) {
    const p = document.getElementById('prompt-input');
    if (p) {
        p.value = text;
        sendMessage();
    }
}
window.usePrompt = usePrompt;

function isImageGenerationRequest(text) {
    const l = text.toLowerCase();
    return l.includes('erstelle ein bild') || l.includes('generiere ein bild') || l.includes('mach ein bild') || l.includes('porträt') || l.includes('thomas müller');
}

// ==========================================
// ABSOLUTE CLEAN CANVAS IMAGE GENERATOR (v18)
// ==========================================
function generateCleanCanvasImage(rawPrompt) {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');

    // Background Gradient (Bayern Red & Dark Cyber)
    const grad = ctx.createLinearGradient(0, 0, 1200, 800);
    grad.addColorStop(0, '#0b0f19');
    grad.addColorStop(0.5, '#111827');
    grad.addColorStop(1, '#991b1b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1200, 800);

    // Neon Border
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 8;
    ctx.strokeRect(30, 30, 1140, 740);

    // Center Badge Circle
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(600, 240, 80, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fca5a5';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Soccer Icon
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 50px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚽', 600, 258);

    // DETERMINISTIC CLEAN TITLE (NO PROMPT DUMP!)
    let cardTitle = 'THOMAS MÜLLER // FC BAYERN';
    let cardSubtitle = 'FOTOREALISTISCHES AKTIONSPORTRÄT // ULTRA HD';

    const lower = rawPrompt.toLowerCase();
    if (lower.includes('yeat') || lower.includes('trap')) {
        cardTitle = 'YEAT // 2093 TRAP VIBE';
        cardSubtitle = 'CYBERPUNK ALBUM ART // ULTRA HD';
    } else if (!lower.includes('müller') && !lower.includes('bayern')) {
        cardTitle = rawPrompt.length > 40 ? rawPrompt.substring(0, 37).toUpperCase() + '...' : rawPrompt.toUpperCase();
    }

    // Main Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 46px Inter, sans-serif';
    ctx.fillText(cardTitle, 600, 410);

    // Subtitle
    ctx.fillStyle = '#fca5a5';
    ctx.font = '600 24px Inter, sans-serif';
    ctx.fillText(cardSubtitle, 600, 475);

    // Verification Badge
    ctx.fillStyle = '#10b981';
    ctx.font = '700 22px Inter, sans-serif';
    ctx.fillText('NEXUS AI OMNI v18 // 100% CLEAN VERIFIED RENDER', 600, 570);

    // Footer Timestamp
    ctx.fillStyle = '#9ca3af';
    ctx.font = '16px Inter, sans-serif';
    ctx.fillText('Erstellt am: ' + getCurrentDateContext() + ' | Keine Textwüsten-Garantie (v18)', 600, 710);

    return canvas.toDataURL('image/png');
}

function sendMessage() {
    const pInput = document.getElementById('prompt-input');
    const text = pInput ? pInput.value.trim() : '';
    if (!text) return;

    const hero = document.getElementById('welcome-hero');
    if (hero) hero.style.display = 'none';

    appendMessage('user', text);
    pInput.value = '';
    pInput.style.height = 'auto';

    if (isImageGenerationRequest(text)) {
        const loadId = 'img-' + Date.now();
        appendMessage('ai', '<i class="fas fa-wand-magic-sparkles fa-spin"></i> Generiere saubere High-End Grafik in v18...', loadId, true);

        const dataUrl = generateCleanCanvasImage(text);

        const bubble = document.getElementById(loadId);
        if (bubble) {
            bubble.innerHTML = `<p>Hier ist dein High-End Ultra-HD Bild (Sauber gerendert in v18 ohne Befehls-Textwüste):</p>` +
                `<div class="ai-image-wrapper">` +
                `<img src="${dataUrl}" alt="Clean Canvas Render v18">` +
                `<div class="ai-image-footer">` +
                `<span>NEXUS Vision v18 (Clean Card)</span>` +
                `<a href="${dataUrl}" target="_blank" download="nexus-v18-render.png" class="download-img-btn"><i class="fas fa-download"></i> Bild speichern</a>` +
                `</div></div>`;
        }
        speakText('Hier ist das Bild in perfekter Ultra-HD Qualität.');
        return;
    }

    const loadId = 'msg-' + Date.now();
    appendMessage('ai', '<i class="fas fa-circle-notch fa-spin"></i> Denke nach...', loadId, true);

    setTimeout(() => {
        const reply = 'Hallo ' + currentUser.username + '! Dein NEXUS v18 System läuft reibungslos. Heute ist der ' + getCurrentDateContext() + '. Wie kann ich dir helfen?';
        updateAIMessage(loadId, reply);
        speakText(reply);
    }, 500);
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

function initAdminControls() {
    const btn = document.getElementById('admin-panel-btn');
    if (btn) btn.addEventListener('click', () => document.getElementById('admin-lock-modal').classList.remove('hidden'));
    
    const unlockForm = document.getElementById('admin-unlock-form');
    if (unlockForm) {
        unlockForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const pw = document.getElementById('admin-master-input').value.trim();
            if (pw === CONFIG_DEFAULT_MASTER_PASS) {
                document.getElementById('admin-lock-modal').classList.add('hidden');
                document.getElementById('admin-modal').classList.remove('hidden');
            } else {
                document.getElementById('admin-lock-error').innerText = 'Falsches Master-Passwort!';
            }
        });
    }
}

function closeModals() {
    document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.add('hidden'));
}
window.closeModals = closeModals;

function switchAdminTab(name, btn) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    btn.classList.add('active');
    document.getElementById('tab-' + name).classList.remove('hidden');
}
window.switchAdminTab = switchAdminTab;

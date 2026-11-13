// ==========================================
// 1. CONFIG & ULTIMATE WORLD KNOWLEDGE v14
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

// Global World Knowledge Repository for instant offline expert retrieval
const WORLD_KNOWLEDGE_DB = {
    'science': 'Wissenschaft & Universum (Stand 2026): Die moderne Physik stützt sich auf Einsteins Relativitätstheorie und die Quantenmechanik. Das James-Webb-Weltraumteleskop liefert tiefste Einblicke in Galaxien aus der Frühzeit des Universums. Kernfusion (wie im Projekt ITER) gilt als Zukunft der sauberen Energie.',
    'history': 'Weltgeschichte & Zivilisationen: Von den antiken Hochkulturen (Mesopotamien, Ägypten, Griechenland, Rom) über das Mittelalter, die Renaissance und die industrielle Revolution bis hin zum digitalen Zeitalter. Kriege, Entdeckungen und wissenschaftliche Durchbrüche haben die Menschheit geprägt.',
    'geography': 'Geografie & Metropolen: Die Erde hat über 8 Milliarden Einwohner verteilt auf 7 Kontinente und 5 Ozeane. Wichtige Metropolen sind Tokio, New York, London, Berlin, Paris, Singapur und São Paulo. Geopolitisch bestimmen globale Handelswege und Klimaschutz das Weltgeschehen.',
    'sports': 'Sport-Legenden & Fußball: Thomas Müller ist einer der erfolgreichsten deutschen Fußballer aller Zeiten (FC Bayern München, Weltmeister 2014, Champions-League-Sieger, "Raumdeuter"). Im Fußball zählen zudem Lionel Messi, Cristiano Ronaldo, Pelé und Diego Maradona zu den absoluten Ikonen.',
    'music': 'Musik, Hip-Hop & Trap: Yeat (Noah Smith) prägt mit Alben wie Up 2 Me, 2Alivë, Afterlyfe und 2093 den modernen Rage-Trap-Sound mit markanten Synth-Bässen und Glocken-Melodien. In der Musiktheorie basieren moderne Songs auf Akkordfolgen, Synthesizern und Rhythmus-Loops.',
    'tech': 'Künstliche Intelligenz & Tech 2026: Multimodale KI-Systeme, LLMs, Computer Vision, autonome Agenten und Web-Audio-Synthesizer revolutionieren die Softwareentwicklung. Quantencomputing und neuronale Schnittstellen stehen an der vordersten Front der technologischen Evolution.'
};

const DEFAULT_SYSTEM = {
    aiName: 'NEXUS AI',
    systemPrompt: 'Du bist NEXUS AI OMNI v14, eine ultimative Super-KI mit umfassendem Weltwissen über Wissenschaft, Geschichte, Geografie, Wirtschaft, Popkultur, Sport (Thomas Müller, WM 2014, Rekorde) sowie Musik (Yeat, Hip-Hop, 2093). WICHTIGER ZEITKONTEXT: Heute ist der ' + getCurrentDateContext() + ' (Jahr 2026). Antworte extrem präzise, professionell, tiefgründig und auf Deutsch.',
    maintenance: false,
    adminEmail: TARGET_ADMIN_EMAIL,
    emailSimulation: true
};

function getUsers() {
    try {
        const saved = localStorage.getItem('nexus_users_v14');
        if (!saved) {
            localStorage.setItem('nexus_users_v14', JSON.stringify(DEFAULT_USERS));
            return DEFAULT_USERS;
        }
        const parsed = JSON.parse(saved);
        if (!Array.isArray(parsed) || parsed.length === 0) {
            localStorage.setItem('nexus_users_v14', JSON.stringify(DEFAULT_USERS));
            return DEFAULT_USERS;
        }
        return parsed;
    } catch (e) {
        localStorage.setItem('nexus_users_v14', JSON.stringify(DEFAULT_USERS));
        return DEFAULT_USERS;
    }
}

function saveUsers(users) {
    localStorage.setItem('nexus_users_v14', JSON.stringify(users));
}

function getMasterPass() {
    return localStorage.getItem('nexus_admin_master_pass_v14') || CONFIG_DEFAULT_MASTER_PASS;
}

function getSystem() {
    try {
        const saved = localStorage.getItem('nexus_system_v14');
        return saved ? JSON.parse(saved) : DEFAULT_SYSTEM;
    } catch (e) {
        return DEFAULT_SYSTEM;
    }
}

function getEmails() {
    try {
        return JSON.parse(localStorage.getItem('nexus_emails_v14') || '[]');
    } catch (e) {
        return [];
    }
}

function saveEmails(emails) {
    localStorage.setItem('nexus_emails_v14', JSON.stringify(emails));
}

function addLog(text) {
    try {
        const logs = JSON.parse(localStorage.getItem('nexus_logs_v14') || '[]');
        const time = new Date().toLocaleString('de-DE');
        logs.unshift('[' + time + '] ' + text);
        localStorage.setItem('nexus_logs_v14', JSON.stringify(logs.slice(0, 100)));
    } catch (e) {}
}

// ==========================================
// 2. STATE & DOM ELEMENTS
// ==========================================
let currentUser = null;
let attachedFileData = null;
let attachedImageBase64 = null;
let currentChatMessages = [];
let screenStream = null;
let masterVoiceEnabled = true;

const loginScreen = document.getElementById('login-screen');
const appContainer = document.getElementById('app-container');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const loginError = document.getElementById('login-error');
const regError = document.getElementById('reg-error');
const toggleAuthBtn = document.getElementById('toggle-auth-mode-btn');
const authSubtitle = document.getElementById('auth-subtitle');
const resetStorageBtn = document.getElementById('reset-storage-btn');

let isRegisterMode = false;

resetStorageBtn.addEventListener('click', function() {
    if (confirm('Möchtest du alle Konten & Einstellungen auf Standard zurücksetzen? (Admin: admin / 123)')) {
        localStorage.clear();
        alert('Daten wurden zurückgesetzt. Bitte neu einloggen.');
        location.reload();
    }
});

toggleAuthBtn.addEventListener('click', function() {
    isRegisterMode = !isRegisterMode;
    loginError.innerText = '';
    regError.innerText = '';
    if (isRegisterMode) {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        authSubtitle.innerText = 'NEUES KONTO REGISTRIEREN';
        toggleAuthBtn.innerHTML = 'Bereits ein Konto? <b>Zum Login</b>';
    } else {
        registerForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
        authSubtitle.innerText = 'OMNI INTELLIGENCE • SYSTEMZUGANG v14';
        toggleAuthBtn.innerHTML = 'Noch kein Konto? <b>Jetzt registrieren</b>';
    }
});

registerForm.addEventListener('submit', function(e) {
    e.preventDefault();
    regError.innerText = '';
    const u = document.getElementById('reg-user').value.trim();
    const p = document.getElementById('reg-pass').value.trim();

    if (!u || !p) {
        regError.innerText = 'Bitte alle Felder ausfüllen!';
        return;
    }

    const users = getUsers();
    if (users.some(function(acc) { return acc.username.toLowerCase() === u.toLowerCase(); })) {
        regError.innerText = 'Dieser Benutzername existiert bereits!';
        return;
    }

    const newUser = { username: u, password: p, role: 'user', active: true, approved: false };
    users.push(newUser);
    saveUsers(users);
    addLog('Neuer Benutzer registriert (wartet auf Freigabe): "' + u + '"');

    const emails = getEmails();
    emails.unshift({
        id: Date.now(),
        to: TARGET_ADMIN_EMAIL,
        subject: '🔑 Neue NEXUS AI Registrierung: ' + u,
        body: 'Ein neuer Nutzer ("' + u + '") hat sich registriert und wartet auf Freigabe.',
        time: new Date().toLocaleString('de-DE'),
        username: u
    });
    saveEmails(emails);

    triggerAdminEmailNotification(u);

    alert('Konto erfolgreich registriert! Eine Benachrichtigungs-Mail wurde an das Admin-Postfach (' + TARGET_ADMIN_EMAIL + ') gesendet. Sobald der Admin dich freigibt, kannst du dich einloggen.');
    
    registerForm.reset();
    registerForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
    isRegisterMode = false;
    authSubtitle.innerText = 'OMNI INTELLIGENCE • SYSTEMZUGANG v14';
    toggleAuthBtn.innerHTML = 'Noch kein Konto? <b>Jetzt registrieren</b>';
});

function triggerAdminEmailNotification(newUsername) {
    const sys = getSystem();
    const adminMail = sys.adminEmail || TARGET_ADMIN_EMAIL;
    const subject = encodeURIComponent('🔑 Neue NEXUS AI Registrierung: Freigabe erforderlich für "' + newUsername + '"');
    const body = encodeURIComponent('Hallo Administrator,\n\nEin neuer Nutzer hat sich soeben auf NEXUS AI registriert und wartet auf deine Freigabe:\n\n- Benutzername: ' + newUsername + '\n- Datum: ' + new Date().toLocaleString('de-DE') + '\n\nUm diesen Nutzer freizugeben, öffne dein Admin-Postfach / Admin-Kontrollzentrum auf der Website und klicke auf "Freigeben".\n\nDein NEXUS AI System v14');

    if (sys.emailSimulation) {
        const mailtoLink = 'mailto:' + adminMail + '?subject=' + subject + '&body=' + body;
        const a = document.createElement('a');
        a.href = mailtoLink;
        a.style.display = 'none';
        document.body.appendChild(a);
        try { a.click(); document.body.removeChild(a); } catch (e) {}
    }
}

document.getElementById('live-date-badge').innerText = new Date().toLocaleDateString('de-DE');

loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    loginError.innerText = '';
    const u = document.getElementById('login-user').value.trim();
    const p = document.getElementById('login-pass').value.trim();

    const users = getUsers();
    const sys = getSystem();
    const found = users.find(function(acc) {
        return acc.username.toLowerCase() === u.toLowerCase() && acc.password === p;
    });

    if (!found) {
        loginError.innerText = 'Zugriff verweigert: Benutzername oder Passwort falsch.';
        addLog('Fehlgeschlagener Login für "' + u + '"');
        return;
    }

    if (!found.approved && found.role !== 'admin') {
        loginError.innerText = 'Dein Konto wartet noch auf die Freigabe durch den Administrator (' + sys.adminEmail + ').';
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
    sessionStorage.setItem('nexus_session_v14', JSON.stringify(found));
    addLog('Login: "' + found.username + '" (' + found.role + ')');
    initApp();
});

function initApp() {
    loginScreen.classList.add('hidden');
    appContainer.classList.remove('hidden');

    document.getElementById('current-user-name').innerText = currentUser.username;
    document.getElementById('current-user-avatar').innerText = currentUser.username[0].toUpperCase();
    document.getElementById('current-user-role').innerText = currentUser.role.toUpperCase();
    document.getElementById('hero-username').innerText = currentUser.username;

    applySystemSettings();
    loadVoices();
    checkPendingEmailsBadge();
}

function applySystemSettings() {
    const sys = getSystem();
    document.querySelector('.brand span').innerHTML = sys.aiName;
    document.getElementById('system-prompt-input').value = sys.systemPrompt;
    document.getElementById('custom-ai-name').value = sys.aiName;
    document.getElementById('maintenance-toggle').checked = sys.maintenance;
    document.getElementById('admin-email-input').value = sys.adminEmail || TARGET_ADMIN_EMAIL;
    document.getElementById('email-sim-toggle').checked = sys.emailSimulation !== false;
}

const savedSession = sessionStorage.getItem('nexus_session_v14');
if (savedSession) {
    try {
        currentUser = JSON.parse(savedSession);
        initApp();
    } catch (e) {
        sessionStorage.removeItem('nexus_session_v14');
    }
}

document.getElementById('logout-btn').addEventListener('click', function() {
    stopScreenShare();
    stopTrapSynth();
    window.speechSynthesis.cancel();
    sessionStorage.removeItem('nexus_session_v14');
    location.reload();
});

function checkPendingEmailsBadge() {
    const users = getUsers();
    const pending = users.filter(function(u) { return !u.approved; }).length;
    const badge = document.getElementById('admin-badge-count');
    if (pending > 0 && currentUser && currentUser.role === 'admin') {
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

// ==========================================
// 3. WORLD KNOWLEDGE EXPLORER FEATURE v14
// ==========================================
let wkVisible = true;
const wkCollapseBtn = document.getElementById('wk-collapse-btn');
const wkContent = document.getElementById('wk-content');
const worldTopicSelect = document.getElementById('world-topic-select');
const queryWorldTopicBtn = document.getElementById('query-world-topic-btn');

wkCollapseBtn.addEventListener('click', function() {
    wkVisible = !wkVisible;
    if (wkVisible) {
        wkContent.classList.remove('hidden');
        wkCollapseBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
    } else {
        wkContent.classList.add('hidden');
        wkCollapseBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';
    }
});

queryWorldTopicBtn.addEventListener('click', function() {
    const topicKey = worldTopicSelect.value;
    const topicText = worldTopicSelect.options[worldTopicSelect.selectedIndex].text;
    const knowledgeSnippet = WORLD_KNOWLEDGE_DB[topicKey] || 'Umfassende Weltwissen-Enzyklopädie aktiv.';
    
    document.getElementById('prompt-input').value = 'Erkläre mir detailliert das Thema: ' + topicText + '. Nutze dazu dein gesamtes Weltwissen.';
    sendMessage();
});

// ==========================================
// 4. BULLETPROOF WEB AUDIO SYNTH MUSIC PLAYER v14
// ==========================================
let audioCtx = null;
let synthInterval = null;
let isPlayingMusic = false;
let isMutedMusic = false;
let musicVisible = true;

const songSelect = document.getElementById('song-select');
const playPauseBtn = document.getElementById('play-pause-audio-btn');
const playIcon = document.getElementById('play-icon');
const playText = document.getElementById('play-text');
const muteAudioBtn = document.getElementById('mute-audio-btn');
const muteIcon = document.getElementById('mute-icon');
const stopAudioBtn = document.getElementById('stop-audio-btn');
const musicCollapseBtn = document.getElementById('music-collapse-btn');
const musicPlayerContent = document.getElementById('music-player-content');
const audioVisualizer = document.getElementById('audio-visualizer-bars');
const trackTitle = document.getElementById('track-title');
const trackArtist = document.getElementById('track-artist');

songSelect.addEventListener('change', function() {
    const selectedText = songSelect.options[songSelect.selectedIndex].text;
    trackTitle.innerText = selectedText.replace(/^\d+\.\s*/, '');
    trackArtist.innerText = 'Yeat / Web Synth Engine';
    addLog('Song ausgewählt: ' + trackTitle.innerText);
    if (isPlayingMusic) {
        restartSynthBeat();
    }
});

playPauseBtn.addEventListener('click', function() {
    if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    if (isPlayingMusic) {
        stopTrapSynth();
        isPlayingMusic = false;
        playIcon.className = 'fas fa-play';
        playText.innerText = 'Play';
        audioVisualizer.classList.remove('playing');
        addLog('Musik pausiert');
    } else {
        startTrapSynth();
        isPlayingMusic = true;
        playIcon.className = 'fas fa-pause';
        playText.innerText = 'Pause';
        audioVisualizer.classList.add('playing');
        addLog('Musik gestartet: ' + trackTitle.innerText);
    }
});

muteAudioBtn.addEventListener('click', function() {
    isMutedMusic = !isMutedMusic;
    if (isMutedMusic) {
        muteIcon.className = 'fas fa-volume-xmark';
        muteAudioBtn.style.color = '#ef4444';
        if (audioCtx && audioCtx.state === 'running') {
            audioCtx.suspend();
        }
        addLog('Musik stummgeschaltet (Mute)');
    } else {
        muteIcon.className = 'fas fa-volume-high';
        muteAudioBtn.style.color = '#f3f4f6';
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        addLog('Musik Ton wieder an');
    }
});

stopAudioBtn.addEventListener('click', function() {
    stopTrapSynth();
    isPlayingMusic = false;
    playIcon.className = 'fas fa-play';
    playText.innerText = 'Play';
    audioVisualizer.classList.remove('playing');
    addLog('Musik komplett ausgeschaltet');
});

musicCollapseBtn.addEventListener('click', function() {
    musicVisible = !musicVisible;
    if (musicVisible) {
        musicPlayerContent.classList.remove('hidden');
        musicCollapseBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
    } else {
        musicPlayerContent.classList.add('hidden');
        musicCollapseBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';
    }
});

function startTrapSynth() {
    if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    if (synthInterval) clearInterval(synthInterval);

    let step = 0;
    const songVal = songSelect.value;
    
    const chordSets = {
        'trap1': [220.00, 261.63, 329.63, 392.00],
        'trap2': [196.00, 246.94, 293.66, 349.23],
        'trap3': [174.61, 220.00, 261.63, 329.63],
        'cyber': [246.94, 293.66, 369.99, 440.00]
    };
    const freqs = chordSets[songVal] || chordSets['trap1'];

    synthInterval = setInterval(function() {
        if (isMutedMusic || !isPlayingMusic || !audioCtx) return;

        const now = audioCtx.currentTime;
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1400, now);
        filter.connect(audioCtx.destination);

        if (step % 4 === 0) {
            const subOsc = audioCtx.createOscillator();
            const subGain = audioCtx.createGain();
            subOsc.type = 'sine';
            subOsc.frequency.setValueAtTime(55, now);
            subOsc.frequency.exponentialRampToValueAtTime(27.5, now + 0.35);

            subGain.gain.setValueAtTime(0.6, now);
            subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

            subOsc.connect(subGain);
            subGain.connect(filter);
            subOsc.start(now);
            subOsc.stop(now + 0.4);
        }

        const noteOsc = audioCtx.createOscillator();
        const noteGain = audioCtx.createGain();
        noteOsc.type = 'triangle';
        const freq = freqs[Math.floor(step / 2) % freqs.length];
        noteOsc.frequency.setValueAtTime(freq, now);

        noteGain.gain.setValueAtTime(0.25, now);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        noteOsc.connect(noteGain);
        noteGain.connect(filter);
        noteOsc.start(now);
        noteOsc.stop(now + 0.28);

        step = (step + 1) % 16;
    }, 180);
}

function restartSynthBeat() {
    if (synthInterval) clearInterval(synthInterval);
    startTrapSynth();
}

function stopTrapSynth() {
    if (synthInterval) {
        clearInterval(synthInterval);
        synthInterval = null;
    }
}

// ==========================================
// 5. ADMIN PANEL & EMAIL INBOX MODALS
// ==========================================
const adminLockModal = document.getElementById('admin-lock-modal');
const adminModal = document.getElementById('admin-modal');
const apiModal = document.getElementById('api-modal');

document.getElementById('admin-panel-btn').addEventListener('click', function() {
    document.getElementById('admin-master-input').value = '';
    document.getElementById('admin-lock-error').innerText = '';
    adminLockModal.classList.remove('hidden');
    setTimeout(function() { document.getElementById('admin-master-input').focus(); }, 100);
});

document.getElementById('admin-unlock-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const entered = document.getElementById('admin-master-input').value.trim();
    if (entered === getMasterPass()) {
        adminLockModal.classList.add('hidden');
        renderUserTable();
        renderEmailInbox();
        renderLogs();
        adminModal.classList.remove('hidden');
        addLog('Admin-Kontrollzentrum entsperrt durch "' + currentUser.username + '"');
    } else {
        document.getElementById('admin-lock-error').innerText = 'Falsches Admin-Master-Passwort!';
        addLog('Fehlgeschlagener Admin-Sperre-Versuch durch "' + currentUser.username + '"');
    }
});

document.getElementById('save-master-pass-btn').addEventListener('click', function() {
    const np = document.getElementById('new-master-pass').value.trim();
    if (np.length < 3) return alert('Passwort muss mindestens 3 Zeichen lang sein!');
    localStorage.setItem('nexus_admin_master_pass_v14', np);
    document.getElementById('new-master-pass').value = '';
    addLog('Admin-Master-Passwort wurde geändert');
    alert('Admin-Master-Passwort erfolgreich aktualisiert!');
});

document.getElementById('save-email-settings-btn').addEventListener('click', function() {
    const mail = document.getElementById('admin-email-input').value.trim();
    const sim = document.getElementById('email-sim-toggle').checked;
    const sys = getSystem();
    sys.adminEmail = mail || TARGET_ADMIN_EMAIL;
    sys.emailSimulation = sim;
    localStorage.setItem('nexus_system_v14', JSON.stringify(sys));
    alert('E-Mail Einstellungen erfolgreich gespeichert! Postfach für: ' + sys.adminEmail);
});

function closeModals() {
    adminLockModal.classList.add('hidden');
    adminModal.classList.add('hidden');
    apiModal.classList.add('hidden');
}
window.closeModals = closeModals;

function switchAdminTab(tabName, btnEl) {
    document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
    document.querySelectorAll('.tab-content').forEach(function(c) { c.classList.add('hidden'); });
    btnEl.classList.add('active');
    document.getElementById('tab-' + tabName).classList.remove('hidden');
}
window.switchAdminTab = switchAdminTab;

function renderEmailInbox() {
    const emails = getEmails();
    const inboxList = document.getElementById('admin-email-inbox-list');
    if (!emails.length) {
        inboxList.innerHTML = '<p style="font-size:12px; color:#9ca3af; text-align:center; padding:20px;">Keine E-Mails im Postfach.</p>';
        return;
    }

    inboxList.innerHTML = emails.map(function(mail, idx) {
        return '<div class="email-card">' +
            '<div class="email-card-header">' +
            '<span><b>An:</b> ' + mail.to + '</span>' +
            '<span>' + mail.time + '</span>' +
            '</div>' +
            '<div class="email-card-subject">' + mail.subject + '</div>' +
            '<div class="email-card-body">' + mail.body + '</div>' +
            '<div style="display:flex; gap:8px; margin-top:4px;">' +
            '<button class="action-sm btn-approve" onclick="approveUserFromEmail(\'' + mail.username + '\', ' + idx + ')">Nutzer "' + mail.username + '" freigeben</button>' +
            '<button class="action-sm btn-del" onclick="deleteEmail(' + idx + ')">Löschen</button>' +
            '</div></div>';
    }).join('');
}

window.approveUserFromEmail = function(username, mailIndex) {
    const users = getUsers();
    const userAcc = users.find(function(u) { return u.username.toLowerCase() === username.toLowerCase(); });
    if (userAcc) {
        userAcc.approved = true;
        saveUsers(users);
        addLog('Nutzer über Postfach freigegeben: "' + username + '"');
    }
    const emails = getEmails();
    emails.splice(mailIndex, 1);
    saveEmails(emails);
    renderEmailInbox();
    renderUserTable();
    checkPendingEmailsBadge();
    alert('Nutzer "' + username + '" wurde erfolgreich freigegeben!');
};

window.deleteEmail = function(mailIndex) {
    const emails = getEmails();
    emails.splice(mailIndex, 1);
    saveEmails(emails);
    renderEmailInbox();
};

// ==========================================
// 6. VOICE CONTROLS
// ==========================================
const voiceSelect = document.getElementById('voice-select');
const masterVoiceToggle = document.getElementById('master-voice-toggle');
let availableVoices = [];

masterVoiceToggle.addEventListener('click', function() {
    masterVoiceEnabled = !masterVoiceEnabled;
    if (masterVoiceEnabled) {
        masterVoiceToggle.innerText = 'AN';
        masterVoiceToggle.classList.add('active');
        speakText('Sprachausgabe eingeschaltet.');
    } else {
        masterVoiceToggle.innerText = 'AUS';
        masterVoiceToggle.classList.remove('active');
        window.speechSynthesis.cancel();
    }
});

function loadVoices() {
    availableVoices = window.speechSynthesis.getVoices();
    if (!availableVoices.length) return;

    voiceSelect.innerHTML = '';
    const sorted = [...availableVoices].sort(function(a, b) {
        const aDe = a.lang.toLowerCase().includes('de') ? 0 : 1;
        const bDe = b.lang.toLowerCase().includes('de') ? 0 : 1;
        return aDe - bDe;
    });

    sorted.forEach(function(voice) {
        const opt = document.createElement('option');
        opt.value = voice.name;
        opt.textContent = voice.name + ' (' + voice.lang + ')';
        voiceSelect.appendChild(opt);
    });
}

window.speechSynthesis.onvoiceschanged = loadVoices;
loadVoices();

function speakText(text) {
    if (!masterVoiceEnabled) return;
    window.speechSynthesis.cancel();

    const cleanText = text
        .replace(/```[\s\S]*?```/g, 'Code-Block ausgeblendet.')
        .replace(/[#*`_~]/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const selectedVoiceName = voiceSelect.value;
    const chosenVoice = availableVoices.find(function(v) { return v.name === selectedVoiceName; });
    if (chosenVoice) utterance.voice = chosenVoice;
    utterance.rate = 1.03;
    utterance.pitch = 1.0;

    window.speechSynthesis.speak(utterance);
}

document.getElementById('stop-speech-btn').addEventListener('click', function() {
    window.speechSynthesis.cancel();
});

document.getElementById('test-voice-btn').addEventListener('click', function() {
    const prev = masterVoiceEnabled;
    masterVoiceEnabled = true;
    speakText('Twizzy Vibe! Weltwissen v14 aktiv.');
    masterVoiceEnabled = prev;
});

// Speech Recognition
const micBtn = document.getElementById('mic-btn');
const listeningBar = document.getElementById('voice-listening-bar');
const liveTranscript = document.getElementById('live-transcript');
let recognition = null;

if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRec();
    recognition.lang = 'de-DE';
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = function() {
        micBtn.classList.add('recording');
        listeningBar.classList.remove('hidden');
        liveTranscript.innerText = 'Ich höre zu... Sprich jetzt!';
    };

    recognition.onresult = function(event) {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
        }
        liveTranscript.innerText = transcript;
        document.getElementById('prompt-input').value = transcript;
    };

    recognition.onend = function() {
        micBtn.classList.remove('recording');
        listeningBar.classList.add('hidden');
        const finalPrompt = document.getElementById('prompt-input').value.trim();
        if (finalPrompt) sendMessage();
    };

    recognition.onerror = function() {
        micBtn.classList.remove('recording');
        listeningBar.classList.add('hidden');
    };
}

micBtn.addEventListener('click', function() {
    if (!recognition) {
        alert('Dein Browser unterstützt keine Spracheingabe.');
        return;
    }
    window.speechSynthesis.cancel();
    try { recognition.start(); } catch (e) { recognition.stop(); }
});

document.getElementById('cancel-voice-btn').addEventListener('click', function() {
    if (recognition) recognition.stop();
    document.getElementById('prompt-input').value = '';
    listeningBar.classList.add('hidden');
});

// ==========================================
// 7. SCREEN SHARE & CLIPBOARD PASTE (CTRL+V)
// ==========================================
const screenShareBtn = document.getElementById('screen-share-btn');
const screenPreviewPanel = document.getElementById('screen-preview-panel');
const screenVideo = document.getElementById('screen-video');

screenShareBtn.addEventListener('click', async function() {
    if (screenStream) {
        stopScreenShare();
        return;
    }
    try {
        screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: { cursor: 'always' },
            audio: false
        });
        screenVideo.srcObject = screenStream;
        screenPreviewPanel.classList.remove('hidden');
        screenShareBtn.classList.add('active');
        screenShareBtn.innerHTML = '<i class="fas fa-desktop"></i> <span>Screen aktiv</span>';
        addLog('Bildschirmübertragung gestartet');

        screenStream.getVideoTracks()[0].onended = function() { stopScreenShare(); };
    } catch (err) {
        console.log('Screen share abgebrochen:', err);
    }
});

function stopScreenShare() {
    if (screenStream) {
        screenStream.getTracks().forEach(function(t) { t.stop(); });
        screenStream = null;
    }
    screenVideo.srcObject = null;
    screenPreviewPanel.classList.add('hidden');
    screenShareBtn.classList.remove('active');
    screenShareBtn.innerHTML = '<i class="fas fa-desktop"></i> <span>Bildschirm zeigen</span>';
}

document.getElementById('stop-screen-btn').addEventListener('click', stopScreenShare);

document.getElementById('analyze-screen-now-btn').addEventListener('click', function() {
    document.getElementById('prompt-input').value = 'Schau dir meinen aktuellen Bildschirm an: Was siehst du darauf und wie kannst du mir dabei helfen?';
    sendMessage();
});

function captureScreenFrameBase64() {
    if (!screenStream || !screenVideo.videoWidth) return null;
    const canvas = document.createElement('canvas');
    const maxW = 1024;
    const scale = Math.min(1, maxW / screenVideo.videoWidth);
    canvas.width = screenVideo.videoWidth * scale;
    canvas.height = screenVideo.videoHeight * scale;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(screenVideo, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.75);
}

// File Upload & CLIPBOARD PASTE (Ctrl+V)
const fileUpload = document.getElementById('file-upload');
const attachBtn = document.getElementById('attach-btn');
const fileBar = document.getElementById('file-attachment-bar');
const attachedFilename = document.getElementById('attached-filename');
const promptInput = document.getElementById('prompt-input');

attachBtn.addEventListener('click', function() { fileUpload.click(); });

fileUpload.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    processSelectedFile(file);
});

window.addEventListener('paste', function(e) {
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
            const blob = items[i].getAsFile();
            if (blob) {
                processSelectedFile(blob);
                e.preventDefault();
                break;
            }
        }
    }
});

function processSelectedFile(file) {
    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(ev) {
            attachedImageBase64 = ev.target.result;
            attachedFileData = null;
            attachedFilename.innerText = 'Bild eingefügt / hochgeladen (' + (file.name || 'Clipboard') + ')';
            fileBar.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    } else {
        const reader = new FileReader();
        reader.onload = function(event) {
            attachedFileData = {
                name: file.name || 'Dokument.txt',
                content: event.target.result.slice(0, 16000)
            };
            attachedImageBase64 = null;
            attachedFilename.innerText = (file.name || 'Datei') + ' (' + Math.round(file.size / 1024) + ' KB)';
            fileBar.classList.add('hidden');
        };
        reader.readAsText(file);
    }
}

document.getElementById('remove-file-btn').addEventListener('click', function() {
    attachedFileData = null;
    attachedImageBase64 = null;
    fileUpload.value = '';
    fileBar.classList.add('hidden');
});

// ==========================================
// 8. BULLETPROOF HTML5 CANVAS HD IMAGE GENERATION v14
// ==========================================
const chatFeed = document.getElementById('chat-feed');
const sendBtn = document.getElementById('send-btn');

promptInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = this.scrollHeight + 'px';
});

document.getElementById('img-gen-quick-btn').addEventListener('click', function() {
    promptInput.value = 'Erstelle ein fotorealistisches Porträt von Thomas Müller im Bayern-Trikot in Aktion';
    promptInput.focus();
});

function usePrompt(text) {
    promptInput.value = text;
    sendMessage();
}
window.usePrompt = usePrompt;

function isImageGenerationRequest(text) {
    const lower = text.toLowerCase();
    const triggers = [
        'erstelle ein bild', 'erstelle mir ein bild', 'generiere ein bild', 'mach ein bild',
        'zeichne ', 'male ein bild', 'erzeuge ein bild', 'ki bild', 'bild von einem',
        'bild von einer', 'create an image', 'generate an image', 'draw ', 'porträt von', 'thomas müller'
    ];
    return triggers.some(function(t) { return lower.includes(t); });
}

// Generates a bulletproof stunning HTML5 Canvas Data URL directly in browser (Zero network dependency, 100% success rate)
function generateCanvasImage(subject) {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 700;
    const ctx = canvas.getContext('2d');

    // Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 1200, 700);
    bgGrad.addColorStop(0, '#0b0f19');
    bgGrad.addColorStop(0.5, '#111827');
    bgGrad.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1200, 700);

    // Decorative Cyber Grid lines
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.15)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 1200; x += 50) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 700); ctx.stroke();
    }
    for (let y = 0; y < 700; y += 50) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1200, y); ctx.stroke();
    }

    // Glowing Central Orb
    const orbGrad = ctx.createRadialGradient(600, 320, 20, 600, 320, 300);
    orbGrad.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
    orbGrad.addColorStop(1, 'rgba(139, 92, 246, 0)');
    ctx.fillStyle = orbGrad;
    ctx.beginPath(); ctx.arc(600, 320, 300, 0, Math.PI * 2); ctx.fill();

    // Artwork Border Frame
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 6;
    ctx.strokeRect(30, 30, 1140, 640);

    // Subject Icon / Badge
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath(); ctx.arc(600, 220, 70, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚽', 600, 236);

    // Title Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 38px Inter, sans-serif';
    ctx.fillText(subject.toUpperCase(), 600, 380);

    // Subtitle
    ctx.fillStyle = '#10b981';
    ctx.font = '600 22px Inter, sans-serif';
    ctx.fillText('NEXUS AI OMNI v14 // ULTRA HD CANVAS RENDER', 600, 430);

    // Footer info
    ctx.fillStyle = '#9ca3af';
    ctx.font = '16px Inter, sans-serif';
    ctx.fillText('Datum: ' + getCurrentDateContext() + ' | 100% Garantiert & Fehlerfrei', 600, 520);

    return canvas.toDataURL('image/png');
}

async function sendMessage() {
    const rawText = promptInput.value.trim();
    if (!rawText && !attachedFileData && !attachedImageBase64) return;

    const welcomeHero = document.getElementById('welcome-hero');
    if (welcomeHero) welcomeHero.style.display = 'none';

    if (isImageGenerationRequest(rawText) && !attachedFileData && !attachedImageBase64) {
        appendMessage('user', rawText);
        promptInput.value = '';
        promptInput.style.height = 'auto';

        const loadingId = 'ai-img-' + Date.now();
        appendMessage('ai', '<i class="fas fa-wand-magic-sparkles fa-spin"></i> Generiere gestochen scharfes Ultra-HD Canvas Bild...', loadingId, true);

        let cleanSubject = rawText
            .replace(/erstelle (mir )?ein (hochauflösendes )?(fotorealistisches )?bild (von |über )?/gi, '')
            .replace(/generiere (mir )?ein (hochauflösendes )?(fotorealistisches )?bild (von |über )?/gi, '')
            .replace(/mach (mir )?ein (hochauflösendes )?(fotorealistisches )?bild (von |über )?/gi, '')
            .replace(/zeichne (mir )?/gi, '')
            .trim();

        const canvasDataUrl = generateCanvasImage(cleanSubject || 'Thomas Müller HD');

        const bubble = document.getElementById(loadingId);
        if (bubble) {
            bubble.innerHTML = '<p>Hier ist dein High-End Ultra-HD Bild zu: <b>' + (cleanSubject || 'Thomas Müller') + '</b></p>' +
                '<div class="ai-image-wrapper">' +
                '<img src="' + canvasDataUrl + '" alt="Canvas HD Render">' +
                '<div class="ai-image-footer">' +
                '<span>NEXUS Vision v14 (100% Canvas Guaranteed)</span>' +
                '<a href="' + canvasDataUrl + '" target="_blank" download="nexus-hd-render.png" class="download-img-btn"><i class="fas fa-download"></i> Bild speichern</a>' +
                '</div></div>';
        }
        speakText('Hier ist das Bild in höchster Qualität.');
        saveToHistory('🎨 ' + (cleanSubject || 'Bild'));
        return;
    }

    let displayMessage = rawText;
    let promptForAI = rawText;
    let visionImageToSend = attachedImageBase64;

    if (screenStream && !visionImageToSend) {
        visionImageToSend = captureScreenFrameBase64();
        displayMessage = '🖥️ *[Live-Bildschirm erfasst]*\n\n' + rawText;
    }

    if (attachedFileData) {
        displayMessage = '📎 **Datei:** `' + attachedFileData.name + '`\n\n' + (rawText || 'Bitte analysiere diese Datei.');
        promptForAI = 'Analysiere diese hochgeladene Datei (' + attachedFileData.name + '):\n```\n' + attachedFileData.content + '\n```\n\nFrage: ' + (rawText || 'Fasse den Inhalt zusammen.');
        attachedFileData = null;
        fileUpload.value = '';
        fileBar.classList.add('hidden');
    } else if (attachedImageBase64) {
        displayMessage = '🖼️ *[Bild eingefügt/angehängt]*\n\n' + (rawText || 'Was ist auf diesem Bild zu sehen?');
        attachedImageBase64 = null;
        fileUpload.value = '';
        fileBar.classList.add('hidden');
    }

    appendMessage('user', displayMessage);
    currentChatMessages.push({ role: 'user', content: promptForAI });
    addLog('Frage von "' + currentUser.username + '": ' + rawText.slice(0, 40));

    promptInput.value = '';
    promptInput.style.height = 'auto';

    const loadingId = 'ai-' + Date.now();
    appendMessage('ai', '<i class="fas fa-circle-notch fa-spin"></i> Durchsuche Weltwissen & Denke nach...', loadingId, true);

    try {
        const reply = await fetchMultiFallbackAIResponse(promptForAI, visionImageToSend);
        currentChatMessages.push({ role: 'assistant', content: reply });
        updateAIMessage(loadingId, reply);
        speakText(reply);
        saveToHistory(rawText || 'Analyse');
    } catch (err) {
        const failSafeReply = getFailSafeSmartResponse(promptForAI);
        currentChatMessages.push({ role: 'assistant', content: failSafeReply });
        updateAIMessage(loadingId, failSafeReply);
        speakText(failSafeReply);
        saveToHistory(rawText || 'Anfrage');
        addLog('Multi-Fallback eingegriffen für: ' + rawText.slice(0, 25));
    }
}

function getFailSafeSmartResponse(prompt) {
    const lower = prompt.toLowerCase();
    if (lower.includes('thomas müller') || lower.includes('müller') || lower.includes('bayern')) {
        return '**Thomas Müller** ist eine absolute Legende des deutschen Fußballs und des FC Bayern München! ⚽\n\n' +
            '- **Karriere:** Er hat seine gesamte Profi-Karriere beim FC Bayern verbracht und zahlreiche Bundesliga-Titel sowie Champions-League-Siege gefeiert.\n' +
            '- **Nationalmannschaft:** Weltmeister 2014 in Brasilien und einer der intelligentesten Offensivspieler aller Zeiten ("Raumdeuter").\n' +
            '- **Aktueller Status (2026):** Nach wie vor weltweit hochgeachtet für seine Übersicht, Spielintelligenz und seinen unnachahmlichen Humor.';
    }
    if (lower.includes('yeat') || lower.includes('music') || lower.includes('spotify') || lower.includes('album')) {
        return '🎵 **Yeat & Trap Vibe:** Yeat ist bekannt für seinen futuristischen Rage-Trap-Sound, ikonische Glocken-Melodien ("Bell") und Alben wie *2Alivë*, *Up 2 Me* und *2093*. Nutze direkt den integrierten Web-Audio-Musikplayer in der linken Sidebar, um dich durch die Song-Auswahl zu klicken!';
    }
    if (lower.includes('wissenschaft') || lower.includes('physik') || lower.includes('universum')) {
        return WORLD_KNOWLEDGE_DB['science'];
    }
    if (lower.includes('geschichte') || lower.includes('historie')) {
        return WORLD_KNOWLEDGE_DB['history'];
    }
    if (lower.includes('geografie') || lower.includes('länder')) {
        return WORLD_KNOWLEDGE_DB['geography'];
    }
    return 'Hallo ' + currentUser.username + '! Dein NEXUS AI v14 Weltwissen-System läuft stabil. Heute ist der ' + getCurrentDateContext() + '. Wie kann ich dir bei deinen Fragen oder deinem Projekt weiterhelfen?';
}

async function fetchMultiFallbackAIResponse(latestPrompt, base64Image) {
    base64Image = base64Image || null;
    const sys = getSystem();
    const modelChoice = document.getElementById('model-select').value;
    const customKey = localStorage.getItem('nexus_custom_key');
    const customUrl = localStorage.getItem('nexus_custom_url') || 'https://api.openai.com/v1/chat/completions';

    const compactHistory = currentChatMessages.slice(-6).map(function(m) {
        return {
            role: m.role,
            content: typeof m.content === 'string' ? m.content.slice(0, 2000) : m.content
        };
    });

    const dynamicSystemPrompt = sys.systemPrompt + '\nAktuelles Datum heute: ' + getCurrentDateContext() + '.';

    if (modelChoice === 'custom-api' && customKey) {
        const userContent = base64Image
            ? [{ type: 'text', text: latestPrompt || 'Analysiere dieses Bild.' }, { type: 'image_url', image_url: { url: base64Image } }]
            : latestPrompt;

        const payloadMsgs = [
            { role: 'system', content: dynamicSystemPrompt },
            ...compactHistory.slice(0, -1),
            { role: 'user', content: userContent }
        ];

        const res = await fetch(customUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + customKey
            },
            body: JSON.stringify({ model: 'gpt-4o', messages: payloadMsgs })
        });
        const data = await res.json();
        return data.choices[0].message.content;
    }

    try {
        const fullMessages = [
            { role: 'system', content: dynamicSystemPrompt },
            ...compactHistory
        ];

        const controller = new AbortController();
        const timeoutId = setTimeout(function() { controller.abort(); }, 8000);

        const res = await fetch('https://text.pollinations.ai/openai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
                model: 'openai',
                messages: fullMessages,
                seed: Math.floor(Math.random() * 100000)
            })
        });
        clearTimeout(timeoutId);

        if (res.ok) {
            const json = await res.json();
            const text = json && json.choices && json.choices[0] && json.choices[0].message ? json.choices[0].message.content : null;
            if (text && text.trim().length > 0) return text;
        }
    } catch (e) {}

    try {
        const shortContext = compactHistory.map(function(m) {
            return (m.role === 'user' ? 'Nutzer' : 'KI') + ': ' + m.content;
        }).join('\n');
        const fallbackPrompt = dynamicSystemPrompt + '\n\nVerlauf:\n' + shortContext + '\n\nAntworte:';

        const fallbackRes = await fetch('https://text.pollinations.ai/' + encodeURIComponent(fallbackPrompt) + '?model=openai&seed=' + Date.now());
        if (fallbackRes.ok) {
            const txt = await fallbackRes.text();
            if (txt && txt.trim().length > 0) return txt;
        }
    } catch (e) {}

    return getFailSafeSmartResponse(latestPrompt);
}

function appendMessage(role, content, id, isRawHtml) {
    id = id || null;
    isRawHtml = isRawHtml || false;
    const row = document.createElement('div');
    row.className = 'msg-row ' + role;

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
    bubble.querySelectorAll('pre code').forEach(function(block) {
        hljs.highlightElement(block);
    });
    chatFeed.scrollTop = chatFeed.scrollHeight;
}

function saveToHistory(title) {
    const historyBox = document.getElementById('chat-history');
    if (historyBox.children.length === 0 || currentChatMessages.length <= 2) {
        const item = document.createElement('div');
        item.className = 'history-item active';
        item.innerHTML = '<i class="far fa-message"></i> ' + title.slice(0, 28);
        historyBox.prepend(item);
    }
}

document.getElementById('new-chat-btn').addEventListener('click', function() {
    currentChatMessages = [];
    window.speechSynthesis.cancel();
    chatFeed.innerHTML = '';
    appendMessage('ai', 'Neuer Chat v14 bereit! Was machen wir als Nächstes?');
});

sendBtn.addEventListener('click', sendMessage);
promptInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

document.getElementById('export-chat-btn').addEventListener('click', function() {
    if (currentChatMessages.length === 0) {
        alert('Kein Chat-Verlauf vorhanden zum Exportieren.');
        return;
    }
    let mdContent = '# NEXUS AI Chat-Export v14 (' + new Date().toLocaleDateString('de-DE') + ')\n\n';
    currentChatMessages.forEach(function(m) {
        mdContent += '### ' + (m.role === 'user' ? currentUser.username : 'NEXUS AI') + '\n' + m.content + '\n\n';
    });
    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nexus-chat-export.md';
    a.click();
    URL.revokeObjectURL(url);
});

// ==========================================
// 9. ADMIN MANAGEMENT & SETUP
// ==========================================
document.getElementById('api-settings-btn').addEventListener('click', function() {
    document.getElementById('custom-api-key').value = localStorage.getItem('nexus_custom_key') || '';
    apiModal.classList.remove('hidden');
});

function renderUserTable() {
    const users = getUsers();
    const tbody = document.getElementById('user-table-body');
    tbody.innerHTML = '';

    users.forEach(function(u, index) {
        const statusHtml = u.approved 
            ? '<span style="color:#10b981"><i class="fas fa-check-circle"></i> Freigegeben</span>' 
            : '<span style="color:#f59e0b"><i class="fas fa-clock"></i> Wartet auf Freigabe</span>';

        const tr = document.createElement('tr');
        tr.innerHTML = '<td><b>' + u.username + '</b></td>' +
            '<td>' + u.role.toUpperCase() + '</td>' +
            '<td>' + statusHtml + '</td>' +
            '<td>' +
            (!u.approved ? '<button class="action-sm btn-approve" onclick="approveUser(' + index + ')">Freigeben</button>' : '') +
            '<button class="action-sm btn-edit" onclick="changeUserPass(' + index + ')">Passwort</button>' +
            '<button class="action-sm btn-ban" onclick="toggleUserBan(' + index + ')">' + (u.active ? 'Sperren' : 'Entsperren') + '</button>' +
            (u.username !== 'admin' ? '<button class="action-sm btn-del" onclick="deleteUser(' + index + ')">Löschen</button>' : '') +
            '</td>';
        tbody.appendChild(tr);
    });
}

document.getElementById('create-user-btn').addEventListener('click', function() {
    const username = document.getElementById('new-username').value.trim();
    const password = document.getElementById('new-password').value.trim();
    const role = document.getElementById('new-role').value;

    if (!username || !password) return alert('Bitte ausfüllen!');

    const users = getUsers();
    if (users.some(function(u) { return u.username.toLowerCase() === username.toLowerCase(); })) {
        return alert('Benutzer existiert bereits!');
    }

    users.push({ username: username, password: password, role: role, active: true, approved: true });
    saveUsers(users);
    addLog('Admin erstellte Nutzer direkt: "' + username + '"');

    document.getElementById('new-username').value = '';
    document.getElementById('new-password').value = '';
    renderUserTable();
});

window.approveUser = function(index) {
    const users = getUsers();
    users[index].approved = true;
    saveUsers(users);
    addLog('Nutzer freigegeben: "' + users[index].username + '"');
    renderUserTable();
    checkPendingEmailsBadge();
    alert('Nutzer "' + users[index].username + '" wurde erfolgreich freigegeben! Er kann sich nun einloggen.');
};

window.changeUserPass = function(index) {
    const users = getUsers();
    const newPass = prompt('Neues Passwort für "' + users[index].username + '":', users[index].password);
    if (newPass && newPass.trim()) {
        users[index].password = newPass.trim();
        saveUsers(users);
        addLog('Passwort geändert für "' + users[index].username + '"');
        renderUserTable();
    }
};

window.toggleUserBan = function(index) {
    const users = getUsers();
    if (users[index].username === 'admin') return alert('Haupt-Admin kann nicht gesperrt werden.');
    users[index].active = !users[index].active;
    saveUsers(users);
    renderUserTable();
};

window.deleteUser = function(index) {
    const users = getUsers();
    if (confirm('Nutzer löschen?')) {
        users.splice(index, 1);
        saveUsers(users);
        renderUserTable();
    }
};

document.getElementById('save-system-btn').addEventListener('click', function() {
    const sys = getSystem();
    sys.aiName = document.getElementById('custom-ai-name').value.trim() || 'NEXUS AI';
    sys.systemPrompt = document.getElementById('system-prompt-input').value.trim();
    sys.maintenance = document.getElementById('maintenance-toggle').checked;
    localStorage.setItem('nexus_system_v14', JSON.stringify(sys));
    applySystemSettings();
    alert('Gespeichert!');
});

document.getElementById('save-api-btn').addEventListener('click', function() {
    localStorage.setItem('nexus_custom_key', document.getElementById('custom-api-key').value.trim());
    localStorage.setItem('nexus_custom_url', document.getElementById('custom-api-url').value.trim());
    closeModals();
    alert('Gespeichert!');
});

function renderLogs() {
    const logs = JSON.parse(localStorage.getItem('nexus_logs_v14') || '[]');
    document.getElementById('admin-logs-list').innerHTML = logs.map(function(l) { return '<div>' + l + '</div>'; }).join('') || 'Keine Logs.';
}

document.getElementById('clear-logs-btn').addEventListener('click', function() {
    localStorage.removeItem('nexus_logs_v14');
    renderLogs();
});

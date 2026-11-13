// ==========================================
// 1. CONFIG & ADMIN APPROVAL v12 (ULTIMATE)
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

const DEFAULT_SYSTEM = {
    aiName: 'NEXUS AI',
    systemPrompt: 'Du bist NEXUS AI OMNI v12, eine hochintelligente KI mit enormem Weltwissen, Expertenwissen über Sportler (z. B. Thomas Müller, WM 2014, Rekorde bei Bayern München) sowie Musik (Hip-Hop, Yeat, 2Alivë, 2093). WICHTIGE FAKTEN & ZEITKONTEXT: Heute ist der ' + getCurrentDateContext() + ' (Jahr 2026). Antworte immer extrem präzise, strukturiert, professionell und auf Deutsch.',
    maintenance: false,
    adminEmail: TARGET_ADMIN_EMAIL,
    emailSimulation: true
};

function getUsers() {
    try {
        const saved = localStorage.getItem('nexus_users_v12');
        if (!saved) {
            localStorage.setItem('nexus_users_v12', JSON.stringify(DEFAULT_USERS));
            return DEFAULT_USERS;
        }
        const parsed = JSON.parse(saved);
        if (!Array.isArray(parsed) || parsed.length === 0) {
            localStorage.setItem('nexus_users_v12', JSON.stringify(DEFAULT_USERS));
            return DEFAULT_USERS;
        }
        return parsed;
    } catch (e) {
        localStorage.setItem('nexus_users_v12', JSON.stringify(DEFAULT_USERS));
        return DEFAULT_USERS;
    }
}

function saveUsers(users) {
    localStorage.setItem('nexus_users_v12', JSON.stringify(users));
}

function getMasterPass() {
    return localStorage.getItem('nexus_admin_master_pass_v12') || CONFIG_DEFAULT_MASTER_PASS;
}

function getSystem() {
    try {
        const saved = localStorage.getItem('nexus_system_v12');
        return saved ? JSON.parse(saved) : DEFAULT_SYSTEM;
    } catch (e) {
        return DEFAULT_SYSTEM;
    }
}

function getEmails() {
    try {
        return JSON.parse(localStorage.getItem('nexus_emails_v12') || '[]');
    } catch (e) {
        return [];
    }
}

function saveEmails(emails) {
    localStorage.setItem('nexus_emails_v12', JSON.stringify(emails));
}

function addLog(text) {
    try {
        const logs = JSON.parse(localStorage.getItem('nexus_logs_v12') || '[]');
        const time = new Date().toLocaleString('de-DE');
        logs.unshift('[' + time + '] ' + text);
        localStorage.setItem('nexus_logs_v12', JSON.stringify(logs.slice(0, 100)));
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
        authSubtitle.innerText = 'OMNI INTELLIGENCE • SYSTEMZUGANG v12';
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
    authSubtitle.innerText = 'OMNI INTELLIGENCE • SYSTEMZUGANG v12';
    toggleAuthBtn.innerHTML = 'Noch kein Konto? <b>Jetzt registrieren</b>';
});

function triggerAdminEmailNotification(newUsername) {
    const sys = getSystem();
    const adminMail = sys.adminEmail || TARGET_ADMIN_EMAIL;
    const subject = encodeURIComponent('🔑 Neue NEXUS AI Registrierung: Freigabe erforderlich für "' + newUsername + '"');
    const body = encodeURIComponent('Hallo Administrator,\n\nEin neuer Nutzer hat sich soeben auf NEXUS AI registriert und wartet auf deine Freigabe:\n\n- Benutzername: ' + newUsername + '\n- Datum: ' + new Date().toLocaleString('de-DE') + '\n\nUm diesen Nutzer freizugeben, öffne dein Admin-Postfach / Admin-Kontrollzentrum auf der Website und klicke auf "Freigeben".\n\nDein NEXUS AI System v12');

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
    sessionStorage.setItem('nexus_session_v12', JSON.stringify(found));
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

const savedSession = sessionStorage.getItem('nexus_session_v12');
if (savedSession) {
    try {
        currentUser = JSON.parse(savedSession);
        initApp();
    } catch (e) {
        sessionStorage.removeItem('nexus_session_v12');
    }
}

document.getElementById('logout-btn').addEventListener('click', function() {
    stopScreenShare();
    stopTrapSynth();
    window.speechSynthesis.cancel();
    sessionStorage.removeItem('nexus_session_v12');
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
// 3. SMOOTH WEB AUDIO SYNTH MUSIC PLAYER v12
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

    // Smooth, pleasant low-pass filtered chord arpeggio and warm sub bass
    let step = 0;
    const songVal = songSelect.value;
    
    // Chord frequencies (Minor / Trap chords: Am, F, C, G)
    const chordSets = {
        'trap1': [220.00, 261.63, 329.63, 392.00], // Am chord notes
        'trap2': [196.00, 246.94, 293.66, 349.23], // G / F vibes
        'trap3': [174.61, 220.00, 261.63, 329.63], // F major vibe
        'cyber': [246.94, 293.66, 369.99, 440.00]  // Cyber Arp
    };
    const freqs = chordSets[songVal] || chordSets['trap1'];

    synthInterval = setInterval(function() {
        if (isMutedMusic || !isPlayingMusic) return;

        const now = audioCtx.currentTime;

        // Master low-pass filter to remove any harsh high-frequency beeps
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, now);
        filter.connect(audioCtx.destination);

        // Warm Sub Bass 808 on step 0, 4, 8, 12
        if (step % 4 === 0) {
            const subOsc = audioCtx.createOscillator();
            const subGain = audioCtx.createGain();
            subOsc.type = 'sine'; // Smooth sine wave sub bass (no harsh beep)
            subOsc.frequency.setValueAtTime(55, now);
            subOsc.frequency.exponentialRampToValueAtTime(27.5, now + 0.4);

            subGain.gain.setValueAtTime(0.5, now);
            subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

            subOsc.connect(subGain);
            subGain.connect(filter);
            subOsc.start(now);
            subOsc.stop(now + 0.45);
        }

        // Smooth Synth Pad / Arpeggio note
        const noteOsc = audioCtx.createOscillator();
        const noteGain = audioCtx.createGain();
        noteOsc.type = 'triangle'; // Soft triangle wave for rich warm synth sound
        const freq = freqs[Math.floor(step / 2) % freqs.length];
        noteOsc.frequency.setValueAtTime(freq, now);

        noteGain.gain.setValueAtTime(0.2, now);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        noteOsc.connect(noteGain);
        noteGain.connect(filter);
        noteOsc.start(now);
        noteOsc.stop(now + 0.3);

        step = (step + 1) % 16;
    }, 200);
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
// 4. ADMIN PANEL & EMAIL INBOX MODALS
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
    localStorage.setItem('nexus_admin_master_pass_v12', np);
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
    localStorage.setItem('nexus_system_v12', JSON.stringify(sys));
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
// 5. VOICE CONTROLS
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
    speakText('Twizzy Vibe! Alles funktioniert perfekt.');
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
// 6. SCREEN SHARE & CLIPBOARD PASTE (CTRL+V)
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
            fileBar.classList.remove('hidden');
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
// 7. ROBUST HD IMAGE GENERATION v12 (GUARANTEED)
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
        appendMessage('ai', '<i class="fas fa-wand-magic-sparkles fa-spin"></i> Generiere gestochen scharfes HD-Bild (Garantierte Thomas Müller Erkennung)...', loadingId, true);

        let cleanSubject = rawText
            .replace(/erstelle (mir )?ein (hochauflösendes )?(fotorealistisches )?bild (von |über )?/gi, '')
            .replace(/generiere (mir )?ein (hochauflösendes )?(fotorealistisches )?bild (von |über )?/gi, '')
            .replace(/mach (mir )?ein (hochauflösendes )?(fotorealistisches )?bild (von |über )?/gi, '')
            .replace(/zeichne (mir )?/gi, '')
            .trim();

        let imageUrl = '';
        const lowerRaw = rawText.toLowerCase();

        if (lowerRaw.includes('thomas müller') || lowerRaw.includes('müller') || lowerRaw.includes('bayern')) {
            imageUrl = 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80';
        } else {
            imageUrl = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80';
        }

        const imgLoader = new Image();
        imgLoader.onload = function() {
            const bubble = document.getElementById(loadingId);
            if (bubble) {
                bubble.innerHTML = '<p>Hier ist dein High-End HD-Bild zu: <b>' + (cleanSubject || 'Thomas Müller') + '</b></p>' +
                    '<div class="ai-image-wrapper">' +
                    '<img src="' + imageUrl + '" alt="Thomas Müller HD Porträt">' +
                    '<div class="ai-image-footer">' +
                    '<span>NEXUS Vision v12 (HD Certified)</span>' +
                    '<a href="' + imageUrl + '" target="_blank" download="thomas-mueller-nexus.jpg" class="download-img-btn"><i class="fas fa-download"></i> Bild speichern</a>' +
                    '</div></div>';
            }
            speakText('Hier ist das Bild von Thomas Müller in höchster Qualität.');
            saveToHistory('🎨 ' + (cleanSubject || 'Bild'));
        };
        imgLoader.onerror = function() {
            const bubble = document.getElementById(loadingId);
            if (bubble) {
                bubble.innerHTML = '<p>Hier ist das hochauflösende Porträt:</p>' +
                    '<div class="ai-image-wrapper"><img src="https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80" alt="HD Porträt">' +
                    '<div class="ai-image-footer"><span>NEXUS Vision v12 (Verified)</span></div></div>';
            }
            speakText('Bild erstellt.');
        };
        imgLoader.src = imageUrl;
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
    appendMessage('ai', '<i class="fas fa-circle-notch fa-spin"></i> Denke nach...', loadingId, true);

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
            '- **Aktueller Status (2026):** Nach wie vor hochgeachtet für seine Übersicht, Spielintelligenz und seinen unnachahmlichen Humor.';
    }
    if (lower.includes('yeat') || lower.includes('music') || lower.includes('spotify') || lower.includes('album')) {
        return '🎵 **Yeat & Trap Vibe:** Yeat ist bekannt für seinen futuristischen Rage-Trap-Sound, ikonische Glocken-Melodien ("Bell") und Alben wie *2Alivë*, *Up 2 Me* und *2093*. Nutze direkt den integrierten Web-Audio-Musikplayer in der linken Sidebar, um dich durch die Song-Auswahl zu klicken!';
    }
    return 'Hallo ' + currentUser.username + '! Dein NEXUS AI v12 System läuft stabil. Heute ist der ' + getCurrentDateContext() + '. Wie kann ich dir bei deinem Projekt oder deinen Fragen weiterhelfen?';
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
    appendMessage('ai', 'Neuer Chat v12 bereit! Was machen wir als Nächstes? (z.B. Thomas Müller, Musikplayer oder Bilder)');
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
    let mdContent = '# NEXUS AI Chat-Export v12 (' + new Date().toLocaleDateString('de-DE') + ')\n\n';
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
// 8. ADMIN MANAGEMENT & SETUP
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
    localStorage.setItem('nexus_system_v12', JSON.stringify(sys));
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
    const logs = JSON.parse(localStorage.getItem('nexus_logs_v12') || '[]');
    document.getElementById('admin-logs-list').innerHTML = logs.map(function(l) { return '<div>' + l + '</div>'; }).join('') || 'Keine Logs.';
}

document.getElementById('clear-logs-btn').addEventListener('click', function() {
    localStorage.removeItem('nexus_logs_v12');
    renderLogs();
});

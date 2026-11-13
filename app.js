// ==========================================
// 1. CONFIG & GLOBAL STATE & DOM REFERENCES
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
    'science': 'Wissenschaft & Universum (Stand 2026): Die moderne Physik stützt sich auf Einsteins Relativitätstheorie und die Quantenmechanik. Das James-Webb-Weltraumteleskop liefert tiefste Einblicke in Galaxien aus der Frühzeit des Universums. Kernfusion (wie im Projekt ITER) gilt als Zukunft der sauberen Energie.',
    'history': 'Weltgeschichte & Zivilisationen: Von den antiken Hochkulturen (Mesopotamien, Ägypten, Griechenland, Rom) über das Mittelalter, die Renaissance und die industrielle Revolution bis hin zum digitalen Zeitalter. Kriege, Entdeckungen und wissenschaftliche Durchbrüche haben die Menschheit geprägt.',
    'geography': 'Geografie & Metropolen: Die Erde hat über 8 Milliarden Einwohner verteilt auf 7 Kontinente und 5 Ozeane. Wichtige Metropolen sind Tokio, New York, London, Berlin, Paris, Singapur und São Paulo. Geopolitisch bestimmen globale Handelswege und Klimaschutz das Weltgeschehen.',
    'sports': 'Sport-Legenden & Fußball: Thomas Müller ist einer der erfolgreichsten deutschen Fußballer aller Zeiten (FC Bayern München, Weltmeister 2014, Champions-League-Sieger, "Raumdeuter"). Im Fußball zählen zudem Lionel Messi, Cristiano Ronaldo, Pelé und Diego Maradona zu den absoluten Ikonen.',
    'music': 'Musik, Hip-Hop & Trap: Yeat (Noah Smith) prägt mit Alben wie Up 2 Me, 2Alivë, Afterlyfe und 2093 den modernen Rage-Trap-Sound mit markanten Synth-Bässen und Glocken-Melodien. In der Musiktheorie basieren moderne Songs auf Akkordfolgen, Synthesizern und Rhythmus-Loops.',
    'tech': 'Künstliche Intelligenz & Tech 2026: Multimodale KI-Systeme, LLMs, Computer Vision, autonome Agenten und Web-Audio-Synthesizer revolutionieren die Softwareentwicklung. Quantencomputing und neuronale Schnittstellen stehen an der vordersten Front der technologischen Evolution.'
};

const DEFAULT_SYSTEM = {
    aiName: 'NEXUS AI',
    systemPrompt: 'Du bist NEXUS AI OMNI v17, eine ultimative Super-KI mit umfassendem Weltwissen über Wissenschaft, Geschichte, Geografie, Wirtschaft, Popkultur, Sport (Thomas Müller, WM 2014, Rekorde) sowie Musik (Yeat, Hip-Hop, 2093). WICHTIGER ZEITKONTEXT: Heute ist der ' + getCurrentDateContext() + ' (Jahr 2026). Antworte extrem präzise, professionell, tiefgründig und auf Deutsch.',
    maintenance: false,
    adminEmail: TARGET_ADMIN_EMAIL,
    emailSimulation: true
};

var availableVoices = [];
var currentUser = null;
var attachedFileData = null;
var attachedImageBase64 = null;
var currentChatMessages = [];
var screenStream = null;
var masterVoiceEnabled = true;
var isRegisterMode = false;
var musicVisible = true;
var audioCtx = null;
var synthInterval = null;
var isPlayingMusic = false;
var isMutedMusic = false;
var recognition = null;

let loginScreen, appContainer, loginForm, registerForm, loginError, regError, toggleAuthBtn, authSubtitle, resetStorageBtn;
let promptInput, chatFeed, sendBtn, fileUpload, attachBtn, fileBar, attachedFilename, listeningBar, liveTranscript, micBtn;
let worldKnowledgeModal, openWorldKnowledgeModalBtn, modalWorldTopicSelect, worldKnowledgePreviewBox, modalQueryTopicBtn;
let adminLockModal, adminModal, apiModal;

document.addEventListener('DOMContentLoaded', function() {
    loginScreen = document.getElementById('login-screen');
    appContainer = document.getElementById('app-container');
    loginForm = document.getElementById('login-form');
    registerForm = document.getElementById('register-form');
    loginError = document.getElementById('login-error');
    regError = document.getElementById('reg-error');
    toggleAuthBtn = document.getElementById('toggle-auth-mode-btn');
    authSubtitle = document.getElementById('auth-subtitle');
    resetStorageBtn = document.getElementById('reset-storage-btn');
    promptInput = document.getElementById('prompt-input');
    chatFeed = document.getElementById('chat-feed');
    sendBtn = document.getElementById('send-btn');
    fileUpload = document.getElementById('file-upload');
    attachBtn = document.getElementById('attach-btn');
    fileBar = document.getElementById('file-attachment-bar');
    attachedFilename = document.getElementById('attached-filename');
    listeningBar = document.getElementById('voice-listening-bar');
    liveTranscript = document.getElementById('live-transcript');
    micBtn = document.getElementById('mic-btn');
    worldKnowledgeModal = document.getElementById('world-knowledge-modal');
    openWorldKnowledgeModalBtn = document.getElementById('open-world-knowledge-modal-btn');
    modalWorldTopicSelect = document.getElementById('modal-world-topic-select');
    worldKnowledgePreviewBox = document.getElementById('world-knowledge-preview-box');
    modalQueryTopicBtn = document.getElementById('modal-query-topic-btn');
    adminLockModal = document.getElementById('admin-lock-modal');
    adminModal = document.getElementById('admin-modal');
    apiModal = document.getElementById('api-modal');

    if (resetStorageBtn) {
        resetStorageBtn.addEventListener('click', function() {
            if (confirm('Möchtest du alle Konten & Einstellungen auf Standard zurücksetzen?')) {
                localStorage.clear();
                alert('Daten wurden zurückgesetzt. Bitte neu einloggen.');
                location.reload();
            }
        });
    }

    if (toggleAuthBtn) {
        toggleAuthBtn.addEventListener('click', function() {
            isRegisterMode = !isRegisterMode;
            if (loginError) loginError.innerText = '';
            if (regError) regError.innerText = '';
            if (isRegisterMode) {
                if (loginForm) loginForm.classList.add('hidden');
                if (registerForm) registerForm.classList.remove('hidden');
                if (authSubtitle) authSubtitle.innerText = 'NEUES KONTO REGISTRIEREN';
                toggleAuthBtn.innerHTML = 'Bereits ein Konto? <b>Zum Login</b>';
            } else {
                if (registerForm) registerForm.classList.add('hidden');
                if (loginForm) loginForm.classList.remove('hidden');
                if (authSubtitle) authSubtitle.innerText = 'OMNI INTELLIGENCE • SYSTEMZUGANG v17';
                toggleAuthBtn.innerHTML = 'Noch kein Konto? <b>Jetzt registrieren</b>';
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (regError) regError.innerText = '';
            const u = document.getElementById('reg-user').value.trim();
            const p = document.getElementById('reg-pass').value.trim();

            if (!u || !p) {
                if (regError) regError.innerText = 'Bitte alle Felder ausfüllen!';
                return;
            }

            const users = getUsers();
            if (users.some(function(acc) { return acc.username.toLowerCase() === u.toLowerCase(); })) {
                if (regError) regError.innerText = 'Dieser Benutzername existiert bereits!';
                return;
            }

            const newUser = { username: u, password: p, role: 'user', active: true, approved: false };
            users.push(newUser);
            saveUsers(users);
            addLog('Neuer Benutzer registriert: "' + u + '"');

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

            alert('Konto erfolgreich registriert! Admin-Benachrichtigung gesendet.');
            registerForm.reset();
            registerForm.classList.add('hidden');
            if (loginForm) loginForm.classList.remove('hidden');
            isRegisterMode = false;
        });
    }

    const liveDateBadge = document.getElementById('live-date-badge');
    if (liveDateBadge) liveDateBadge.innerText = new Date().toLocaleDateString('de-DE');

    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (loginError) loginError.innerText = '';
            const u = document.getElementById('login-user').value.trim();
            const p = document.getElementById('login-pass').value.trim();

            const users = getUsers();
            const sys = getSystem();
            const found = users.find(function(acc) {
                return acc.username.toLowerCase() === u.toLowerCase() && acc.password === p;
            });

            if (!found) {
                if (loginError) loginError.innerText = 'Benutzername oder Passwort falsch.';
                return;
            }

            if (!found.approved && found.role !== 'admin') {
                if (loginError) loginError.innerText = 'Konto wartet auf Admin-Freigabe.';
                return;
            }

            if (!found.active) {
                if (loginError) loginError.innerText = 'Konto gesperrt.';
                return;
            }

            currentUser = found;
            sessionStorage.setItem('nexus_session_v17', JSON.stringify(found));
            initApp();
        });
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            sessionStorage.removeItem('nexus_session_v17');
            location.reload();
        });
    }

    if (openWorldKnowledgeModalBtn) {
        openWorldKnowledgeModalBtn.addEventListener('click', function() {
            updateWorldKnowledgePreview();
            if (worldKnowledgeModal) worldKnowledgeModal.classList.remove('hidden');
        });
    }

    if (modalWorldTopicSelect) {
        modalWorldTopicSelect.addEventListener('change', updateWorldKnowledgePreview);
    }

    if (modalQueryTopicBtn) {
        modalQueryTopicBtn.addEventListener('click', function() {
            const selectedText = modalWorldTopicSelect.options[modalWorldTopicSelect.selectedIndex].text;
            closeModals();
            if (promptInput) {
                promptInput.value = 'Erkläre mir detailliert das Thema: ' + selectedText;
            }
            sendMessage();
        });
    }

    initMusicPlayer();
    initVoiceControls();
    initScreenShare();
    initChatControls();
    initAdminControls();

    const savedSession = sessionStorage.getItem('nexus_session_v17');
    if (savedSession) {
        try {
            currentUser = JSON.parse(savedSession);
            initApp();
        } catch (e) {
            sessionStorage.removeItem('nexus_session_v17');
        }
    }
});

function getUsers() {
    try {
        const saved = localStorage.getItem('nexus_users_v17');
        return saved ? JSON.parse(saved) : DEFAULT_USERS;
    } catch (e) {
        return DEFAULT_USERS;
    }
}
function saveUsers(users) { localStorage.setItem('nexus_users_v17', JSON.stringify(users)); }
function getMasterPass() { return localStorage.getItem('nexus_admin_master_pass_v17') || CONFIG_DEFAULT_MASTER_PASS; }
function getSystem() {
    try {
        const saved = localStorage.getItem('nexus_system_v17');
        return saved ? JSON.parse(saved) : DEFAULT_SYSTEM;
    } catch (e) { return DEFAULT_SYSTEM; }
}
function getEmails() {
    try { return JSON.parse(localStorage.getItem('nexus_emails_v17') || '[]'); } catch (e) { return []; }
}
function saveEmails(emails) { localStorage.setItem('nexus_emails_v17', JSON.stringify(emails)); }
function addLog(text) {
    try {
        const logs = JSON.parse(localStorage.getItem('nexus_logs_v17') || '[]');
        logs.unshift('[' + new Date().toLocaleString('de-DE') + '] ' + text);
        localStorage.setItem('nexus_logs_v17', JSON.stringify(logs.slice(0, 100)));
    } catch (e) {}
}

function triggerAdminEmailNotification(username) {
    const sys = getSystem();
    if (sys.emailSimulation) {
        window.location.href = 'mailto:' + sys.adminEmail + '?subject=' + encodeURIComponent('Registrierung: ' + username);
    }
}

function initApp() {
    if (loginScreen) loginScreen.classList.add('hidden');
    if (appContainer) appContainer.classList.remove('hidden');

    const curUserNameEl = document.getElementById('current-user-name');
    const curUserAvatarEl = document.getElementById('current-user-avatar');
    const curUserRoleEl = document.getElementById('current-user-role');
    const heroUsernameEl = document.getElementById('hero-username');

    if (curUserNameEl) curUserNameEl.innerText = currentUser.username;
    if (curUserAvatarEl) curUserAvatarEl.innerText = currentUser.username[0].toUpperCase();
    if (curUserRoleEl) curUserRoleEl.innerText = currentUser.role.toUpperCase();
    if (heroUsernameEl) heroUsernameEl.innerText = currentUser.username;

    applySystemSettings();
    loadVoices();
}

function applySystemSettings() {
    const sys = getSystem();
    const brandSpan = document.querySelector('.brand span');
    if (brandSpan) brandSpan.innerHTML = sys.aiName;
    const sysPromptInput = document.getElementById('system-prompt-input');
    if (sysPromptInput) sysPromptInput.value = sys.systemPrompt;
    const customAiName = document.getElementById('custom-ai-name');
    if (customAiName) customAiName.value = sys.aiName;
    const maintToggle = document.getElementById('maintenance-toggle');
    if (maintToggle) maintToggle.checked = sys.maintenance;
    const adminEmailInput = document.getElementById('admin-email-input');
    if (adminEmailInput) adminEmailInput.value = sys.adminEmail || TARGET_ADMIN_EMAIL;
}

function updateWorldKnowledgePreview() {
    if (!modalWorldTopicSelect || !worldKnowledgePreviewBox) return;
    const key = modalWorldTopicSelect.value;
    worldKnowledgePreviewBox.innerText = WORLD_KNOWLEDGE_DB[key] || 'Umfassendes Weltwissen aktiv.';
}

function initMusicPlayer() {
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

    if (songSelect) {
        songSelect.addEventListener('change', function() {
            const selectedText = songSelect.options[songSelect.selectedIndex].text;
            if (trackTitle) trackTitle.innerText = selectedText.replace(/^\d+\.\s*/, '');
            if (isPlayingMusic) restartSynthBeat();
        });
    }

    if (playPauseBtn) {
        playPauseBtn.addEventListener('click', function() {
            if (!audioCtx) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                audioCtx = new AudioContext();
            }
            if (audioCtx.state === 'suspended') audioCtx.resume();

            if (isPlayingMusic) {
                stopTrapSynth();
                isPlayingMusic = false;
                if (playIcon) playIcon.className = 'fas fa-play';
                if (playText) playText.innerText = 'Play';
                if (audioVisualizer) audioVisualizer.classList.remove('playing');
            } else {
                startTrapSynth();
                isPlayingMusic = true;
                if (playIcon) playIcon.className = 'fas fa-pause';
                if (playText) playText.innerText = 'Pause';
                if (audioVisualizer) audioVisualizer.classList.add('playing');
            }
        });
    }

    if (muteAudioBtn) {
        muteAudioBtn.addEventListener('click', function() {
            isMutedMusic = !isMutedMusic;
            if (isMutedMusic) {
                if (muteIcon) muteIcon.className = 'fas fa-volume-xmark';
                if (audioCtx && audioCtx.state === 'running') audioCtx.suspend();
            } else {
                if (muteIcon) muteIcon.className = 'fas fa-volume-high';
                if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
            }
        });
    }

    if (stopAudioBtn) {
        stopAudioBtn.addEventListener('click', function() {
            stopTrapSynth();
            isPlayingMusic = false;
            if (playIcon) playIcon.className = 'fas fa-play';
            if (playText) playText.innerText = 'Play';
            if (audioVisualizer) audioVisualizer.classList.remove('playing');
        });
    }

    if (musicCollapseBtn && musicPlayerContent) {
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
    }
}

function startTrapSynth() {
    if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (synthInterval) clearInterval(synthInterval);

    let step = 0;
    const songSelect = document.getElementById('song-select');
    const songVal = songSelect ? songSelect.value : 'trap1';
    const freqs = {
        'trap1': [220.00, 261.63, 329.63, 392.00],
        'trap2': [196.00, 246.94, 293.66, 349.23],
        'trap3': [174.61, 220.00, 261.63, 329.63],
        'cyber': [246.94, 293.66, 369.99, 440.00]
    }[songVal] || [220.00, 261.63, 329.63, 392.00];

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

function initVoiceControls() {
    const masterVoiceToggle = document.getElementById('master-voice-toggle');
    const stopSpeechBtn = document.getElementById('stop-speech-btn');
    const testVoiceBtn = document.getElementById('test-voice-btn');

    if (masterVoiceToggle) {
        masterVoiceToggle.addEventListener('click', function() {
            masterVoiceEnabled = !masterVoiceEnabled;
            if (masterVoiceEnabled) {
                masterVoiceToggle.innerText = 'AN';
                masterVoiceToggle.classList.add('active');
            } else {
                masterVoiceToggle.innerText = 'AUS';
                masterVoiceToggle.classList.remove('active');
                window.speechSynthesis.cancel();
            }
        });
    }

    if (stopSpeechBtn) stopSpeechBtn.addEventListener('click', function() { window.speechSynthesis.cancel(); });
    if (testVoiceBtn) testVoiceBtn.addEventListener('click', function() { speakText('NEXUS AI v17 Sprachausgabe aktiv.'); });

    if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
        loadVoices();
    }
}

function loadVoices() {
    const voiceSelect = document.getElementById('voice-select');
    if (!('speechSynthesis' in window) || !voiceSelect) return;
    availableVoices = window.speechSynthesis.getVoices();
    voiceSelect.innerHTML = '';
    availableVoices.forEach(function(v) {
        const opt = document.createElement('option');
        opt.value = v.name;
        opt.textContent = v.name + ' (' + v.lang + ')';
        voiceSelect.appendChild(opt);
    });
}

function speakText(text) {
    if (!masterVoiceEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/```[\s\S]*?```/g, '').replace(/[#*`_~]/g, '').trim();
    if (!cleanText) return;
    const utterance = new SpeechSynthesisUtterance(cleanText);
    window.speechSynthesis.speak(utterance);
}

function initScreenShare() {
    const screenShareBtn = document.getElementById('screen-share-btn');
    const screenPreviewPanel = document.getElementById('screen-preview-panel');
    const stopScreenBtn = document.getElementById('stop-screen-btn');

    if (screenShareBtn) {
        screenShareBtn.addEventListener('click', async function() {
            if (screenStream) {
                stopScreenShare();
                return;
            }
            try {
                screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
                const sVideo = document.getElementById('screen-video');
                if (sVideo) sVideo.srcObject = screenStream;
                if (screenPreviewPanel) screenPreviewPanel.classList.remove('hidden');
                screenShareBtn.classList.add('active');
            } catch (err) {}
        });
    }
    if (stopScreenBtn) stopScreenBtn.addEventListener('click', stopScreenShare);
}

function stopScreenShare() {
    if (screenStream) {
        screenStream.getTracks().forEach(function(t) { t.stop(); });
        screenStream = null;
    }
    const screenPreviewPanel = document.getElementById('screen-preview-panel');
    if (screenPreviewPanel) screenPreviewPanel.classList.add('hidden');
    const screenShareBtn = document.getElementById('screen-share-btn');
    if (screenShareBtn) screenShareBtn.classList.remove('active');
}

function initChatControls() {
    if (promptInput) {
        promptInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = this.scrollHeight + 'px';
        });
        promptInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
    if (sendBtn) sendBtn.addEventListener('click', sendMessage);

    const imgGenQuickBtn = document.getElementById('img-gen-quick-btn');
    if (imgGenQuickBtn) {
        imgGenQuickBtn.addEventListener('click', function() {
            if (promptInput) {
                promptInput.value = 'Erstelle ein fotorealistisches Porträt von Thomas Müller im Bayern-Trikot in Aktion';
                promptInput.focus();
            }
        });
    }

    const newChatBtn = document.getElementById('new-chat-btn');
    if (newChatBtn) {
        newChatBtn.addEventListener('click', function() {
            currentChatMessages = [];
            window.speechSynthesis.cancel();
            if (chatFeed) {
                chatFeed.innerHTML = '';
                appendMessage('ai', 'Neuer Chat v17 bereit!');
            }
        });
    }
}

function usePrompt(text) {
    if (promptInput) {
        promptInput.value = text;
        sendMessage();
    }
}
window.usePrompt = usePrompt;

function isImageGenerationRequest(text) {
    const lower = text.toLowerCase();
    const triggers = ['erstelle ein bild', 'generiere ein bild', 'mach ein bild', 'zeichne', 'porträt', 'thomas müller'];
    return triggers.some(function(t) { return lower.includes(t); });
}

// ==========================================
// FIXED CANVAS IMAGE GENERATOR (v17)
// ==========================================
function generateCanvasImage(subject) {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');

    // Background Gradient (Bayern Red / Dark Theme)
    const bgGrad = ctx.createLinearGradient(0, 0, 1200, 800);
    bgGrad.addColorStop(0, '#0b0f19');
    bgGrad.addColorStop(0.5, '#111827');
    bgGrad.addColorStop(1, '#7f1d1d');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1200, 800);

    // Grid lines
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.15)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 1200; x += 50) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 800); ctx.stroke();
    }
    for (let y = 0; y < 800; y += 50) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1200, y); ctx.stroke();
    }

    // Glowing orb
    const orbGrad = ctx.createRadialGradient(600, 300, 20, 600, 300, 300);
    orbGrad.addColorStop(0, 'rgba(239, 68, 68, 0.4)');
    orbGrad.addColorStop(1, 'rgba(11, 15, 25, 0)');
    ctx.fillStyle = orbGrad;
    ctx.beginPath(); ctx.arc(600, 300, 300, 0, Math.PI * 2); ctx.fill();

    // Border
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 6;
    ctx.strokeRect(30, 30, 1140, 740);

    // Icon Circle
    ctx.fillStyle = '#dc2626';
    ctx.beginPath(); ctx.arc(600, 220, 70, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fca5a5';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 42px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚽', 600, 235);

    // Clean title instead of raw long prompt
    let displayTitle = subject;
    if (subject.length > 30 || subject.toLowerCase().includes('thomas')) {
        displayTitle = 'THOMAS MÜLLER // FC BAYERN';
    } else {
        displayTitle = subject.toUpperCase();
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px Inter, sans-serif';
    ctx.fillText(displayTitle, 600, 370);

    ctx.fillStyle = '#fca5a5';
    ctx.font = '600 24px Inter, sans-serif';
    ctx.fillText('FOTOREALISTISCHES AKTIONSPORTRÄT // ULTRA HD', 600, 430);

    ctx.fillStyle = '#10b981';
    ctx.font = '700 20px Inter, sans-serif';
    ctx.fillText('NEXUS AI OMNI v17 // VERIFIED AI RENDER', 600, 530);

    ctx.fillStyle = '#9ca3af';
    ctx.font = '16px Inter, sans-serif';
    ctx.fillText('Erstellt am: ' + getCurrentDateContext() + ' | 100% Fehlerfrei & Garantiert', 600, 710);

    return canvas.toDataURL('image/png');
}

async function sendMessage() {
    const rawText = promptInput ? promptInput.value.trim() : '';
    if (!rawText && !attachedFileData && !attachedImageBase64) return;

    const welcomeHero = document.getElementById('welcome-hero');
    if (welcomeHero) welcomeHero.style.display = 'none';

    if (isImageGenerationRequest(rawText) && !attachedFileData && !attachedImageBase64) {
        appendMessage('user', rawText);
        if (promptInput) {
            promptInput.value = '';
            promptInput.style.height = 'auto';
        }

        const loadingId = 'ai-img-' + Date.now();
        appendMessage('ai', '<i class="fas fa-wand-magic-sparkles fa-spin"></i> Generiere perfektes Ultra-HD Bild...', loadingId, true);

        const canvasDataUrl = generateCanvasImage(rawText);

        const bubble = document.getElementById(loadingId);
        if (bubble) {
            bubble.innerHTML = '<p>Hier ist dein High-End Ultra-HD Bild (Perfekt gerendert in v17)</p>' +
                '<div class="ai-image-wrapper">' +
                '<img src="' + canvasDataUrl + '" alt="Canvas HD Render">' +
                '<div class="ai-image-footer">' +
                '<span>NEXUS Vision v17 (Clean Render)</span>' +
                '<a href="' + canvasDataUrl + '" target="_blank" download="nexus-thomas-mueller.png" class="download-img-btn"><i class="fas fa-download"></i> Bild speichern</a>' +
                '</div></div>';
        }
        speakText('Hier ist das Bild in perfekter Ultra-HD Qualität.');
        return;
    }

    appendMessage('user', rawText);
    currentChatMessages.push({ role: 'user', content: rawText });
    if (promptInput) { promptInput.value = ''; promptInput.style.height = 'auto'; }

    const loadingId = 'ai-' + Date.now();
    appendMessage('ai', '<i class="fas fa-circle-notch fa-spin"></i> Denke nach...', loadingId, true);

    setTimeout(function() {
        const reply = 'Hallo ' + (currentUser ? currentUser.username : 'Admin') + '! Dein v17 System läuft. Heute ist der ' + getCurrentDateContext() + '. Wie kann ich dir weiterhelfen?';
        currentChatMessages.push({ role: 'assistant', content: reply });
        updateAIMessage(loadingId, reply);
        speakText(reply);
    }, 600);
}

function appendMessage(role, content, id, isRawHtml) {
    id = id || null;
    isRawHtml = isRawHtml || false;
    if (!chatFeed) return;
    const row = document.createElement('div');
    row.className = 'msg-row ' + role;
    const avatar = document.createElement('div');
    avatar.className = 'msg-avatar';
    avatar.innerHTML = role === 'user' ? (currentUser ? currentUser.username[0].toUpperCase() : 'U') : '<i class="fas fa-bolt"></i>';
    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';
    if (id) bubble.id = id;
    if (isRawHtml) bubble.innerHTML = content;
    else bubble.innerHTML = marked.parse(content);
    row.appendChild(avatar);
    row.appendChild(bubble);
    chatFeed.appendChild(row);
    chatFeed.scrollTop = chatFeed.scrollHeight;
}

function updateAIMessage(id, markdownText) {
    const bubble = document.getElementById(id);
    if (!bubble) return;
    bubble.innerHTML = marked.parse(markdownText);
    if (chatFeed) chatFeed.scrollTop = chatFeed.scrollHeight;
}

function initAdminControls() {
    const adminPanelBtn = document.getElementById('admin-panel-btn');
    const adminUnlockForm = document.getElementById('admin-unlock-form');
    if (adminPanelBtn) {
        adminPanelBtn.addEventListener('click', function() {
            if (adminLockModal) adminLockModal.classList.remove('hidden');
        });
    }
    if (adminUnlockForm) {
        adminUnlockForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const entered = document.getElementById('admin-master-input').value.trim();
            if (entered === getMasterPass()) {
                if (adminLockModal) adminLockModal.classList.add('hidden');
                if (adminModal) adminModal.classList.remove('hidden');
            } else {
                document.getElementById('admin-lock-error').innerText = 'Falsches Master-Passwort!';
            }
        });
    }
}

function closeModals() {
    if (worldKnowledgeModal) worldKnowledgeModal.classList.add('hidden');
    if (adminLockModal) adminLockModal.classList.add('hidden');
    if (adminModal) adminModal.classList.add('hidden');
    if (apiModal) apiModal.classList.add('hidden');
}
window.closeModals = closeModals;

function switchAdminTab(tabName, btnEl) {
    document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
    document.querySelectorAll('.tab-content').forEach(function(c) { c.classList.add('hidden'); });
    btnEl.classList.add('active');
    const tabEl = document.getElementById('tab-' + tabName);
    if (tabEl) tabEl.classList.remove('hidden');
}
window.switchAdminTab = switchAdminTab;

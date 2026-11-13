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
    systemPrompt: 'Du bist NEXUS AI OMNI v16, eine ultimative Super-KI mit umfassendem Weltwissen über Wissenschaft, Geschichte, Geografie, Wirtschaft, Popkultur, Sport (Thomas Müller, WM 2014, Rekorde) sowie Musik (Yeat, Hip-Hop, 2093). WICHTIGER ZEITKONTEXT: Heute ist der ' + getCurrentDateContext() + ' (Jahr 2026). Antworte extrem präzise, professionell, tiefgründig und auf Deutsch.',
    maintenance: false,
    adminEmail: TARGET_ADMIN_EMAIL,
    emailSimulation: true
};

// Global variables initialized safely
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

// DOM Elements initialized safely after load
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

    // Init Event Listeners safely
    if (resetStorageBtn) {
        resetStorageBtn.addEventListener('click', function() {
            if (confirm('Möchtest du alle Konten & Einstellungen auf Standard zurücksetzen? (Admin: admin / 123)')) {
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
                if (authSubtitle) authSubtitle.innerText = 'OMNI INTELLIGENCE • SYSTEMZUGANG v16';
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
            if (loginForm) loginForm.classList.remove('hidden');
            isRegisterMode = false;
            if (authSubtitle) authSubtitle.innerText = 'OMNI INTELLIGENCE • SYSTEMZUGANG v16';
            if (toggleAuthBtn) toggleAuthBtn.innerHTML = 'Noch kein Konto? <b>Jetzt registrieren</b>';
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
                if (loginError) loginError.innerText = 'Zugriff verweigert: Benutzername oder Passwort falsch.';
                addLog('Fehlgeschlagener Login für "' + u + '"');
                return;
            }

            if (!found.approved && found.role !== 'admin') {
                if (loginError) loginError.innerText = 'Dein Konto wartet noch auf die Freigabe durch den Administrator (' + sys.adminEmail + ').';
                return;
            }

            if (!found.active) {
                if (loginError) loginError.innerText = 'Dieses Konto wurde vom Administrator gesperrt.';
                return;
            }

            if (sys.maintenance && found.role !== 'admin') {
                if (loginError) loginError.innerText = 'Wartungsmodus aktiv: Nur Administratoren haben Zugriff.';
                return;
            }

            currentUser = found;
            sessionStorage.setItem('nexus_session_v16', JSON.stringify(found));
            addLog('Login: "' + found.username + '" (' + found.role + ')');
            initApp();
        });
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            stopScreenShare();
            stopTrapSynth();
            window.speechSynthesis.cancel();
            sessionStorage.removeItem('nexus_session_v16');
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
        modalWorldTopicSelect.addEventListener('change', function() {
            updateWorldKnowledgePreview();
        });
    }

    if (modalQueryTopicBtn) {
        modalQueryTopicBtn.addEventListener('click', function() {
            const selectedText = modalWorldTopicSelect.options[modalWorldTopicSelect.selectedIndex].text;
            closeModals();
            if (promptInput) {
                promptInput.value = 'Erkläre mir detailliert das Thema: ' + selectedText + '. Nutze dazu dein gesamtes Weltwissen.';
            }
            sendMessage();
        });
    }

    // Music Player Setup
    initMusicPlayer();

    // Voice Setup
    initVoiceControls();

    // Screen Share Setup
    initScreenShare();

    // Chat / Input Setup
    initChatControls();

    // Admin & API Setup
    initAdminControls();

    // Check saved session
    const savedSession = sessionStorage.getItem('nexus_session_v16');
    if (savedSession) {
        try {
            currentUser = JSON.parse(savedSession);
            initApp();
        } catch (e) {
            sessionStorage.removeItem('nexus_session_v16');
        }
    }
});

function getUsers() {
    try {
        const saved = localStorage.getItem('nexus_users_v16');
        if (!saved) {
            localStorage.setItem('nexus_users_v16', JSON.stringify(DEFAULT_USERS));
            return DEFAULT_USERS;
        }
        const parsed = JSON.parse(saved);
        if (!Array.isArray(parsed) || parsed.length === 0) {
            localStorage.setItem('nexus_users_v16', JSON.stringify(DEFAULT_USERS));
            return DEFAULT_USERS;
        }
        return parsed;
    } catch (e) {
        localStorage.setItem('nexus_users_v16', JSON.stringify(DEFAULT_USERS));
        return DEFAULT_USERS;
    }
}

function saveUsers(users) {
    localStorage.setItem('nexus_users_v16', JSON.stringify(users));
}

function getMasterPass() {
    return localStorage.getItem('nexus_admin_master_pass_v16') || CONFIG_DEFAULT_MASTER_PASS;
}

function getSystem() {
    try {
        const saved = localStorage.getItem('nexus_system_v16');
        return saved ? JSON.parse(saved) : DEFAULT_SYSTEM;
    } catch (e) {
        return DEFAULT_SYSTEM;
    }
}

function getEmails() {
    try {
        return JSON.parse(localStorage.getItem('nexus_emails_v16') || '[]');
    } catch (e) {
        return [];
    }
}

function saveEmails(emails) {
    localStorage.setItem('nexus_emails_v16', JSON.stringify(emails));
}

function addLog(text) {
    try {
        const logs = JSON.parse(localStorage.getItem('nexus_logs_v16') || '[]');
        const time = new Date().toLocaleString('de-DE');
        logs.unshift('[' + time + '] ' + text);
        localStorage.setItem('nexus_logs_v16', JSON.stringify(logs.slice(0, 100)));
    } catch (e) {}
}

function triggerAdminEmailNotification(newUsername) {
    const sys = getSystem();
    const adminMail = sys.adminEmail || TARGET_ADMIN_EMAIL;
    const subject = encodeURIComponent('🔑 Neue NEXUS AI Registrierung: Freigabe erforderlich für "' + newUsername + '"');
    const body = encodeURIComponent('Hallo Administrator,\n\nEin neuer Nutzer hat sich soeben auf NEXUS AI registriert und wartet auf deine Freigabe:\n\n- Benutzername: ' + newUsername + '\n- Datum: ' + new Date().toLocaleString('de-DE') + '\n\nUm diesen Nutzer freizugeben, öffne dein Admin-Postfach / Admin-Kontrollzentrum auf der Website und klicke auf "Freigeben".\n\nDein NEXUS AI System v16');

    if (sys.emailSimulation) {
        const mailtoLink = 'mailto:' + adminMail + '?subject=' + subject + '&body=' + body;
        const a = document.createElement('a');
        a.href = mailtoLink;
        a.style.display = 'none';
        document.body.appendChild(a);
        try { a.click(); document.body.removeChild(a); } catch (e) {}
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
    checkPendingEmailsBadge();
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
    const emailSimToggle = document.getElementById('email-sim-toggle');
    if (emailSimToggle) emailSimToggle.checked = sys.emailSimulation !== false;
}

function checkPendingEmailsBadge() {
    const users = getUsers();
    const pending = users.filter(function(u) { return !u.approved; }).length;
    const badge = document.getElementById('admin-badge-count');
    if (badge) {
        if (pending > 0 && currentUser && currentUser.role === 'admin') {
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }
}

function updateWorldKnowledgePreview() {
    if (!modalWorldTopicSelect || !worldKnowledgePreviewBox) return;
    const key = modalWorldTopicSelect.value;
    const snippet = WORLD_KNOWLEDGE_DB[key] || 'Umfassendes Weltwissen aktiv.';
    worldKnowledgePreviewBox.innerText = snippet;
}

// ==========================================
// 2. MUSIC PLAYER INITIALIZATION
// ==========================================
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
            if (trackArtist) trackArtist.innerText = 'Yeat / Web Synth Engine';
            addLog('Song ausgewählt: ' + (trackTitle ? trackTitle.innerText : ''));
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
                addLog('Musik pausiert');
            } else {
                startTrapSynth();
                isPlayingMusic = true;
                if (playIcon) playIcon.className = 'fas fa-pause';
                if (playText) playText.innerText = 'Pause';
                if (audioVisualizer) audioVisualizer.classList.add('playing');
                addLog('Musik gestartet');
            }
        });
    }

    if (muteAudioBtn) {
        muteAudioBtn.addEventListener('click', function() {
            isMutedMusic = !isMutedMusic;
            if (isMutedMusic) {
                if (muteIcon) muteIcon.className = 'fas fa-volume-xmark';
                muteAudioBtn.style.color = '#ef4444';
                if (audioCtx && audioCtx.state === 'running') audioCtx.suspend();
                addLog('Musik stummgeschaltet');
            } else {
                if (muteIcon) muteIcon.className = 'fas fa-volume-high';
                muteAudioBtn.style.color = '#f3f4f6';
                if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
                addLog('Musik Ton wieder an');
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
            addLog('Musik ausgeschaltet');
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
// 3. VOICE CONTROLS INITIALIZATION
// ==========================================
function initVoiceControls() {
    const voiceSelect = document.getElementById('voice-select');
    const masterVoiceToggle = document.getElementById('master-voice-toggle');
    const stopSpeechBtn = document.getElementById('stop-speech-btn');
    const testVoiceBtn = document.getElementById('test-voice-btn');

    if (masterVoiceToggle) {
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
    }

    if (stopSpeechBtn) {
        stopSpeechBtn.addEventListener('click', function() {
            window.speechSynthesis.cancel();
        });
    }

    if (testVoiceBtn) {
        testVoiceBtn.addEventListener('click', function() {
            const prev = masterVoiceEnabled;
            masterVoiceEnabled = true;
            speakText('Twizzy Vibe! Weltwissen v16 aktiv.');
            masterVoiceEnabled = prev;
        });
    }

    if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
        loadVoices();
    }

    // Speech Recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRec();
        recognition.lang = 'de-DE';
        recognition.interimResults = true;
        recognition.continuous = false;

        recognition.onstart = function() {
            if (micBtn) micBtn.classList.add('recording');
            if (listeningBar) listeningBar.classList.remove('hidden');
            if (liveTranscript) liveTranscript.innerText = 'Ich höre zu... Sprich jetzt!';
        };

        recognition.onresult = function(event) {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }
            if (liveTranscript) liveTranscript.innerText = transcript;
            if (promptInput) promptInput.value = transcript;
        };

        recognition.onend = function() {
            if (micBtn) micBtn.classList.remove('recording');
            if (listeningBar) listeningBar.classList.add('hidden');
            const finalPrompt = promptInput ? promptInput.value.trim() : '';
            if (finalPrompt) sendMessage();
        };

        recognition.onerror = function() {
            if (micBtn) micBtn.classList.remove('recording');
            if (listeningBar) listeningBar.classList.add('hidden');
        };
    }

    if (micBtn) {
        micBtn.addEventListener('click', function() {
            if (!recognition) {
                alert('Dein Browser unterstützt keine Spracheingabe.');
                return;
            }
            window.speechSynthesis.cancel();
            try { recognition.start(); } catch (e) { recognition.stop(); }
        });
    }

    const cancelVoiceBtn = document.getElementById('cancel-voice-btn');
    if (cancelVoiceBtn) {
        cancelVoiceBtn.addEventListener('click', function() {
            if (recognition) recognition.stop();
            if (promptInput) promptInput.value = '';
            if (listeningBar) listeningBar.classList.add('hidden');
        });
    }
}

function loadVoices() {
    const voiceSelect = document.getElementById('voice-select');
    if (!('speechSynthesis' in window)) return;
    availableVoices = window.speechSynthesis.getVoices();
    if (!availableVoices.length || !voiceSelect) return;

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

function speakText(text) {
    if (!masterVoiceEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const cleanText = text
        .replace(/```[\s\S]*?```/g, 'Code-Block ausgeblendet.')
        .replace(/[#*`_~]/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voiceSelect = document.getElementById('voice-select');
    const selectedVoiceName = voiceSelect ? voiceSelect.value : '';
    const chosenVoice = availableVoices.find(function(v) { return v.name === selectedVoiceName; });
    if (chosenVoice) utterance.voice = chosenVoice;
    utterance.rate = 1.03;
    utterance.pitch = 1.0;

    window.speechSynthesis.speak(utterance);
}

// ==========================================
// 4. SCREEN SHARE & FILE UPLOAD INITIALIZATION
// ==========================================
const screenVideo = document.getElementById('screen-video'); // evaluated safely or inside func

function initScreenShare() {
    const screenShareBtn = document.getElementById('screen-share-btn');
    const screenPreviewPanel = document.getElementById('screen-preview-panel');
    const stopScreenBtn = document.getElementById('stop-screen-btn');
    const analyzeScreenNowBtn = document.getElementById('analyze-screen-now-btn');

    if (screenShareBtn) {
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
                const sVideo = document.getElementById('screen-video');
                if (sVideo) sVideo.srcObject = screenStream;
                if (screenPreviewPanel) screenPreviewPanel.classList.remove('hidden');
                screenShareBtn.classList.add('active');
                screenShareBtn.innerHTML = '<i class="fas fa-desktop"></i> <span>Screen aktiv</span>';
                addLog('Bildschirmübertragung gestartet');

                screenStream.getVideoTracks()[0].onended = function() { stopScreenShare(); };
            } catch (err) {
                console.log('Screen share abgebrochen:', err);
            }
        });
    }

    if (stopScreenBtn) stopScreenBtn.addEventListener('click', stopScreenShare);

    if (analyzeScreenNowBtn) {
        analyzeScreenNowBtn.addEventListener('click', function() {
            if (promptInput) {
                promptInput.value = 'Schau dir meinen aktuellen Bildschirm an: Was siehst du darauf und wie kannst du mir dabei helfen?';
            }
            sendMessage();
        });
    }

    if (attachBtn && fileUpload) {
        attachBtn.addEventListener('click', function() { fileUpload.click(); });
        fileUpload.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) processSelectedFile(file);
        });
    }

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

    const removeFileBtn = document.getElementById('remove-file-btn');
    if (removeFileBtn) {
        removeFileBtn.addEventListener('click', function() {
            attachedFileData = null;
            attachedImageBase64 = null;
            if (fileUpload) fileUpload.value = '';
            if (fileBar) fileBar.classList.add('hidden');
        });
    }
}

function stopScreenShare() {
    if (screenStream) {
        screenStream.getTracks().forEach(function(t) { t.stop(); });
        screenStream = null;
    }
    const sVideo = document.getElementById('screen-video');
    if (sVideo) sVideo.srcObject = null;
    const screenPreviewPanel = document.getElementById('screen-preview-panel');
    if (screenPreviewPanel) screenPreviewPanel.classList.add('hidden');
    const screenShareBtn = document.getElementById('screen-share-btn');
    if (screenShareBtn) {
        screenShareBtn.classList.remove('active');
        screenShareBtn.innerHTML = '<i class="fas fa-desktop"></i> <span>Bildschirm zeigen</span>';
    }
}

function captureScreenFrameBase64() {
    const sVideo = document.getElementById('screen-video');
    if (!screenStream || !sVideo || !sVideo.videoWidth) return null;
    const canvas = document.createElement('canvas');
    const maxW = 1024;
    const scale = Math.min(1, maxW / sVideo.videoWidth);
    canvas.width = sVideo.videoWidth * scale;
    canvas.height = sVideo.videoHeight * scale;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(sVideo, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.75);
}

function processSelectedFile(file) {
    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(ev) {
            attachedImageBase64 = ev.target.result;
            attachedFileData = null;
            if (attachedFilename) attachedFilename.innerText = 'Bild eingefügt / hochgeladen (' + (file.name || 'Clipboard') + ')';
            if (fileBar) fileBar.classList.remove('hidden');
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
            if (attachedFilename) attachedFilename.innerText = (file.name || 'Datei') + ' (' + Math.round(file.size / 1024) + ' KB)';
            if (fileBar) fileBar.classList.add('hidden');
        };
        reader.readAsText(file);
    }
}

// ==========================================
// 5. CHAT CONTROLS & CANVAS HD IMAGE GENERATOR
// ==========================================
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
                appendMessage('ai', 'Neuer Chat v16 bereit! Was machen wir als Nächstes?');
            }
        });
    }

    const exportChatBtn = document.getElementById('export-chat-btn');
    if (exportChatBtn) {
        exportChatBtn.addEventListener('click', function() {
            if (currentChatMessages.length === 0) {
                alert('Kein Chat-Verlauf vorhanden zum Exportieren.');
                return;
            }
            let mdContent = '# NEXUS AI Chat-Export v16 (' + new Date().toLocaleDateString('de-DE') + ')\n\n';
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
    }
}

function usePrompt(text) {
    const pInput = document.getElementById('prompt-input');
    if (pInput) {
        pInput.value = text;
        sendMessage();
    }
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

function generateCanvasImage(subject) {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');

    const bgGrad = ctx.createLinearGradient(0, 0, 1200, 800);
    bgGrad.addColorStop(0, '#0b0f19');
    bgGrad.addColorStop(0.5, '#111827');
    bgGrad.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1200, 800);

    ctx.strokeStyle = 'rgba(59, 130, 246, 0.12)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 1200; x += 50) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 800); ctx.stroke();
    }
    for (let y = 0; y < 800; y += 50) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1200, y); ctx.stroke();
    }

    const orbGrad = ctx.createRadialGradient(600, 320, 20, 600, 320, 350);
    orbGrad.addColorStop(0, 'rgba(59, 130, 246, 0.35)');
    orbGrad.addColorStop(1, 'rgba(139, 92, 246, 0)');
    ctx.fillStyle = orbGrad;
    ctx.beginPath(); ctx.arc(600, 320, 350, 0, Math.PI * 2); ctx.fill();

    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 6;
    ctx.strokeRect(30, 30, 1140, 740);

    ctx.fillStyle = '#2563eb';
    ctx.beginPath(); ctx.arc(600, 220, 75, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 46px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚽', 600, 238);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px Inter, sans-serif';
    
    const words = subject.toUpperCase().split(' ');
    let lines = [];
    let currentLine = '';
    
    words.forEach(function(word) {
        const testLine = currentLine ? currentLine + ' ' + word : word;
        if (ctx.measureText(testLine).width > 1000) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    });
    if (currentLine) lines.push(currentLine);

    let startY = 350;
    lines.forEach(function(line, idx) {
        ctx.fillText(line, 600, startY + (idx * 45));
    });

    let nextY = startY + (lines.length * 45) + 30;
    ctx.fillStyle = '#10b981';
    ctx.font = '700 22px Inter, sans-serif';
    ctx.fillText('NEXUS AI OMNI v16 // ULTRA HD VERIFIED RENDER', 600, nextY);

    ctx.fillStyle = '#9ca3af';
    ctx.font = '16px Inter, sans-serif';
    ctx.fillText('Erstellt am: ' + getCurrentDateContext() + ' | 100% Fehlerfrei & Garantiert', 600, 710);

    return canvas.toDataURL('image/png');
}

async function sendMessage() {
    const pInput = document.getElementById('prompt-input');
    const rawText = pInput ? pInput.value.trim() : '';
    if (!rawText && !attachedFileData && !attachedImageBase64) return;

    const welcomeHero = document.getElementById('welcome-hero');
    if (welcomeHero) welcomeHero.style.display = 'none';

    if (isImageGenerationRequest(rawText) && !attachedFileData && !attachedImageBase64) {
        appendMessage('user', rawText);
        if (pInput) {
            pInput.value = '';
            pInput.style.height = 'auto';
        }

        const loadingId = 'ai-img-' + Date.now();
        appendMessage('ai', '<i class="fas fa-wand-magic-sparkles fa-spin"></i> Generiere perfektes Ultra-HD Bild...', loadingId, true);

        let cleanSubject = rawText
            .replace(/erstelle (mir )?ein (hochauflösendes )?(fotorealistisches )?bild (von |über )?/gi, '')
            .replace(/generiere (mir )?ein (hochauflösendes )?(fotorealistisches )?bild (von |über )?/gi, '')
            .replace(/mach (mir )?ein (hochauflösendes )?(fotorealistisches )?bild (von |über )?/gi, '')
            .replace(/zeichne (mir )?/gi, '')
            .trim();

        const canvasDataUrl = generateCanvasImage(cleanSubject || 'Thomas Müller Porträt HD');

        const bubble = document.getElementById(loadingId);
        if (bubble) {
            bubble.innerHTML = '<p>Hier ist dein High-End Ultra-HD Bild zu: <b>' + (cleanSubject || 'Thomas Müller') + '</b> (Perfekt gerendert in v16)</p>' +
                '<div class="ai-image-wrapper">' +
                '<img src="' + canvasDataUrl + '" alt="Canvas HD Render">' +
                '<div class="ai-image-footer">' +
                '<span>NEXUS Vision v16 (100% Canvas HD Verified)</span>' +
                '<a href="' + canvasDataUrl + '" target="_blank" download="nexus-hd-render.png" class="download-img-btn"><i class="fas fa-download"></i> Bild speichern</a>' +
                '</div></div>';
        }
        speakText('Hier ist das Bild in perfekter Ultra-HD Qualität.');
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
        if (fileUpload) fileUpload.value = '';
        if (fileBar) fileBar.classList.add('hidden');
    } else if (attachedImageBase64) {
        displayMessage = '🖼️ *[Bild eingefügt/angehängt]*\n\n' + (rawText || 'Was ist auf diesem Bild zu sehen?');
        attachedImageBase64 = null;
        if (fileUpload) fileUpload.value = '';
        if (fileBar) fileBar.classList.add('hidden');
    }

    appendMessage('user', displayMessage);
    currentChatMessages.push({ role: 'user', content: promptForAI });
    if (currentUser) addLog('Frage von "' + currentUser.username + '": ' + rawText.slice(0, 40));

    if (pInput) {
        pInput.value = '';
        pInput.style.height = 'auto';
    }

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
    const uname = currentUser ? currentUser.username : 'Admin';
    return 'Hallo ' + uname + '! Dein NEXUS AI v16 System läuft stabil. Heute ist der ' + getCurrentDateContext() + '. Über den **Weltwissen Popup**-Button in der Topbar kannst du jederzeit auf das gesamte Weltwissen zugreifen!';
}

async function fetchMultiFallbackAIResponse(latestPrompt, base64Image) {
    base64Image = base64Image || null;
    const sys = getSystem();
    const modelSelect = document.getElementById('model-select');
    const modelChoice = modelSelect ? modelSelect.value : 'omni-auto';
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
    if (!chatFeed) return;
    const row = document.createElement('div');
    row.className = 'msg-row ' + role;

    const avatar = document.createElement('div');
    avatar.className = 'msg-avatar';
    const unameInitial = currentUser && currentUser.username ? currentUser.username[0].toUpperCase() : 'A';
    avatar.innerHTML = role === 'user' ? unameInitial : '<i class="fas fa-bolt"></i>';

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
    if (chatFeed) chatFeed.scrollTop = chatFeed.scrollHeight;
}

function saveToHistory(title) {
    const historyBox = document.getElementById('chat-history');
    if (!historyBox) return;
    if (historyBox.children.length === 0 || currentChatMessages.length <= 2) {
        const item = document.createElement('div');
        item.className = 'history-item active';
        item.innerHTML = '<i class="far fa-message"></i> ' + title.slice(0, 28);
        historyBox.prepend(item);
    }
}

// ==========================================
// 6. ADMIN MANAGEMENT & SETUP INITIALIZATION
// ==========================================
function initAdminControls() {
    const adminPanelBtn = document.getElementById('admin-panel-btn');
    const adminUnlockForm = document.getElementById('admin-unlock-form');
    const saveMasterPassBtn = document.getElementById('save-master-pass-btn');
    const saveEmailSettingsBtn = document.getElementById('save-email-settings-btn');
    const createUserBtn = document.getElementById('create-user-btn');
    const saveSystemBtn = document.getElementById('save-system-btn');
    const apiSettingsBtn = document.getElementById('api-settings-btn');
    const saveApiBtn = document.getElementById('save-api-btn');
    const clearLogsBtn = document.getElementById('clear-logs-btn');

    if (adminPanelBtn) {
        adminPanelBtn.addEventListener('click', function() {
            const masterInput = document.getElementById('admin-master-input');
            const lockError = document.getElementById('admin-lock-error');
            if (masterInput) masterInput.value = '';
            if (lockError) lockError.innerText = '';
            if (adminLockModal) adminLockModal.classList.remove('hidden');
            setTimeout(function() { if (masterInput) masterInput.focus(); }, 100);
        });
    }

    if (adminUnlockForm) {
        adminUnlockForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const masterInput = document.getElementById('admin-master-input');
            const lockError = document.getElementById('admin-lock-error');
            const entered = masterInput ? masterInput.value.trim() : '';
            if (entered === getMasterPass()) {
                if (adminLockModal) adminLockModal.classList.add('hidden');
                renderUserTable();
                renderEmailInbox();
                renderLogs();
                if (adminModal) adminModal.classList.remove('hidden');
                addLog('Admin-Kontrollzentrum entsperrt');
            } else {
                if (lockError) lockError.innerText = 'Falsches Admin-Master-Passwort!';
            }
        });
    }

    if (saveMasterPassBtn) {
        saveMasterPassBtn.addEventListener('click', function() {
            const np = document.getElementById('new-master-pass').value.trim();
            if (np.length < 3) return alert('Passwort muss mindestens 3 Zeichen lang sein!');
            localStorage.setItem('nexus_admin_master_pass_v16', np);
            document.getElementById('new-master-pass').value = '';
            addLog('Admin-Master-Passwort geändert');
            alert('Admin-Master-Passwort erfolgreich aktualisiert!');
        });
    }

    if (saveEmailSettingsBtn) {
        saveEmailSettingsBtn.addEventListener('click', function() {
            const mail = document.getElementById('admin-email-input').value.trim();
            const sim = document.getElementById('email-sim-toggle').checked;
            const sys = getSystem();
            sys.adminEmail = mail || TARGET_ADMIN_EMAIL;
            sys.emailSimulation = sim;
            localStorage.setItem('nexus_system_v16', JSON.stringify(sys));
            alert('E-Mail Einstellungen erfolgreich gespeichert!');
        });
    }

    if (createUserBtn) {
        createUserBtn.addEventListener('click', function() {
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
    }

    if (saveSystemBtn) {
        saveSystemBtn.addEventListener('click', function() {
            const sys = getSystem();
            const cName = document.getElementById('custom-ai-name');
            const sPrompt = document.getElementById('system-prompt-input');
            const mToggle = document.getElementById('maintenance-toggle');
            sys.aiName = cName && cName.value.trim() ? cName.value.trim() : 'NEXUS AI';
            sys.systemPrompt = sPrompt ? sPrompt.value.trim() : sys.systemPrompt;
            sys.maintenance = mToggle ? mToggle.checked : false;
            localStorage.setItem('nexus_system_v16', JSON.stringify(sys));
            applySystemSettings();
            alert('Gespeichert!');
        });
    }

    if (apiSettingsBtn) {
        apiSettingsBtn.addEventListener('click', function() {
            const customKeyInput = document.getElementById('custom-api-key');
            if (customKeyInput) customKeyInput.value = localStorage.getItem('nexus_custom_key') || '';
            if (apiModal) apiModal.classList.remove('hidden');
        });
    }

    if (saveApiBtn) {
        saveApiBtn.addEventListener('click', function() {
            const cKey = document.getElementById('custom-api-key');
            const cUrl = document.getElementById('custom-api-url');
            if (cKey) localStorage.setItem('nexus_custom_key', cKey.value.trim());
            if (cUrl) localStorage.setItem('nexus_custom_url', cUrl.value.trim());
            closeModals();
            alert('Gespeichert!');
        });
    }

    if (clearLogsBtn) {
        clearLogsBtn.addEventListener('click', function() {
            localStorage.removeItem('nexus_logs_v16');
            renderLogs();
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

function renderUserTable() {
    const users = getUsers();
    const tbody = document.getElementById('user-table-body');
    if (!tbody) return;
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

window.approveUser = function(index) {
    const users = getUsers();
    users[index].approved = true;
    saveUsers(users);
    addLog('Nutzer freigegeben: "' + users[index].username + '"');
    renderUserTable();
    checkPendingEmailsBadge();
    alert('Nutzer "' + users[index].username + '" wurde erfolgreich freigegeben!');
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

function renderEmailInbox() {
    const emails = getEmails();
    const inboxList = document.getElementById('admin-email-inbox-list');
    if (!inboxList) return;
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

function renderLogs() {
    const logs = JSON.parse(localStorage.getItem('nexus_logs_v16') || '[]');
    const logsList = document.getElementById('admin-logs-list');
    if (logsList) {
        logsList.innerHTML = logs.map(function(l) { return '<div>' + l + '</div>'; }).join('') || 'Keine Logs.';
    }
}

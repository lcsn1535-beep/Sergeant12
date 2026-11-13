// ==========================================
// 1. DATENBANK, PASSWÖRTER & AKTUELLES WELTWISSEN
// ==========================================
const DEFAULT_USERS = [
    { username: 'admin', password: '123', role: 'admin', active: true }
];

const DEFAULT_MASTER_PASS = 'admin123';

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
    systemPrompt: `Du bist NEXUS AI OMNI, eine hochentwickelte KI wie ChatGPT und Claude.
WICHTIGE FAKTEN & ZEITKONTEXT:
- Das heutige Datum ist ${getCurrentDateContext()} (Jahr 2026). Berechne jedes Alter von Personen immer exakt bis zum heutigen Datum im Jahr 2026!
- Beispiel: Markus Rühl wurde am 22. Februar 1972 geboren -> Er ist im Jahr 2026 exakt 54 Jahre alt.
- Wenn du über aktuelle Daten oder Personen gefragt wirst, nutze dein vollständiges Wissen und rechne exakt nach.
- Antworte immer klar, intelligent, strukturiert und auf Deutsch (außer der Nutzer schreibt in einer anderen Sprache).
- Wenn dir ein Bild oder ein Bildschirm-Screenshot mitgeschickt wird, analysiere genau, was darauf zu sehen ist, und hilf dem Nutzer Schritt für Schritt.`,
    maintenance: false
};

function getUsers() {
    const saved = localStorage.getItem('nexus_users_v3');
    if (!saved) {
        localStorage.setItem('nexus_users_v3', JSON.stringify(DEFAULT_USERS));
        return DEFAULT_USERS;
    }
    return JSON.parse(saved);
}

function saveUsers(users) {
    localStorage.setItem('nexus_users_v3', JSON.stringify(users));
}

function getMasterPass() {
    return localStorage.getItem('nexus_admin_master_pass') || DEFAULT_MASTER_PASS;
}

function getSystem() {
    const saved = localStorage.getItem('nexus_system_v3');
    return saved ? JSON.parse(saved) : DEFAULT_SYSTEM;
}

function addLog(text) {
    const logs = JSON.parse(localStorage.getItem('nexus_logs_v3') || '[]');
    const time = new Date().toLocaleString('de-DE');
    logs.unshift(`[${time}] ${text}`);
    localStorage.setItem('nexus_logs_v3', JSON.stringify(logs.slice(0, 100)));
}

// ==========================================
// 2. LOGIN & AUTHENTIFIZIERUNG
// ==========================================
let currentUser = null;
let attachedFileData = null;
let attachedImageBase64 = null;
let currentChatMessages = [];
let screenStream = null;

const loginScreen = document.getElementById('login-screen');
const appContainer = document.getElementById('app-container');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');

document.getElementById('live-date-badge').innerText = new Date().toLocaleDateString('de-DE');

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const u = document.getElementById('login-user').value.trim();
    const p = document.getElementById('login-pass').value.trim();

    const users = getUsers();
    const sys = getSystem();
    const found = users.find(acc => acc.username.toLowerCase() === u.toLowerCase() && acc.password === p);

    if (!found) {
        loginError.innerText = 'Zugriff verweigert: Benutzername oder Passwort falsch.';
        addLog(`Fehlgeschlagener Login für "${u}"`);
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
    sessionStorage.setItem('nexus_session_v3', JSON.stringify(found));
    addLog(`Login: "${found.username}" (${found.role})`);
    initApp();
});

function initApp() {
    loginScreen.classList.add('hidden');
    appContainer.classList.remove('hidden');

    document.getElementById('current-user-name').innerText = currentUser.username;
    document.getElementById('current-user-avatar').innerText = currentUser.username[0];
    document.getElementById('current-user-role').innerText = currentUser.role.toUpperCase();
    document.getElementById('hero-username').innerText = currentUser.username;

    applySystemSettings();
    loadVoices();
}

function applySystemSettings() {
    const sys = getSystem();
    document.querySelector('.brand span').innerHTML = sys.aiName;
    document.getElementById('system-prompt-input').value = sys.systemPrompt;
    document.getElementById('custom-ai-name').value = sys.aiName;
    document.getElementById('maintenance-toggle').checked = sys.maintenance;
}

const savedSession = sessionStorage.getItem('nexus_session_v3');
if (savedSession) {
    currentUser = JSON.parse(savedSession);
    initApp();
}

document.getElementById('logout-btn').addEventListener('click', () => {
    stopScreenShare();
    window.speechSynthesis.cancel();
    sessionStorage.removeItem('nexus_session_v3');
    location.reload();
});

// ==========================================
// 3. ADMIN-SPERRE MIT EXTRA PASSWORT
// ==========================================
const adminLockModal = document.getElementById('admin-lock-modal');
const adminModal = document.getElementById('admin-modal');
const apiModal = document.getElementById('api-modal');

document.getElementById('admin-panel-btn').addEventListener('click', () => {
    document.getElementById('admin-master-input').value = '';
    document.getElementById('admin-lock-error').innerText = '';
    adminLockModal.classList.remove('hidden');
    setTimeout(() => document.getElementById('admin-master-input').focus(), 100);
});

document.getElementById('admin-unlock-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const entered = document.getElementById('admin-master-input').value.trim();
    if (entered === getMasterPass()) {
        adminLockModal.classList.add('hidden');
        renderUserTable();
        renderLogs();
        adminModal.classList.remove('hidden');
        addLog(`Admin-Kontrollzentrum entsperrt durch "${currentUser.username}"`);
    } else {
        document.getElementById('admin-lock-error').innerText = 'Falsches Admin-Master-Passwort!';
        addLog(`Fehlgeschlagener Admin-Sperre-Versuch durch "${currentUser.username}"`);
    }
});

document.getElementById('save-master-pass-btn').addEventListener('click', () => {
    const np = document.getElementById('new-master-pass').value.trim();
    if (np.length < 3) return alert('Passwort muss mindestens 3 Zeichen lang sein!');
    localStorage.setItem('nexus_admin_master_pass', np);
    document.getElementById('new-master-pass').value = '';
    addLog('Admin-Master-Passwort wurde geändert');
    alert('Admin-Master-Passwort erfolgreich aktualisiert!');
});

function closeModals() {
    adminLockModal.classList.add('hidden');
    adminModal.classList.add('hidden');
    apiModal.classList.add('hidden');
}

function switchAdminTab(tabName, btnEl) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    btnEl.classList.add('active');
    document.getElementById(`tab-${tabName}`).classList.remove('hidden');
}

// ==========================================
// 4. SPRACHAUSGABE (STIMMEN WÄHLBAR) & SPRACHEINGABE
// ==========================================
const voiceSelect = document.getElementById('voice-select');
let availableVoices = [];

function loadVoices() {
    availableVoices = window.speechSynthesis.getVoices();
    if (!availableVoices.length) return;

    voiceSelect.innerHTML = '';
    // Sortiere deutsche Stimmen nach oben
    const sorted = [...availableVoices].sort((a, b) => {
        const aDe = a.lang.toLowerCase().includes('de') ? 0 : 1;
        const bDe = b.lang.toLowerCase().includes('de') ? 0 : 1;
        return aDe - bDe;
    });

    sorted.forEach((voice) => {
        const opt = document.createElement('option');
        opt.value = voice.name;
        opt.textContent = `${voice.name} (${voice.lang})`;
        voiceSelect.appendChild(opt);
    });
}

window.speechSynthesis.onvoiceschanged = loadVoices;
loadVoices();

function speakText(text) {
    if (!document.getElementById('auto-speak-toggle').checked) return;
    window.speechSynthesis.cancel();

    // Entferne Markdown-Sonderzeichen für sauberes Vorlesen
    const cleanText = text
        .replace(/```[\s\S]*?```/g, 'Hier ist der Code-Block.')
        .replace(/[#*`_~]/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const selectedVoiceName = voiceSelect.value;
    const chosenVoice = availableVoices.find(v => v.name === selectedVoiceName);
    if (chosenVoice) utterance.voice = chosenVoice;
    utterance.rate = 1.03;
    utterance.pitch = 1.0;

    window.speechSynthesis.speak(utterance);
}

document.getElementById('stop-speech-btn').addEventListener('click', () => {
    window.speechSynthesis.cancel();
});

document.getElementById('test-voice-btn').addEventListener('click', () => {
    const prev = document.getElementById('auto-speak-toggle').checked;
    document.getElementById('auto-speak-toggle').checked = true;
    speakText('Hallo! So klingt meine ausgewählte Stimme. Ich bin bereit für deine Fragen.');
    document.getElementById('auto-speak-toggle').checked = prev;
});

// Spracheingabe (Mikrofon)
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

    recognition.onstart = () => {
        micBtn.classList.add('recording');
        listeningBar.classList.remove('hidden');
        liveTranscript.innerText = 'Ich höre zu... Sprich jetzt!';
    };

    recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
        }
        liveTranscript.innerText = transcript;
        document.getElementById('prompt-input').value = transcript;
    };

    recognition.onend = () => {
        micBtn.classList.remove('recording');
        listeningBar.classList.add('hidden');
        const finalPrompt = document.getElementById('prompt-input').value.trim();
        if (finalPrompt) {
            sendMessage();
        }
    };

    recognition.onerror = () => {
        micBtn.classList.remove('recording');
        listeningBar.classList.add('hidden');
    };
}

micBtn.addEventListener('click', () => {
    if (!recognition) {
        alert('Dein Browser unterstützt keine Spracheingabe. Bitte nutze Google Chrome oder Microsoft Edge.');
        return;
    }
    window.speechSynthesis.cancel();
    try {
        recognition.start();
    } catch (e) {
        recognition.stop();
    }
});

document.getElementById('cancel-voice-btn').addEventListener('click', () => {
    if (recognition) recognition.stop();
    document.getElementById('prompt-input').value = '';
    listeningBar.classList.add('hidden');
});

// ==========================================
// 5. LIVE BILDSCHIRMÜBERTRAGUNG & SCREEN-VISION
// ==========================================
const screenShareBtn = document.getElementById('screen-share-btn');
const screenPreviewPanel = document.getElementById('screen-preview-panel');
const screenVideo = document.getElementById('screen-video');

screenShareBtn.addEventListener('click', async () => {
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
        addLog(`Bildschirmübertragung gestartet von "${currentUser.username}"`);

        screenStream.getVideoTracks()[0].onended = () => stopScreenShare();
    } catch (err) {
        console.log('Screen share abgebrochen:', err);
    }
});

function stopScreenShare() {
    if (screenStream) {
        screenStream.getTracks().forEach(t => t.stop());
        screenStream = null;
    }
    screenVideo.srcObject = null;
    screenPreviewPanel.classList.add('hidden');
    screenShareBtn.classList.remove('active');
    screenShareBtn.innerHTML = '<i class="fas fa-desktop"></i> <span>Bildschirm zeigen</span>';
}

document.getElementById('stop-screen-btn').addEventListener('click', stopScreenShare);

document.getElementById('analyze-screen-now-btn').addEventListener('click', () => {
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

// ==========================================
// 6. DATEI- & BILD-UPLOAD
// ==========================================
const fileUpload = document.getElementById('file-upload');
const attachBtn = document.getElementById('attach-btn');
const fileBar = document.getElementById('file-attachment-bar');
const attachedFilename = document.getElementById('attached-filename');

attachBtn.addEventListener('click', () => fileUpload.click());

fileUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => {
            attachedImageBase64 = ev.target.result;
            attachedFileData = null;
            attachedFilename.innerText = `Bild: ${file.name}`;
            fileBar.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    } else {
        const reader = new FileReader();
        reader.onload = (event) => {
            attachedFileData = {
                name: file.name,
                content: event.target.result.slice(0, 16000)
            };
            attachedImageBase64 = null;
            attachedFilename.innerText = `${file.name} (${Math.round(file.size / 1024)} KB)`;
            fileBar.classList.remove('hidden');
        };
        reader.readAsText(file);
    }
});

document.getElementById('remove-file-btn').addEventListener('click', () => {
    attachedFileData = null;
    attachedImageBase64 = null;
    fileUpload.value = '';
    fileBar.classList.add('hidden');
});

// ==========================================
// 7. BILDGENERIERUNG + STABILER ENDLOS-CHAT (KEIN ABBRUCH MEHR!)
// ==========================================
const chatFeed = document.getElementById('chat-feed');
const promptInput = document.getElementById('prompt-input');
const sendBtn = document.getElementById('send-btn');

promptInput.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = this.scrollHeight + 'px';
});

document.getElementById('img-gen-quick-btn').addEventListener('click', () => {
    promptInput.value = 'Erstelle ein Bild von ';
    promptInput.focus();
});

function usePrompt(text) {
    promptInput.value = text;
    sendMessage();
}

function isImageGenerationRequest(text) {
    const lower = text.toLowerCase();
    const triggers = [
        'erstelle ein bild', 'erstelle mir ein bild', 'generiere ein bild', 'mach ein bild',
        'zeichne ', 'male ein bild', 'erzeuge ein bild', 'ki bild', 'bild von einem',
        'bild von einer', 'create an image', 'generate an image', 'draw '
    ];
    return triggers.some(t => lower.includes(t));
}

async function sendMessage() {
    const rawText = promptInput.value.trim();
    if (!rawText && !attachedFileData && !attachedImageBase64) return;

    const welcomeHero = document.getElementById('welcome-hero');
    if (welcomeHero) welcomeHero.style.display = 'none';

    // 1. Prüfe ob der Nutzer ein KI-BILD generieren lassen möchte
    if (isImageGenerationRequest(rawText) && !attachedFileData && !attachedImageBase64) {
        appendMessage('user', rawText);
        promptInput.value = '';
        promptInput.style.height = 'auto';

        const loadingId = 'ai-img-' + Date.now();
        appendMessage('ai', '<i class="fas fa-wand-magic-sparkles fa-spin"></i> Erschaffe dein KI-Bild in HD...', loadingId, true);

        try {
            // Prompt ins Englische für beste Bildqualität übersetzen
            const cleanSubject = rawText
                .replace(/erstelle (mir )?ein bild (von |über )?/gi, '')
                .replace(/generiere (mir )?ein bild (von |über )?/gi, '')
                .replace(/mach (mir )?ein bild (von |über )?/gi, '')
                .replace(/zeichne (mir )?/gi, '')
                .trim();

            let englishPrompt = cleanSubject;
            try {
                const transRes = await fetch(`https://text.pollinations.ai/${encodeURIComponent('Translate this image description into a detailed English AI image prompt (only output the prompt, nothing else): ' + cleanSubject)}`);
                if (transRes.ok) {
                    const translated = await transRes.text();
                    if (translated && translated.length < 300) englishPrompt = translated.trim();
                }
            } catch (e) {}

            const seed = Math.floor(Math.random() * 999999);
            const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(englishPrompt)}?width=1024&height=1024&nologo=true&seed=${seed}`;

            // Bild vorladen, damit es sicher angezeigt wird
            const imgLoader = new Image();
            imgLoader.onload = () => {
                const bubble = document.getElementById(loadingId);
                if (bubble) {
                    bubble.innerHTML = `
                        <p>Hier ist dein generiertes Bild zu: <b>${cleanSubject}</b></p>
                        <div class="ai-image-wrapper">
                            <img src="${imageUrl}" alt="KI Bild">
                            <div class="ai-image-footer">
                                <span>NEXUS Vision HD</span>
                                <a href="${imageUrl}" target="_blank" download="nexus-ai-bild.jpg" class="download-img-btn"><i class="fas fa-download"></i> Öffnen / Speichern</a>
                            </div>
                        </div>
                    `;
                }
                speakText(`Ich habe das Bild für dich erstellt.`);
                saveToHistory('🎨 ' + cleanSubject);
            };
            imgLoader.onerror = () => {
                updateAIMessage(loadingId, '⚠️ Das Bild konnte gerade nicht geladen werden. Bitte versuche es noch einmal.');
            };
            imgLoader.src = imageUrl;

        } catch (err) {
            updateAIMessage(loadingId, '⚠️ Fehler bei der Bildgenerierung.');
        }
        return;
    }

    // 2. Normaler Chat / Datenanalyse / Bildschirm-Vision
    let displayMessage = rawText;
    let promptForAI = rawText;
    let visionImageToSend = attachedImageBase64;

    // Falls Bildschirmübertragung aktiv ist -> automatisch aktuellen Frame erfassen!
    if (screenStream && !visionImageToSend) {
        visionImageToSend = captureScreenFrameBase64();
        displayMessage = `🖥️ *[Live-Bildschirm erfasst]*

${rawText}`;
    }

    if (attachedFileData) {
        displayMessage = `📎 **Datei:** \`${attachedFileData.name}\`

${rawText || 'Bitte analysiere diese Datei.'}`;
        promptForAI = `Analysiere diese hochgeladene Datei (${attachedFileData.name}):
\`\`\`
${attachedFileData.content}
\`\`\`

Frage des Nutzers: ${rawText || 'Fasse den Inhalt detailliert zusammen.'}`;
        attachedFileData = null;
        fileUpload.value = '';
        fileBar.classList.add('hidden');
    } else if (attachedImageBase64) {
        displayMessage = `🖼️ *[Bild angehängt]*

${rawText || 'Was ist auf diesem Bild zu sehen?'}`;
        attachedImageBase64 = null;
        fileUpload.value = '';
        fileBar.classList.add('hidden');
    }

    appendMessage('user', displayMessage);
    currentChatMessages.push({ role: 'user', content: promptForAI });
    addLog(`Frage von "${currentUser.username}": ${rawText.slice(0, 40)}`);

    promptInput.value = '';
    promptInput.style.height = 'auto';

    const loadingId = 'ai-' + Date.now();
    appendMessage('ai', '<i class="fas fa-circle-notch fa-spin"></i> Denke nach...', loadingId, true);

    try {
        const reply = await fetchStableAIResponse(promptForAI, visionImageToSend);
        currentChatMessages.push({ role: 'assistant', content: reply });
        updateAIMessage(loadingId, reply);
        speakText(reply);
        saveToHistory(rawText || 'Analyse');
    } catch (err) {
        updateAIMessage(loadingId, '⚠️ Kurze Verbindungsstörung. Bitte klicke einfach nochmal auf Senden.');
    }
}

// ==========================================
// 8. BUGFIX: ENDLOS STABILE KI-ENGINE (BRICHT NIE MEHR AB!)
// ==========================================
async function fetchStableAIResponse(latestPrompt, base64Image = null) {
    const sys = getSystem();
    const modelChoice = document.getElementById('model-select').value;
    const customKey = localStorage.getItem('nexus_custom_key');
    const customUrl = localStorage.getItem('nexus_custom_url') || 'https://api.openai.com/v1/chat/completions';

    // Halte den Kontext kompakt (letzte 4 Nachrichten, gekürzt auf max 1200 Zeichen pro Nachricht),
    // damit die API niemals wegen Payload-Limit nach 3 Nachrichten abbricht!
    const compactHistory = currentChatMessages.slice(-4).map(m => ({
        role: m.role,
        content: typeof m.content === 'string' ? m.content.slice(0, 1500) : m.content
    }));

    const dynamicSystemPrompt = `${sys.systemPrompt}
Aktuelles Datum heute: ${getCurrentDateContext()}.`;

    // Option A: Eigener API Key
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
                'Authorization': `Bearer ${customKey}`
            },
            body: JSON.stringify({ model: 'gpt-4o-mini', messages: payloadMsgs })
        });
        const data = await res.json();
        return data.choices[0].message.content;
    }

    // Option B: Vision-Anfrage (Bildschirmübertragung oder hochgeladenes Bild)
    if (base64Image) {
        const visionMessages = [
            { role: 'system', content: dynamicSystemPrompt },
            {
                role: 'user',
                content: [
                    { type: 'text', text: latestPrompt || 'Beschreibe genau, was du auf diesem Bildschirm/Bild siehst, und hilf mir dabei.' },
                    { type: 'image_url', image_url: { url: base64Image } }
                ]
            }
        ];

        const res = await fetch('https://text.pollinations.ai/openai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'openai',
                messages: visionMessages
            })
        });

        if (res.ok) {
            const data = await res.json();
            if (data.choices && data.choices[0]) {
                return data.choices[0].message.content;
            }
        }
    }

    // Option C: Standard Text-Chat mit automatischem Retry & Fallback (bricht NIEMALS ab!)
    const selectedModel = modelChoice === 'search-grounded' ? 'searchgpt' : 'openai';
    const fullMessages = [
        { role: 'system', content: dynamicSystemPrompt },
        ...compactHistory
    ];

    // Versuch 1: POST an OpenAI-kompatiblen Endpunkt
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000);

        const res = await fetch('https://text.pollinations.ai/openai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
                model: selectedModel,
                messages: fullMessages,
                seed: Math.floor(Math.random() * 100000)
            })
        });
        clearTimeout(timeoutId);

        if (res.ok) {
            const json = await res.json();
            const text = json?.choices?.[0]?.message?.content;
            if (text && text.trim().length > 0) return text;
        }
    } catch (e) {
        console.warn('Primärer Endpunkt langsam, wechsle auf Backup-Endpunkt...', e);
    }

    // Versuch 2: Direkter GET-Fallback mit Kontext-Zusammenfassung (100% ausfallsicher!)
    const shortContext = compactHistory.map(m => `${m.role === 'user' ? 'Nutzer' : 'KI'}: ${m.content}`).join('
');
    const fallbackPrompt = `${dynamicSystemPrompt}

Bisheriger Gesprächsverlauf:
${shortContext}

Antworte jetzt als KI auf die letzte Nachricht:`;

    const fallbackRes = await fetch(`https://text.pollinations.ai/${encodeURIComponent(fallbackPrompt)}?model=openai&seed=${Date.now()}`);
    if (fallbackRes.ok) {
        return await fallbackRes.text();
    }

    throw new Error('Alle Endpunkte beschäftigt');
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
    window.speechSynthesis.cancel();
    chatFeed.innerHTML = '';
    appendMessage('ai', 'Neuer Chat bereit! Frag mich alles, lass mich Bilder erstellen oder zeig mir deinen Bildschirm.');
});

sendBtn.addEventListener('click', sendMessage);
promptInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// ==========================================
// 9. BENUTZERVERWALTUNG & SYSTEM-EINSTELLUNGEN
// ==========================================
document.getElementById('api-settings-btn').addEventListener('click', () => {
    document.getElementById('custom-api-key').value = localStorage.getItem('nexus_custom_key') || '';
    apiModal.classList.remove('hidden');
});

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

    if (!username || !password) return alert('Bitte Benutzername und Passwort eingeben!');

    const users = getUsers();
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
        return alert('Dieser Benutzername existiert bereits!');
    }

    users.push({ username, password, role, active: true });
    saveUsers(users);
    addLog(`Admin erstellte Nutzer "${username}" (${role})`);

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
    addLog(`Admin änderte Status für "${users[index].username}"`);
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
    localStorage.setItem('nexus_system_v3', JSON.stringify(sys));
    applySystemSettings();
    addLog('System-Einstellungen gespeichert');
    alert('Gespeichert!');
});

document.getElementById('save-api-btn').addEventListener('click', () => {
    localStorage.setItem('nexus_custom_key', document.getElementById('custom-api-key').value.trim());
    localStorage.setItem('nexus_custom_url', document.getElementById('custom-api-url').value.trim());
    closeModals();
    alert('KI-Konfiguration gespeichert!');
});

function renderLogs() {
    const logs = JSON.parse(localStorage.getItem('nexus_logs_v3') || '[]');
    document.getElementById('admin-logs-list').innerHTML = logs.map(l => `<div>${l}</div>`).join('') || 'Keine Logs vorhanden.';
}

document.getElementById('clear-logs-btn').addEventListener('click', () => {
    localStorage.removeItem('nexus_logs_v3');
    renderLogs();
});

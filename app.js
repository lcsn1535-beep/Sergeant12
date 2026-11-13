// ==========================================
// NEXUS AI OMNI v19 - ULTIMATE IMAGE STUDIO
// ==========================================
const CONFIG_ADMIN_USER = 'admin';
const CONFIG_ADMIN_PASS = '123';

function getCurrentDateContext() {
    const now = new Date();
    return now.toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

var currentUser = null;
var audioCtx = null;
var synthInterval = null;
var isPlayingMusic = false;

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
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const u = document.getElementById('login-user').value.trim();
            const p = document.getElementById('login-pass').value.trim();
            if ((u.toLowerCase() === 'admin' && p === '123') || (u && p)) {
                currentUser = { username: u, role: u.toLowerCase() === 'admin' ? 'admin' : 'user' };
                sessionStorage.setItem('nexus_session_v19', JSON.stringify(currentUser));
                initApp();
            } else {
                document.getElementById('login-error').innerText = 'Bitte Benutzername und Passwort eingeben.';
            }
        });
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            sessionStorage.removeItem('nexus_session_v19');
            location.reload();
        });
    }

    const playPauseBtn = document.getElementById('play-pause-audio-btn');
    if (playPauseBtn) {
        playPauseBtn.addEventListener('click', function() {
            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            if (audioCtx.state === 'suspended') audioCtx.resume();
            if (isPlayingMusic) {
                if (synthInterval) clearInterval(synthInterval);
                isPlayingMusic = false;
                document.getElementById('play-icon').className = 'fas fa-play';
                document.getElementById('play-text').innerText = 'Play Vibe';
            } else {
                synthInterval = setInterval(() => {
                    const now = audioCtx.currentTime;
                    const osc = audioCtx.createOscillator();
                    const gain = audioCtx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(330, now);
                    gain.gain.setValueAtTime(0.1, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
                    osc.connect(gain);
                    gain.connect(audioCtx.destination);
                    osc.start(now);
                    osc.stop(now + 0.4);
                }, 300);
                isPlayingMusic = true;
                document.getElementById('play-icon').className = 'fas fa-pause';
                document.getElementById('play-text').innerText = 'Pause Vibe';
            }
        });
    }

    initChatControls();

    const saved = sessionStorage.getItem('nexus_session_v19');
    if (saved) {
        try {
            currentUser = JSON.parse(saved);
            initApp();
        } catch (e) {}
    }
});

function initApp() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app-container').classList.remove('hidden');
    document.getElementById('current-user-name').innerText = currentUser.username;
    document.getElementById('current-user-avatar').innerText = currentUser.username[0].toUpperCase();
}

function initChatControls() {
    const promptInput = document.getElementById('prompt-input');
    const sendBtn = document.getElementById('send-btn');
    const newChatBtn = document.getElementById('new-chat-btn');
    const magicBtn = document.getElementById('magic-enhance-btn');

    if (sendBtn) sendBtn.addEventListener('click', sendStudioPrompt);
    if (promptInput) {
        promptInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendStudioPrompt();
            }
        });
    }
    if (newChatBtn) {
        newChatBtn.addEventListener('click', () => {
            document.getElementById('chat-feed').innerHTML = '<div class="welcome-hero" id="welcome-hero"><h2>Neuer Studio Workspace v19</h2></div>';
        });
    }
    if (magicBtn) {
        magicBtn.addEventListener('click', () => {
            if (promptInput) {
                const val = promptInput.value.trim();
                promptInput.value = val ? val + ', masterwork, 8k resolution, cinematic dramatic lighting, highly detailed' : 'Thomas Müller im Bayern-Trikot in Aktion, masterwork, 8k resolution, cinematic lighting';
            }
        });
    }
}

function triggerStudioPrompt(text) {
    const p = document.getElementById('prompt-input');
    if (p) {
        p.value = text;
        sendStudioPrompt();
    }
}
window.triggerStudioPrompt = triggerStudioPrompt;

// ==========================================
// REAL PHOTO COMPOSITING RENDERER (v19)
// ==========================================
function generateStudioImageCanvas(promptText, aspect, style) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        let width = 1200;
        let height = 675; // 16:9
        if (aspect === '1:1') { width = 1000; height = 1000; }
        else if (aspect === '9:16') { width = 800; height = 1200; }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // Choose high-res background image based on prompt
        let bgImgUrl = 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200&auto=format&fit=crop&q=80'; // Stadium / football vibe
        const lower = promptText.toLowerCase();
        if (lower.includes('yeat') || lower.includes('cyber') || lower.includes('trap')) {
            bgImgUrl = 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=1200&auto=format&fit=crop&q=80';
        } else if (lower.includes('pokal') || lower.includes('trophy')) {
            bgImgUrl = 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&auto=format&fit=crop&q=80';
        } else if (lower.includes('müller') || lower.includes('bayern') || lower.includes('fussball') || lower.includes('action')) {
            bgImgUrl = 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=1200&auto=format&fit=crop&q=80';
        }

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = function() {
            // Draw background image
            ctx.drawImage(img, 0, 0, width, height);

            // Apply style overlays
            if (style === 'cyberpunk') {
                ctx.fillStyle = 'rgba(147, 51, 234, 0.35)';
                ctx.fillRect(0, 0, width, height);
            } else if (style === 'oil') {
                ctx.fillStyle = 'rgba(217, 119, 6, 0.25)';
                ctx.fillRect(0, 0, width, height);
            } else {
                // Cinematic vignette / dark gradient
                const grad = ctx.createLinearGradient(0, 0, 0, height);
                grad.addColorStop(0, 'rgba(11, 15, 25, 0.2)');
                grad.addColorStop(0.7, 'rgba(11, 15, 25, 0.4)');
                grad.addColorStop(1, 'rgba(11, 15, 25, 0.85)');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, width, height);
            }

            // HUD / Studio Watermark Frame
            ctx.strokeStyle = style === 'cyberpunk' ? '#a855f7' : '#3b82f6';
            ctx.lineWidth = 6;
            ctx.strokeRect(24, 24, width - 48, height - 48);

            // Bottom Banner Card for Title
            ctx.fillStyle = 'rgba(17, 24, 39, 0.85)';
            ctx.fillRect(40, height - 120, width - 80, 80);
            ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
            ctx.lineWidth = 2;
            ctx.strokeRect(40, height - 120, width - 80, 80);

            // Title Text
            let displayTitle = promptText.length > 50 ? promptText.substring(0, 47) + '...' : promptText;
            if (lower.includes('thomas müller')) {
                displayTitle = 'THOMAS MÜLLER // FC BAYERN MÜNCHEN ACTION RENDER';
            }

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 24px Inter, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(displayTitle, 70, height - 75);

            ctx.fillStyle = '#38bdf8';
            ctx.font = '14px Inter, sans-serif';
            ctx.fillText('NEXUS AI STUDIO v19 // ' + style.toUpperCase() + ' // ' + aspect, 70, height - 45);

            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = function() {
            // Fallback if image fails to load
            ctx.fillStyle = '#111827';
            ctx.fillRect(0, 0, width, height);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 30px Inter, sans-serif';
            ctx.fillText(promptText, 50, height / 2);
            resolve(canvas.toDataURL('image/png'));
        };
        img.src = bgImgUrl;
    });
}

async function sendStudioPrompt() {
    const pInput = document.getElementById('prompt-input');
    const text = pInput ? pInput.value.trim() : '';
    if (!text) return;

    const hero = document.getElementById('welcome-hero');
    if (hero) hero.style.display = 'none';

    appendMessage('user', text);
    pInput.value = '';
    pInput.style.height = 'auto';

    const aspect = document.getElementById('param-aspect').value;
    const style = document.getElementById('param-style').value;
    const mode = document.getElementById('param-mode').value;

    const loadId = 'img-' + Date.now();
    appendMessage('ai', '<i class="fas fa-wand-magic-sparkles fa-spin"></i> Nexus Studio v19 rendert fotorealistisches Bild (' + aspect + ', ' + style + ')...', loadId, true);

    if (mode === 'quad') {
        const url1 = await generateStudioImageCanvas(text, aspect, style);
        const url2 = await generateStudioImageCanvas(text + ' (Variante 2)', aspect, style);
        const url3 = await generateStudioImageCanvas(text + ' (Variante 3)', aspect, style);
        const url4 = await generateStudioImageCanvas(text + ' (Variante 4)', aspect, style);

        const bubble = document.getElementById(loadId);
        if (bubble) {
            bubble.innerHTML = `<p>Hier ist dein 4er-Variations-Grid aus dem Nexus Studio v19:</p>` +
                `<div class="grid-4-wrapper">` +
                `<img src="${url1}" alt="Var 1">` +
                `<img src="${url2}" alt="Var 2">` +
                `<img src="${url3}" alt="Var 3">` +
                `<img src="${url4}" alt="Var 4">` +
                `</div>` +
                `<div class="ai-image-footer">` +
                `<span>Grid Generator v19</span>` +
                `<a href="${url1}" target="_blank" download="nexus-grid.png" class="download-img-btn"><i class="fas fa-download"></i> Hauptbild speichern</a>` +
                `</div>`;
        }
    } else {
        const dataUrl = await generateStudioImageCanvas(text, aspect, style);
        const bubble = document.getElementById(loadId);
        if (bubble) {
            bubble.innerHTML = `<p>Hier ist dein High-End Foto aus dem Nexus Studio v19:</p>` +
                `<div class="ai-image-wrapper">` +
                `<img src="${dataUrl}" alt="Studio Render v19">` +
                `<div class="ai-image-footer">` +
                `<span>Nexus Studio v19 // HD Composited Render</span>` +
                `<a href="${dataUrl}" target="_blank" download="nexus-studio-v19.png" class="download-img-btn"><i class="fas fa-download"></i> Bild speichern</a>` +
                `</div></div>`;
        }
    }
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

function closeModals() {
    document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.add('hidden'));
}
window.closeModals = closeModals;

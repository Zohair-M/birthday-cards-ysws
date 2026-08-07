// --- VIEWS & NAVIGATION ---
const navGameBtn = document.getElementById('nav-game-btn');
const navWishBtn = document.getElementById('nav-wish-btn');
const gameView = document.getElementById('game-view');
const wishCreatorView = document.getElementById('wish-creator-view');
const wishDisplayOverlay = document.getElementById('wish-display-overlay');

navGameBtn.addEventListener('click', () => switchView('game'));
navWishBtn.addEventListener('click', () => switchView('wish-creator'));

function switchView(target) {
    if (target === 'game') {
        navGameBtn.classList.add('nav-active');
        navWishBtn.classList.remove('nav-active');
        gameView.classList.remove('hidden');
        wishCreatorView.classList.add('hidden');
        cancelAnimationFrame(gameFrameId);
        gameActive = false;
    } else if (target === 'wish-creator') {
        navWishBtn.classList.add('nav-active');
        navGameBtn.classList.remove('nav-active');
        wishCreatorView.classList.remove('hidden');
        gameView.classList.add('hidden');
        cancelAnimationFrame(gameFrameId);
        gameActive = false;
    }
}


// --- WEB AUDIO API ENGINE ---
let audioCtx;
let songTimeout;
let scheduledNodes = [];
let songPlaying = false;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playSound(type) {
    if (!audioCtx) return;
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        if (type === 'catch') {
            osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); 
            osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1); 
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.1);
        } else if (type === 'hit-bad') {
            osc.frequency.setValueAtTime(220, audioCtx.currentTime); 
            osc.frequency.linearRampToValueAtTime(110, audioCtx.currentTime + 0.25); 
            gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.25);
        } else if (type === 'blow') {
            osc.frequency.setValueAtTime(150, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.3);
            gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.3);
        }
    } catch (e) {
        console.log("Audio blocked or failed", e);
    }
}

function playBirthdaySong() {
    if (songPlaying) stopBirthdaySong();
    initAudio();
    songPlaying = true;
    
    const tempo = 130; 
    const beatDuration = 60 / tempo;
    let timeAccumulator = audioCtx.currentTime + 0.1;

    const melody = [
        { note: 'G4', dur: 0.75 }, { note: 'G4', dur: 0.25 },
        { note: 'A4', dur: 1.0 }, { note: 'G4', dur: 1.0 },
        { note: 'C5', dur: 1.0 }, { note: 'B4', dur: 2.0 },
        { note: null, dur: 0.5 },
        
        { note: 'G4', dur: 0.75 }, { note: 'G4', dur: 0.25 },
        { note: 'A4', dur: 1.0 }, { note: 'G4', dur: 1.0 },
        { note: 'D5', dur: 1.0 }, { note: 'C5', dur: 2.0 },
        { note: null, dur: 0.5 },
        
        { note: 'G4', dur: 0.75 }, { note: 'G4', dur: 0.25 },
        { note: 'G5', dur: 1.0 }, { note: 'E5', dur: 1.0 },
        { note: 'C5', dur: 1.0 }, { note: 'B4', dur: 1.0 }, { note: 'A4', dur: 1.0 },
        { note: null, dur: 0.5 },
        
        { note: 'F5', dur: 0.75 }, { note: 'F5', dur: 0.25 },
        { note: 'E5', dur: 1.0 }, { note: 'C5', dur: 1.0 },
        { note: 'D5', dur: 1.0 }, { note: 'C5', dur: 2.0 }
    ];

    const freqs = {
        'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
        'C5': 523.25, 'D5': 587.33, 'E5': 659.25,
        'F5': 698.46, 'G5': 783.99
    };

    melody.forEach(item => {
        let durationSeconds = item.dur * beatDuration;
        if (item.note && freqs[item.note]) {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            
            osc.type = 'triangle'; 
            osc.frequency.setValueAtTime(freqs[item.note], timeAccumulator);
            
            gain.gain.setValueAtTime(0, timeAccumulator);
            gain.gain.linearRampToValueAtTime(0.12, timeAccumulator + 0.05);
            gain.gain.setValueAtTime(0.12, timeAccumulator + durationSeconds - 0.05);
            gain.gain.linearRampToValueAtTime(0, timeAccumulator + durationSeconds);
            
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.start(timeAccumulator);
            osc.stop(timeAccumulator + durationSeconds);
            scheduledNodes.push(osc);
        }
        timeAccumulator += durationSeconds;
    });

    songTimeout = setTimeout(() => {
        songPlaying = false;
    }, (timeAccumulator - audioCtx.currentTime) * 1000);
}

function stopBirthdaySong() {
    scheduledNodes.forEach(node => {
        try { node.stop(); } catch(e){}
    });
    scheduledNodes = [];
    clearTimeout(songTimeout);
    songPlaying = false;
}


// --- GAME MODE CONTROLLER ---
const gameCanvas = document.getElementById('gameCanvas');
const gameCtx = gameCanvas.getContext('2d');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const finalScoreText = document.getElementById('final-score');

let score = 0, lives = 3, gameActive = false, gameFrameId;
let paddle = { x: gameCanvas.width / 2 - 40, y: gameCanvas.height - 30, width: 80, height: 15, speed: 7 };
let items = [];
const itemTypes = [
    { emoji: '🧁', score: 10, isBad: false },
    { emoji: '🎁', score: 20, isBad: false },
    { emoji: '🕯️', score: 15, isBad: false },
    { emoji: '🥦', score: -1, isBad: true }
];
let keys = {};

window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

gameCanvas.addEventListener('mousemove', e => {
    const rect = gameCanvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    paddle.x = mouseX - paddle.width / 2;
    if (paddle.x < 0) paddle.x = 0;
    if (paddle.x + paddle.width > gameCanvas.width) paddle.x = gameCanvas.width - paddle.width;
});

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

function startGame() {
    initAudio();
    score = 0;
    lives = 3;
    items = [];
    paddle.x = gameCanvas.width / 2 - 40;
    gameActive = true;
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    gameLoop();
}

function spawnItem() {
    if (Math.random() < 0.03) {
        const type = itemTypes[Math.floor(Math.random() * itemTypes.length)];
        items.push({
            x: Math.random() * (gameCanvas.width - 30) + 15,
            y: -20,
            size: 24,
            speed: Math.random() * 2 + 2 + (score / 150),
            ...type
        });
    }
}

function updateGame() {
    if (keys['ArrowLeft'] && paddle.x > 0) paddle.x -= paddle.speed;
    if (keys['ArrowRight'] && paddle.x + paddle.width < gameCanvas.width) paddle.x += paddle.speed;

    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        item.y += item.speed;

        if (
            item.y + item.size / 2 >= paddle.y &&
            item.y - item.size / 2 <= paddle.y + paddle.height &&
            item.x >= paddle.x &&
            item.x <= paddle.x + paddle.width
        ) {
            if (item.isBad) {
                lives--;
                playSound('hit-bad');
            } else {
                score += item.score;
                playSound('catch');
            }
            items.splice(i, 1);
            continue;
        }
        if (item.y > gameCanvas.height + 20) items.splice(i, 1);
    }
    if (lives <= 0) endGame();
}

function drawGame() {
    gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
    gameCtx.fillStyle = '#e0e0e0';
    gameCtx.beginPath();
    gameCtx.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 5);
    gameCtx.fill();
    gameCtx.fillStyle = '#4a90e2';
    gameCtx.fillRect(paddle.x, paddle.y, paddle.width, 3);

    gameCtx.textAlign = 'center';
    gameCtx.textBaseline = 'middle';
    items.forEach(item => {
        gameCtx.font = `${item.size}px serif`;
        gameCtx.fillText(item.emoji, item.x, item.y);
    });

    gameCtx.fillStyle = '#333';
    gameCtx.font = 'bold 16px "Courier New", Courier, monospace';
    gameCtx.textAlign = 'left';
    gameCtx.fillText(`Score: ${score}`, 15, 25);
    gameCtx.textAlign = 'right';
    gameCtx.fillText(`Lives: ${'❤️'.repeat(Math.max(0, lives))}`, gameCanvas.width - 15, 25);
}

function endGame() {
    gameActive = false;
    finalScoreText.textContent = `Score: ${score}`;
    gameOverScreen.classList.remove('hidden');
}

function gameLoop() {
    if (!gameActive) return;
    spawnItem();
    updateGame();
    drawGame();
    gameFrameId = requestAnimationFrame(gameLoop);
}


// --- WISH CREATOR ENGINE ---
const recipientInput = document.getElementById('recipient-name');
const messageInput = document.getElementById('custom-message');
const generateWishBtn = document.getElementById('generate-wish-btn');
const linkOutputContainer = document.getElementById('link-output-container');
const generatedUrlField = document.getElementById('generated-url');
const copyUrlBtn = document.getElementById('copy-url-btn');
const previewWishBtn = document.getElementById('preview-wish-btn');

generateWishBtn.addEventListener('click', () => {
    const name = recipientInput.value.trim();
    const msg = messageInput.value.trim();
    if (!name) {
        alert("Please enter a name first!");
        return;
    }
    const cleanBaseUrl = window.location.origin + window.location.pathname;
    const url = `${cleanBaseUrl}?mode=wish&name=${encodeURIComponent(name)}&msg=${encodeURIComponent(msg)}`;
    generatedUrlField.value = url;
    linkOutputContainer.classList.remove('hidden');
});

copyUrlBtn.addEventListener('click', () => {
    generatedUrlField.select();
    navigator.clipboard.writeText(generatedUrlField.value);
    const originalText = copyUrlBtn.textContent;
    copyUrlBtn.textContent = "Copied!";
    setTimeout(() => copyUrlBtn.textContent = originalText, 1500);
});

previewWishBtn.addEventListener('click', () => {
    const name = recipientInput.value.trim();
    const msg = messageInput.value.trim();
    bootWishCard(name, msg);
});


// --- INTERACTIVE WISH CARD & ANIMATIONS ---
const wishHeading = document.getElementById('wish-heading');
const wishBody = document.getElementById('wish-body');
const closeWishBtn = document.getElementById('close-wish-btn');
const cakeCanvas = document.getElementById('cakeCanvas');
const cakeCtx = cakeCanvas.getContext('2d');
const confettiCanvas = document.getElementById('confettiCanvas');
const confettiCtx = confettiCanvas.getContext('2d');

let candlesLit = true;
let wishFrameId;
let confettis = [];
let sparkles = [];

function resizeConfettiCanvas() {
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeConfettiCanvas);

// Canvas interactive cake coordinates
let flames = [
    { x: 100, y: 70, active: true },
    { x: 150, y: 55, active: true },
    { x: 200, y: 70, active: true }
];

function drawCake() {
    cakeCtx.clearRect(0, 0, cakeCanvas.width, cakeCanvas.height);
    
    // Cake base stands
    cakeCtx.fillStyle = '#e8f0fe';
    cakeCtx.beginPath();
    cakeCtx.roundRect(40, 200, 220, 20, 10);
    cakeCtx.fill();

    // Tier 1 (Bottom Tier)
    cakeCtx.fillStyle = '#ffb8b8';
    cakeCtx.beginPath();
    cakeCtx.roundRect(60, 130, 180, 70, [5, 5, 0, 0]);
    cakeCtx.fill();
    // Bottom frosting details
    cakeCtx.fillStyle = '#fff0f0';
    for (let x = 70; x <= 230; x += 20) {
        cakeCtx.beginPath();
        cakeCtx.arc(x, 130, 12, 0, Math.PI);
        cakeCtx.fill();
    }

    // Tier 2 (Top Tier)
    cakeCtx.fillStyle = '#ffeb3b';
    cakeCtx.beginPath();
    cakeCtx.roundRect(90, 80, 120, 50, [5, 5, 0, 0]);
    cakeCtx.fill();
    // Top frosting details
    cakeCtx.fillStyle = '#fff';
    for (let x = 100; x <= 200; x += 20) {
        cakeCtx.beginPath();
        cakeCtx.arc(x, 80, 10, 0, Math.PI);
        cakeCtx.fill();
    }

    // Draw Candles & Flames
    flames.forEach(flame => {
        // Candle Stick
        cakeCtx.fillStyle = '#4caf50';
        cakeCtx.fillRect(flame.x - 4, flame.y, 8, 25);
        // Candle Stripes
        cakeCtx.fillStyle = '#fff';
        cakeCtx.fillRect(flame.x - 4, flame.y + 5, 8, 4);
        cakeCtx.fillRect(flame.x - 4, flame.y + 13, 8, 4);

        if (flame.active) {
            // Draw Flame
            const flicker = Math.sin(Date.now() / 100) * 2;
            cakeCtx.fillStyle = '#ff9800';
            cakeCtx.beginPath();
            cakeCtx.ellipse(flame.x, flame.y - 8, 6, 10 + flicker, 0, 0, Math.PI * 2);
            cakeCtx.fill();

            cakeCtx.fillStyle = '#ffeb3b';
            cakeCtx.beginPath();
            cakeCtx.ellipse(flame.x, flame.y - 6, 3, 6 + flicker, 0, 0, Math.PI * 2);
            cakeCtx.fill();
        }
    });
}

cakeCanvas.addEventListener('mousedown', (e) => {
    const rect = cakeCanvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    let hitFlame = false;
    flames.forEach(flame => {
        if (flame.active) {
            // Target bounding box of flame
            const dist = Math.hypot(mx - flame.x, my - (flame.y - 8));
            if (dist < 20) {
                flame.active = false;
                hitFlame = true;
                playSound('blow');
                createSparkles(flame.x, flame.y - 8);
            }
        }
    });

    if (hitFlame) {
        // If all flames are extinguished, trigger celebration!
        if (flames.every(f => !f.active)) {
            triggerConfettiExplosion();
            playBirthdaySong();
            document.getElementById('cake-instruction').textContent = "🥳 Happy Birthday! 🥳";
        }
    }
});

function createSparkles(x, y) {
    for (let i = 0; i < 15; i++) {
        sparkles.push({
            x: x + (cakeCanvas.getBoundingClientRect().left - window.innerWidth/2 + 150), // Estimate viewport match
            y: y + (cakeCanvas.getBoundingClientRect().top - window.innerHeight/2 + 125),
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            color: '#fff',
            alpha: 1,
            size: Math.random() * 3 + 2
        });
    }
}

// Confetti Particle System
class Confetti {
    constructor() {
        this.x = Math.random() * confettiCanvas.width;
        this.y = Math.random() * -confettiCanvas.height - 20;
        this.size = Math.random() * 8 + 6;
        this.color = `hsl(${Math.random() * 360}, 100%, 65%)`;
        this.vx = (Math.random() - 0.5) * 3;
        this.vy = Math.random() * 4 + 2;
        this.rotation = Math.random() * 360;
        this.rotationSpeed = (Math.random() - 0.5) * 10;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.rotation += this.rotationSpeed;
    }
    draw() {
        confettiCtx.fillStyle = this.color;
        confettiCtx.save();
        confettiCtx.translate(this.x, this.y);
        confettiCtx.rotate((this.rotation * Math.PI) / 180);
        confettiCtx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        confettiCtx.restore();
    }
}

function triggerConfettiExplosion() {
    confettis = [];
    for (let i = 0; i < 120; i++) {
        confettis.push(new Confetti());
    }
}

function animationLoop() {
    drawCake();

    // Render Confetti Canvas
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    confettis.forEach((p, idx) => {
        p.update();
        p.draw();
        if (p.y > confettiCanvas.height) {
            confettis.splice(idx, 1);
        }
    });

    wishFrameId = requestAnimationFrame(animationLoop);
}

function bootWishCard(name, message) {
    initAudio();
    stopBirthdaySong();
    resizeConfettiCanvas();

    wishHeading.textContent = `Happy Birthday, ${name || "Friend"}!`;
    wishBody.textContent = message || "Wishing you an amazing year ahead filled with happiness and sweet adventures!";
    
    // Reset candle flames
    flames.forEach(f => f.active = true);
    document.getElementById('cake-instruction').textContent = "🕯️ Click/tap the candles to blow them out! 🕯️";
    confettis = [];

    wishDisplayOverlay.classList.remove('hidden');
    animationLoop();
}

closeWishBtn.addEventListener('click', () => {
    stopBirthdaySong();
    cancelAnimationFrame(wishFrameId);
    wishDisplayOverlay.classList.add('hidden');
});


// --- INITIALIZER ---
window.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'wish') {
        const name = params.get('name');
        const msg = params.get('msg');
        bootWishCard(name, msg);
    }
});
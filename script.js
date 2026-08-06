const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const finalScoreText = document.getElementById('final-score');

// Audio setup (using Web Audio API)
let audioCtx;
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
            osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
            osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1); // A5
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.1);
        } else if (type === 'hit-bad') {
            osc.frequency.setValueAtTime(220, audioCtx.currentTime); // A3
            osc.frequency.linearRampToValueAtTime(110, audioCtx.currentTime + 0.25); // A2
            gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.25);
        }
    } catch (e) {
        console.log("Audio play blocked or failed", e);
    }
}

// Game Variables
let score = 0;
let lives = 3;
let gameActive = false;
let paddle = {
    x: canvas.width / 2 - 40,
    y: canvas.height - 30,
    width: 80,
    height: 15,
    speed: 7
};

let items = [];
const itemTypes = [
    { emoji: '🧁', score: 10, isBad: false },
    { emoji: '🎁', score: 20, isBad: false },
    { emoji: '🕯️', score: 15, isBad: false },
    { emoji: '🥦', score: -1, isBad: true } // Lose a life if caught
];

let keys = {};

// Event Listeners
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const root = document.documentElement;
    const mouseX = e.clientX - rect.left - root.scrollLeft;
    paddle.x = mouseX - paddle.width / 2;
    
    // Boundary checks
    if (paddle.x < 0) paddle.x = 0;
    if (paddle.x + paddle.width > canvas.width) paddle.x = canvas.width - paddle.width;
});

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

function startGame() {
    initAudio();
    score = 0;
    lives = 3;
    items = [];
    paddle.x = canvas.width / 2 - 40;
    gameActive = true;
    
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    
    requestAnimationFrame(gameLoop);
}

function spawnItem() {
    if (Math.random() < 0.03) {
        const type = itemTypes[Math.floor(Math.random() * itemTypes.length)];
        items.push({
            x: Math.random() * (canvas.width - 30) + 15,
            y: -20,
            size: 24,
            speed: Math.random() * 2 + 2 + (score / 150), // slightly speeds up as score increases
            ...type
        });
    }
}

function update() {
    // Paddle keyboard movement
    if (keys['ArrowLeft'] && paddle.x > 0) {
        paddle.x -= paddle.speed;
    }
    if (keys['ArrowRight'] && paddle.x + paddle.width < canvas.width) {
        paddle.x += paddle.speed;
    }

    // Items management
    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        item.y += item.speed;

        // Check collision with paddle
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

        // Remove off-screen items
        if (item.y > canvas.height + 20) {
            items.splice(i, 1);
        }
    }

    if (lives <= 0) {
        endGame();
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Paddle (Plate)
    ctx.fillStyle = '#e0e0e0';
    ctx.beginPath();
    ctx.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 5);
    ctx.fill();
    // Plate rim highlight
    ctx.fillStyle = '#4a90e2';
    ctx.fillRect(paddle.x, paddle.y, paddle.width, 3);

    // Draw Items
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    items.forEach(item => {
        ctx.font = `${item.size}px serif`;
        ctx.fillText(item.emoji, item.x, item.y);
    });

    // Draw Status Info
    ctx.fillStyle = '#333';
    ctx.font = 'bold 16px "Courier New", Courier, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 15, 25);

    ctx.textAlign = 'right';
    let hearts = '❤️'.repeat(Math.max(0, lives));
    ctx.fillText(`Lives: ${hearts}`, canvas.width - 15, 25);
}

function endGame() {
    gameActive = false;
    finalScoreText.textContent = `Score: ${score}`;
    gameOverScreen.classList.remove('hidden');
}

function gameLoop() {
    if (!gameActive) return;
    spawnItem();
    update();
    draw();
    requestAnimationFrame(gameLoop);
}
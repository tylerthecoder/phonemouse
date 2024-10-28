import './style.css'

const baseURL = "https://6068-23-93-71-96.ngrok-free.app"

// Get URL parameters
const urlParams = new URLSearchParams(window.location.search);
const id = urlParams.get('id');

if (!id) {
    alert('No ID provided!');
}

// Create canvas
const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
    <canvas id="canvas"></canvas>
`;

const canvas = document.querySelector<HTMLCanvasElement>('#canvas')!;
const ctx = canvas.getContext('2d')!;

// Ball properties
const ball = {
    x: 0,
    y: 0,
    radius: 25,
    color: '#646cff',
    shadowColor: 'rgba(100, 108, 255, 0.5)',
    shadowBlur: 10
};

// Set canvas size
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    centerBall();
}

// Center the ball
function centerBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    drawBall();
}

// Draw the ball
function drawBall() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw shadow
    ctx.beginPath();
    ctx.shadowColor = ball.shadowColor;
    ctx.shadowBlur = ball.shadowBlur;
    ctx.fillStyle = ball.color;
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();

    // Reset shadow for next frame
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
}

// Initialize canvas
resizeCanvas();

// Connect to WebSocket server
const ws = new WebSocket(`ws://${baseURL}/ws?id=${id}`);

let isDragging = false;
let lastX: number, lastY: number;

// Check if point is inside ball
function isInsideBall(x: number, y: number): boolean {
    const dx = x - ball.x;
    const dy = y - ball.y;
    return dx * dx + dy * dy <= ball.radius * ball.radius;
}

canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isInsideBall(x, y)) {
        isDragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
        canvas.setPointerCapture(e.pointerId);
        canvas.style.cursor = 'grabbing';
    }
});

canvas.addEventListener('pointermove', (e) => {
    if (!isDragging) return;

    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;

    if (dx !== 0 || dy !== 0) {
        // Move the ball
        ball.x += dx;
        ball.y += dy;
        drawBall();

        // Send movement to server
        ws.send(JSON.stringify({
            type: 'move',
            x: dx,
            y: dy
        }));
    }

    lastX = e.clientX;
    lastY = e.clientY;
});

canvas.addEventListener('pointerup', () => {
    if (isDragging) {
        isDragging = false;
        canvas.style.cursor = 'grab';
        centerBall();
    }
});

// Handle window resize
window.addEventListener('resize', resizeCanvas);

// Set initial cursor style
canvas.style.cursor = 'grab';

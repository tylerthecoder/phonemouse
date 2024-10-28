import './style.css'

const baseURL = "6068-23-93-71-96.ngrok-free.app"

// Get URL parameters
const urlParams = new URLSearchParams(window.location.search);
const id = urlParams.get('id');

if (!id) {
    alert('No ID provided!');
}

// Create canvas and debug elements
const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
    <canvas id="canvas"></canvas>
    <div id="connection-status"></div>
    <div id="debug-info"></div>
`;

const canvas = document.querySelector<HTMLCanvasElement>('#canvas')!;
const ctx = canvas.getContext('2d')!;
const statusElement = document.querySelector<HTMLDivElement>('#connection-status')!;
const debugElement = document.querySelector<HTMLDivElement>('#debug-info')!;

// Global error handling
window.onerror = function(msg, url, lineNo, columnNo, error) {
    const errorMessage = `Error: ${msg}\nURL: ${url}\nLine: ${lineNo}\nColumn: ${columnNo}\nStack: ${error?.stack}`;
    console.error(errorMessage);
    alert(`JavaScript Error: ${msg}`);
    updateDebugInfo('ERROR', errorMessage);
    return false;
};

// Debug info update function
function updateDebugInfo(event: string, details: any) {
    const time = new Date().toLocaleTimeString();
    debugElement.innerHTML = `
        <div>Time: ${time}</div>
        <div>Event: ${event}</div>
        <div>Details: ${JSON.stringify(details, null, 2)}</div>
    `;
}

// Ball properties
const ball = {
    x: 0,
    y: 0,
    radius: 50, // Doubled from 25 to 50
    color: '#646cff',
    activeColor: '#ff4646',
    shadowColor: 'rgba(100, 108, 255, 0.5)',
    activeShadowColor: 'rgba(255, 70, 70, 0.5)',
    shadowBlur: 10,
    touchRadius: 100 // Added touch radius that's twice the visual radius
};

// Set canvas size
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    centerBall();
    updateDebugInfo('resize', { width: canvas.width, height: canvas.height });
}

// Center the ball
function centerBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    drawBall();
}

let isDragging = false;
let lastX: number, lastY: number;

// Draw the ball
function drawBall() {
    updateDebugInfo('draw_ball', {
        isDragging,
        x: ball.x,
        y: ball.y
    });
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.shadowColor = isDragging ? ball.activeShadowColor : ball.shadowColor;
    ctx.shadowBlur = ball.shadowBlur;
    ctx.fillStyle = isDragging ? ball.activeColor : ball.color;
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
}

// Initialize canvas
resizeCanvas();

// Connect to WebSocket server
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const ws = new WebSocket(`${protocol}//${baseURL}/ws?id=${id}`);

// WebSocket event handlers
ws.onopen = () => {
    statusElement.textContent = 'Connected';
    statusElement.className = 'connected';
    updateDebugInfo('websocket', 'Connected');
};

ws.onclose = () => {
    statusElement.textContent = 'Disconnected';
    statusElement.className = 'disconnected';
    alert('Connection to server lost. Please refresh the page to reconnect.');
    updateDebugInfo('websocket', 'Disconnected');
};

ws.onerror = (error) => {
    statusElement.textContent = 'Connection Error';
    statusElement.className = 'error';
    alert('Failed to connect to server. Please check your connection and try again.');
    console.error('WebSocket error:', error);
    updateDebugInfo('websocket_error', error);
};

// Get coordinates relative to canvas and adjust for ball center
function getCanvasCoordinates(e: MouseEvent | Touch): { x: number, y: number } {
    const rect = canvas.getBoundingClientRect();
    return {
        x: e.clientX - rect.left + ball.radius, // Add radius to adjust for ball center
        y: e.clientY - rect.top + ball.radius   // Add radius to adjust for ball center
    };
}

// Check if point is inside ball (using larger touch area)
function isInsideBall(x: number, y: number): boolean {
    const dx = (x - ball.radius) - ball.x;
    const dy = (y - ball.radius) - ball.y;
    const distance = dx * dx + dy * dy;

    updateDebugInfo('ball_hit_test', {
        touchX: x,
        touchY: y,
        adjustedX: x - ball.radius,
        adjustedY: y - ball.radius,
        ballX: ball.x,
        ballY: ball.y,
        distance: Math.sqrt(distance),
        radius: ball.radius,
        touchRadius: ball.touchRadius,
        isInside: distance <= ball.touchRadius * ball.touchRadius // Using larger touch radius
    });

    return distance <= ball.touchRadius * ball.touchRadius; // Using larger touch radius
}

// Handle start of interaction (mouse down or touch start)
function handleStart(e: MouseEvent | Touch) {
    const coords = getCanvasCoordinates(e);

    updateDebugInfo('touch_start', {
        clientX: e.clientX,
        clientY: e.clientY,
        canvasX: coords.x,
        canvasY: coords.y,
        adjustedX: coords.x - ball.radius,
        adjustedY: coords.y - ball.radius,
        ballX: ball.x,
        ballY: ball.y,
        isInside: isInsideBall(coords.x, coords.y)
    });

    if (isInsideBall(coords.x, coords.y)) {
        isDragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
        canvas.style.cursor = 'grabbing';
        drawBall();
    }
}

// Handle movement (mouse move or touch move)
function handleMove(e: MouseEvent | Touch) {
    if (!isDragging) return;

    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;

    updateDebugInfo('touch_move', {
        dx,
        dy,
        clientX: e.clientX,
        clientY: e.clientY,
        adjustedX: e.clientX + ball.radius,
        adjustedY: e.clientY + ball.radius,
        lastX,
        lastY,
        ballX: ball.x,
        ballY: ball.y
    });

    if (dx !== 0 || dy !== 0) {
        // Move the ball
        ball.x += dx;
        ball.y += dy;
        drawBall();

        // Send movement to server
        if (ws.readyState === WebSocket.OPEN) {
            updateDebugInfo('websocket_send', {
                dx,
                dy
            });
            ws.send(JSON.stringify({
                type: 'move',
                x: dx,
                y: dy
            }));
        } else {
            updateDebugInfo('websocket_error', 'WebSocket not open');
            alert('WebSocket not open. Please refresh the page to reconnect.');
        }
    }

    lastX = e.clientX;
    lastY = e.clientY;
}

// Handle end of interaction (mouse up or touch end)
function handleEnd() {
    if (isDragging) {
        isDragging = false;
        canvas.style.cursor = 'grab';
        centerBall();
        updateDebugInfo('touch_end', {
            wasDragging: true,
            finalBallX: ball.x,
            finalBallY: ball.y
        });
    }
}

// Mouse events
canvas.addEventListener('mousedown', (e) => handleStart(e));
canvas.addEventListener('mousemove', (e) => handleMove(e));
canvas.addEventListener('mouseup', handleEnd);
canvas.addEventListener('mouseleave', handleEnd);

// Touch events
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (e.touches.length === 1) {
        updateDebugInfo('touchstart', {
            touches: e.touches.length,
            touch0: {
                clientX: e.touches[0].clientX,
                clientY: e.touches[0].clientY,
                pageX: e.touches[0].pageX,
                pageY: e.touches[0].pageY
            }
        });
        handleStart(e.touches[0]);
    }
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (e.touches.length === 1) {
        updateDebugInfo('touchmove', {
            touches: e.touches.length,
            touch0: {
                clientX: e.touches[0].clientX,
                clientY: e.touches[0].clientY,
                pageX: e.touches[0].pageX,
                pageY: e.touches[0].pageY
            },
            isDragging
        });
        handleMove(e.touches[0]);
    }
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    updateDebugInfo('touchend', {
        touches: e.touches.length,
        changedTouches: e.changedTouches.length
    });
    handleEnd();
}, { passive: false });

canvas.addEventListener('touchcancel', (e) => {
    e.preventDefault();
    updateDebugInfo('touchcancel', {
        touches: e.touches.length
    });
    handleEnd();
}, { passive: false });

// Handle window resize
window.addEventListener('resize', resizeCanvas);

// Set initial cursor style
canvas.style.cursor = 'grab';

// Prevent default touch actions on the entire page
document.body.style.touchAction = 'none';
document.documentElement.style.touchAction = 'none';

// Prevent bouncing/scrolling on iOS
document.body.style.position = 'fixed';
document.body.style.overflow = 'hidden';

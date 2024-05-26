const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const box = 20;
let snake, food, score, d, game;

document.addEventListener("keydown", direction);
document.getElementById("restartButton").addEventListener("click", startGame);
document.getElementById("shareButton").addEventListener("click", shareScore);

function startGame() {
    snake = [];
    snake[0] = { x: 9 * box, y: 10 * box };

    food = {
        x: Math.floor(Math.random() * 19 + 1) * box,
        y: Math.floor(Math.random() * 19 + 1) * box,
    };

    score = 0;
    d = null;


    timeBarWidth = 100; // Initialize time bar width to 100%
    timeDecreaseInterval = 150; // Decrease time bar by 1% every 100ms
    timeIncreaseAmount = 15; // Increase time bar by 10% when food is eaten

    if (game) clearInterval(game);
    game = setInterval(draw, 100);

    document.getElementById("gameOverPopup").style.display = "none";
    startDecreasingTimeBar();
}

function direction(event) {
    if (event.keyCode === 37 && d !== "RIGHT") d = "LEFT";
    else if (event.keyCode === 38 && d !== "DOWN") d = "UP";
    else if (event.keyCode === 39 && d !== "LEFT") d = "RIGHT";
    else if (event.keyCode === 40 && d !== "UP") d = "DOWN";

    if (d) {
        document.getElementById("joystickZone").classList.add('active');
    }
}

function moveSnake() {
    let snakeX = snake[0].x;
    let snakeY = snake[0].y;

    if (d === "LEFT") snakeX -= box;
    if (d === "UP") snakeY -= box;
    if (d === "RIGHT") snakeX += box;
    if (d === "DOWN") snakeY += box;

    if (snakeX === food.x && snakeY === food.y) {
        score++;
        food = {
            x: Math.floor(Math.random() * 19 + 1) * box,
            y: Math.floor(Math.random() * 19 + 1) * box,
        };

        increaseTimeBar();

    } else {
        snake.pop();
    }

    if (snakeX < 0) snakeX = canvas.width - box;
    if (snakeX >= canvas.width) snakeX = 0;
    if (snakeY < 0) snakeY = canvas.height - box;
    if (snakeY >= canvas.height) snakeY = 0;

    let newHead = { x: snakeX, y: snakeY };

    if (collision(newHead, snake)) {
        clearInterval(game);
        document.getElementById("finalScore").innerText = score;
        document.getElementById("gameOverPopup").style.display = "flex";
    }

    snake.unshift(newHead);
}

function collision(head, array) {
    for (let i = 0; i < array.length; i++) {
        if (head.x === array[i].x && head.y === array[i].y) {
            return true;
        }
    }
    return false;
}

function draw() {
    ctx.fillStyle = "#FFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < snake.length; i++) {
        ctx.fillStyle = i === 0 ? "#ffc107" : "#FFFFFF";
        ctx.fillRect(snake[i].x, snake[i].y, box, box);
        ctx.strokeStyle = "#000";
        ctx.strokeRect(snake[i].x, snake[i].y, box, box);
    }

    ctx.fillStyle = "#00AA00";
    ctx.fillRect(food.x, food.y, box, box);
    ctx.strokeRect(food.x, food.y, box, box);

    document.getElementById("score").innerText = score;

    moveSnake();
}

function shareScore() {
    const shareText = `I scored ${score} points in the Snake Game! Can you beat my score?`;
    const shareUrl = window.location.href;

    if (navigator.share) {
        navigator.share({
            title: 'Snake Game',
            text: shareText,
            url: shareUrl,
        }).then(() => {
            console.log('Thanks for sharing!');
        }).catch(err => {
            console.error('Could not share:', err);
        });
    } else {
        // Fallback for older browsers
        const tempInput = document.createElement('input');
        document.body.appendChild(tempInput);
        tempInput.value = `${shareText} - ${shareUrl}`;
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        alert('Score copied to clipboard. Share it on your social media!');
    }
}

function startDecreasingTimeBar() {
    const timeBar = document.getElementById("timeBar");
    setInterval(() => {
        if (timeBarWidth > 0) {
            timeBarWidth -= 1;
            timeBar.style.width = timeBarWidth + "%";
        } else {
            clearInterval(game);
            document.getElementById("finalScore").innerText = score;
            document.getElementById("gameOverPopup").style.display = "flex";
        }
    }, timeDecreaseInterval);
}

function increaseTimeBar() {
    timeBarWidth = Math.min(timeBarWidth + timeIncreaseAmount, 100);
    document.getElementById("timeBar").style.width = timeBarWidth + "%";
}


startGame();

// Virtual joystick controls
const joystick = nipplejs.create({
    zone: document.getElementById('joystickZone'),
    mode: 'static',
    position: { left: '50%', bottom: '50px' },
    color: '#FFF',
    size: 60
});

joystick.on('move', (evt, data) => {
    const { angle } = data;
    if (angle) {
        const { degree } = angle;
        if (degree >= 45 && degree < 135 && d !== "UP") d = "UP";
        else if (degree >= 135 && degree < 225 && d !== "LEFT") d = "LEFT";
        else if (degree >= 225 && degree < 315 && d !== "DOWN") d = "DOWN";
        else if ((degree >= 315 || degree < 45) && d !== "RIGHT") d = "RIGHT";
        document.getElementById("joystickZone").classList.add('active');
    }
});

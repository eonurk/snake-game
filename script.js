const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const box = 20;
let snake, food, score, d, game;
let firstMove = false;
let timeBarInterval;

const foodTypes = [
    { color: "#00AA00", points: 1, time: 15, shape: 'square', weight: 85 },
    { color: "#DD0000", points: 3, time: 30, shape: 'circle', weight: 10 },
    { color: "#0000DD", points: 5, time: 50, shape: 'triangle', weight: 5 }
];

document.addEventListener("keydown", direction);
document.getElementById("restartButton").addEventListener("click", startGame);
document.getElementById("shareButton").addEventListener("click", shareScore);
document.getElementById('up').addEventListener('click', () => changeDirection('UP'));
document.getElementById('left').addEventListener('click', () => changeDirection('LEFT'));
document.getElementById('down').addEventListener('click', () => changeDirection('DOWN'));
document.getElementById('right').addEventListener('click', () => changeDirection('RIGHT'));

function startGame() {
    snake = [];
    snake[0] = { x: 9 * box, y: 10 * box };

    generateFood();

    score = 0;
    d = null;
    firstMove = false;

    timeBarWidth = 100;
    timeDecreaseInterval = 100;

    if (game) clearInterval(game);
    game = setInterval(draw, 135);

    if (timeBarInterval) clearInterval(timeBarInterval);
    timeBarInterval = null;

    document.getElementById("gameOverPopup").style.display = "none";
}

function generateFood() {
    const totalWeight = foodTypes.reduce((total, food) => total + food.weight, 0);
    const randomWeight = Math.random() * totalWeight;
    let weightSum = 0;

    for (const foodType of foodTypes) {
        weightSum += foodType.weight;
        if (randomWeight <= weightSum) {
            food = {
                x: Math.floor(Math.random() * 19 + 1) * box,
                y: Math.floor(Math.random() * 19 + 1) * box,
                color: foodType.color,
                points: foodType.points,
                time: foodType.time,
                shape: foodType.shape
            };
            break;
        }
    }
}

function direction(event) {
    switch (event.keyCode) {
        case 37:
            if (d !== "RIGHT") changeDirection("LEFT");
            break;
        case 38:
            if (d !== "DOWN") changeDirection("UP");
            break;
        case 39:
            if (d !== "LEFT") changeDirection("RIGHT");
            break;
        case 40:
            if (d !== "UP") changeDirection("DOWN");
            break;
    }
}

function changeDirection(newDirection) {
    switch (newDirection) {
        case "LEFT":
            if (d !== "RIGHT") d = "LEFT";
            break;
        case "UP":
            if (d !== "DOWN") d = "UP";
            break;
        case "RIGHT":
            if (d !== "LEFT") d = "RIGHT";
            break;
        case "DOWN":
            if (d !== "UP") d = "DOWN";
            break;
    }

    if (!firstMove) {
        startDecreasingTimeBar();
        firstMove = true;
    }
}

async function moveSnake() {
    let snakeX = snake[0].x;
    let snakeY = snake[0].y;

    switch (d) {
        case "LEFT":
            snakeX -= box;
            break;
        case "UP":
            snakeY -= box;
            break;
        case "RIGHT":
            snakeX += box;
            break;
        case "DOWN":
            snakeY += box;
            break;
    }

    if (snakeX < 0) snakeX = canvas.width - box;
    if (snakeX >= canvas.width) snakeX = 0;
    if (snakeY < 0) snakeY = canvas.height - box;
    if (snakeY >= canvas.height) snakeY = 0;

    if (snakeX === food.x && snakeY === food.y) {
        score += food.points;
        increaseTimeBar(food.time);
        generateFood();
    } else {
        snake.pop();
    }

    const newHead = { x: snakeX, y: snakeY };

    if (collision(newHead, snake)) {
        clearInterval(game);
        document.getElementById("finalScore").innerText = score;
        await checkAndSaveScore(score);
        clearInterval(timeBarInterval);
        document.getElementById("gameOverPopup").style.display = "flex";
    }

    snake.unshift(newHead);
}

function collision(head, array) {
    return array.some(segment => head.x === segment.x && head.y === segment.y);
}

function draw() {
    ctx.fillStyle = "#FFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    snake.forEach((segment, index) => {
        ctx.fillStyle = index === 0 ? "#ffc107" : "#FFFFFF";
        ctx.fillRect(segment.x, segment.y, box, box);
        ctx.strokeStyle = "#000";
        ctx.strokeRect(segment.x, segment.y, box, box);
    });

    drawFood();
    document.getElementById("score").innerText = score;
    moveSnake();
}

function drawFood() {
    ctx.fillStyle = food.color;
    switch (food.shape) {
        case 'circle':
            ctx.beginPath();
            ctx.arc(food.x + box / 2, food.y + box / 2, box / 2, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
            break;
        case 'square':
            ctx.fillRect(food.x, food.y, box, box);
            ctx.strokeRect(food.x, food.y, box, box);
            break;
        case 'triangle':
            ctx.beginPath();
            ctx.moveTo(food.x + box / 2, food.y);
            ctx.lineTo(food.x + box, food.y + box);
            ctx.lineTo(food.x, food.y + box);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            break;
    }
}

function shareScore() {
    const shareText = `I scored ${score} points in the Snake Game! Can you beat my score?`;
    const shareUrl = window.location.href;

    if (navigator.share) {
        navigator.share({
            title: 'Snake Game',
            text: shareText,
            url: shareUrl,
        }).then(() => console.log('Thanks for sharing!'))
          .catch(err => console.error('Could not share:', err));
    } else {
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
    if (timeBarInterval) clearInterval(timeBarInterval);
    timeBarInterval = setInterval(async () => {
        if (timeBarWidth > 0) {
            timeBarWidth -= 1;
            timeBar.style.width = timeBarWidth + "%";
        } else {
            clearInterval(game);
            clearInterval(timeBarInterval);
            await checkAndSaveScore(score);
            document.getElementById("finalScore").innerText = score;
            document.getElementById("gameOverPopup").style.display = "flex";
        }
    }, timeDecreaseInterval);
}

function increaseTimeBar(time) {
    timeBarWidth = Math.min(timeBarWidth + time, 100);
    document.getElementById("timeBar").style.width = timeBarWidth + "%";
}

const API_BASE_URL = 'https://snake-game-git-main-eonurks-projects.vercel.app';

async function saveScore(player, score) {
    try {
        const response = await axios.post(`${API_BASE_URL}/api/scores`, { player, score });
        return response.data;
    } catch (error) {
        console.error("Error saving score:", error);
        return null;
    }
}

async function displayHighScores(highScores, currentPlayerScore = null) {
    const highScoresTable = document.getElementById("highScoresTable").getElementsByTagName('tbody')[0];
    highScoresTable.innerHTML = '';

    highScores.forEach((score, index) => {
        const row = highScoresTable.insertRow();
        const cellRank = row.insertCell(0);
        const cellPlayer = row.insertCell(1);
        const cellScore = row.insertCell(2);

        cellRank.innerText = index + 1;
        cellPlayer.innerText = score.player;
        cellScore.innerText = score.score;

        if (currentPlayerScore && score.player === currentPlayerScore.player && score.score === currentPlayerScore.score) {
            row.classList.add('highlight');
        }
    });
}

async function checkAndSaveScore(score) {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/scores`);
        const highScores = response.data;
        if (highScores.length < 10 || score > highScores[highScores.length - 1].score) {
            const player = prompt("Enter your name:");
            if (player) {
                const savedScore = await saveScore(player, score);
                if (savedScore) {
                    const updatedScores = await axios.get(`${API_BASE_URL}/api/scores`);
                    displayHighScores(updatedScores.data, savedScore);
                }
            }
        } else {
            displayHighScores(highScores);
        }
    } catch (error) {
        console.error("Error fetching high scores:", error);
    }
}

startGame();

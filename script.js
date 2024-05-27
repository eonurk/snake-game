const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const box = 20;
let snake, food, score, d, game;
let firstMove = false;  // To track if the snake has made its first move
let timeBarInterval;  // Variable to store the interval ID for the time bar

const foodTypes = [
    { color: "#00AA00", points: 1, time: 15, shape: 'square', weight: 90 },  // Regular food
    { color: "#DD0000", points: 3, time: 30, shape: 'circle', weight: 8 },   // Bonus food
    { color: "#0000DD", points: 5, time: 50, shape: 'triangle', weight: 2 }  // Super food
];

document.addEventListener("keydown", direction);
document.getElementById("restartButton").addEventListener("click", startGame);
document.getElementById("shareButton").addEventListener("click", shareScore);

function startGame() {
    snake = [];
    snake[0] = { x: 9 * box, y: 10 * box };

    generateFood();

    score = 0;
    d = null;
    firstMove = false;  // Reset the first move tracker

    timeBarWidth = 100; // Initialize time bar width to 100%
    timeDecreaseInterval = 100; // Decrease time bar by 1% every 100ms

    if (game) clearInterval(game);
    game = setInterval(draw, 100);

    if (timeBarInterval) clearInterval(timeBarInterval);  // Clear the previous interval
    timeBarInterval = null;  // Reset the interval ID

    document.getElementById("gameOverPopup").style.display = "none";
    document.getElementById("joystickArrows").style.display = "block";  // Show arrows
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
    if (event.keyCode === 37 && d !== "RIGHT") d = "LEFT";
    else if (event.keyCode === 38 && d !== "DOWN") d = "UP";
    else if (event.keyCode === 39 && d !== "LEFT") d = "RIGHT";
    else if (event.keyCode === 40 && d !== "UP") d = "DOWN";

    if (!firstMove) {
        startDecreasingTimeBar();
        firstMove = true;
        document.getElementById("joystickArrows").style.display = "none";  // Hide arrows
    }

    if (d) {
        document.getElementById("joystickZone").classList.add('active');
    }
}

async function moveSnake() {
    let snakeX = snake[0].x;
    let snakeY = snake[0].y;

    if (d === "LEFT") snakeX -= box;
    if (d === "UP") snakeY -= box;
    if (d === "RIGHT") snakeX += box;
    if (d === "DOWN") snakeY += box;

    if (snakeX === food.x && snakeY === food.y) {
        score += food.points;
        increaseTimeBar(food.time);
        generateFood(); // Generate new food

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
        await checkAndSaveScore(score); // Check if score qualifies for top 10
        clearInterval(timeBarInterval)
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

    drawFood();

    document.getElementById("score").innerText = score;

    moveSnake();
}

function drawFood() {
    ctx.fillStyle = food.color;
    if (food.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(food.x + box / 2, food.y + box / 2, box / 2, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
    } else if (food.shape === 'square') {
        ctx.fillRect(food.x, food.y, box, box);
        ctx.strokeRect(food.x, food.y, box, box);
    } else if (food.shape === 'triangle') {
        ctx.beginPath();
        ctx.moveTo(food.x + box / 2, food.y);
        ctx.lineTo(food.x + box, food.y + box);
        ctx.lineTo(food.x, food.y + box);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
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
    if (timeBarInterval) clearInterval(timeBarInterval);  // Clear any existing interval
    timeBarInterval = setInterval(async () => {
        if (timeBarWidth > 0) {
            timeBarWidth -= 1;
            timeBar.style.width = timeBarWidth + "%";
        } else {
            clearInterval(game);
            clearInterval(timeBarInterval);
            await checkAndSaveScore(score); // Check if score qualifies for top 10
            document.getElementById("finalScore").innerText = score;
            document.getElementById("gameOverPopup").style.display = "flex";
        }
    }, timeDecreaseInterval);
}

function increaseTimeBar(time) {
    timeBarWidth = Math.min(timeBarWidth + time, 100);
    document.getElementById("timeBar").style.width = timeBarWidth + "%";
}

const API_BASE_URL = 'https://snake-game-git-main-eonurks-projects.vercel.app/'; // Replace with your actual deployment URL

async function saveScore(player, score) {
    try {
        const response = await axios.post(`${API_BASE_URL}/api/scores`, { player, score });
        return response.data; // Return the saved score data
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

        // Highlight the player's current score
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
                    displayHighScores(updatedScores.data, savedScore); // Display high scores and highlight current player's score
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

        if (!firstMove) {
            startDecreasingTimeBar();
            firstMove = true;
            document.getElementById("joystickArrows").style.display = "none";  // Hide arrows
        }

        document.getElementById("joystickZone").classList.add('active');
    }
});

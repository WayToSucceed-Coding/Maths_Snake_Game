// Game Constants
const BOARD_WIDTH = 640;
const BOARD_HEIGHT = 540;
const GRID_SIZE = 20;
const GRID_WIDTH = BOARD_WIDTH / GRID_SIZE;
const GRID_HEIGHT = BOARD_HEIGHT / GRID_SIZE;
const INITIAL_SPEED = 180; // Slower speed for calculation time
const MAX_APPLES = 5;
const MIN_APPLE_DISTANCE = 5;
const MAX_LIVES = 3;
const GUARANTEED_CORRECT_APPLES = 1;
const CORRECT_ANSWER_CHANCE = 0.4; // 40% chance for correct answers

// Game Variables
let snake = [];
let direction = "right";
let nextDirection = "right";
let gameInterval;
let apples = [];
let score = 0;
let lives = MAX_LIVES;
let currentQuestion = {};
let isGameActive = false;
let currentSpeed = INITIAL_SPEED;
let usedValues = new Set(); // Track used apple values

// DOM Elements
const gameBoard = document.getElementById("game-board");
const gameScreen = document.getElementById("game-screen");
const welcomeScreen = document.getElementById("welcome-screen");
const gameOverScreen = document.getElementById("game-over-screen");
const loadingScreen = document.getElementById("loading-screen");
const startBtn = document.getElementById("start-btn");
const restartBtn = document.getElementById("restart-btn");
const loadingBar = document.getElementById("loading-bar");
const loadingText = document.getElementById("loading-text");
const questionDisplay = document.getElementById("question");
const scoreDisplay = document.getElementById("score");
const livesDisplay = document.getElementById("lives");
const finalScoreDisplay = document.getElementById("final-score");

// Audio Elements
const correctSound = new Audio(
  "https://assets.mixkit.co/sfx/preview/mixkit-correct-answer-tone-2870.mp3"
);
const wrongSound = new Audio(
  "https://assets.mixkit.co/sfx/preview/mixkit-wrong-answer-fail-notification-946.mp3"
);
const gameOverSound = new Audio(
  "https://assets.mixkit.co/sfx/preview/mixkit-arcade-game-explosion-2759.mp3"
);

// Start game setup
startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", restartGame);
document.addEventListener("keydown", changeDirection);

function startGame() {
  welcomeScreen.style.display = "none";
  loadingScreen.style.display = "flex";

  let progress = 0;
  const loadingMessages = [
    "Creating math problems...",
    "Preparing the snake...",
    "Setting up the board...",
    "Almost ready!",
  ];

  const loadingInterval = setInterval(() => {
    progress += 2;
    loadingBar.style.width = `${progress}%`;

    if (progress < 25) {
      loadingText.textContent = loadingMessages[0];
    } else if (progress < 50) {
      loadingText.textContent = loadingMessages[1];
    } else if (progress < 75) {
      loadingText.textContent = loadingMessages[2];
    } else {
      loadingText.textContent = loadingMessages[3];
    }

    if (progress >= 100) {
      clearInterval(loadingInterval);
      setTimeout(() => {
        loadingScreen.style.display = "none";
        gameScreen.style.display = "block";
        initGame();
      }, 300);
    }
  }, 30);
}

function restartGame() {
  gameOverScreen.style.display = "none";
  initGame();
}

function initGame() {
  // Reset game state
  snake = [];
  apples = [];
  score = 0;
  lives = MAX_LIVES;
  direction = "right";
  nextDirection = "right";
  isGameActive = true;
  currentSpeed = INITIAL_SPEED;
  usedValues = new Set(); // Reset used values

  // Clear the game board
  gameBoard.innerHTML = "";

  // Create initial snake
  const initialX = Math.floor(GRID_WIDTH / 4);
  const initialY = Math.floor(GRID_HEIGHT / 2);

  for (let i = 0; i < 3; i++) {
    snake.push({ x: initialX - i, y: initialY });
  }

  generateQuestion();
  updateScore();
  updateLives();

  // Create guaranteed correct apples first
  createApple(true);

  // Then fill remaining apples
  for (let i = 0; i < MAX_APPLES - GUARANTEED_CORRECT_APPLES; i++) {
    createApple(false);
  }

  if (gameInterval) clearInterval(gameInterval);
  gameInterval = setInterval(gameLoop, currentSpeed);

  draw();
}

function gameLoop() {
  if (!isGameActive) return;

  direction = nextDirection;
  const head = { ...snake[0] };

  switch (direction) {
    case "up":
      head.y--;
      break;
    case "down":
      head.y++;
      break;
    case "left":
      head.x--;
      break;
    case "right":
      head.x++;
      break;
  }

  // Wall collision
  if (
    head.x < 0 ||
    head.x >= GRID_WIDTH ||
    head.y < 0 ||
    head.y >= GRID_HEIGHT
  ) {
    gameOver();
    return;
  }

  // Self collision
  for (let i = 0; i < snake.length; i++) {
    if (snake[i].x === head.x && snake[i].y === head.y) {
      gameOver();
      return;
    }
  }

  // Apple collision
  let appleEaten = false;
  let correctAppleEaten = false;

  for (let i = 0; i < apples.length; i++) {
    if (head.x === apples[i].x && head.y === apples[i].y) {
      appleEaten = true;

      // Remove the value from usedValues when apple is eaten
      usedValues.delete(apples[i].value);

      if (apples[i].value === currentQuestion.answer) {
        score += 10;
        correctAppleEaten = true;
        updateScore();
        showCelebration();
        correctSound.play();
        generateQuestion();
      } else {
        lives--;
        updateLives();
        wrongSound.play();

        if (lives <= 0) {
          gameOver();
          return;
        }
      }

      apples.splice(i, 1);
      break;
    }
  }

  snake.unshift(head);
  if (!appleEaten) {
    snake.pop();
  }

  if (correctAppleEaten) {
    showPointsAnimation(head.x, head.y);
    // Add a new correct apple when one is eaten
    apples=[]
    createApple(true);
   
  }

  // Ensure we maintain at least GUARANTEED_CORRECT_APPLES correct answers
  const currentCorrect = apples.filter(
    (a) => a.value === currentQuestion.answer
  ).length;
  if (currentCorrect < GUARANTEED_CORRECT_APPLES) {
    createApple(true);
  }

  // Ensure we have enough apples total
  while (apples.length < MAX_APPLES) {
    createApple(false);
  }

  draw();
}

function draw() {
  gameBoard.innerHTML = "";

  // Draw snake with gradient effect
  snake.forEach((part, index) => {
    const snakePart = document.createElement("div");
    snakePart.className =
      index === 0 ? "snake-part snake-head" : "snake-part";
    snakePart.style.left = `${part.x * GRID_SIZE}px`;
    snakePart.style.top = `${part.y * GRID_SIZE}px`;

    // Body gradient effect
    if (index > 0) {
      const hue = 160 + ((index * 2) % 60);
      snakePart.style.background = `hsl(${hue}, 85%, 55%)`;
    }

    gameBoard.appendChild(snakePart);
  });

  // Draw apples
  apples.forEach((apple) => {
    const appleElement = document.createElement("div");
    appleElement.className = "apple"       
    appleElement.style.left = `${apple.x * GRID_SIZE}px`;
    appleElement.style.top = `${apple.y * GRID_SIZE}px`;
    appleElement.textContent = apple.value;
    appleElement.classList.add("glow");
    

    gameBoard.appendChild(appleElement);
  });

  // Draw animations
  document.querySelectorAll(".point-animation").forEach((el) => {
    gameBoard.appendChild(el);
  });
}

function showPointsAnimation(x, y) {
  const animation = document.createElement("div");
  animation.className = "point-animation";
  animation.textContent = "+10";
  animation.style.left = `${x * GRID_SIZE + 10}px`;
  animation.style.top = `${y * GRID_SIZE - 10}px`;
  gameBoard.appendChild(animation);

  setTimeout(() => {
    if (animation.parentNode) {
      animation.parentNode.removeChild(animation);
    }
  }, 800);
}

function showCelebration() {
  const celebration = document.createElement("div");
  celebration.className = "celebration";
  celebration.textContent = "GREAT!";
  gameBoard.appendChild(celebration);

  setTimeout(() => {
    if (celebration.parentNode) {
      celebration.parentNode.removeChild(celebration);
    }
  }, 800);
}

function createApple(forceCorrect) {
  let newApple;
  let overlapping;
  let attempts = 0;
  const maxAttempts = 100;

  do {
    overlapping = false;
    attempts++;

    // Ensure apples stay within game board boundaries
    const x = Math.max(
      0,
      Math.min(GRID_WIDTH - 5, Math.floor(Math.random() * GRID_WIDTH))
    );
    const y = Math.max(
      0,
      Math.min(GRID_HEIGHT - 5, Math.floor(Math.random() * GRID_HEIGHT))
    );

    let value;
    if (forceCorrect) {
      value = currentQuestion.answer;
    } else {
      if (
        Math.random() < CORRECT_ANSWER_CHANCE &&
        !usedValues.has(currentQuestion.answer)
      ) {
        value = currentQuestion.answer;
      } else {
        // Generate unique wrong answers
        let potentialValue;
        do {
          const offset = Math.floor(Math.random() * 10) - 5;
          potentialValue = currentQuestion.answer + offset;
          if (potentialValue === currentQuestion.answer) {
            potentialValue += Math.random() > 0.5 ? 1 : -1;
          }
          potentialValue = Math.max(1, potentialValue);
        } while (usedValues.has(potentialValue));

        value = potentialValue;
      }
    }

    // Skip if this value is already used (except for correct answers which we want to allow)
    if (!forceCorrect && usedValues.has(value)) {
      continue;
    }

    newApple = { x, y, value };

    // Check snake collision
    for (const part of snake) {
      if (part.x === newApple.x && part.y === newApple.y) {
        overlapping = true;
        break;
      }
    }

    // Check apple collision with minimum distance
    for (const apple of apples) {
      const distance = Math.sqrt(
        Math.pow(apple.x - newApple.x, 2) +
          Math.pow(apple.y - newApple.y, 2)
      );

      if (distance < MIN_APPLE_DISTANCE) {
        overlapping = true;
        break;
      }
    }

    if (attempts >= maxAttempts) {
      for (const apple of apples) {
        if (apple.x === newApple.x && apple.y === newApple.y) {
          overlapping = true;
          break;
        }
      }
    }
  } while (overlapping && attempts < maxAttempts);

  if (!overlapping) {
    usedValues.add(newApple.value);
    apples.push(newApple);
  }
}

function generateQuestion() {
  const operations = ["+", "-"];
  const operation =
    operations[Math.floor(Math.random() * operations.length)];

  let num1, num2, answer;

  if (operation === "+") {
    num1 = Math.floor(Math.random() * 15) + 1;
    num2 = Math.floor(Math.random() * 15) + 1;
    answer = num1 + num2;
  } else {
    num1 = Math.floor(Math.random() * 15) + 10;
    num2 = Math.floor(Math.random() * num1);
    answer = num1 - num2;
  }

  currentQuestion = {
    text: `${num1} ${operation} ${num2} = ?`,
    answer: answer,
  };

  questionDisplay.textContent = currentQuestion.text;
  usedValues = new Set(); // Reset used values when question changes
}

function updateScore() {
  scoreDisplay.textContent = `Score: ${score}`;
}

function updateLives() {
  livesDisplay.textContent = `Lives: ${lives}`;
}

function gameOver() {
  isGameActive = false;
  clearInterval(gameInterval);
  gameOverSound.play();
  finalScoreDisplay.textContent = `Score: ${score}`;
  gameOverScreen.style.display = "flex";
}

function changeDirection(event) {
  const key = event.key.toLowerCase();

  if (key === "arrowup" || key === "w") {
    if (direction !== "down") nextDirection = "up";
  } else if (key === "arrowdown" || key === "s") {
    if (direction !== "up") nextDirection = "down";
  } else if (key === "arrowleft" || key === "a") {
    if (direction !== "right") nextDirection = "left";
  } else if (key === "arrowright" || key === "d") {
    if (direction !== "left") nextDirection = "right";
  }

  if (["arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
    event.preventDefault();
  }
}


// Game Constants
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
var initialSpeed = 180; // Slower speed for calculation time
let currentSpeed = initialSpeed;
let usedValues = new Set(); // Track used apple values
// Touch variables
let touchStartX = 0;
let touchStartY = 0;
const minSwipeDistance = 50; // Minimum pixels to count as a swipe
let lastTouchTime = 0;
let gridSizeX, gridSizeY;

let grid_size; // Will be calculated dynamically
let grid_width;
let grid_height;
const min_grid_size = 20; // Minimum cell size in pixels
const max_grid_cells_x = 32; // Max horizontal cells (original was 640/20=32)
const max_grid_cells_y = 27; // Max vertical cells (original was 540/20=27)



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
const musicControl = document.getElementById("music-control");
let isMusicPlaying=false

musicControl.addEventListener("click",()=>{
  toggleMusic()
})

// Toggle function
function toggleMusic() {
  isMusicPlaying = !isMusicPlaying;
  const icon = musicControl.querySelector("i");
  
  if (isMusicPlaying) {
    backgroundSound.loop = true;
    backgroundSound.play().catch(e => console.log("Audio play prevented:", e));
    icon.classList.replace("fa-volume-mute", "fa-volume-up");
  } else {
    backgroundSound.pause();
    icon.classList.replace("fa-volume-up", "fa-volume-mute");
  }
}

// Initialize
function initMusic() {
  backgroundSound.volume = 0.8;
  toggleMusic(); // Start muted
}

// Add this early in your script
document.body.style.overflow = 'hidden'; // Prevent page scrolling

function calculateGridDimensions() {
  const availableWidth = gameBoard.clientWidth;
  const availableHeight = gameBoard.clientHeight;

  grid_size = Math.max(
    min_grid_size,
    Math.min(
      Math.floor(availableWidth / max_grid_cells_x),
      Math.floor(availableHeight / max_grid_cells_y)
    )
  );

  // Use visible cells, not maximum possible
  grid_width = Math.floor(availableWidth / grid_size);
  grid_height 
= Math.floor(availableHeight / grid_size);

  gameBoard.style.setProperty('--grid-size', `${grid_size}px`);
}
function handleResize() {

  // Clamp snake position to new grid
  const head = snake[0];
  snake = snake.map(segment => ({
    x: Math.min(segment.x, grid_width - 1),
    y: Math.min(segment.y, grid_height 
    - 1)
  }));

  // Filter out-of-bounds apples
  apples = apples.filter(apple =>
    apple.x < grid_width && apple.y < grid_height
  );

  // Maintain minimum apples
  while (apples.length < MAX_APPLES) {
    createApple(false);
  }

  draw();
}

// Debounce the resize handler
const debouncedResize = debounce(handleResize, 200);
window.addEventListener('resize', debouncedResize);

// Replace your BOARD_WIDTH/HEIGHT with:
const getGameSize = () => {
  const maxWidth = Math.min(window.innerWidth, 640); // Cap at 640px width
  const maxHeight = Math.min(window.innerHeight, 540); // Cap at 540px height
  return {
    width: maxWidth,
    height: maxHeight - 100 // Reserve space for UI
  };
};


// Audio Elements
const correctSound = new Audio(
  "assets/sounds/correct.mp3"
);
const wrongSound = new Audio(
  "https://assets.mixkit.co/sfx/preview/mixkit-wrong-answer-fail-notification-946.mp3"
);
const gameOverSound = new Audio(
  "assets/sounds/game-over.mp3"
);

const gameStartSound= new Audio("assets/sounds/game-start.mp3")

const backgroundSound=new Audio("assets/sounds/background.mp3")



// Start game setup
startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", restartGame);
document.addEventListener("keydown", changeDirection);
startBtn.addEventListener("touchstart", startGame);
restartBtn.addEventListener("touchstart", restartGame);

const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints;

if (isTouchDevice) {
  // You might want to adjust game speed for touch devices
  initialSpeed = 200; // Slightly slower for touch controls
}

// Debounce function to limit rapid calls
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function startGame() {
  
  welcomeScreen.style.display = "none";
  loadingScreen.style.display = "flex";
  
  gameStartSound.play()
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
        initMusic()
      }, 300);
    }
  }, 30);
}

function restartGame() {
  gameOverScreen.style.display = "none";
  gameStartSound.play()
  initGame();
}

// Replace your current setup with these high-performance listeners
function setupSwipeControls() {
  const board = document.getElementById('game-board');
  
  // Use passive: true for touchmove (better scrolling performance)
  board.addEventListener('touchstart', handleTouchStart, { passive: false });
  board.addEventListener('touchmove', handleTouchMove, { passive: true }); // Changed to passive
  board.addEventListener('touchend', handleTouchEnd, { passive: false });
  
  // Prevent scroll only when actively swiping
  let isSwiping = false;
  board.addEventListener('touchstart', () => isSwiping = true);
  board.addEventListener('touchend', () => isSwiping = false);
  document.addEventListener('touchmove', (e) => {
    if (isSwiping) e.preventDefault();
  }, { passive: false });
}

// Modified touch handlers
function handleTouchStart(e) {
  e.preventDefault(); // Critical for iOS
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}

function handleTouchMove(e) {
  e.preventDefault(); // Block scroll during swipe
}

function handleTouchEnd(e) {
  const now = Date.now();
  if (now - lastTouchTime < 30 || !isGameActive) return;

  const touch = e.changedTouches[0];
  const dx = touch.clientX - touchStartX;
  const dy = touch.clientY - touchStartY;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  // Only register swipes >40px movement
  if (Math.max(absDx, absDy) < 40) return;

  // Prioritize dominant direction
  if (absDx > absDy) {
    if (dx > 0 && direction !== "left") nextDirection = "right";
    else if (dx < 0 && direction !== "right") nextDirection = "left";
  } else {
    if (dy > 0 && direction !== "up") nextDirection = "down";
    else if (dy < 0 && direction !== "down") nextDirection = "up";
  }
}
function initGame() {
  calculateGridDimensions(); // First thing!
  setupSwipeControls()

  // Reset game state
  snake = [];
  apples = [];
  score = 0;
  lives = MAX_LIVES;
  direction = "right";
  nextDirection = "right";
  isGameActive = true;
  currentSpeed = initialSpeed;
  usedValues = new Set(); // Reset used values

  // Clear the game board
  gameBoard.innerHTML = "";

  // Create initial snake
  const initialX = Math.floor(grid_width / 4);
  const initialY = Math.floor(grid_height 
  / 2);

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
    head.x >= grid_width ||
    head.y < 0 ||
    head.y >= grid_height
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
    apples = []
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

  // Snake drawing (updated to use dynamic grid_size)
  snake.forEach((part, index) => {
    const snakePart = document.createElement("div");
    snakePart.className = index === 0 ? "snake-part snake-head glow" : "snake-part";
    snakePart.style.left = `${part.x * grid_size}px`;
    snakePart.style.top = `${part.y * grid_size}px`;
    gameBoard.appendChild(snakePart);
  });

  // Apple drawing
  apples.forEach(apple => {
    const appleElement = document.createElement("div");
    appleElement.className = "apple glow";
    appleElement.style.left = `${apple.x * grid_size}px`;
    appleElement.style.top = `${apple.y * grid_size}px`;
    appleElement.textContent = apple.value;
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
  animation.style.left = `${x * grid_size + 10}px`;
  animation.style.top = `${y * grid_size - 10}px`;
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

  // Calculate safe boundaries (leave 1 cell margin)
  const maxX = grid_width - 2;
  const maxY = grid_height 
- 2;

  do {
    overlapping = false;
    attempts++;

    // Ensure we stay within current grid bounds
    const x = Math.max(1, Math.min(maxX, Math.floor(Math.random() * maxX)));
    const y = Math.max(1, Math.min(maxY, Math.floor(Math.random() * maxY)));
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
  clearInterval(gameInterval)
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
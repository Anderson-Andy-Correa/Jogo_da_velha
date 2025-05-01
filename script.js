const main = document.getElementById('main');
const startModal = document.getElementById('startModal');
const startGameBtn = document.getElementById('startGameBtn');
const startDifficulty = document.getElementById('startDifficulty');
const playerSymbolSelect = document.getElementById('playerSymbol');
const firstMoveSelect = document.getElementById('firstMove');
const muteBtn = document.getElementById('muteBtn');
const board = document.getElementById('board');
const symbolSelect = document.getElementById('symbolSelect');
const statusText = document.getElementById('status');
const restartBtn = document.getElementById('restart');
const toggleThemeBtn = document.getElementById('toggle-theme');
const difficultySelect = document.getElementById('difficulty');
const scoreX = document.getElementById('scoreX');
const scoreO = document.getElementById('scoreO');
const scoreDraw = document.getElementById('scoreDraw');
const soundClick = new Audio('./assets/sounds/click.mp3');
const soundWin = new Audio('./assets/sounds/Win.mp3');
const soundLose = new Audio('./assets/ounds/Fail.ogg');
const soundDraw = new Audio('./assets/sounds/Empate.ogg');
const bgMusic = new Audio('./assets/sounds/background.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.3;
soundWin.volume = 0.3;
soundLose.volume = 0.3;
soundDraw.volume = 0.3;

let muted = false;
let gameStarted = false;
let totalSeconds = 0;
let xSeconds = 0;
let oSeconds = 0;
let intervalId = null;
let currentTimer = null;
let timerActive = false;
let boardLocked = false;
let currentPlayer = 'X';
let gameActive = true;
let gameState = ['', '', '', '', '', '', '', '', ''];
let scores = { X: 0, O: 0, Draw: 0 };
let playerSide = 'X';
let aiSide = 'O';
let firstMove = 'player';

const winningConditions = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

function createBoard() {
  board.innerHTML = '';
  gameState.forEach((_, index) => {
    const div = document.createElement('div');
    div.className = 'cell';
    div.setAttribute('data-index', index);
    div.setAttribute('tabindex', 0);
    div.setAttribute('aria-label', `Célula ${index + 1}`);
    div.addEventListener('click', handleMove);
    div.addEventListener('keydown', handleKey);
    board.appendChild(div);
  });
}  

function startTimers() {
  clearInterval(intervalId);
  totalSeconds = xSeconds = oSeconds = 0;
  timerActive = true;
  currentTimer = currentPlayer;

  intervalId = setInterval(() => {
    if (!timerActive) return;
    totalSeconds++;
    if (currentTimer === 'X') xSeconds++;
    else if (currentTimer === 'O') oSeconds++;

    updateTimeDisplay();
  }, 1000);
}

function stopTimers() {
  timerActive = false;
}

function updateTimeDisplay() {
  document.getElementById('totalTime').textContent = formatTime(totalSeconds);
  document.getElementById('timeX').textContent = formatTime(xSeconds);
  document.getElementById('timeO').textContent = formatTime(oSeconds);
}

function formatTime(sec) {
  const min = String(Math.floor(sec / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  return `${min}:${s}`;
}

function handleMove(e) {
  if (!gameActive || boardLocked || currentPlayer !== playerSide || !gameStarted) return;

  const index = e.target.getAttribute('data-index');
  if (gameState[index]) return;

  soundClick.play();
  makeMove(index, playerSide);

  if (checkResult(playerSide)) return;

  currentPlayer = aiSide;
  currentTimer = aiSide;
  updateStatusText(); // Atualiza a vez na tela

  boardLocked = true; // Bloqueia para esperar a IA
  setTimeout(() => {
    aiMove(); // IA joga
  }, 300);
}

function makeMove(index, player) {
  gameState[index] = player;
  const cell = board.children[index];
  const emoji = player === 'X' ? '❌' : '⭕';
  const filledClass = player === 'X' ? 'filled-x' : 'filled-o';

  cell.textContent = emoji;
  cell.classList.add(filledClass);
}

function updateStatusText() {
  statusText.textContent = `Vez de: ${currentPlayer === 'X' ? '❌' : '⭕'}`;
}

function checkResult(player) {
  for (let condition of winningConditions) {
    const [a, b, c] = condition;
    if (
      gameState[a] &&
      gameState[a] === gameState[b] &&
      gameState[a] === gameState[c]
    ) {
      const emoji = player === 'X' ? '❌' : '⭕';
      const winClass = player === 'X' ? 'win-x' : 'win-o';
      const sound = player === playerSide ? soundWin : soundLose;

      stopTimers();
      stopAllSounds();
      sound.play();
      statusText.textContent = `Vitória de: ${emoji}`;
      statusText.className = winClass;
      scores[player]++;
      updateScores();

      // Aplica a animação de piscar às células vencedoras
      [a, b, c].forEach(index => {
        board.children[index].classList.add('winner-cell');
      });

      gameActive = false;
      disableBoard();
      return true;
    }
  }

  // Verifica empate
  if (!gameState.includes('')) {
    stopTimers();
    stopAllSounds();
    soundDraw.play();
    statusText.textContent = 'Empate! 🤝';
    statusText.className = 'draw';
    board.classList.add('gray-out');
    scores.Draw++;
    updateScores();
    gameActive = false;
    disableBoard();
    return true;
  }

  return false;
}

function updateScores() {
  scoreX.textContent = scores.X;
  scoreO.textContent = scores.O;
  scoreDraw.textContent = scores.Draw;
}


function restartGame() {
  disableBoard();
  board.classList.remove('gray-out', 'draw');
  stopAllSounds();
  
  gameActive = true;
  boardLocked = false;
  gameState = ['', '', '', '', '', '', '', '', ''];
  statusText.className = '';
  updateSymbolDisplay();
  updateStatusText();
  createBoard();
  startTimers();
  updateTimeDisplay();
  if (bgMusic.paused) bgMusic.play();

  // Se a IA começa, a IA faz sua jogada imediatamente
  if (currentPlayer === aiSide) {
    boardLocked = true;
    setTimeout(() => {
      aiMove();
      boardLocked = false;
    }, 300);
  }
}


function toggleTheme() {
  if (document.body.classList.contains('dark')) {
    document.body.classList.remove('dark');
    document.body.classList.add('light');
  } else {
    document.body.classList.remove('light');
    document.body.classList.add('dark');
  }
}
  

function aiMove() {
  if (!gameActive || currentPlayer !== aiSide) return;

  const level = difficultySelect.value;
  const available = gameState.map((v, i) => v === '' ? i : null).filter(v => v !== null);
  if (available.length === 0) return;

  let index;

  if (level === 'easy') {
    index = available[Math.floor(Math.random() * available.length)];
  } else {
    index = minimax(gameState, aiSide).index;
  }

  if (index !== undefined && gameActive) {
    makeMove(index, aiSide);

    // ⚠️ Verifica vitória ou empate. Se acabou o jogo, não faz mais nada.
    if (checkResult(aiSide)) {
      boardLocked = false; // <- Libera só para prevenir travamento permanente
      return;
    }

    currentPlayer = playerSide;
    currentTimer = playerSide;
    updateStatusText();
    boardLocked = false; // ✅ Desbloqueia corretamente
  }
}

function minimax(newBoard, player) {
  const availSpots = newBoard.map((v, i) => v === '' ? i : null).filter(v => v !== null);

  if (checkWin(newBoard, 'X')) return { score: -10 };
  if (checkWin(newBoard, 'O')) return { score: 10 };
  if (availSpots.length === 0) return { score: 0 };

  const moves = [];

  for (let i of availSpots) {
    const move = {};
    move.index = i;
    newBoard[i] = player;

    const result = minimax(newBoard, player === 'O' ? 'X' : 'O');
    move.score = result.score;

    newBoard[i] = '';
    moves.push(move);
  }

  if (player === 'O') {
    return moves.reduce((best, move) => move.score > best.score ? move : best);
  } else {
    return moves.reduce((best, move) => move.score < best.score ? move : best);
  }
}

function checkWin(board, player) {
  return winningConditions.some(([a, b, c]) =>
    board[a] === player && board[b] === player && board[c] === player
  );
}

function stopAllSounds() {
  [soundClick, soundWin, soundDraw, soundLose, bgMusic].forEach(sound => {
    sound.pause();
    sound.currentTime = 0;
  });
}


function disableBoard() {
  Array.from(board.children).forEach(cell => {
    cell.removeEventListener('click', handleMove);
    cell.removeEventListener('keydown', handleKey);
  });
}
  
function handleKey(e) {
  if (e.key === 'Enter' || e.key === ' ') handleMove(e);
}
 

function toggleMute() {
  muted = !muted;  // Inverte o estado de mute

  if (muted) {
    // Muda o volume dos sons para 0 (silencioso)
    soundClick.volume = 0;
    soundWin.volume = 0;
    soundLose.volume = 0;
    soundDraw.volume = 0;
    bgMusic.volume = 0;
    
    // Atualiza o texto do botão para "desmutar"
    muteBtn.textContent = "🔇";
  } else {
    // Restaura o volume original dos sons
    soundClick.volume = 0.3;
    soundWin.volume = 0.3;
    soundLose.volume = 0.3;
    soundDraw.volume = 0.3;
    bgMusic.volume = 0.3;

    // Atualiza o texto do botão para "mudo"
    muteBtn.textContent = "🔊";
  }
}

function restartWithNewSymbol() {
  const selectedSymbol = symbolSelect.value;

  playerSymbol = selectedSymbol;
  currentPlayer = playerSymbol;

  statusText.textContent = `Vez de: ${currentPlayer === 'X' ? '❌' : '⭕'}`;

  // Reiniciar o jogo com o novo símbolo
  restartGame();  // Reutiliza a função de reiniciar que você já tem
}

function restartWithNewSymbol() {
  const selectedSymbol = symbolSelect.value;
  playerSymbol = selectedSymbol;

  restartGame();
}

function updateSymbolDisplay() {
  symbolSelect.value = playerSide;
}

// Eventos
restartBtn.addEventListener('click', restartGame);
toggleThemeBtn.addEventListener('click', toggleTheme);
difficultySelect.addEventListener('change', () => {
  restartGame();
  startTimers();
});
muteBtn.addEventListener('click', toggleMute);
symbolSelect.addEventListener('change', () => {
  const selectedSymbol = symbolSelect.value;
  playerSide = selectedSymbol;
  aiSide = selectedSymbol === 'X' ? 'O' : 'X';
  currentPlayer = playerSide; 
  updateSymbolDisplay();
  restartGame();
});

// Inicialização
createBoard();

// Garante que o tema esteja definido no início
document.body.classList.add('dark');

startGameBtn.addEventListener('click', () => {
  startModal.style.display = 'none';
  main.classList.remove('hidden');

  gameStarted = true;

  // Salva as configurações iniciais
  difficultySelect.value = startDifficulty.value;
  const playerSymbol = playerSymbolSelect.value;
  firstMove = firstMoveSelect.value;  // Salva a escolha de quem começa

  currentPlayer = firstMove === 'player' ? playerSymbol : (playerSymbol === 'X' ? 'O' : 'X');

  // Salva o símbolo do jogador
  playerSide = playerSymbol;
  aiSide = playerSymbol === 'X' ? 'O' : 'X';

  // Atualiza UI
  statusText.textContent = `Vez de: ${currentPlayer === 'X' ? '❌' : '⭕'}`;

  symbolSelect.value = playerSymbol;

  gameActive = true;
  createBoard();
  startTimers(); 

  if (bgMusic.paused) bgMusic.play();

  // Se a IA começa
  if (currentPlayer === aiSide) {
    boardLocked = true;
    setTimeout(() => {
      aiMove();
      boardLocked = false;
    }, 300);
  }
});
 
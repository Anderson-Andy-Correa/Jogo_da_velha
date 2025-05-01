const board = document.getElementById('board');
const statusText = document.getElementById('status');
const restartBtn = document.getElementById('restart');
const toggleThemeBtn = document.getElementById('toggle-theme');
const difficultySelect = document.getElementById('difficulty');
const scoreX = document.getElementById('scoreX');
const scoreO = document.getElementById('scoreO');
const scoreDraw = document.getElementById('scoreDraw');
const soundClick = new Audio('sounds/click.mp3');
const soundWin = new Audio('sounds/Win.mp3');
const soundLose = new Audio('sounds/Fail.ogg');
const soundDraw = new Audio('sounds/Empate.ogg');
const bgMusic = new Audio('sounds/background.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.4;

let boardLocked = false;
let currentPlayer = 'X';
let gameActive = true;
let gameState = ['', '', '', '', '', '', '', '', ''];
let scores = { X: 0, O: 0, Draw: 0 };

const winningConditions = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

function createBoard() {
    board.innerHTML = '';
    gameState.forEach((cell, index) => {
      const div = document.createElement('div');
      div.className = 'cell';
      div.setAttribute('data-index', index);
      div.setAttribute('tabindex', 0);
      div.addEventListener('click', handleMove);
      div.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') handleMove(e);
      });
      board.appendChild(div);
    });
  }
  
  

  function handleMove(e) {
    if (!gameActive || boardLocked) return;
  
    const index = e.target.getAttribute('data-index');
    if (gameState[index]) return;

    soundClick.play();
    makeMove(index, currentPlayer);
  
    // Após a jogada do jogador, verifica se o jogo acabou
    if (checkResult(currentPlayer)) return;
  
    // Se ainda estiver ativo, e for a vez da IA, faz ela jogar
    if (currentPlayer === 'O') {
      boardLocked = true; // Bloqueia para esperar a IA
      setTimeout(() => {
        aiMove();
        boardLocked = false; // Libera após a IA jogar
      }, 300);
    }
  }

function makeMove(index, player) {
    gameState[index] = player;
  
    const cell = board.children[index];
    const emoji = player === 'X' ? '❌' : '⭕';
    const filledClass = player === 'X' ? 'filled-x' : 'filled-o';
  
    cell.textContent = emoji;
    cell.classList.add(filledClass);
    if (checkResult(player)) {
        return; // Só troca jogador se o jogo não acabou
      }
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
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
        var emoji;
        var winClass;
        bgMusic.pause();
        bgMusic.currentTime = 0;
        if (player === 'X') {
            soundWin.play();  // Vitória do jogador
            emoji = '❌';
            winClass = 'win-x';
          } else {
            soundLose.play(); // Toca som de derrota se o jogador perder para a IA
            emoji = '⭕';
            winClass = 'win-o';
          }
  
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
  
    if (!gameState.includes('')) {
        bgMusic.pause();
        bgMusic.currentTime = 0;
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
    board.classList.remove('gray-out', 'draw');
    stopAllSounds();
    currentPlayer = 'X';
    gameActive = true;
    gameState = ['', '', '', '', '', '', '', '', ''];
    statusText.textContent = `Vez de: ❌`;
    statusText.className = '';
    createBoard();

    bgMusic.play();
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
    if (!gameActive) return; // 🛑 Evita que a IA jogue após fim de jogo
  
    let index;
    const level = difficultySelect.value;
    const available = gameState.map((v, i) => v === '' ? i : null).filter(v => v !== null);
  
    if (available.length === 0) return; // 🛑 Confirma que ainda tem jogadas válidas
  
    if (level === 'easy') {
      index = available[Math.floor(Math.random() * available.length)];
    } else {
      index = minimax(gameState, 'O').index;
    }
  
    if (index !== undefined && gameActive) {
      makeMove(index, 'O');
    }
  }

// Minimax (apenas para O como IA)
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
 

// Eventos
restartBtn.addEventListener('click', restartGame);
toggleThemeBtn.addEventListener('click', toggleTheme);
difficultySelect.addEventListener('change', () => {
    currentDifficulty = difficultySelect.value;
    restartGame(); // reinicia automaticamente ao mudar
});

// Inicialização
createBoard();

// Garante que o tema esteja definido no início
if (!document.body.classList.contains('dark') && !document.body.classList.contains('light')) {
    document.body.classList.add('light');
  }

  const startModal = document.getElementById('startModal');
  const startGameBtn = document.getElementById('startGameBtn');
  
  startGameBtn.addEventListener('click', () => {
    startModal.style.display = 'none';
    bgMusic.play();
  });
  
  
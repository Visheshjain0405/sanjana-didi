const ROOM_ID = 'didi_bhai_private';
const TARGET_SCORE = 10;

// In-memory state for Rock Paper Scissors match
let rpsState = {
  choices: {}, // { didi: 'rock', bhai: 'paper' }
  scores: { didi: 0, bhai: 0 },
  roundHistory: [],
  matchWinner: null,
};

function calculateWinner(choiceA, choiceB, playerA, playerB) {
  if (!choiceA && !choiceB) return 'draw';
  if (!choiceA) return playerB;
  if (!choiceB) return playerA;
  if (choiceA === choiceB) return 'draw';
  if (
    (choiceA === 'rock' && choiceB === 'scissors') ||
    (choiceA === 'paper' && choiceB === 'rock') ||
    (choiceA === 'scissors' && choiceB === 'paper')
  ) {
    return playerA;
  }
  return playerB;
}

// In-memory state for Guess The Movie challenge
let movieState = {
  activeChallenge: null, // { mode: 'image'|'clues', creator: 'didi'|'bhai', secretTitle: '3 Idiots', imageUri: '', clues: ['', '', ''], createdAt: Date, isResolved: false, winner: null, guesses: [] }
};

// In-memory state for Guess The Relative game
let relativeGameState = {
  setups: {}, // { didi: { personName, imageUri, hints }, bhai: { personName, imageUri, hints } }
  gamePhase: 'setup', // 'setup' | 'waiting' | 'guessing' | 'ended'
  winner: null,
  winningRelative: null,
  guessesHistory: [],
};

// In-memory state for Tic-Tac-Toe game
let tttState = {
  board: Array(9).fill(null), // Array of 9 cells: null | 'didi' | 'bhai'
  currentTurn: 'didi', // 'didi' starts first by default
  scores: { didi: 0, bhai: 0 },
  winner: null, // null | 'didi' | 'bhai' | 'draw'
  winningCombo: null, // e.g. [0, 1, 2]
  isGameOver: false,
};

// In-memory state for Sibling Scoreboard & Chai Debt Tracker
let scoreboardState = {
  didiWins: 0,
  bhaiWins: 0,
  ties: 0,
  chaiOwedBy: 'none', // 'didi' | 'bhai' | 'none'
  chaiCount: 0,
};

function updateChaiDebt() {
  const diff = scoreboardState.didiWins - scoreboardState.bhaiWins;
  if (diff > 0) {
    scoreboardState.chaiOwedBy = 'bhai';
    scoreboardState.chaiCount = diff;
  } else if (diff < 0) {
    scoreboardState.chaiOwedBy = 'didi';
    scoreboardState.chaiCount = Math.abs(diff);
  } else {
    scoreboardState.chaiOwedBy = 'none';
    scoreboardState.chaiCount = 0;
  }
}

const TTT_WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6]             // Diagonals
];

function checkTTTWinner(board) {
  for (let combo of TTT_WINNING_COMBINATIONS) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], winningCombo: combo };
    }
  }
  if (board.every((cell) => cell !== null)) {
    return { winner: 'draw', winningCombo: null };
  }
  return null;
}

module.exports = function setupGameSocket(io) {
  io.on('connection', (socket) => {
    socket.on('rps_join', () => {
      socket.join(ROOM_ID);
      // Emit current game state upon joining
      socket.emit('rps_state_update', {
        choices: Object.keys(rpsState.choices),
        scores: rpsState.scores,
        roundHistory: rpsState.roundHistory,
        matchWinner: rpsState.matchWinner,
        targetScore: TARGET_SCORE,
      });
    });

    socket.on('rps_submit_choice', ({ user, choice }) => {
      const normalizedUser = (user || '').toLowerCase(); // 'didi' or 'bhai'
      if (!['didi', 'bhai'].includes(normalizedUser)) return;
      if (rpsState.matchWinner) return;

      rpsState.choices[normalizedUser] = choice;

      // Broadcast move status (without revealing choices)
      io.to(ROOM_ID).emit('rps_player_locked', {
        user: normalizedUser,
        choicesLocked: Object.keys(rpsState.choices),
      });

      // If both players have picked, calculate round result
      if (rpsState.choices.didi && rpsState.choices.bhai) {
        processRoundResult(io);
      }
    });

    socket.on('rps_time_up', ({ user }) => {
      const normalizedUser = (user || '').toLowerCase();
      if (!['didi', 'bhai'].includes(normalizedUser)) return;
      if (rpsState.matchWinner) return;

      // If choice not made, set choice to null (forfeited round move)
      if (!rpsState.choices[normalizedUser]) {
        rpsState.choices[normalizedUser] = null;
      }

      // Check if both sides resolved (either picked or timed out)
      if (
        rpsState.choices.hasOwnProperty('didi') &&
        rpsState.choices.hasOwnProperty('bhai')
      ) {
        processRoundResult(io);
      }
    });

    socket.on('rps_reset_match', () => {
      rpsState = {
        choices: {},
        scores: { didi: 0, bhai: 0 },
        roundHistory: [],
        matchWinner: null,
      };
      io.to(ROOM_ID).emit('rps_match_reset', {
        scores: rpsState.scores,
        targetScore: TARGET_SCORE,
      });
    });

    // --- GUESS THE MOVIE EVENTS ---
    socket.on('movie_join', () => {
      socket.join(ROOM_ID);
      socket.emit('movie_state_update', {
        activeChallenge: movieState.activeChallenge,
      });
    });

    socket.on('movie_send_challenge', (challengeData) => {
      const { mode, creator, secretTitle, imageUri, clues } = challengeData;
      if (!secretTitle || !creator) return;

      movieState.activeChallenge = {
        id: Date.now().toString(),
        mode: mode || 'clues', // 'image' or 'clues'
        creator: creator.toLowerCase(),
        secretTitle: secretTitle.trim(),
        imageUri: imageUri || '',
        clues: Array.isArray(clues) ? clues : ['', '', ''],
        createdAt: new Date(),
        isResolved: false,
        winner: null,
        guesses: [],
        timeLimit: mode === 'image' ? 45 : 60,
      };

      io.to(ROOM_ID).emit('movie_new_challenge', movieState.activeChallenge);
    });

    socket.on('movie_submit_guess', ({ user, guess }) => {
      const challenge = movieState.activeChallenge;
      if (!challenge || challenge.isResolved) return;

      const normalizedGuess = (guess || '').trim().toLowerCase();
      const normalizedSecret = challenge.secretTitle.trim().toLowerCase();
      const isCorrect = normalizedGuess === normalizedSecret;

      const guessEntry = {
        user: (user || '').toLowerCase(),
        guess: guess.trim(),
        isCorrect,
        timestamp: new Date(),
      };

      challenge.guesses.push(guessEntry);

      if (isCorrect) {
        challenge.isResolved = true;
        challenge.winner = (user || '').toLowerCase();
      }

      io.to(ROOM_ID).emit('movie_guess_result', {
        challengeId: challenge.id,
        guessEntry,
        isResolved: challenge.isResolved,
        winner: challenge.winner,
        secretTitle: challenge.isResolved ? challenge.secretTitle : null,
      });
    });

    socket.on('movie_time_up', () => {
      const challenge = movieState.activeChallenge;
      if (!challenge || challenge.isResolved) return;

      challenge.isResolved = true;
      challenge.winner = 'nobody'; // Timeout

      io.to(ROOM_ID).emit('movie_round_timeout', {
        challengeId: challenge.id,
        secretTitle: challenge.secretTitle,
      });
    });

    socket.on('movie_reset_challenge', () => {
      movieState.activeChallenge = null;
      io.to(ROOM_ID).emit('movie_challenge_cleared');
    });

    // --- GUESS THE RELATIVE EVENTS ---
    socket.on('relative_game_join', () => {
      socket.join(ROOM_ID);
      socket.emit('relative_state_update', getSanitizedRelativeState());
    });

    socket.on('relative_submit_setup', ({ role, personName, imageUri, hints }) => {
      const normRole = (role || '').toLowerCase();
      if (!['didi', 'bhai'].includes(normRole)) return;

      relativeGameState.setups[normRole] = {
        personName: (personName || '').trim(),
        imageUri: imageUri || '',
        hints: Array.isArray(hints) ? hints.filter(h => h.trim()) : [],
      };

      const hasDidi = !!relativeGameState.setups.didi;
      const hasBhai = !!relativeGameState.setups.bhai;

      if (hasDidi && hasBhai) {
        relativeGameState.gamePhase = 'guessing';
        io.to(ROOM_ID).emit('relative_start_guessing', {
          phase: 'guessing',
          challenges: {
            didi: {
              imageUri: relativeGameState.setups.bhai.imageUri,
              hints: relativeGameState.setups.bhai.hints,
            },
            bhai: {
              imageUri: relativeGameState.setups.didi.imageUri,
              hints: relativeGameState.setups.didi.hints,
            },
          },
        });
      } else {
        relativeGameState.gamePhase = 'waiting';
        io.to(ROOM_ID).emit('relative_player_submitted', {
          submittedUser: normRole,
          phase: 'waiting',
        });
      }
    });

    socket.on('relative_submit_guess', ({ user, guess }) => {
      const normUser = (user || '').toLowerCase(); // 'didi' or 'bhai'
      if (!['didi', 'bhai'].includes(normUser)) return;
      if (relativeGameState.gamePhase !== 'guessing') return;

      const targetRole = normUser === 'didi' ? 'bhai' : 'didi';
      const targetSetup = relativeGameState.setups[targetRole];
      if (!targetSetup) return;

      const normGuess = (guess || '').trim().toLowerCase();
      const normAnswer = targetSetup.personName.toLowerCase();
      const isCorrect = normGuess.length > 1 && (normAnswer.includes(normGuess) || normGuess.includes(normAnswer));

      const guessEntry = {
        user: normUser,
        guess: (guess || '').trim(),
        isCorrect,
        timestamp: new Date(),
      };

      relativeGameState.guessesHistory.push(guessEntry);

      if (isCorrect) {
        relativeGameState.gamePhase = 'ended';
        relativeGameState.winner = normUser;
        relativeGameState.winningRelative = targetSetup.personName;

        io.to(ROOM_ID).emit('relative_game_won', {
          winner: normUser,
          winningRelative: targetSetup.personName,
          guessEntry,
          setups: relativeGameState.setups,
        });
      } else {
        io.to(ROOM_ID).emit('relative_guess_wrong', {
          guessEntry,
        });
      }
    });

    socket.on('relative_reset', () => {
      relativeGameState = {
        setups: {},
        gamePhase: 'setup',
        winner: null,
        winningRelative: null,
        guessesHistory: [],
      };
      io.to(ROOM_ID).emit('relative_reset_done');
    });

    // --- TIC TAC TOE EVENTS ---
    socket.on('ttt_join', () => {
      socket.join(ROOM_ID);
      socket.emit('ttt_state_update', tttState);
    });

    socket.on('ttt_make_move', ({ user, index }) => {
      const normUser = (user || '').toLowerCase();
      if (!['didi', 'bhai'].includes(normUser)) return;

      // Validate turn and empty cell
      if (tttState.isGameOver) return;
      if (tttState.currentTurn !== normUser) return;
      if (index < 0 || index > 8 || tttState.board[index] !== null) return;

      // Apply move
      tttState.board[index] = normUser;

      // Check win or draw
      const outcome = checkTTTWinner(tttState.board);
      if (outcome) {
        tttState.isGameOver = true;
        tttState.winner = outcome.winner;
        tttState.winningCombo = outcome.winningCombo;

        if (outcome.winner === 'didi') {
          tttState.scores.didi += 1;
          scoreboardState.didiWins += 1;
        } else if (outcome.winner === 'bhai') {
          tttState.scores.bhai += 1;
          scoreboardState.bhaiWins += 1;
        } else if (outcome.winner === 'draw') {
          scoreboardState.ties += 1;
        }
        updateChaiDebt();

        io.to(ROOM_ID).emit('ttt_game_over', tttState);
        io.to(ROOM_ID).emit('stats_update', scoreboardState);
      } else {
        // Toggle turn
        tttState.currentTurn = normUser === 'didi' ? 'bhai' : 'didi';
        io.to(ROOM_ID).emit('ttt_move_made', tttState);
      }
    });

    socket.on('ttt_reset_game', () => {
      tttState.board = Array(9).fill(null);
      tttState.currentTurn = 'didi'; // Alternate or reset to Didi
      tttState.winner = null;
      tttState.winningCombo = null;
      tttState.isGameOver = false;

      io.to(ROOM_ID).emit('ttt_state_update', tttState);
    });

    // --- MEMORY MATCH EVENTS ---
    socket.on('memory_join', () => {
      socket.join(ROOM_ID);
      socket.emit('memory_state_update', getSanitizedMemoryState());
    });

    socket.on('memory_flip_card', ({ user, index }) => {
      const normUser = (user || '').toLowerCase();
      if (!['didi', 'bhai'].includes(normUser)) return;
      if (memoryState.isEvaluating || memoryState.isGameOver) return;
      if (memoryState.currentTurn !== normUser) return;
      if (index < 0 || index >= memoryState.deck.length) return;
      if (memoryState.flippedIndices.includes(index) || memoryState.matchedPairs.hasOwnProperty(index)) return;

      memoryState.flippedIndices.push(index);

      // Broadcast single card flip to room
      io.to(ROOM_ID).emit('memory_card_flipped', getSanitizedMemoryState());

      // Evaluate pair on second card flip
      if (memoryState.flippedIndices.length === 2) {
        memoryState.isEvaluating = true;
        const [idx1, idx2] = memoryState.flippedIndices;
        const card1 = memoryState.deck[idx1];
        const card2 = memoryState.deck[idx2];

        if (card1.emoji === card2.emoji) {
          // MATCH FOUND!
          memoryState.matchedPairs[idx1] = normUser;
          memoryState.matchedPairs[idx2] = normUser;
          memoryState.scores[normUser] += 1;
          memoryState.flippedIndices = [];
          memoryState.isEvaluating = false;

          // Check for game completion (6 pairs = 12 cards)
          if (Object.keys(memoryState.matchedPairs).length === 12) {
            memoryState.isGameOver = true;
            if (memoryState.scores.didi > memoryState.scores.bhai) {
              memoryState.winner = 'didi';
            } else if (memoryState.scores.bhai > memoryState.scores.didi) {
              memoryState.winner = 'bhai';
            } else {
              memoryState.winner = 'draw';
            }
          }

          // Matched player receives bonus turn!
          io.to(ROOM_ID).emit('memory_match_result', {
            ...getSanitizedMemoryState(),
            isMatch: true,
            matchedEmoji: card1.emoji,
          });
        } else {
          // MISMATCH: Show for 1.2s then flip back and switch turn
          setTimeout(() => {
            memoryState.flippedIndices = [];
            memoryState.currentTurn = normUser === 'didi' ? 'bhai' : 'didi';
            memoryState.isEvaluating = false;

            io.to(ROOM_ID).emit('memory_match_result', {
              ...getSanitizedMemoryState(),
              isMatch: false,
            });
          }, 1200);
        }
      }
    });

    socket.on('memory_reset_game', () => {
      memoryState = initMemoryState();
      io.to(ROOM_ID).emit('memory_state_update', getSanitizedMemoryState());
    });

    // --- TRUTH OR DARE EVENTS ---
    socket.on('tod_join', () => {
      socket.join(ROOM_ID);
      socket.emit('tod_state_update', todState);
    });

    socket.on('tod_send_challenge', ({ creator, mode, text }) => {
      const normCreator = (creator || '').toLowerCase();
      if (!['didi', 'bhai'].includes(normCreator)) return;
      if (!text || !text.trim()) return;

      const receiver = normCreator === 'didi' ? 'bhai' : 'didi';

      todState.activeChallenge = {
        id: Date.now().toString(),
        creator: normCreator,
        receiver,
        mode: mode || 'truth', // 'truth' or 'dare'
        text: text.trim(),
        proofText: '',
        proofImageUri: '',
        status: 'pending', // 'pending' | 'submitted' | 'accepted' | 'rejected'
        createdAt: new Date(),
      };

      io.to(ROOM_ID).emit('tod_new_challenge', todState);
    });

    socket.on('tod_submit_proof', ({ user, proofText, proofImageUri }) => {
      const normUser = (user || '').toLowerCase();
      const challenge = todState.activeChallenge;
      if (!challenge || challenge.receiver !== normUser) return;

      challenge.proofText = (proofText || '').trim();
      challenge.proofImageUri = proofImageUri || '';
      challenge.status = 'submitted';

      io.to(ROOM_ID).emit('tod_proof_submitted', todState);
    });

    socket.on('tod_judge_verdict', ({ user, accepted }) => {
      const normUser = (user || '').toLowerCase();
      const challenge = todState.activeChallenge;
      if (!challenge || challenge.creator !== normUser) return;

      if (accepted) {
        challenge.status = 'accepted';
        todState.scores[challenge.receiver] += 10;
      } else {
        challenge.status = 'rejected';
      }

      // Alternate next turn challenger
      todState.currentChallenger = todState.currentChallenger === 'didi' ? 'bhai' : 'didi';

      io.to(ROOM_ID).emit('tod_verdict_announced', todState);
    });

    socket.on('tod_reset_match', () => {
      todState = {
        activeChallenge: null,
        currentChallenger: 'didi',
        scores: { didi: 0, bhai: 0 },
      };
      io.to(ROOM_ID).emit('tod_state_update', todState);
    });

    // --- SIBLING SCOREBOARD & CHAI DEBT EVENTS ---
    socket.on('stats_get', () => {
      socket.join(ROOM_ID);
      socket.emit('stats_update', scoreboardState);
    });

    socket.on('stats_record_win', ({ winner }) => {
      const normWinner = (winner || '').toLowerCase();
      if (normWinner === 'didi') {
        scoreboardState.didiWins += 1;
      } else if (normWinner === 'bhai') {
        scoreboardState.bhaiWins += 1;
      } else if (normWinner === 'draw' || normWinner === 'tie') {
        scoreboardState.ties += 1;
      }
      updateChaiDebt();
      io.to(ROOM_ID).emit('stats_update', scoreboardState);
    });

    socket.on('stats_settle_chai', () => {
      scoreboardState.chaiOwedBy = 'none';
      scoreboardState.chaiCount = 0;
      // Also balance wins on settling debt
      const minWins = Math.min(scoreboardState.didiWins, scoreboardState.bhaiWins);
      scoreboardState.didiWins = minWins;
      scoreboardState.bhaiWins = minWins;
      io.to(ROOM_ID).emit('stats_update', scoreboardState);
    });
  });
};

// In-memory state for Truth or Dare game
let todState = {
  activeChallenge: null, // { id, creator, receiver, mode, text, proofText, proofImageUri, status }
  currentChallenger: 'didi',
  scores: { didi: 0, bhai: 0 },
};

const MEMORY_EMOJIS = ['☕', '📺', '🍜', '🛍️', '🥊', '🍫'];

function initMemoryState() {
  const pairedDeck = [...MEMORY_EMOJIS, ...MEMORY_EMOJIS].map((emoji, id) => ({ id, emoji }));
  // Fisher-Yates Shuffle
  for (let i = pairedDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pairedDeck[i], pairedDeck[j]] = [pairedDeck[j], pairedDeck[i]];
  }
  return {
    deck: pairedDeck,
    flippedIndices: [],
    matchedPairs: {}, // { index: 'didi'|'bhai' }
    currentTurn: 'didi',
    scores: { didi: 0, bhai: 0 },
    winner: null,
    isEvaluating: false,
    isGameOver: false,
  };
}

let memoryState = initMemoryState();

function getSanitizedMemoryState() {
  return {
    // Hide emojis for face-down cards
    cards: memoryState.deck.map((card, idx) => {
      const isFlipped = memoryState.flippedIndices.includes(idx);
      const isMatched = memoryState.matchedPairs.hasOwnProperty(idx);
      return {
        id: idx,
        emoji: isFlipped || isMatched ? card.emoji : null,
        isFlipped,
        isMatched,
        matchedBy: memoryState.matchedPairs[idx] || null,
      };
    }),
    flippedIndices: memoryState.flippedIndices,
    currentTurn: memoryState.currentTurn,
    scores: memoryState.scores,
    winner: memoryState.winner,
    isEvaluating: memoryState.isEvaluating,
    isGameOver: memoryState.isGameOver,
  };
}

function getSanitizedRelativeState() {
  return {
    phase: relativeGameState.gamePhase,
    submittedRoles: Object.keys(relativeGameState.setups),
    winner: relativeGameState.winner,
    winningRelative: relativeGameState.winningRelative,
    challenges: relativeGameState.gamePhase === 'guessing' ? {
      didi: {
        imageUri: relativeGameState.setups.bhai?.imageUri || '',
        hints: relativeGameState.setups.bhai?.hints || [],
      },
      bhai: {
        imageUri: relativeGameState.setups.didi?.imageUri || '',
        hints: relativeGameState.setups.didi?.hints || [],
      },
    } : null,
  };
}

function processRoundResult(io) {
  const didiChoice = rpsState.choices.didi;
  const bhaiChoice = rpsState.choices.bhai;
  const winner = calculateWinner(didiChoice, bhaiChoice, 'didi', 'bhai');

  if (winner === 'didi') {
    rpsState.scores.didi += 1;
  } else if (winner === 'bhai') {
    rpsState.scores.bhai += 1;
  }

  let matchWinner = null;
  if (rpsState.scores.didi >= TARGET_SCORE) {
    matchWinner = 'didi';
  } else if (rpsState.scores.bhai >= TARGET_SCORE) {
    matchWinner = 'bhai';
  }

  rpsState.matchWinner = matchWinner;

  const resultData = {
    didiChoice,
    bhaiChoice,
    winner,
    scores: { ...rpsState.scores },
    matchWinner,
    targetScore: TARGET_SCORE,
    timestamp: new Date(),
  };

  rpsState.roundHistory.unshift(resultData);

  if (matchWinner) {
    if (matchWinner === 'didi') {
      scoreboardState.didiWins += 1;
    } else if (matchWinner === 'bhai') {
      scoreboardState.bhaiWins += 1;
    }
    updateChaiDebt();
    io.to(ROOM_ID).emit('stats_update', scoreboardState);
  }

  // Emit round result to room
  io.to(ROOM_ID).emit('rps_round_result', resultData);

  // Reset choices for next round
  rpsState.choices = {};
}

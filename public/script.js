// Game State Management
const GameState = {
    score: 0,
    level: 1,
    totalQuestions: 10,
    currentQuestionIndex: 0,
    isHardcore: false,
    questions: [], // Current game questions
    wrongAnswers: [], // List of failed questions to retry
    timer: null,
    timeLeft: 0,
    maxTime: 0,
    startTime: 0,
    isPlaying: false,

    // Persistent Session Data (Loaded from LocalStorage)
    sessionHistory: JSON.parse(localStorage.getItem('wv_sessionHistory')) || [],
    cumulativeScore: parseInt(localStorage.getItem('wv_cumulativeScore')) || 0
};

// DOM Elements
const screens = {
    setup: document.getElementById('setup-screen'),
    game: document.getElementById('game-screen'),
    result: document.getElementById('result-screen')
};

const audio = {
    bg: document.getElementById('bg_music'),
    correct: document.getElementById('sfx_correct'),
    wrong: document.getElementById('sfx_wrong')
};

// Setup Controls
const levelInput = document.getElementById('level-select');
const levelDisplay = document.getElementById('level-display');
const qCountInputs = document.getElementsByName('q-count');
const customCountInput = document.getElementById('custom-count-input');
const hardcoreInput = document.getElementById('hardcore-mode');

// Game Elements
const scoreDisplay = document.getElementById('score-display');
const progressDisplay = document.getElementById('progress-display');
const timerBar = document.getElementById('timer-bar');
const timerText = document.getElementById('timer-text');
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const feedbackArea = document.getElementById('feedback-area');
const feedbackMessage = document.getElementById('feedback-message');
const nextBtn = document.getElementById('next-btn');

// Chart
let progressChart = null;

// --- Initialization ---
function init() {
    // Setup Screen Event Listeners
    levelInput.addEventListener('input', (e) => {
        levelDisplay.textContent = `Level ${e.target.value}`;
    });

    Array.from(qCountInputs).forEach(radio => {
        radio.addEventListener('change', (e) => {
            customCountInput.disabled = e.target.value !== 'custom';
        });
    });

    document.getElementById('start-btn').addEventListener('click', startGame);
    document.getElementById('about-btn').addEventListener('click', () => document.getElementById('about-modal').showModal());
    document.getElementById('close-about').addEventListener('click', () => document.getElementById('about-modal').close());

    nextBtn.addEventListener('click', nextQuestion);

    // Soft Reset: Keep history, go back to setup
    document.getElementById('restart-btn').addEventListener('click', () => {
        switchScreen('setup');
    });

    // Hard Reset: Reload page
    document.getElementById('home-btn').addEventListener('click', () => location.reload());
}

// --- Game Logic ---

function startGame() {
    // 1. Get Settings
    GameState.level = parseInt(levelInput.value);

    let selectedCount = Array.from(qCountInputs).find(r => r.checked).value;
    GameState.totalQuestions = selectedCount === 'custom' ? parseInt(customCountInput.value) : parseInt(selectedCount);

    GameState.isHardcore = hardcoreInput.checked;

    // 2. Reset Round State (But keep session history)
    GameState.score = 0;
    GameState.currentQuestionIndex = 0;
    GameState.questions = []; // Clear current round questions
    GameState.wrongAnswers = [];
    GameState.isPlaying = true;

    // 3. UI Transition
    switchScreen('game');
    audio.bg.volume = 0.3;
    audio.bg.play().catch(e => console.log("Audio play failed:", e));

    // 4. Load First Question
    loadQuestion();
}

function switchScreen(screenName) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[screenName].classList.add('active');
}

async function loadQuestion() {
    // Reset UI
    optionsContainer.innerHTML = '';
    feedbackArea.classList.add('feedback-hidden');
    questionText.textContent = "Loading...";

    // Update Stats
    scoreDisplay.textContent = GameState.score;
    progressDisplay.textContent = `${GameState.currentQuestionIndex + 1}/${GameState.totalQuestions}`;

    // Determine Level based on Score (Adaptive)
    let currentLevel = Math.min(10, Math.max(1, GameState.level + Math.floor(GameState.score / 100)));

    // Binary Choice: New Question (1) or Retry Wrong (0)
    let useNewQuestion = 1;
    if (GameState.wrongAnswers.length > 0) {
        useNewQuestion = Math.random() < 0.5 ? 0 : 1;
    }

    let questionData;

    if (useNewQuestion === 1 || GameState.wrongAnswers.length === 0) {
        try {
            const response = await fetch(`data/level_${currentLevel}.json`);
            const data = await response.json();
            questionData = generateQuestionFromData(data);
        } catch (error) {
            console.error("Failed to load level data:", error);
            questionText.textContent = "Error loading data. Please restart.";
            return;
        }
    } else {
        const index = Math.floor(Math.random() * GameState.wrongAnswers.length);
        questionData = GameState.wrongAnswers.splice(index, 1)[0];
    }

    renderQuestion(questionData);
}

function generateQuestionFromData(data) {
    const keys = Object.keys(data);
    const correctKey = keys[Math.floor(Math.random() * keys.length)];
    const question = data[correctKey];

    const distractors = [];
    while (distractors.length < 3) {
        const randKey = keys[Math.floor(Math.random() * keys.length)];
        if (randKey !== correctKey && !distractors.includes(randKey)) {
            distractors.push(randKey);
        }
    }

    return {
        question: question,
        correctAnswer: correctKey,
        options: shuffleArray([correctKey, ...distractors])
    };
}

function renderQuestion(qData) {
    GameState.currentQuestion = qData;
    questionText.textContent = qData.question;

    qData.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = opt;
        btn.onclick = () => handleAnswer(opt, btn);
        optionsContainer.appendChild(btn);
    });

    startTimer();
}

function startTimer() {
    if (GameState.timer) clearInterval(GameState.timer);

    GameState.maxTime = GameState.isHardcore ? 5 : 30;
    GameState.timeLeft = GameState.maxTime;
    GameState.startTime = Date.now();

    updateTimerUI();

    GameState.timer = setInterval(() => {
        GameState.timeLeft -= 0.1;
        updateTimerUI();

        if (GameState.timeLeft <= 0) {
            clearInterval(GameState.timer);
            handleTimeout();
        }
    }, 100);
}

function updateTimerUI() {
    const pct = (GameState.timeLeft / GameState.maxTime) * 100;
    timerBar.style.width = `${pct}%`;
    timerBar.style.backgroundColor = pct < 30 ? 'var(--accent-danger)' : 'var(--accent-primary)';
    timerText.textContent = Math.ceil(GameState.timeLeft) + 's';
}

function saveData() {
    localStorage.setItem('wv_sessionHistory', JSON.stringify(GameState.sessionHistory));
    localStorage.setItem('wv_cumulativeScore', GameState.cumulativeScore);
}

function handleAnswer(selectedOption, btnElement) {
    clearInterval(GameState.timer);
    const timeTaken = (Date.now() - GameState.startTime) / 1000;
    const isCorrect = selectedOption === GameState.currentQuestion.correctAnswer;

    Array.from(optionsContainer.children).forEach(b => b.disabled = true);

    if (isCorrect) {
        btnElement.classList.add('correct');
        audio.correct.play();
        GameState.score += 10;
        GameState.cumulativeScore += 10;
        feedbackMessage.textContent = "Correct! Well done.";
        feedbackMessage.style.color = "var(--accent-success)";
    } else {
        btnElement.classList.add('wrong');
        Array.from(optionsContainer.children).forEach(b => {
            if (b.textContent === GameState.currentQuestion.correctAnswer) {
                b.classList.add('correct');
            }
        });
        audio.wrong.play();
        GameState.score -= 5;
        GameState.cumulativeScore -= 5;
        feedbackMessage.innerHTML = `Wrong! The correct answer is <strong>${GameState.currentQuestion.correctAnswer}</strong>`;
        feedbackMessage.style.color = "var(--accent-danger)";

        GameState.wrongAnswers.push(GameState.currentQuestion);
    }

    const growth = isCorrect ? Math.max(0, GameState.maxTime - timeTaken) : 0;

    const questionRecord = {
        index: GameState.sessionHistory.length + 1,
        isCorrect: isCorrect,
        timeTaken: timeTaken,
        growth: growth,
        score: GameState.score,
        cumulativeScore: GameState.cumulativeScore
    };

    GameState.questions.push(questionRecord);
    GameState.sessionHistory.push(questionRecord);
    saveData(); // Save to LocalStorage

    scoreDisplay.textContent = GameState.score;
    feedbackArea.classList.remove('feedback-hidden');
}

function handleTimeout() {
    Array.from(optionsContainer.children).forEach(b => b.disabled = true);

    Array.from(optionsContainer.children).forEach(b => {
        if (b.textContent === GameState.currentQuestion.correctAnswer) {
            b.classList.add('correct');
        }
    });

    audio.wrong.play();
    GameState.score -= 5;
    GameState.cumulativeScore -= 5;
    feedbackMessage.innerHTML = `Time's Up! The answer was <strong>${GameState.currentQuestion.correctAnswer}</strong>`;
    feedbackMessage.style.color = "var(--accent-danger)";

    GameState.wrongAnswers.push(GameState.currentQuestion);

    const questionRecord = {
        index: GameState.sessionHistory.length + 1,
        isCorrect: false,
        timeTaken: GameState.maxTime,
        growth: 0,
        score: GameState.score,
        cumulativeScore: GameState.cumulativeScore
    };

    GameState.questions.push(questionRecord);
    GameState.sessionHistory.push(questionRecord);
    saveData(); // Save to LocalStorage

    scoreDisplay.textContent = GameState.score;
    feedbackArea.classList.remove('feedback-hidden');
}

function nextQuestion() {
    GameState.currentQuestionIndex++;

    if (GameState.currentQuestionIndex >= GameState.totalQuestions) {
        endGame();
    } else {
        loadQuestion();
    }
}

function endGame() {
    switchScreen('result');
    audio.bg.pause();

    document.getElementById('final-score').textContent = GameState.score;

    const correctCount = GameState.questions.filter(q => q.isCorrect).length;
    const accuracy = Math.round((correctCount / GameState.totalQuestions) * 100);
    document.getElementById('final-accuracy').textContent = `${accuracy}%`;

    renderChart();
}

function renderChart() {
    const ctx = document.getElementById('progress-chart').getContext('2d');

    // Use sessionHistory for the chart to show cumulative progress
    const labels = GameState.sessionHistory.map(q => `Q${q.index}`);
    const growthData = GameState.sessionHistory.map(q => q.growth);
    const scoreData = GameState.sessionHistory.map(q => q.cumulativeScore);

    if (progressChart) progressChart.destroy();

    progressChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Growth (Speed)',
                    data: growthData,
                    borderColor: '#38bdf8',
                    backgroundColor: 'rgba(56, 189, 248, 0.2)',
                    yAxisID: 'y',
                    tension: 0.4
                },
                {
                    label: 'Cumulative Score',
                    data: scoreData,
                    borderColor: '#34d399',
                    backgroundColor: 'rgba(52, 211, 153, 0.2)',
                    yAxisID: 'y1',
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: { display: true, text: 'Growth Factor' }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: { drawOnChartArea: false },
                    title: { display: true, text: 'Total Score' }
                }
            },
            plugins: {
                legend: {
                    labels: { color: '#f1f5f9' }
                },
                title: {
                    display: true,
                    text: 'Lifetime Progress (Cumulative)',
                    color: '#f1f5f9'
                }
            }
        }
    });
}

// Utils
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Start
init();

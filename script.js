const STORAGE_KEYS = {
    sessionHistory: 'wv_sessionHistory',
    cumulativeScore: 'wv_cumulativeScore'
};

function loadStoredHistory() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.sessionHistory)) || [];
    } catch {
        return [];
    }
}

function loadStoredScore() {
    const score = Number(localStorage.getItem(STORAGE_KEYS.cumulativeScore));
    return Number.isFinite(score) ? score : 0;
}

export const gameState = {
    score: 0,
    level: 1,
    totalQuestions: 10,
    currentQuestionIndex: 0,
    isHardcore: false,
    isPlaying: false,
    currentQuestion: null,
    roundQuestions: [],
    wrongAnswers: [],
    timer: null,
    maxTime: 0,
    timeLeft: 0,
    startTime: 0,
    sessionHistory: loadStoredHistory(),
    cumulativeScore: loadStoredScore()
};

const audio = {
    bg: document.getElementById('bg_music'),
    correct: document.getElementById('sfx_correct'),
    wrong: document.getElementById('sfx_wrong')
};

let progressChart = null;

export function persistSession() {
    localStorage.setItem(STORAGE_KEYS.sessionHistory, JSON.stringify(gameState.sessionHistory));
    localStorage.setItem(STORAGE_KEYS.cumulativeScore, String(gameState.cumulativeScore));
}

export function resetRound(config) {
    gameState.level = config.level;
    gameState.totalQuestions = config.totalQuestions;
    gameState.isHardcore = Boolean(config.isHardcore);
    gameState.score = 0;
    gameState.currentQuestionIndex = 0;
    gameState.currentQuestion = null;
    gameState.roundQuestions = [];
    gameState.wrongAnswers = [];
    gameState.isPlaying = true;
    clearRoundTimer();
}

export function clearRoundTimer() {
    if (gameState.timer) {
        clearInterval(gameState.timer);
        gameState.timer = null;
    }
}

export function startRoundTimer(onTick, onEnd) {
    clearRoundTimer();

    gameState.maxTime = gameState.isHardcore ? 5 : 30;
    gameState.timeLeft = gameState.maxTime;
    gameState.startTime = Date.now();

    onTick(getTimerSnapshot());

    gameState.timer = setInterval(() => {
        gameState.timeLeft -= 0.1;

        if (gameState.timeLeft <= 0) {
            gameState.timeLeft = 0;
            onTick(getTimerSnapshot());
            clearRoundTimer();
            onEnd();
            return;
        }

        onTick(getTimerSnapshot());
    }, 100);
}

export function getTimerSnapshot() {
    const pct = gameState.maxTime > 0 ? (gameState.timeLeft / gameState.maxTime) * 100 : 0;
    return {
        seconds: Math.ceil(gameState.timeLeft),
        percent: Math.max(0, pct)
    };
}

export function elapsedSeconds() {
    return (Date.now() - gameState.startTime) / 1000;
}

export function getEffectiveLevel() {
    return Math.min(10, Math.max(1, gameState.level + Math.floor(gameState.score / 100)));
}

export function shouldLoadNewQuestion() {
    if (gameState.wrongAnswers.length === 0) {
        return true;
    }
    return Math.random() >= 0.5;
}

export async function loadLevelData(level) {
    const response = await fetch(`data/level_${level}.json`);
    if (!response.ok) {
        throw new Error(`Failed to load level ${level}`);
    }
    return response.json();
}

export function generateQuestionFromData(data) {
    const keys = Object.keys(data);
    const correctKey = keys[Math.floor(Math.random() * keys.length)];
    const question = data[correctKey];

    const distractors = [];
    while (distractors.length < 3) {
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        if (randomKey !== correctKey && !distractors.includes(randomKey)) {
            distractors.push(randomKey);
        }
    }

    return {
        question,
        correctAnswer: correctKey,
        options: shuffleArray([correctKey, ...distractors])
    };
}

export function getRetryQuestion() {
    const index = Math.floor(Math.random() * gameState.wrongAnswers.length);
    return gameState.wrongAnswers.splice(index, 1)[0];
}

export function recordQuestion({ isCorrect, timeTaken }) {
    const growth = isCorrect ? Math.max(0, gameState.maxTime - timeTaken) : 0;

    if (isCorrect) {
        gameState.score += 10;
        gameState.cumulativeScore += 10;
    } else {
        gameState.score -= 5;
        gameState.cumulativeScore -= 5;
    }

    const record = {
        index: gameState.sessionHistory.length + 1,
        isCorrect,
        timeTaken,
        growth,
        score: gameState.score,
        cumulativeScore: gameState.cumulativeScore
    };

    gameState.roundQuestions.push(record);
    gameState.sessionHistory.push(record);
    persistSession();
    return record;
}

export function nextQuestionIndex() {
    gameState.currentQuestionIndex += 1;
    return gameState.currentQuestionIndex;
}

export function setCurrentQuestion(question) {
    gameState.currentQuestion = question;
}

export function addWrongQuestion(question) {
    gameState.wrongAnswers.push(question);
}

export function endRound() {
    gameState.isPlaying = false;
    clearRoundTimer();
}

export function getRoundSummary() {
    const answered = gameState.roundQuestions.length;
    const correct = gameState.roundQuestions.filter((q) => q.isCorrect).length;
    const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0;

    return {
        finalScore: gameState.score,
        accuracy,
        answered,
        total: gameState.totalQuestions,
        correct
    };
}

export function playBackgroundAudio() {
    if (!audio.bg) return;
    audio.bg.volume = 0.22;
    audio.bg.play().catch(() => {
        // Browser autoplay restrictions are expected on first interaction.
    });
}

export function stopBackgroundAudio() {
    if (!audio.bg) return;
    audio.bg.pause();
}

export function playCorrectSound() {
    if (!audio.correct) return;
    audio.correct.currentTime = 0;
    audio.correct.play().catch(() => {});
}

export function playWrongSound() {
    if (!audio.wrong) return;
    audio.wrong.currentTime = 0;
    audio.wrong.play().catch(() => {});
}

export function renderProgressChart(canvas) {
    if (!canvas || typeof Chart === 'undefined') return;
    const ctx = canvas.getContext('2d');

    const labels = gameState.sessionHistory.map((item) => `Q${item.index}`);
    const growthData = gameState.sessionHistory.map((item) => item.growth);
    const scoreData = gameState.sessionHistory.map((item) => item.cumulativeScore);

    if (progressChart) {
        progressChart.destroy();
    }

    progressChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Growth',
                    data: growthData,
                    borderColor: '#27a7ff',
                    backgroundColor: 'rgba(39, 167, 255, 0.16)',
                    yAxisID: 'y',
                    borderWidth: 2,
                    tension: 0.35,
                    pointRadius: 2
                },
                {
                    label: 'Cumulative Score',
                    data: scoreData,
                    borderColor: '#0ec98d',
                    backgroundColor: 'rgba(14, 201, 141, 0.16)',
                    yAxisID: 'y1',
                    borderWidth: 2,
                    tension: 0.35,
                    pointRadius: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#3f4652'
                    }
                },
                title: {
                    display: true,
                    text: 'Lifetime Performance',
                    color: '#1f2735',
                    font: {
                        family: 'Space Grotesk'
                    }
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Growth'
                    },
                    ticks: {
                        color: '#616a78'
                    },
                    grid: {
                        color: 'rgba(77, 105, 143, 0.18)'
                    }
                },
                y1: {
                    type: 'linear',
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Score'
                    },
                    grid: {
                        drawOnChartArea: false
                    },
                    ticks: {
                        color: '#616a78'
                    }
                },
                x: {
                    ticks: {
                        color: '#616a78'
                    },
                    grid: {
                        color: 'rgba(77, 105, 143, 0.12)'
                    }
                }
            }
        }
    });
}

export function clampQuestionCount(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        return 10;
    }
    return Math.min(100, Math.max(5, Math.round(parsed)));
}

export function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

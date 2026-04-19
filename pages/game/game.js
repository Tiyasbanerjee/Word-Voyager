function disableOptions(container) {
    Array.from(container.children).forEach((button) => {
        button.disabled = true;
    });
}

function revealCorrectOption(container, answer) {
    Array.from(container.children).forEach((button) => {
        if (button.textContent === answer) {
            button.classList.add('correct');
        } else if (!button.classList.contains('wrong')) {
            button.classList.add('disabled-gray');
        }
    });
}

function grayOutOthers(container, exceptButton) {
    Array.from(container.children).forEach((button) => {
        if (button !== exceptButton && !button.classList.contains('correct')) {
            button.classList.add('disabled-gray');
        }
    });
}

export function init({ navigate, core }) {
    const state = core.gameState;

    if (!state.isPlaying) {
        navigate('home');
        return;
    }

    const scoreDisplay = document.getElementById('score-display');
    const progressDisplay = document.getElementById('progress-display');
    const timerBar = document.getElementById('timer-bar');
    const timerText = document.getElementById('timer-text');
    const questionText = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');
    const feedbackArea = document.getElementById('feedback-area');
    const feedbackMessage = document.getElementById('feedback-message');
    const nextBtn = document.getElementById('next-btn');

    function updateStats() {
        scoreDisplay.textContent = String(state.score);
        progressDisplay.textContent = `${state.currentQuestionIndex + 1}/${state.totalQuestions}`;
    }

    function updateTimerUI(snapshot) {
        timerBar.style.width = `${snapshot.percent}%`;
        timerBar.classList.toggle('timer-danger', snapshot.percent < 30);
        timerText.textContent = `${snapshot.seconds}s`;
    }

    async function loadQuestion() {
        feedbackArea.classList.add('feedback-hidden');
        optionsContainer.innerHTML = '';
        questionText.textContent = 'Loading question...';
        updateStats();

        const effectiveLevel = core.getEffectiveLevel();
        let question;

        try {
            if (core.shouldLoadNewQuestion()) {
                const levelData = await core.loadLevelData(effectiveLevel);
                question = core.generateQuestionFromData(levelData);
            } else {
                question = core.getRetryQuestion();
            }

            core.setCurrentQuestion(question);
            questionText.textContent = question.question;
        } catch (error) {
            questionText.textContent = 'Could not load level data. Return to menu and retry.';
            return;
        }

        question.options.forEach((option) => {
            const button = document.createElement('button');
            button.className = 'option-btn card-3d';
            button.textContent = option;
            button.addEventListener('click', () => handleAnswer(option, button));
            optionsContainer.appendChild(button);
        });

        core.startRoundTimer(updateTimerUI, handleTimeout);
    }

    function handleAnswer(selectedOption, selectedButton) {
        core.clearRoundTimer();
        disableOptions(optionsContainer);

        const isCorrect = selectedOption === state.currentQuestion.correctAnswer;
        const timeTaken = core.elapsedSeconds();

        if (isCorrect) {
            selectedButton.classList.add('correct');
            grayOutOthers(optionsContainer, selectedButton);
            core.playCorrectSound();
            feedbackMessage.textContent = 'Correct. Nice speed and precision.';
            feedbackMessage.className = 'feedback-text feedback-good';
        } else {
            selectedButton.classList.add('wrong');
            revealCorrectOption(optionsContainer, state.currentQuestion.correctAnswer);
            core.addWrongQuestion(state.currentQuestion);
            core.playWrongSound();
            feedbackMessage.innerHTML = `Wrong. Correct answer: <strong>${state.currentQuestion.correctAnswer}</strong>`;
            feedbackMessage.className = 'feedback-text feedback-bad';
        }

        core.recordQuestion({ isCorrect, timeTaken });
        updateStats();
        feedbackArea.classList.remove('feedback-hidden');
    }

    function handleTimeout() {
        disableOptions(optionsContainer);
        revealCorrectOption(optionsContainer, state.currentQuestion.correctAnswer);
        core.addWrongQuestion(state.currentQuestion);
        core.playWrongSound();
        core.recordQuestion({
            isCorrect: false,
            timeTaken: state.maxTime
        });

        feedbackMessage.innerHTML = `Time up. Correct answer: <strong>${state.currentQuestion.correctAnswer}</strong>`;
        feedbackMessage.className = 'feedback-text feedback-bad';
        updateStats();
        feedbackArea.classList.remove('feedback-hidden');
    }

    nextBtn.addEventListener('click', () => {
        const newIndex = core.nextQuestionIndex();
        if (newIndex >= state.totalQuestions) {
            core.endRound();
            core.stopBackgroundAudio();
            navigate('result');
            return;
        }

        loadQuestion();
    });

    loadQuestion();
}

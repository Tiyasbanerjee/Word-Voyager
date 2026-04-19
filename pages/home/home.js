export function init({ navigate, core }) {
    const state = core.gameState;

    const levelInput = document.getElementById('level-select');
    const levelDisplay = document.getElementById('level-display');
    const qCountInputs = document.querySelectorAll('input[name="q-count"]');
    const customCountInput = document.getElementById('custom-count-input');
    const hardcoreInput = document.getElementById('hardcore-mode');
    const startBtn = document.getElementById('start-btn');
    const aboutBtn = document.getElementById('about-btn');
    const aboutModal = document.getElementById('about-modal');
    const closeAboutBtn = document.getElementById('close-about');
    const lifetimeScore = document.getElementById('lifetime-score');
    const historyCount = document.getElementById('history-count');

    lifetimeScore.textContent = String(state.cumulativeScore);
    historyCount.textContent = String(state.sessionHistory.length);

    levelInput.addEventListener('input', (event) => {
        levelDisplay.textContent = `Level ${event.target.value}`;
    });

    qCountInputs.forEach((radio) => {
        radio.addEventListener('change', (event) => {
            customCountInput.disabled = event.target.value !== 'custom';
        });
    });

    aboutBtn.addEventListener('click', () => {
        aboutModal.showModal();
    });

    closeAboutBtn.addEventListener('click', () => {
        aboutModal.close();
    });

    customCountInput.addEventListener('blur', () => {
        customCountInput.value = String(core.clampQuestionCount(customCountInput.value));
    });

    function launchGame() {
        const selectedInput = Array.from(qCountInputs).find((input) => input.checked);
        const selectedCount = selectedInput ? selectedInput.value : '10';
        const totalQuestions = selectedCount === 'custom'
            ? core.clampQuestionCount(customCountInput.value)
            : core.clampQuestionCount(selectedCount);

        core.resetRound({
            level: Number(levelInput.value),
            totalQuestions,
            isHardcore: hardcoreInput.checked
        });

        core.playBackgroundAudio();
        navigate('game');
    }

    startBtn.addEventListener('click', launchGame);

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && document.activeElement?.id !== 'custom-count-input') {
            launchGame();
        }
    });
}

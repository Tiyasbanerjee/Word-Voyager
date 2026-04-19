export function init({ navigate, core }) {
    const summary = core.getRoundSummary();

    const finalScore = document.getElementById('final-score');
    const finalAccuracy = document.getElementById('final-accuracy');
    const finalCorrect = document.getElementById('final-correct');
    const chartCanvas = document.getElementById('progress-chart');
    const restartBtn = document.getElementById('restart-btn');

    finalScore.textContent = String(summary.finalScore);
    finalAccuracy.textContent = `${summary.accuracy}%`;
    finalCorrect.textContent = `${summary.correct}/${summary.total}`;

    core.renderProgressChart(chartCanvas);

    restartBtn.addEventListener('click', () => {
        navigate('home');
    });
}

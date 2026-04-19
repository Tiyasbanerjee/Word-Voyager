# Word Voyager

Live demo: https://tiyasbanerjee.github.io/Word-Voyager/

> "Words are not for memorizing only, they are tools for building new worlds."

Word Voyager is a creative, adaptive English vocabulary game designed for Bengali learners.
It combines challenge, speed, and repetition so users improve recall under real decision pressure.

## Why This Project Exists

Most vocabulary tools focus on passive memorization. Word Voyager focuses on active retrieval.

Core learning goals:
- Build fast English word recall from Bengali meaning prompts
- Adapt difficulty in real time based on player performance
- Re-introduce mistakes until they are mastered
- Track long-term growth across multiple sessions

## Key Features

- Adaptive level progression using score-based scaling
- Smart retry system for previously wrong answers
- Standard and Hardcore (5-second) timing modes
- Audio feedback for correct and incorrect responses
- Persistent session history with cumulative score in localStorage
- Performance chart (Growth + Cumulative Score) powered by Chart.js
- Modern modular UI with responsive, mobile-first layout

## Game Mechanics

### Adaptive Level Formula

Current level increases with score:

`effectiveLevel = baseLevel + floor(score / 100)`

### New vs Retry Question Logic

- If there are no wrong answers saved, next question is always new.
- If wrong answers exist, the game uses a 50/50 decision:
  - Serve a new question
  - Serve a retry question from failed history

### Score Rules

- Correct answer: `+10`
- Wrong answer: `-5`
- Timeout: treated as wrong (`-5`)

### Growth Metric

Growth rewards quick correct answers:

`growth = max(0, maxTime - timeTaken)` if correct, otherwise `0`

## Tech Stack

- HTML5 (modular page fragments)
- CSS3 (global design system + page-specific styles)
- Vanilla JavaScript (ES modules)
- Chart.js (result visualization)
- JSON datasets (level-wise vocabulary)

## Project Structure

```text
Word-Voyager/
├── index.html
├── index.js                  # App entry point + hash-based routing
├── script.js                 # Shared core state, game logic, utilities
├── style.css                 # Global design system + responsiveness
├── pages/
│   ├── home/
│   │   ├── home.html
│   │   ├── home.css
│   │   └── home.js
│   ├── game/
│   │   ├── game.html
│   │   ├── game.css
│   │   └── game.js
│   └── result/
│       ├── result.html
│       ├── result.css
│       └── result.js
├── data/
│   ├── level_1.json
│   └── level_10.json
├── sound/
└── README.md
```

## Local Development

Because the app loads JSON and HTML fragments via `fetch`, run it using a local server.

Example with Python:

```bash
python -m http.server 8000
```

Then open:

`http://localhost:8000`

## Performance and UX Notes

- Mobile-first spacing, touch targets, and stacked controls
- Layered visual depth with soft gradients and subtle motion
- Clear interaction states for timer urgency and answer feedback
- Persistent user progress without backend dependency
- Reduced-motion support for accessibility-sensitive users

## Workflow and Update Points

Current gameplay workflow:
- Setup screen: choose level, question count, and mode
- Game screen: answer timed prompts with adaptive progression
- Result screen: review score, accuracy, and growth chart

Best places to extend the app:
- `script.js`: add streak bonuses, hints, or spaced-revision logic
- `pages/game/game.js`: add keyboard shortcuts and pause/resume UX
- `pages/result/result.js`: add per-level analytics and export options
- `pages/home/home.html`: add onboarding cards or goal presets

## Creator

Made by Tiyas Banerjee.

GitHub: https://github.com/Tiyasbanerjee

## License

This project is released under the terms of the LICENSE file in this repository.

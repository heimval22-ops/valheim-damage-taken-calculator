# ⚔ Valheim Hit Simulator and Analyzer

A tool for calculating physical damage taken in Valheim, accounting for difficulty scaling, star levels, blocking, parrying, and body armor — across three scenarios simultaneously.

Runs entirely in the browser as a static site — no backend required.

---

## Features

- **Three scenarios in one calculation** — No Shield, Block, and Parry results side by side
- **Damage pipeline** — Step-by-step breakdown: Effective Damage → Effective Block Armor → Block-Reduced → Resistance-Multiplied → Armor Reduced → Adjusted Total → Remaining Health
- **Multi-type damage** — Per-type breakdown (Blunt, Slash, Pierce, Fire, Frost, Lightning, Poison, Spirit) with color-coded badges
- **Resistance modifiers** — Configurable per damage type with presets (Immune → Very Weak)
- **Stagger detection** — Shows whether the player is staggered on block or on armor
- **Combat Difficulty & star scaling** — Very Easy / Easy / Normal / Hard / Very Hard (50%–200% enemy damage) and 0–2 star mob bonuses
- **Hit Simulator** — Animated combat arena with DoT drain, adjustable speed, and hit logging
- **Armor Builder** — Compose armor sets from game pieces and meads to calculate total armor
- **Mob & shield presets** — Biome-grouped mob attacks and shield presets with quality levels
- **Calculation history** — Last 10 results saved in localStorage, with optional custom labels and per-entry delete

---

## Damage Pipeline

| Step | What happens |
|------|-------------|
| **1** | Base damage is scaled by difficulty, star & extra damage bonuses → **Effective Damage** |
| **2** | Block armor is scaled by blocking skill & parry multiplier → **Effective Block Armor** |
| **3** | Effective damage is reduced by effective block armor → **Block-Reduced Damage** |
| **4** | Resistance modifiers scale damage up or down → **Resistance-Multiplied Damage** |
| **5** | Resistance-multiplied damage is reduced by body armor → **Armor Reduced Damage** |
| **6** | DoT types with per-tick damage below threshold are disregarded → **Adjusted Total Damage** |
| **7** | Adjusted damage is subtracted from Max Health → **Remaining Health** |

Stagger threshold = **40% of Max Health**. A block-stagger prevents a second armor-stagger on the same hit.

---

## Tech Stack

- **Frontend** — Angular single-page application (TypeScript, SCSS)
- **Calculation engine** — Pure-function module (`damage-calculator.ts`) — no DOM dependency
- **Tests** — Zero-dependency Node.js test runner, data-driven from `test-cases.json`

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Install dependencies

```bash
npm install
```

### Serve locally

```bash
npm start
```

### Run tests

```bash
# Angular unit tests
npm test

# Damage calculator unit tests (Node.js)
npm run test:calc
```

Test cases live in `tests/test-cases.json`. To add a scenario, append a JSON object — no code changes needed.

---

## Project Structure

```
├── angular.json                    # Angular CLI configuration
├── package.json                    # npm scripts: start, build, test, test:calc
├── tsconfig.json                   # TypeScript configuration
├── src/
│   ├── index.html                  # Single-page entry point
│   ├── main.ts                     # Angular bootstrap
│   ├── styles.scss                 # Global styles
│   ├── app/
│   │   ├── app.ts                  # Root component — tabs, calculation orchestration
│   │   ├── core/
│   │   │   ├── damage-calculator.ts        # All game math — single source of truth
│   │   │   ├── damage-calculator.service.ts
│   │   │   ├── form-state.service.ts       # Centralized form state with localStorage
│   │   │   ├── hit-simulator.service.ts    # Hit simulator state & DoT animation
│   │   │   ├── constants/                  # Damage types, difficulty, scenarios, etc.
│   │   │   └── models/                     # TypeScript interfaces & types
│   │   ├── features/
│   │   │   ├── hit-analyzer/               # Hit Analyzer tab (results table, steps)
│   │   │   ├── hit-simulator/              # Hit Simulator tab (combat arena)
│   │   │   ├── armor-builder/              # Armor Builder page
│   │   │   ├── mob-attack-form/            # Mob attack stats form
│   │   │   └── player-defense-form/        # Player defense stats form
│   │   └── shared/                         # Shared components, directives, pipes
│   └── assets/
│       ├── data/                           # JSON data (mob attacks, shields, armor)
│       └── images/                         # UI images (animations, preset icons)
├── tests/
│   ├── damage-calculator.test.js           # Node.js test runner
│   └── test-cases.json                     # Data-driven test fixtures
```

---

## Hosting

Build the production bundle and deploy the `dist/` output to any static host:

```bash
npm run build
```

- **GitHub Pages** — use `npm run build:pages` (sets `--base-href=./`)
- **Netlify / Vercel** — set publish directory to `dist/hit-analyzer/browser`

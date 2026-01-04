# NBA Stats Rewind Specification

## Goal
A web application that allows users to "rewind" and "replay" NBA game statistics as if they were happening in real-time or at a specific point in time.

## Use Cases

### 1. Spoiler-Free "Delayed" Viewing
- **Scenario:** A fan who missed the start of a game (due to work or other commitments) wants to catch up without knowing the final score.
- **Experience:**
    - The user can start replaying the game from the beginning or a specific timestamp.
    - Statistics (score, box score, play-by-play) update progressively at real-time speed or a customized playback speed (e.g., 2x).
    - Future data remains hidden to prevent spoilers.

### 2. Analysis of "Clutch" Moments
- **Scenario:** A user wants to analyze player performance during critical moments, such as the last 5 minutes of the 4th quarter.
- **Experience:**
    - The user can jump to any specific time in the game using a seek bar or timestamp input.
    - The app displays cumulative stats up to that point, or filtered stats for a specific time window (e.g., "points scored in the last 2 minutes").

### 3. Visualization of Game Momentum
- **Scenario:** A user wants to understand how the lead changed and what triggered shifts in momentum during the game.
- **Experience:**
    - A visual representation (e.g., a scoring margin graph) is synchronized with the playback.
    - Key events (runs, turnovers, lead changes) are highlighted as the timeline progresses, helping users identify turning points.

## UI/UX Design

### 1. Top Page (Dashboard)
- **Scoreboard:** A list of recent games with team logos and final/current scores.
- **Date Picker:** Allows users to select a specific date to view historical games.
- **Search/Filter:** Filter games by team name.

### 2. Rewind Page (Stats Screen)
- **Game Header:**
    - Team names and logos.
    - Real-time score (relative to the playback timestamp).
    - Game clock and period.
- **Playback Controls:**
    - Play/Pause button.
    - Playback speed selector (1x, 2x, 4x, 10x).
    - Seek bar representing the entire game duration (48+ minutes).
- **Statistics (NBA.com Live style):**
    - **Box Score:** Detailed player statistics (PTS, REB, AST, STL, BLK, TOV, PF, FG/3P/FT attempts and percentages, +/-).
    - **Play-by-Play:** A scrolling list of game events (shots, fouls, substitutions, etc.) synchronized with the playback time.
    - **Team Stats Comparison:** Comparison of team-wide metrics (e.g., Field Goal %, Rebounds, Points in Paint, Second Chance Points).
- **Momentum Graph:**
    - A line chart showing the scoring margin over time.
    - Users can click on the graph to jump to specific moments.

## Navigation Flow

### 1. Discovery (Top Page -> Rewind Page)
- Users browse the Scoreboard on the Top Page.
- Clicking on a specific game card navigates the user to the Rewind Page for that game.

### 2. Returning (Rewind Page -> Top Page)
- A "Back to Scoreboard" button or the application logo in the header allows users to return to the Top Page.
- The state (selected date) on the Top Page should be preserved when returning, if possible.

## Technical Stack

- **Frontend/Backend:** [Next.js](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Deployment:** [Vercel](https://vercel.com/)
- **Data Source:** NBA Stats API (accessed via `stats.nba.com` or community-maintained wrappers)
- **State Management:** React Context or [Zustand](https://github.com/pmndrs/zustand) for playback state (current time, playback speed).

## Monorepo Structure

The project uses a monorepo structure managed by `npm` workspaces to separate concerns between the frontend application and the data fetching logic.

```text
nba-stats-rewind/
├── apps/
│   └── web/                # Next.js (Frontend & API Routes)
├── packages/
│   └── nba-api-client/     # Shared library for NBA Stats API interaction
├── package.json            # Root package.json with workspace configuration
└── SPEC.md                 # Project specification
```

### Package Roles
- **apps/web**: The main user interface. It consumes `nba-api-client` to fetch and display stats. It also handles proxying requests to bypass CORS issues if necessary.
- **packages/nba-api-client**: A standalone TypeScript library that encapsulates all the logic for communicating with `stats.nba.com`. This includes type definitions for API responses and request header management.

## Development Roadmap

### Phase 1: Foundation & Scoreboard
- Set up a monorepo structure (using `pnpm` workspaces).
- Create a shared `nba-api-client` package to fetch data from `stats.nba.com`.
- Implement the Top Page to display a list of games for a selected date.

### Phase 2: Raw Play-by-Play Data
- Extend `nba-api-client` to support Play-by-Play endpoints.
- Create the Rewind Page to display a raw list of all game events for a selected game.

### Phase 3: Basic Playback Logic
- Implement playback state management (Play/Pause, current "game time").
- Filter and display play-by-play events based on the current "game time".

### Phase 4: Dynamic Box Score
- Calculate and display real-time player/team statistics by aggregating play-by-play data or using time-synced box score snapshots.
- Implement the NBA.com-style Box Score table.

### Phase 5: Visualization & Polishing
- Add a Momentum Graph (score margin chart).
- Implement playback speed control and a functional seek bar.
- Refine UI/UX with Tailwind CSS and ensure mobile responsiveness.

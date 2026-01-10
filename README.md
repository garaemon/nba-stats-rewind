# NBA Stats Rewind

NBA Stats Rewind is a web application that allows users to "rewind" and "replay" NBA game statistics as if they were happening in real-time or at a specific point in time. It's designed for fans who want a spoiler-free delayed viewing experience or for those who want to analyze game momentum and clutch moments in detail.

## Live Demo

[https://nba.garaemon.com](https://nba.garaemon.com)

## Key Features

- **Spoiler-Free Delayed Viewing**: Start replaying any game from the beginning without knowing the final score. Stats update progressively.
- **Dynamic Playback Control**: Play, pause, and adjust playback speed (1x, 2x, 4x, 10x). Seek to any specific moment in the game.
- **Real-Time Box Score**: View detailed player and team statistics that update dynamically based on the current playback time.
- **Momentum Graph**: Visualize scoring margins over time and jump to key moments directly from the chart.
- **Play-by-Play**: A synchronized list of game events that follows the playback timeline.

## Tech Stack

- **Frontend**: [Next.js](https://nextjs.org/) (App Router), [React](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Testing**: [Vitest](https://vitest.dev/) (Unit/Integration), [Playwright](https://playwright.dev/) (E2E)
- **Data Source**: NBA Stats API

## Monorepo Structure

This project is a monorepo managed by npm workspaces.

- `apps/web`: The Next.js web application.
- `packages/nba-api-client`: A shared TypeScript library for interacting with the NBA Stats API.

## Getting Started

### Prerequisites

- Node.js (v20 or later)
- npm

### Installation

```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3001`.

### Testing

Run unit tests for all packages:

```bash
# In the root directory
npm test -w packages/nba-api-client
npm test -w apps/web
```

Run E2E tests for the web application:

```bash
npm run test:e2e -w apps/web
```

## License

This project is licensed under the ISC License.

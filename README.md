# Yovi_es3b - Game Y at UniOvi

[![Release — Test, Build, Publish, Deploy](https://github.com/arquisoft/yovi_es3b/actions/workflows/release-deploy.yml/badge.svg)](https://github.com/arquisoft/yovi_es3b/actions/workflows/release-deploy.yml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=Arquisoft_yovi_es3b&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=Arquisoft_yovi_es3b)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=Arquisoft_yovi_es3b&metric=coverage)](https://sonarcloud.io/summary/new_code?id=Arquisoft_yovi_es3b)

## Colaborators
| Name | Email |
|------|-------|
| David López Araujo | UO299774@uniovi.es |
| Sergio García Santamarina | UO294636@uniovi.es |
| Pablo Hevia Fernández | UO301496@uniovi.es |
| Alejandro González Álvarez | UO293819@uniovi.es |

Course: Software Architecture

Academic Year: 2025/2026

## Project Structure

The project is divided into three main components, each in its own directory:

- `webapp/`: A frontend application built with React, Vite, and TypeScript.
- `users/`: A backend service for managing users, built with Node.js and Express.
- `gamey/`: A Rust game engine and bot service.
- `docs/`: Architecture documentation sources following Arc42 template

Each component has its own `package.json` file with the necessary scripts to run and test the application.

## Basic Features

- **User Registration**: The web application provides a simple form to register new users.
- **User Service**: The user service receives the registration request, simulates some processing, and returns a welcome message.
- **GameY**: A basic Game engine which only chooses a random piece.

##  New Features

The following features have been added on top of the original Memory Game:

---

###  Internationalization (i18n)

The game is now fully available in two languages:

- 🇬🇧 **English**
- 🇪🇸 **Spanish**

Language can be selected from the main menu. All UI text, labels and
messages adapt automatically to the chosen language.

---

###  Difficulty Levels

Players can now choose their preferred difficulty before starting a game.
Each level adjusts the reason of each bot move:

- **Easy** – Random moves.
- **Hard** – Heuristic that calculate the turn for each criteria
- **Extreme** – [Minimax with Alpha-Beta pruning](https://es.wikipedia.org/wiki/Minimax)
- **Impossible** - Uses the [Montecarlo algorithm](https://es.wikipedia.org/wiki/M%C3%A9todo_de_Montecarlo).

---

###  Score Ranking

A persistent leaderboard has been added to track the best performances. The ranking displays
the top results sorted by score, including player name, points, number of games won and lossed.

---

###  Game Modes

Two new game modes have been introduced, offering different gameplay
experiences:

#### Double Turn Mode
Each player gets **two moves per turn** instead of one. This mode
rewards memory and strategy.

#### Coin Flip Mode
Before each turn, a **coin is flipped randomly**. The outcome
determines whether the current player gets to take their turn or
passes it to the opponent. This mode adds an element of chance and
keeps every round unpredictable.


## Components

### Webapp

The `webapp` is a single-page application (SPA) created with [Vite](https://vitejs.dev/) and [React](https://reactjs.org/).

- `src/App.tsx`: The main component of the application.
- `src/RegisterForm.tsx`: The component that renders the user registration form.
- `package.json`: Contains scripts to run, build, and test the webapp.
- `vite.config.ts`: Configuration file for Vite.
- `Dockerfile`: Defines the Docker image for the webapp.

### Users Service

The `users` service is a simple REST API built with [Node.js](https://nodejs.org/) and [Express](https://expressjs.com/).

- `users-service.js`: The main file for the user service. It defines an endpoint `/createuser` to handle user creation.
- `package.json`: Contains scripts to start the service.
- `Dockerfile`: Defines the Docker image for the user service.

### Gamey

The `gamey` component is a Rust-based game engine with bot support, built with [Rust](https://www.rust-lang.org/) and [Cargo](https://doc.rust-lang.org/cargo/).

- `src/main.rs`: Entry point for the application.
- `src/lib.rs`: Library exports for the gamey engine.
- `src/bot/`: Bot implementation and registry.
- `src/core/`: Core game logic including actions, coordinates, game state, and player management.
- `src/notation/`: Game notation support (YEN, YGN).
- `src/web/`: Web interface components.
- `Cargo.toml`: Project manifest with dependencies and metadata.
- `Dockerfile`: Defines the Docker image for the gamey service.

## Running the Project

The project is accesible via : [Web](http://20.244.6.215/)

The documentation is in : [Documentation](https://arquisoft.github.io/yovi_es3b/)

Both APIs are documented in : [OpenAPI documentation](http://20.244.6.215:3000/api-docs/)

## Available Scripts

Each component has its own set of scripts defined in its `package.json`. Here are some of the most important ones:

### Webapp (`webapp/package.json`)

- `npm run dev`: Starts the development server for the webapp.
- `npm test`: Runs the unit tests.
- `npm run test:e2e`: Runs the end-to-end tests.
- `npm run start:all`: A convenience script to start both the `webapp` and the `users` service concurrently.

### Users (`users/package.json`)

- `npm start`: Starts the user service.
- `npm test`: Runs the tests for the service.

### Gamey (`gamey/Cargo.toml`)

- `cargo build`: Builds the gamey application.
- `cargo test`: Runs the unit tests.
- `cargo run`: Runs the gamey application.
- `cargo doc`: Generates documentation for the GameY engine application

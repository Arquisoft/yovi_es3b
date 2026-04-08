import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import "@testing-library/jest-dom";
import HistoryPage from "../components/history/HistoryPage.tsx";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    // Para el format de la fecha
    i18n: {
      language: "es",
    },
  }),
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    username: "TestUser",
    photoURL: "avatar_1.png",
    token: "fake-token",
    user: {
      getIdToken: vi.fn().mockResolvedValue("fake-token"),
    },
  }),
}));

const renderHistoryPage = () => render(<HistoryPage />);

describe("HistoryPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("renders History Page with no games played", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    renderHistoryPage();

    // Comprobar que muestra "cargando partidas" al inicio
    expect(screen.getByText("history.loading")).toBeInTheDocument();

    // Esperar a que desaparezca el mensaje de cargando
    await waitFor(() => {
      expect(screen.queryByText("history.loading")).not.toBeInTheDocument();
    });

    // Comprobar que muestra "no tienes partidas"
    const noGamesText = screen.getByText("history.empty");
    expect(noGamesText).toBeInTheDocument();
  });

  test("renders a History game result with specified values", async () => {
    const gameData = {
      _id: "1",
      winner: "player",
      durationMs: 100000, // 1m 40s
      turns: 15,
      difficulty: "hard",
      createdAt: new Date().toISOString(),
    };

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => [gameData],
    });

    renderHistoryPage();

    // Esperar a que carguen los datos
    await waitFor(() => {
      expect(screen.getByText("history.title")).toBeInTheDocument();
      expect(screen.getByText(/history.subtitle/)).toBeInTheDocument();
    });

    // Comprobaciones de la tarjeta de juego: verificar que aparece la info del mock
    expect(screen.getByText("history.win")).toBeInTheDocument();
    expect(screen.getByText("1m 40s")).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByText(/history.difficultyHard/)).toBeInTheDocument();

    // Verificar que la tarjeta tiene la clase de victoria
    const gameCard = screen.getByText("history.win").closest(".game-card");
    expect(gameCard).toHaveClass("game-card--win");
  });

  test("renders number of history card equal to games finished", async () => {
    const game1 = {
      _id: "1",
      winner: "player",
      durationMs: 100000,
      turns: 15,
      difficulty: "hard",
      createdAt: new Date().toISOString(),
    };
    const game2 = {
      _id: "2",
      winner: "bot",
      durationMs: 200000,
      turns: 25,
      difficulty: "easy",
      createdAt: new Date().toISOString(),
    };
    const game3 = {
      _id: "3",
      winner: "player",
      durationMs: 100000,
      turns: 9,
      difficulty: "extreme",
      createdAt: new Date().toISOString(),
    };

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => [game1, game2, game3],
    });

    renderHistoryPage();

    // Esperar a que carguen los datos
    await waitFor(() => {
      expect(screen.getByText("history.title")).toBeInTheDocument();
    });

    // Verificar que hay 2 victorias y 1 derrota
    const wins = screen.getAllByText("history.win");
    const losses = screen.getAllByText("history.loss");
    expect(wins).toHaveLength(2);
    expect(losses).toHaveLength(1);

    // Verificar que existen 3 cards
    const gameCards = document.querySelectorAll(".game-card");
    expect(gameCards).toHaveLength(3);
  });
});

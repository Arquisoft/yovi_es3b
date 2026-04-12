import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import LobbyPage from "../LobbyPage.tsx";
import React from "react";

// Mocks
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
    // Mock de trans: extraemos el component GameLink y lo clonamos
  Trans: ({
    components,
  }: { components?: Record<string, React.ReactElement>; }) => (
    <span>
      {components?.gameLink &&
        React.cloneElement(components.gameLink, {}, "Game Y")}
    </span>
  ),
}));

let mockUsername: string | null = 'TestUser';

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    username: mockUsername,
    photoURL: "avatar_1.png",
    token: "fake-token",
  }),
}));

// Mocks del fondo de particulas
vi.mock("@tsparticles/react", () => ({
  default: () => <div data-testid="particles-mock" />,
  initParticlesEngine: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@tsparticles/slim", () => ({
  loadSlim: vi.fn().mockResolvedValue(undefined),
}));

// Mock para no renderizar GameBoard: div con texto GameBoard
vi.mock("../components/board/GameBoard.tsx", () => ({
  default: () => <div data-testid="game-board">GameBoard</div>,
}));

const renderLobby = () => render(<LobbyPage />);

describe("LobbyPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("renders Lobby page with mocked username", () => {
    renderLobby();

    const title = screen.getByRole("heading");
    expect(title).toHaveTextContent("lobby.welcome TestUser");

    const btGame = screen.getByRole("button", { name: /lobby.quickGame/ });
    expect(btGame).toHaveClass("lobby-btn-primary");
  });

  test('renders Game page when "Quick game" is clicked', async () => {
    const user = userEvent.setup();
    renderLobby();

    const button = screen.getByRole("button", { name: /lobby.quickGame/ });
    await user.click(button);

    const gameBoard = screen.getByTestId("game-board");
    expect(gameBoard).toBeInTheDocument();
  });

  test("link to wikipedia is present in Game Y text", async () => {
    renderLobby();

    const wikipediaLink = screen.getByRole("link", { name: /Game Y/ });
    expect(wikipediaLink).toHaveAttribute(
      "href",
      "https://es.wikipedia.org/wiki/Y_(juego)",
    );
    expect(wikipediaLink).toHaveAttribute("target", "_blank");
  });

    test("link to documentation is present with text 'officialDocs'", async () => {
      renderLobby();

      const docsLink = screen.getByRole("link", { name: /officialDocs/ });
      expect(docsLink).toHaveAttribute(
          "href",
          "https://arquisoft.github.io/yovi_es3b/",
      );
      expect(docsLink).toHaveClass( "lobby-docs-link")
    });

    test('expect default username(...) when username is not present', () => {
      mockUsername = null;
      renderLobby();

      const title = screen.getByRole("heading");
      expect(title).toHaveTextContent("lobby.welcome ...");
    })
});

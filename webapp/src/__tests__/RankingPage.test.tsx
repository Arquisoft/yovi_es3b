import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import "@testing-library/jest-dom";
import RankingPage from "../components/ranking/RankingPage.tsx";

vi.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

let mockUser: any = {
    username: "TestUser",
    photoURL: "avatar_1.png",
    user: {
        getIdToken: vi.fn().mockResolvedValue("fake-token"),
    },
};

vi.mock("../context/AuthContext", () => ({
    useAuth: () => mockUser,
}));

const sampleEntries = [
    {
        _id: "u1",
        username: "alice",
        photoURL: "avatar_2.png",
        points: 4200,
        gamesPlayed: 10,
        gamesWon: 7,
        gamesLost: 3,
    },
    {
        _id: "u2",
        username: "TestUser",
        points: 1800,
        gamesPlayed: 4,
        gamesWon: 2,
        gamesLost: 2,
    },
    {
        _id: "u3",
        username: "charlie",
        points: 0,
        gamesPlayed: 0,
        gamesWon: 0,
        gamesLost: 0,
    },
];

const renderRankingPage = () => render(<RankingPage />);

describe("RankingPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUser = {
            username: "TestUser",
            photoURL: "avatar_1.png",
            user: {
                getIdToken: vi.fn().mockResolvedValue("fake-token"),
            },
        };
        global.fetch = vi.fn();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    test("renders the title and difficulty filter tabs", async () => {
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => [],
        });

        renderRankingPage();

        expect(screen.getByText("ranking.title")).toBeInTheDocument();
        expect(screen.getByText("game.difficultyEasy")).toBeInTheDocument();
        expect(screen.getByText("game.difficultyHard")).toBeInTheDocument();
        expect(screen.getByText("game.difficultyExtreme")).toBeInTheDocument();
        expect(screen.getByText("game.difficultyImpossible")).toBeInTheDocument();
        expect(screen.getByText("ranking.pointsLegend")).toBeInTheDocument();

        await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    });

    test("shows the empty status when the API returns no entries", async () => {
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => [],
        });

        renderRankingPage();

        await waitFor(() => {
            expect(screen.getByText("ranking.empty")).toBeInTheDocument();
        });
        expect(screen.queryByRole("table")).not.toBeInTheDocument();
    });

    test("renders the ranking table with one row per entry", async () => {
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => sampleEntries,
        });

        renderRankingPage();

        await waitFor(() => {
            expect(screen.getByRole("table")).toBeInTheDocument();
        });

        expect(document.querySelectorAll("tbody tr")).toHaveLength(3);
        expect(screen.getByText("alice")).toBeInTheDocument();
        expect(screen.getByText("charlie")).toBeInTheDocument();
        expect(screen.getByText("4200")).toBeInTheDocument();
    });

    test("highlights the row that matches the logged-in username", async () => {
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => sampleEntries,
        });

        renderRankingPage();

        await waitFor(() => {
            expect(screen.getByText("TestUser")).toBeInTheDocument();
        });

        const myRow = screen.getByText("TestUser").closest("tr");
        expect(myRow).toHaveClass("ranking-row--me");

        const otherRow = screen.getByText("alice").closest("tr");
        expect(otherRow).not.toHaveClass("ranking-row--me");
    });

    test("renders an avatar when photoURL is present and skips it otherwise", async () => {
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => sampleEntries,
        });

        renderRankingPage();

        await waitFor(() => {
            expect(screen.getByText("alice")).toBeInTheDocument();
        });

        const avatars = document.querySelectorAll<HTMLImageElement>(".ranking-avatar");
        // Only alice has a photoURL in the fixture; TestUser and charlie don't.
        expect(avatars).toHaveLength(1);
        expect(avatars[0].src).toContain("/avatars/avatar_2.png");
    });

    test("formatWinRate shows percentage for played games and dash for none", async () => {
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => sampleEntries,
        });

        renderRankingPage();

        await waitFor(() => {
            expect(screen.getByText("alice")).toBeInTheDocument();
        });

        expect(screen.getByText("70.0%")).toBeInTheDocument();
        expect(screen.getByText("50.0%")).toBeInTheDocument();
        expect(screen.getByText("—")).toBeInTheDocument();
    });

    test("calls the API with the default difficulty=easy on first render", async () => {
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => [],
        });

        renderRankingPage();

        await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
        const url = (global.fetch as any).mock.calls[0][0] as string;
        expect(url).toContain("/users?difficulty=easy");

        const init = (global.fetch as any).mock.calls[0][1];
        expect(init.headers.Authorization).toBe("Bearer fake-token");
    });

    test("clicking a difficulty tab refetches with the new difficulty", async () => {
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => [],
        });
        const user = userEvent.setup();

        renderRankingPage();

        await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

        await user.click(screen.getByText("game.difficultyHard"));

        await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
        const secondUrl = (global.fetch as any).mock.calls[1][0] as string;
        expect(secondUrl).toContain("/users?difficulty=hard");
    });

    test("marks the active difficulty tab with aria-selected and the active class", async () => {
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => [],
        });
        const user = userEvent.setup();

        renderRankingPage();

        const easyTab = screen.getByText("game.difficultyEasy").closest("button")!;
        const hardTab = screen.getByText("game.difficultyHard").closest("button")!;

        expect(easyTab).toHaveAttribute("aria-selected", "true");
        expect(easyTab).toHaveClass("ranking-filter--active");
        expect(hardTab).toHaveAttribute("aria-selected", "false");

        await user.click(hardTab);

        await waitFor(() => {
            expect(hardTab).toHaveAttribute("aria-selected", "true");
            expect(hardTab).toHaveClass("ranking-filter--active");
            expect(easyTab).toHaveAttribute("aria-selected", "false");
        });
    });

    test("shows error status when the API responds with non-ok", async () => {
        (global.fetch as any).mockResolvedValue({
            ok: false,
            json: async () => ({}),
        });

        renderRankingPage();

        await waitFor(() => {
            expect(screen.getByText("ranking.error")).toBeInTheDocument();
        });
        expect(screen.getByText("ranking.error")).toHaveClass("ranking-status--error");
        expect(screen.queryByRole("table")).not.toBeInTheDocument();
    });

    test("shows error status when fetch itself rejects", async () => {
        (global.fetch as any).mockRejectedValue(new Error("network down"));

        renderRankingPage();

        await waitFor(() => {
            expect(screen.getByText("network down")).toBeInTheDocument();
        });
        expect(screen.getByText("network down")).toHaveClass("ranking-status--error");
    });

    test("does not fetch when user is not available", async () => {
        mockUser = { username: null, user: null };
        renderRankingPage();

        expect(screen.getByText("ranking.loading")).toBeInTheDocument();
        await waitFor(() => {
            expect(global.fetch).not.toHaveBeenCalled();
        });
    });
});

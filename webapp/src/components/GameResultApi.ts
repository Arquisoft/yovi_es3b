import type { User } from "firebase/auth";

export type Difficulty = "easy" | "hard" | "extreme" | "impossible";
export type Winner = "player" | "bot";
export type GameMode = "classic" | "master" | "fortune";

// Extraemos la funcionalidad para guardar los resultados de la partida
// a una clase externa
export async function saveGame(
    user: User,
    winner: Winner,
    durationMs: number,
    turns: number,
    difficulty: Difficulty,
    gameMode: GameMode = "classic"
): Promise<void> {
    try {
        const token = await user.getIdToken();
        const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
        await fetch(`${API_URL}/games`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ winner, durationMs, turns, difficulty, gameMode }),
        });
    } catch (err) {
        console.error("Error guardando partida:", err);
    }
}

export function resolveWinner(winnerId: string): Winner {
    return winnerId === "0" ? "player" : "bot";
}
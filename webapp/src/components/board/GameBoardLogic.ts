import { useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { saveGame, resolveWinner, type Difficulty } from "../GameResultApi";

export type Player = 1 | 2;
export type Board = Record<string, Player>;


// YEN serialisation — converts the board state to the format the bot API
// expects: rows of B (player 1), R (bot), or . (empty), joined by "/"
export function buildYEN(size: number, board: Board) {
    // Casillas ocupadas
    // Player 1 -> B
    // Player 2 -> R
    const occupied: Record<string, string> = {};
    for (const [key, player] of Object.entries(board)) {
        occupied[key] = player === 1 ? "B" : "R";
    }

    // Letra del jugador o "." si está vacía
    // Guarda el esquema de cada fila
    const rows: string[] = [];
    for (let x = size - 1; x >= 0; x--) {
        let row = "";
        for (let y = 0; y < size - x; y++) {
            row += occupied[`${x},${y}`] ?? ".";
        }
        rows.push(row);
    }

    return {
        size,
        turn: 1, // 1 = bot's turn (0-indexed: 0 = "B", 1 = "R")
        players: ["B", "R"] as [string, string],
        layout: rows.join("/"),
    };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useGameY(size: number, botId: string, difficulty: Difficulty) {
    const { user } = useAuth();

    const [board, setBoard] = useState<Board>({});
    const [currentPlayer, setCurrentPlayer] = useState<Player>(1);
    const [loadingBot, setLoadingBot] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [winner, setWinner] = useState<string | null>(null);
    const [turns, setTurns] = useState(0);

    // Para usar la referencia al último estado del objeto en llamadas asíncronas
    const gameFinishedRef = useRef(false);
    const startTimeRef = useRef(Date.now());

    // ---- helpers -----------------------------------------------------------

    // Guardar el resultado de la partida
    const persistResult = async (winnerId: string) => {
        if (!user) return;
        await saveGame(
            user,
            resolveWinner(winnerId),
            Date.now() - startTimeRef.current,
            turns,
            difficulty
        );
    };

    // Set todos los valores necesarios al finalizar el juego
    const finishGame = async (winnerId: string) => {
        gameFinishedRef.current = true;
        setWinner(winnerId);
        setGameOver(true);
        await persistResult(winnerId);
    };

    // ---- bot move ----------------------------------------------------------

    const fetchBotMove = async (boardAfterPlayer: Board): Promise<void> => {
        const API_URL = import.meta.env.VITE_GAMEY_URL ?? "http://localhost:4000";
        const yen = buildYEN(size, boardAfterPlayer);

        const res = await fetch(`${API_URL}/v1/ybot/choose/${botId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify(yen),
        });

        // 409 = game already finished (server-side detection)
        if (res.status === 409) {
            const errJson = await res.json().catch(() => ({}));
            const msg: string = errJson?.message ?? "";
            const match = msg.match(/\(winner:\s*PlayerId\((\d+)\)\)/i);
            await finishGame(match?.[1]?.trim() ?? "");
            return;
        }

        if (!res.ok) {
            const text = await res.text().catch(() => "");
            throw new Error(`HTTP ${res.status}${text ? `: ${text}` : ""}`);
        }

        const data = await res.json();
        const status = data?.status;

        // Game finished with a winner reported in the response body
        if (status && typeof status === "object" && "Finished" in status) {
            const w = status.Finished?.winner;
            await finishGame(typeof w === "number" ? String(w) : String(w ?? ""));
            return;
        }

        // Normal move: apply the bot's chosen coordinates
        const { x, y, z } = data?.coords ?? {};
        // Comprobamos que las coordenadas son válidas
        const validCoords =
            typeof x === "number" &&
            typeof y === "number" &&
            typeof z === "number" &&
            x + y + z === size - 1;

        if (validCoords) {
            setBoard((prev) => {
                const botKey = `${x},${y}`;
                return prev[botKey] ? prev : { ...prev, [botKey]: 2 };
            });
            setTurns((t) => t + 1);
        }
        // If no valid coords the bot skipped its turn — nothing to do
    };

    // ---- player clicks a cell --------------------------------

    /* Usa coordenadas en sistema axial hexagonal
     * q: equivalente la columna de la celda. Se incrementa hacia la derecha en el tablero
     * r: equivalente a la fila de la celda. Se incrementa hacia arriba y hacia la derecha (triangulo)
     */
    const handleCellClick = async (q: number, r: number): Promise<void> => {
        if (gameFinishedRef.current || gameOver || loadingBot || currentPlayer !== 1) return;

        const key = `${q},${r}`;
        if (board[key]) return; // cell already occupied

        // Copiamos el tablero actual y lo modificamos con el movimiento del jugador
        const nextBoard: Board = { ...board, [key]: 1 };
        setBoard(nextBoard);
        setCurrentPlayer(2);
        setLoadingBot(true);
        setTurns((t) => t + 1);

        try {
            await fetchBotMove(nextBoard);
        } catch (err: any) {
            console.error("Bot error:", err);
            alert(`Error al obtener el movimiento del bot: ${String(err?.message ?? err)}`);
        } finally {
            setCurrentPlayer(1);
            setLoadingBot(false);
        }
    };

    // ---- reset board -----------------------------------------------

    const resetGame = () => {
        gameFinishedRef.current = false;
        startTimeRef.current = Date.now();
        setBoard({});
        setCurrentPlayer(1);
        setLoadingBot(false);
        setGameOver(false);
        setWinner(null);
        setTurns(0);
    };

    return { board, currentPlayer, loadingBot, gameOver, winner, handleCellClick, resetGame };
}
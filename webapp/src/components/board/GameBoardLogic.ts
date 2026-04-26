import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { saveGame, resolveWinner, type Difficulty } from "../GameResultApi";

export type Player = 1 | 2;
export type Board = Record<string, Player>;
export type GameMode = "classic" | "master" | "fortune";

const TURN_TIMEOUT_MS = 8000;

// YEN serialisation — converts the board state to the format the bot API
// expects: rows of B (player 1), R (bot), or . (empty), joined by "/"
export function buildYEN(size: number, board: Board) {
    const occupied: Record<string, string> = {};
    for (const [key, player] of Object.entries(board)) {
        occupied[key] = player === 1 ? "B" : "R";
    }

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
        turn: 1,
        players: ["B", "R"] as [string, string],
        layout: rows.join("/"),
    };
}

// YEN serialization reversed — swaps player and bot perspective
// Player (1 -> "B") becomes bot, and bot (2 -> "R") becomes player
export function buildYENReversed(size: number, board: Board) {
    const occupied: Record<string, string> = {};

    for (const [key, player] of Object.entries(board)) {
        occupied[key] = player === 1 ? "R" : "B";
    }

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
        turn: 1,
        players: ["R", "B"] as [string, string], // swapped order
        layout: rows.join("/"),
    };
}

// ---------------------------------------------------------------------------
// Client-side win detection (mirrors the Rust Union-Find logic)
// Sides: x===0 → side A, y===0 → side B, x+y===size-1 → side C
// ---------------------------------------------------------------------------
function checkWin(size: number, board: Board, player: Player): boolean {
    const owned = new Set<string>(
        Object.entries(board).filter(([, v]) => v === player).map(([k]) => k)
    );
    const visited = new Set<string>();

    for (const start of owned) {
        if (visited.has(start)) continue;

        const queue = [start];
        let sideA = false, sideB = false, sideC = false;

        while (queue.length > 0) {
            const key = queue.shift()!;
            if (visited.has(key)) continue;
            visited.add(key);

            const [q, r] = key.split(",").map(Number);
            if (q === 0)            sideA = true;
            if (r === 0)            sideB = true;
            if (q + r === size - 1) sideC = true;
            if (sideA && sideB && sideC) return true;

            // 6 neighbours in barycentric coords — only follow player-owned cells
            const nbrs: string[] = [];
            if (q > 0)            { nbrs.push(`${q-1},${r+1}`, `${q-1},${r}`); }
            if (r > 0)            { nbrs.push(`${q+1},${r-1}`, `${q},${r-1}`); }
            if (q + r < size - 1) { nbrs.push(`${q+1},${r}`,   `${q},${r+1}`); }
            for (const n of nbrs) {
                if (owned.has(n) && !visited.has(n)) queue.push(n);
            }
        }
    }
    return false;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useGameY(size: number, botId: string, difficulty: Difficulty, gameMode: GameMode = "classic") {
    const { user } = useAuth();

    const [board, setBoard] = useState<Board>({});
    const [clueCell, setClueCell] = useState<string | null>(null);
    const [currentPlayer, setCurrentPlayer] = useState<Player>(1);
    const [loadingBot, setLoadingBot] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [winner, setWinner] = useState<string | null>(null);
    const [turns, setTurns] = useState(0);

    // Master Y: pieces the player can still place this turn (resets to 2 after bot moves)
    const [masterPiecesLeft, setMasterPiecesLeft] = useState(2);

    // Fortune Y: result of the last coin flip ("player" | "bot" | null)
    const [fortuneFlip, setFortuneFlip] = useState<"player" | "bot" | null>(null);

    // Fortune Y: coin flip animation state
    const [coinAnimating, setCoinAnimating] = useState(false);
    const [coinAnimResult, setCoinAnimResult] = useState<"player" | "bot" | null>(null);

    // timer 8seg
    const [turnDeadline, setTurnDeadline] = useState<number | null>(null);
    const turnTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const boardRef = useRef<Board>({});
    useEffect(() => { boardRef.current = board; }, [board]);

    const gameFinishedRef = useRef(false);
    const startTimeRef = useRef(Date.now());

    // ---- helpers -----------------------------------------------------------

    const persistResult = async (winnerId: string) => {
        if (!user) return;
        await saveGame(
            user,
            resolveWinner(winnerId),
            Date.now() - startTimeRef.current,
            turns,
            difficulty,
            gameMode
        );
    };

    const finishGame = async (winnerId: string) => {
        gameFinishedRef.current = true;
        setWinner(winnerId);
        setGameOver(true);
        await persistResult(winnerId);
    };

    // ---- coin flip animation -----------------------------------------------
    // Returns the flip result after the visual animation completes.

    const flipCoin = (): Promise<"player" | "bot"> => {
        return new Promise((resolve) => {
            const array = new Uint32Array(1);
            crypto.getRandomValues(array);
            const result: "player" | "bot" = array[0] % 2 === 0 ? "player" : "bot";
            setCoinAnimating(true);
            setCoinAnimResult(result);
            setTimeout(() => {
                setCoinAnimating(false);
                setCoinAnimResult(null);
                resolve(result);
            }, 1600);
        });
    };

    // ---- bot move ----------------------------------------------------------
    // Returns the board after applying the bot's move so callers can chain moves.

    const fetchBotMove = async (currentBoard: Board): Promise<Board> => {
        const API_URL = import.meta.env.VITE_GAMEY_URL ?? "http://localhost:4000";
        const yen = buildYEN(size, currentBoard);

        const res = await fetch(`${API_URL}/v1/ybot/choose/${botId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify(yen),
        });

        if (res.status === 409) {
            const errJson = await res.json().catch(() => ({}));
            const msg: string = errJson?.message ?? "";
            const match = msg.match(/\(winner:\s*PlayerId\((\d+)\)\)/i);
            await finishGame(match?.[1]?.trim() ?? "");
            return currentBoard;
        }

        if (!res.ok) {
            const text = await res.text().catch(() => "");
            throw new Error(`HTTP ${res.status}${text ? `: ${text}` : ""}`);
        }

        const data = await res.json();
        const status = data?.status;

        const { x, y, z } = data?.coords ?? {};
        const validCoords =
            typeof x === "number" &&
            typeof y === "number" &&
            typeof z === "number" &&
            x + y + z === size - 1;

        // Always apply the bot's move first so the winning piece is visible
        let newBoard = currentBoard;
        if (validCoords) {
            const botKey = `${x},${y}`;
            if (!currentBoard[botKey]) {
                newBoard = { ...currentBoard, [botKey]: 2 as Player };
                setBoard(newBoard);
                setTurns((t) => t + 1);
            }
        }

        if (status && typeof status === "object" && "Finished" in status) {
            const w = status.Finished?.winner;
            await finishGame(typeof w === "number" ? String(w) : String(w ?? ""));
            return newBoard;
        }

        return newBoard;
    };

    // ---- classic bot turn --------------------------------------------------

    const runClassicBotTurn = async (boardAfterPlayer: Board) => {
        setCurrentPlayer(2);
        setLoadingBot(true);
        try {
            await fetchBotMove(boardAfterPlayer);
        } catch (err: any) {
            console.error("Bot error:", err);
            alert(`Error al obtener el movimiento del bot: ${String(err?.message ?? err)}`);
        } finally {
            if (!gameFinishedRef.current) {
                setCurrentPlayer(1);
                setLoadingBot(false);
            }
        }
    };

    // ---- master bot turn (2 pieces) ----------------------------------------

    const runMasterBotTurn = async (boardAfterPlayer: Board) => {
        setCurrentPlayer(2);
        setLoadingBot(true);
        try {
            const boardAfterBot1 = await fetchBotMove(boardAfterPlayer);
            if (!gameFinishedRef.current) {
                await fetchBotMove(boardAfterBot1);
            }
        } catch (err: any) {
            console.error("Bot error:", err);
            alert(`Error al obtener el movimiento del bot: ${String(err?.message ?? err)}`);
        } finally {
            if (!gameFinishedRef.current) {
                setCurrentPlayer(1);
                setLoadingBot(false);
                setMasterPiecesLeft(2);
            }
        }
    };

    // ---- fortune bot turn (loop until coin says player) --------------------

    const runFortuneBotTurn = async (initialBoard: Board) => {
        setCurrentPlayer(2);
        setLoadingBot(true);
        try {
            let currentBoard = initialBoard;
            let nextFlip: "player" | "bot" = "bot";

            while (nextFlip === "bot" && !gameFinishedRef.current) {
                currentBoard = await fetchBotMove(currentBoard);
                if (gameFinishedRef.current) break;
                nextFlip = await flipCoin();
                setFortuneFlip(nextFlip);
            }
        } catch (err: any) {
            console.error("Bot error:", err);
            alert(`Error al obtener el movimiento del bot: ${String(err?.message ?? err)}`);
        } finally {
            if (!gameFinishedRef.current) {
                setCurrentPlayer(1);
                setLoadingBot(false);
            }
        }
    };

    // ---- initial coin flip for Fortune Y ----------------------------------
    // resetKey increments on each resetGame() call so the effect re-runs.
    // startedRef prevents the double-invocation that React Strict Mode causes.

    const [resetKey, setResetKey] = useState(0);
    const initialFlipStartedRef = useRef(false);

    useEffect(() => {
        if (gameMode !== "fortune") return;
        if (initialFlipStartedRef.current) return;
        initialFlipStartedRef.current = true;

        (async () => {
            const flip = await flipCoin();
            setFortuneFlip(flip);
            if (flip === "bot") await runFortuneBotTurn({});
        })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [resetKey]);

    // ---- player clicks a cell ----------------------------------------------

    const handleCellClick = async (q: number, r: number): Promise<void> => {
        if (gameFinishedRef.current || gameOver || loadingBot || coinAnimating || currentPlayer !== 1) return;

        const key = `${q},${r}`;
        if (board[key]) return;

        setClueCell(null);

        const nextBoard: Board = { ...board, [key]: 1 };
        setBoard(nextBoard);
        setTurns((t) => t + 1);

        if (gameMode === "master") {
            if (masterPiecesLeft > 1) {
                // Player still has a second piece to place this turn
                setMasterPiecesLeft(1);
                return;
            }
            // Player placed their 2nd piece → bot places 2
            setMasterPiecesLeft(2);
            await runMasterBotTurn(nextBoard);

        } else if (gameMode === "fortune") {
            // Detect player win immediately without waiting for a bot turn
            if (checkWin(size, nextBoard, 1)) {
                await finishGame("0");
                return;
            }
            const flip = await flipCoin();
            setFortuneFlip(flip);
            if (flip === "bot") {
                await runFortuneBotTurn(nextBoard);
            }
            // flip === "player": player goes again, nothing else to do

        } else {
            // Classic
            await runClassicBotTurn(nextBoard);
        }
    };

    // ---- reset board -------------------------------------------------------

    const resetGame = () => {
        gameFinishedRef.current = false;
        startTimeRef.current = Date.now();
        setBoard({});
        setCurrentPlayer(1);
        setLoadingBot(false);
        setGameOver(false);
        setWinner(null);
        setTurns(0);
        setMasterPiecesLeft(2);
        setFortuneFlip(null);
        setCoinAnimating(false);
        setCoinAnimResult(null);
        clearTurnTimer();

        if (gameMode === "fortune") {
            initialFlipStartedRef.current = false;
            setResetKey((k) => k + 1);
        }
    };


    // ---- extra actions -------------------------------------------------------
    const skipAction = async (currentBoard: Board) => {
        if (gameFinishedRef.current || gameOver || loadingBot || coinAnimating || currentPlayer !== 1) return;

        setClueCell(null);

        if (gameMode === "master") {
            if (masterPiecesLeft > 1) {
                // Player still has a second piece to place this turn
                setMasterPiecesLeft(1);
                return;
            }
            setMasterPiecesLeft(2);
            await runMasterBotTurn(currentBoard);

        } else if (gameMode === "fortune") {
            const flip = await flipCoin();
            setFortuneFlip(flip);
            if (flip === "bot") {
                await runFortuneBotTurn(currentBoard);
            }

        } else {
            // Classic
            await runClassicBotTurn(currentBoard);
        }
    };

    const askForClue = async (currentBoard: Board): Promise<{ x: number; y: number; z: number } | null> => {
    const API_URL = import.meta.env.VITE_GAMEY_URL ?? "http://localhost:4000";

    const yen = buildYENReversed(size, currentBoard);

    const res = await fetch(`${API_URL}/v1/ybot/choose/montecarlo_bot`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify(yen),
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Clue request failed ${res.status}${text ? `: ${text}` : ""}`);
    }

    const data = await res.json();

    const { x, y, z } = data?.coords ?? {};

    const valid =
        typeof x === "number" &&
        typeof y === "number" &&
        typeof z === "number";

    if (!valid) return null;

    return { x, y, z };
};

const handleClue = async (currentBoard: Board) => {
    try {
        const coords = await askForClue(currentBoard);
        if (!coords) return;

        const key = `${coords.x},${coords.y}`;
        setClueCell(key);
    } catch (e) {
        console.error("Clue error:", e);
    }
};

    // ---- timer ------
    // in master skips one piece

    function clearTurnTimer() {
        if (turnTimeoutRef.current) {
            clearTimeout(turnTimeoutRef.current);
            turnTimeoutRef.current = null;
        }
        setTurnDeadline(null);
    }

    function armTurnTimer() {
        clearTurnTimer();
        setTurnDeadline(Date.now() + TURN_TIMEOUT_MS);
        turnTimeoutRef.current = setTimeout(() => {
            turnTimeoutRef.current = null;
            setTurnDeadline(null);
            if (!gameFinishedRef.current) {
                void skipAction(boardRef.current);
            }
        }, TURN_TIMEOUT_MS);
    }

    useEffect(() => {
        const playerActive =
            !gameOver &&
            !loadingBot &&
            !coinAnimating &&
            currentPlayer === 1 &&
            (gameMode !== "fortune" || fortuneFlip === "player");

        if (playerActive) {
            armTurnTimer();
        } else {
            clearTurnTimer();
        }
        return clearTurnTimer;
    }, [currentPlayer, loadingBot, coinAnimating, gameOver, gameMode, fortuneFlip, masterPiecesLeft, board]);

    return {
        board,
        clueCell,
        currentPlayer,
        loadingBot,
        gameOver,
        winner,
        handleCellClick,
        skipAction,
        askForClue,
        handleClue,
        resetGame,
        masterPiecesLeft,
        fortuneFlip,
        coinAnimating,
        coinAnimResult,
        turnDeadline,
        turnTimeoutMs: TURN_TIMEOUT_MS,
    };
}

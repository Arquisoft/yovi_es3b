import type { GameResult } from "./HistoryPage.tsx";
import "./GameHistoryCard.css";

// Función auxuliar para formatear la duración de la partida
// Recibimos milisegundos y devolvemos minutos y segundos
function formatDuration(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

// Formateamos la fecha de la partida
// Recibimos el string clásico y devolvemos:
// Hoy/Ayer/Día, hora:minutos
function formatDate(isoString: string): string {
    const date = new Date(isoString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const time = date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

    if (isToday) return `Hoy, ${time}`;
    if (isYesterday) return `Ayer, ${time}`;
    return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" }) + `, ${time}`;
}

// Recibimos el resultado del juego, definido en la página del historial
type Props = {
    game: GameResult;
};

// Carta individual del historial
// Mostramos estilos diferentes para partidas ganadas o perdidas
// El div de estadísticas muestra duración, turnos y dificultad
// Header muestra Victoria o derrota y la fecha
const GameHistoryCard: React.FC<Props> = ({ game }) => {
    const isWin = game.winner === "player";

    return (
        // Aplicamos un estilo diferente para partidas ganadas y perdidas
        <div className={`game-card ${isWin ? "game-card--win" : "game-card--loss"}`}>
            <div className="game-card__header">
                <span className={`game-card__result ${isWin ? "game-card__result--win" : "game-card__result--loss"}`}>
                  {isWin ? "Victoria" : "Derrota"}
                </span>
                <span className="game-card__date">{formatDate(game.createdAt)}</span>
            </div>
            <div className="game-card__stats">
                <div className="game-card__stat">
                    <span className="game-card__stat-label">Duración</span>
                    <span className="game-card__stat-value">{formatDuration(game.durationMs)}</span>
                </div>
                <div className="game-card__stat">
                    <span className="game-card__stat-label">Turnos</span>
                    <span className="game-card__stat-value">{game.turns}</span>
                </div>
                <div className="game-card__stat game-card__stat--full">
                    <span className="game-card__stat-label">Dificultad</span>
                    <span className={`game-card__difficulty game-card__difficulty--${game.difficulty}`}>
                        {{ easy: "🎲 Fácil", hard: "🧠 Difícil", extreme: "🔥 Extremo", impossible: "👿 Imposible" }[game.difficulty]}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default GameHistoryCard;
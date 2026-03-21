import type { GameResult } from "./HistoryPage.tsx";
import "./GameHistoryCard.css";
import { useTranslation } from "react-i18next";

// Función auxuliar para formatear la duración de la partida
// Recibimos milisegundos y devolvemos minutos y segundos
function formatDuration(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

function formatDate(isoString: string, t: (key: string) => string, locale: string): string {
    const date = new Date(isoString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const time = date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });

    if (isToday) return `${t('history.today')}, ${time}`;
    if (isYesterday) return `${t('history.yesterday')}, ${time}`;
    return date.toLocaleDateString(locale, { day: "numeric", month: "short" }) + `, ${time}`;
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
    const { t, i18n } = useTranslation();
    const isWin = game.winner === "player";
    const locale = i18n.language.startsWith('es') ? 'es-ES' : 'en-GB';

    return (
        // Aplicamos un estilo diferente para partidas ganadas y perdidas
        <div className={`game-card ${isWin ? "game-card--win" : "game-card--loss"}`}>
            <div className="game-card__header">
                <span className={`game-card__result ${isWin ? "game-card__result--win" : "game-card__result--loss"}`}>
                    {isWin ? t('history.win') : t('history.loss')}
                </span>
                <span className="game-card__date">{formatDate(game.createdAt, t, locale)}</span>
            </div>
            <div className="game-card__stats">
                <div className="game-card__stat">
                    <span className="game-card__stat-label">{t('history.duration')}</span>
                    <span className="game-card__stat-value">{formatDuration(game.durationMs)}</span>
                </div>
                <div className="game-card__stat">
                    <span className="game-card__stat-label">{t('history.turns')}</span>
                    <span className="game-card__stat-value">{game.turns}</span>
                </div>
                <div className="game-card__stat game-card__stat--full">
                    <span className="game-card__stat-label">{t('history.difficulty')}</span>
                    <span className={`game-card__difficulty game-card__difficulty--${game.difficulty}`}>
                        {{ easy: "🎲 Fácil", hard: "🧠 Difícil", extreme: "🔥 Extremo", impossible: "👿 Imposible" }[game.difficulty]}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default GameHistoryCard;
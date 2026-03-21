import type { GameResult } from "./HistoryPage.tsx";
import "./GameHistoryCard.css";
import { useTranslation } from "react-i18next";

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

type Props = {
    game: GameResult;
};

const GameHistoryCard: React.FC<Props> = ({ game }) => {
    const { t, i18n } = useTranslation();
    const isWin = game.winner === "player";
    const locale = i18n.language.startsWith('es') ? 'es-ES' : 'en-GB';

    return (
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
                        {game.difficulty === "easy" ? t('history.difficultyEasy') : t('history.difficultyHard')}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default GameHistoryCard;
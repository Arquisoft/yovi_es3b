import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext.tsx";
import "./RankingPage.css";

type Difficulty = "easy" | "hard" | "extreme" | "impossible";

type RankingEntry = {
    _id: string;
    username: string;
    photoURL?: string;
    points: number;
    gamesPlayed: number;
    gamesWon: number;
    gamesLost: number;
};

const DIFFICULTY_FILTERS: { id: Difficulty; labelKey: string }[] = [
    { id: "easy",       labelKey: "game.difficultyEasy" },
    { id: "hard",       labelKey: "game.difficultyHard" },
    { id: "extreme",    labelKey: "game.difficultyExtreme" },
    { id: "impossible", labelKey: "game.difficultyImpossible" },
];

const RankingPage: React.FC = () => {
    const { t } = useTranslation();
    const { user, username: myUsername } = useAuth();
    const [difficulty, setDifficulty] = useState<Difficulty>("easy");
    const [entries, setEntries] = useState<RankingEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;

        const fetchRanking = async () => {
            setLoading(true);
            setError(null);
            try {
                const token = await user.getIdToken();
                const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
                const res = await fetch(`${API_URL}/users?difficulty=${difficulty}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) throw new Error(t("ranking.error"));
                const data = await res.json();
                setEntries(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchRanking();
    }, [user, difficulty]);

    const formatWinRate = (entry: RankingEntry) => {
        if (entry.gamesPlayed === 0) return "—";
        return `${((entry.gamesWon / entry.gamesPlayed) * 100).toFixed(1)}%`;
    };

    return (
        <div className="ranking-page">
            <h1 className="ranking-title">{t("ranking.title")}</h1>

            <div className="ranking-filters" role="tablist" aria-label={t("ranking.filterDifficulty")}>
                {DIFFICULTY_FILTERS.map((f) => (
                    <button
                        key={f.id}
                        role="tab"
                        aria-selected={difficulty === f.id}
                        className={`ranking-filter${difficulty === f.id ? " ranking-filter--active" : ""}`}
                        onClick={() => setDifficulty(f.id)}
                    >
                        {t(f.labelKey)}
                    </button>
                ))}
            </div>

            {loading && <p className="ranking-status">{t("ranking.loading")}</p>}
            {error && !loading && <p className="ranking-status ranking-status--error">{error}</p>}
            {!loading && !error && entries.length === 0 && (
                <p className="ranking-status">{t("ranking.empty")}</p>
            )}

            {!loading && !error && entries.length > 0 && (
                <div className="ranking-table-wrapper">
                    <table className="ranking-table">
                        <thead>
                            <tr>
                                <th>{t("ranking.colPos")}</th>
                                <th>{t("ranking.colUser")}</th>
                                <th>{t("ranking.colPoints")}</th>
                                <th>{t("ranking.colPlayed")}</th>
                                <th>{t("ranking.colWon")}</th>
                                <th>{t("ranking.colLost")}</th>
                                <th>{t("ranking.colWinRate")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map((entry, idx) => {
                                const isMe = !!myUsername && entry.username === myUsername;
                                return (
                                    <tr
                                        key={entry._id}
                                        className={`ranking-row${isMe ? " ranking-row--me" : ""}`}
                                    >
                                        <td className="ranking-pos">{idx + 1}</td>
                                        <td className="ranking-user">
                                            {entry.photoURL && (
                                                <img
                                                    src={`/avatars/${entry.photoURL}`}
                                                    alt=""
                                                    className="ranking-avatar"
                                                />
                                            )}
                                            <span>{entry.username}</span>
                                        </td>
                                        <td className="ranking-points">{entry.points}</td>
                                        <td>{entry.gamesPlayed}</td>
                                        <td>{entry.gamesWon}</td>
                                        <td>{entry.gamesLost}</td>
                                        <td>{formatWinRate(entry)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <p className="ranking-legend">{t("ranking.pointsLegend")}</p>
        </div>
    );
};

export default RankingPage;

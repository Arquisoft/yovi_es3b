import { useAuth } from "../../context/AuthContext.tsx";
import {useEffect, useState} from "react";
import GameHistoryCard from "./GameHistoryCard.tsx";
import "./HistoryPage.css";
import { useTranslation } from "react-i18next";

// Resultado del juego para mostrar en el historial
export type GameResult = {
    _id: string;
    winner: "player" | "bot";
    durationMs: number;
    turns: number;
    difficulty: "easy" | "hard" | "extreme" | "impossible";
    createdAt: string;
};

const HistoryPage: React.FC = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    // Guarda las partidas registradas
    const [games, setGames] = useState<GameResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Se ejecuta después de renderizar el componente
    // Cambia al cambiar el usuario ([user])
    useEffect(() => {
        if (!user) return;

        const fetchGames = async () => {
            try {
                const token = await user.getIdToken();
                const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
                const res = await fetch(`${API_URL}/games/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) throw new Error(t('history.error'));
                const data = await res.json();
                setGames(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchGames();
    }, [user]);

    // Por si no ha acabado de cargar las partidas
    if (loading) return <p className="history-status">{t('history.loading')}</p>;
    // En caso de error mostramos el mensaje
    if (error) return <p className="history-status">{error}</p>;
    if (games.length === 0) return <p className="history-status">{t('history.empty')}</p>;

    // Creamos una card del historial por cada partida guardada
    return (
        <div className="history-page">
            <h1 className="history-title">{t('history.title')}</h1>
            <p className="history-subtitle">{t('history.subtitle', { count: games.length })}</p>
            <div className="history-grid">
                {games.map((game) => (
                    <GameHistoryCard key={game._id} game={game} />
                ))}
            </div>
        </div>
    );
};

export default HistoryPage;
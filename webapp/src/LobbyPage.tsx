import { useCallback, useEffect, useState } from "react";
import { useAuth } from './context/AuthContext';
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import './LobbyPage.css';
import GameBoard from "./components/board/GameBoard.tsx";
import {PARTICLES_CONFIG} from "./lobbyParticlesConfig.ts";

const LobbyPage: React.FC = () => {
    const { username } = useAuth();
    const [engineReady, setEngineReady] = useState(false);
    const [playing, setPlaying] = useState(false);

    useEffect(() => {
        initParticlesEngine(async (engine) => {
            await loadSlim(engine);
        }).then(() => setEngineReady(true));
    }, []);

    const particlesLoaded = useCallback(async () => {}, []);

    if (playing) {
        return <GameBoard botId={"random_bot"} difficulty={"easy"} />;
    }

    return (
        <div className="lobby-page">
            {engineReady && (
                <Particles
                    id="lobby-particles"
                    className="lobby-particles"
                    options={PARTICLES_CONFIG}
                    particlesLoaded={particlesLoaded}
                />
            )}

            <div className="lobby-container">
                <span className="lobby-game-name">Game Y</span>

                <h1 className="lobby-title">
                    Bienvenido,{' '}
                    <span className="lobby-title__username">{username ?? '...'}</span>
                </h1>

                <p className="lobby-description">
                    YOVI es nuestra versión web de{' '}
                    <a href="https://es.wikipedia.org/wiki/Y_(juego)" target="_blank" rel="noopener noreferrer">
                        Game Y
                    </a>
                    , un juego de tablero clásico desarrollado por estudiantes de
                    Ingeniería Informática de la Universidad de Oviedo.
                </p>

                <div className="lobby-footer">
                    <button
                        className="lobby-btn-primary"
                        onClick={() => setPlaying(true)}
                    >
                        ▶&nbsp;&nbsp;Partida rápida
                    </button>
                    <a
                        href="https://arquisoft.github.io/yovi_es3b/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="lobby-docs-link"
                    >
                        Documentación oficial →
                    </a>
                </div>
            </div>
        </div>
    );
};

export default LobbyPage;
import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from './context/AuthContext';
import { useTranslation, Trans } from 'react-i18next';
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import './LobbyPage.css';
import GameBoard from "./components/board/GameBoard.tsx";
import { PARTICLES_CONFIG } from "./lobbyParticlesConfig.ts";

const LobbyPage: React.FC = () => {
    const { username } = useAuth();
    const { t } = useTranslation();
    const [engineReady, setEngineReady] = useState(false);
    const [playing, setPlaying] = useState(false);

    useEffect(() => {
        initParticlesEngine(async (engine) => {
            await loadSlim(engine);
        }).then(() => setEngineReady(true));
    }, []);

    const particlesLoaded = useCallback(async () => {}, []);

    // Etiqueta personalizada para el enlace i18n a Wikipedia del juego
    const transComponents = {
        gameLink: React.createElement('a', {
            href: 'https://es.wikipedia.org/wiki/Y_(juego)',
            target: '_blank',
            rel: 'noopener noreferrer'
        })
    };

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
                    {t('lobby.welcome')}{' '}
                    <span className="lobby-title__username">{username ?? '...'}</span>
                </h1>

                <p className="lobby-description">
                    <Trans
                        i18nKey="lobby.description"
                        components={transComponents}
                    />
                </p>

                <div className="lobby-footer">
                    <button
                        className="lobby-btn-primary"
                        onClick={() => setPlaying(true)}
                    >
                        {'▶\u00a0\u00a0'}{t('lobby.quickGame')}
                    </button>
                    <a
                        href="https://arquisoft.github.io/yovi_es3b/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="lobby-docs-link"
                    >
                        {t('lobby.officialDocs')}{' \u2192'}
                    </a>
                </div>
            </div>
        </div>
    );
};

export default LobbyPage;
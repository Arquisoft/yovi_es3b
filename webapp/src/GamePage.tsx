import { useState } from "react";
import GameBoard from "./components/board/GameBoard.tsx";
import "./GameSetup.css";
import { useTranslation } from "react-i18next";

type Mode = "easy" | "hard" | null;

const BOARD_SIZES = [5, 7, 9, 11, 13] as const;
const DEFAULT_BOARD_SIZE = 9;

const GamePage: React.FC = () => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>(null);
  const [boardSize, setBoardSize] = useState<number>(DEFAULT_BOARD_SIZE);
  const [difficulty, setDifficulty] = useState<"easy" | "hard">("easy");

  const botId = mode === "easy" ? "random_bot" : mode === "hard" ? "corner_bot" : undefined;

  if (!mode) {
    // Muestra los botones de selección de modo
    return (
      <div className="setup">
        <div className="setup__card">
          {/* Cabecera */}
          <div className="setup__header">
            <span className="setup__tag">{t('newGame')}</span>
            <h1 className="setup__title">{t('title')}</h1>
            <p className="setup__subtitle">{t('subtitle')}</p>
          </div>

          <div className="setup__divider" />

          {/* Tamaño */}
          <div className="setup__field">
            <label className="setup__label">{t('size')}</label>
            <div className="setup__sizes">
              {BOARD_SIZES.map((s) => (
                <button
                  key={s}
                  className={`setup__size-btn${s === boardSize ? " setup__size-btn--active" : ""}`}
                  onClick={() => setBoardSize(s)}
                >
                  <span className="setup__size-num">{s}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="setup__divider" />

          {/* Dificultad */}
          <div className="setup__field">
            <label className="setup__label">{t('difficulty')}</label>
            <div className="setup__diff-options">
              <button
                className={`setup__diff-btn${difficulty === "easy" ? " setup__diff-btn--active" : ""}`}
                onClick={() => setDifficulty("easy")}
              >
                <span className="setup__diff-icon setup__diff-icon--easy" />
                <div className="setup__diff-text">
                  <span className="setup__diff-name">{t('easy')}</span>
                  <span className="setup__diff-desc">{t('random_bot')}</span>
                </div>
              </button>
              <button
                className={`setup__diff-btn${difficulty === "hard" ? " setup__diff-btn--active" : ""}`}
                onClick={() => setDifficulty("hard")}
              >
                <span className="setup__diff-icon setup__diff-icon--hard" />
                <div className="setup__diff-text">
                  <span className="setup__diff-name">{t('hard')}</span>
                  <span className="setup__diff-desc">{t('hard_bot')}</span>
                </div>
              </button>
            </div>
          </div>

          <div className="setup__divider" />

          {/* Botón de jugar */}
          <button className="setup__play-btn" onClick={() => setMode(difficulty)}>
            {t('startGame')}
          </button>
        </div>
      </div>
    );
  }

  return <GameBoard size={boardSize} botId={botId} difficulty={mode}/>;
};

export default GamePage;
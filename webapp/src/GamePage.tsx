import { useState } from "react";
import GameBoard from "./components/board/GameBoard.tsx";
import "./GameSetup.css";
import { useTranslation } from "react-i18next";

type Mode = "easy" | "hard" | "extreme" | "impossible" | null;

const BOARD_SIZES = [5, 7, 9, 11, 13] as const;
const DEFAULT_BOARD_SIZE = 9;

const BOT_MAP: Record<string, string> = {
  easy: "random_bot",
  hard: "heuristic_bot",
  extreme: "minimax_bot",
  impossible: "montecarlo_bot",
};

const DIFF_KEYS: Record<string, string> = {
  easy: "game.difficultyEasy",
  hard: "game.difficultyHard",
  extreme: "game.difficultyExtreme",
  impossible: "game.difficultyImpossible",
};

const GamePage: React.FC = () => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>(null);
  const [boardSize, setBoardSize] = useState<number>(DEFAULT_BOARD_SIZE);
  const [difficulty, setDifficulty] = useState<"easy" | "hard" | "extreme" | "impossible">("easy");

  if (!mode) {
    return (
      <div className="setup">
        <div className="setup__card">
          <div className="setup__header">
            <span className="setup__tag">{t('setup.newGame')}</span>
            <h1 className="setup__title">Game Y</h1>
            <p className="setup__subtitle">{t('setup.subtitle')}</p>
          </div>

          <div className="setup__divider" />

          <div className="setup__field">
            <label className="setup__label">{t('setup.size')}</label>
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

          <div className="setup__field">
            <label className="setup__label">{t('setup.difficulty')}</label>
            <div className="setup__diff-options">
              {(["easy", "hard", "extreme", "impossible"] as const).map((d) => (
                <button
                  key={d}
                  className={`setup__diff-btn${difficulty === d ? " setup__diff-btn--active" : ""}`}
                  onClick={() => setDifficulty(d)}
                >
                  <span className={`setup__diff-icon setup__diff-icon--${d}`} />
                  <div className="setup__diff-text">
                    <span className="setup__diff-name">{t(DIFF_KEYS[d])}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="setup__divider" />

          <button className="setup__play-btn" onClick={() => setMode(difficulty)}>
            {t('setup.startGame')}
          </button>
        </div>
      </div>
    );
  }

  return <GameBoard size={boardSize} botId={BOT_MAP[mode]} difficulty={mode}/>;
};

export default GamePage;

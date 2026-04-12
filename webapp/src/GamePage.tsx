import { useState } from "react";
import GameBoard from "./components/board/GameBoard.tsx";
import { type GameMode } from "./components/board/GameBoardLogic.ts";
import "./GameSetup.css";
import { useTranslation } from "react-i18next";

type Difficulty = "easy" | "hard" | "extreme" | "impossible";

const BOARD_SIZES = [5, 7, 9, 11, 13] as const;
const DEFAULT_BOARD_SIZE = 9;

const BOT_MAP: Record<Difficulty, string> = {
  easy: "random_bot",
  hard: "heuristic_bot",
  extreme: "minimax_bot",
  impossible: "montecarlo_bot",
};

const DIFF_KEYS: Record<Difficulty, string> = {
  easy: "game.difficultyEasy",
  hard: "game.difficultyHard",
  extreme: "game.difficultyExtreme",
  impossible: "game.difficultyImpossible",
};

const GAME_MODES: { id: GameMode; labelKey: string; descKey: string }[] = [
  { id: "classic", labelKey: "setup.modeClassic", descKey: "setup.modeClassicDesc" },
  { id: "master",  labelKey: "setup.modeMaster",  descKey: "setup.modeMasterDesc"  },
  { id: "fortune", labelKey: "setup.modeFortune", descKey: "setup.modeFortuneDesc" },
];

const GamePage: React.FC = () => {
  const { t } = useTranslation();
  const [started, setStarted] = useState(false);
  const [boardSize, setBoardSize] = useState<number>(DEFAULT_BOARD_SIZE);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [gameMode, setGameMode] = useState<GameMode>("classic");

  if (started) {
    return (
      <GameBoard
        size={boardSize}
        botId={BOT_MAP[difficulty]}
        difficulty={difficulty}
        gameMode={gameMode}
      />
    );
  }

  return (
    <div className="setup">
      <div className="setup__card">
        <div className="setup__header">
          <span className="setup__tag">{t('setup.newGame')}</span>
          <h1 className="setup__title">Game Y</h1>
          <p className="setup__subtitle">{t('setup.subtitle')}</p>
        </div>

        <div className="setup__divider" />

        {/* Board size */}
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

        {/* Game mode */}
        <div className="setup__field">
          <label className="setup__label">{t('setup.gameMode')}</label>
          <div className="setup__diff-options">
            {GAME_MODES.map(({ id, labelKey, descKey }) => (
              <button
                key={id}
                className={`setup__diff-btn${gameMode === id ? " setup__diff-btn--active" : ""}`}
                onClick={() => setGameMode(id)}
              >
                <span className={`setup__diff-icon setup__diff-icon--mode-${id}`} />
                <div className="setup__diff-text">
                  <span className="setup__diff-name">{t(labelKey)}</span>
                  <span className="setup__diff-desc">{t(descKey)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="setup__divider" />

        {/* Difficulty */}
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

        <button className="setup__play-btn" onClick={() => setStarted(true)}>
          {t('setup.startGame')}
        </button>
      </div>
    </div>
  );
};

export default GamePage;

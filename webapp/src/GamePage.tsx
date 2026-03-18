import { useState } from "react";
import GameBoard from "./components/board/GameBoard.tsx";
import { useTranslation } from "react-i18next";

type Mode = "easy" | "hard" | null;

const GamePage: React.FC = () => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>(null);

  const botId = mode === "easy" ? "random_bot" : mode === "hard" ? "corner_bot" : undefined;

  if (!mode) {
    return (
        <div style={{ textAlign: "center", marginTop: "50px" }}>
          <h1>{t('game.selectMode')}</h1>
          <div style={{ marginTop: "20px" }}>
            <button
                style={{ marginRight: "10px", padding: "10px 20px", fontSize: "16px" }}
                onClick={() => setMode("easy")}
            >
              {t('game.easy')}
            </button>
            <button
                style={{ padding: "10px 20px", fontSize: "16px" }}
                onClick={() => setMode("hard")}
            >
              {t('game.hard')}
            </button>
          </div>
        </div>
    );
  }

  return <GameBoard size={9} botId={botId} difficulty={mode} />;
};

export default GamePage;
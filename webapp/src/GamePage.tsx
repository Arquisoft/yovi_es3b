import { useState } from "react";
import GameBoard from "./components/GameBoard";

type Mode = "easy" | "hard" | null;

const GamePage: React.FC = () => {
  const [mode, setMode] = useState<Mode>(null);

  // Define el botId según el modo
  const botId = mode === "easy" ? "random_bot" : mode === "hard" ? "corner_bot" : undefined;

  if (!mode) {
    // Muestra los botones de selección de modo
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <h1>Selecciona un modo de juego</h1>
        <div style={{ marginTop: "20px" }}>
          <button
            style={{ marginRight: "10px", padding: "10px 20px", fontSize: "16px" }}
            onClick={() => setMode("easy")}
          >
            Modo fácil
          </button>
          <button
            style={{ padding: "10px 20px", fontSize: "16px" }}
            onClick={() => setMode("hard")}
          >
            Modo difícil
          </button>
        </div>
      </div>
    );
  }

  // Una vez seleccionado, renderiza el GameBoard con el botId correspondiente
  return <GameBoard size={9} botId={botId} difficulty={mode}/>;
};

export default GamePage;
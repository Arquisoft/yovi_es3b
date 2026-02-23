import './App.css'
import { useState } from 'react';
import RegisterForm from './RegisterForm';
import GameBoard from './components/GameBoard';

function App() {
    const [playerName, setPlayerName] = useState<string | null>(null);

    if (playerName !== null) {
        return <GameBoard userName={playerName} />; // ← pasa el nombre
    }

    return (
        <div className="App">
            <h2>Welcome to the Software Arquitecture 2025-2026 course</h2>
            <RegisterForm onSuccess={(name) => setPlayerName(name)} />
        </div>
    );
}

export default App;

import './App.css'
import { useState } from 'react';
import RegisterForm from './RegisterForm';
import GameBoard from './components/GameBoard';

function App() {
    const [registered, setRegistered] = useState(false);

    if (registered) {
        return <GameBoard />;
    }

    return (
        <div className="App">
            <h2>Welcome to the Software Arquitecture 2025-2026 course</h2>
            <RegisterForm onSuccess={() => setRegistered(true)} />
        </div>
    );
}

export default App;

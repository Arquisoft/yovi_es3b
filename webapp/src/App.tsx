import { useAuth } from './context/AuthContext';
import AuthPage from './AuthPage';
import GameBoard from './components/GameBoard';
import Navbar from './components/NavBar';
import './App.css';

function App() {
    const { user, loading } = useAuth();

    // Mientras Firebase comprueba si hay sesión activa, no renderizamos nada
    if (loading) return <div>Loading...</div>;

    return (
        <div className="App">
            <Navbar />
            {user ? <GameBoard /> : <AuthPage onSuccess={() => {}} />}
        </div>
    );
}

export default App;
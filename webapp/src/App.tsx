import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import AuthPage from './AuthPage';
import LobbyPage from './LobbyPage';
import GamePage from './GamePage';
import ProfilePage from './ProfilePage';
import HistoryPage from './components/history/HistoryPage.tsx';
import RankingPage from './components/ranking/RankingPage.tsx';
import Navbar from './components/NavBar';
import './App.css';

function App() {
    const { user, loading } = useAuth();
    const [currentPage, setCurrentPage] = useState('lobby');

    if (loading) return <div className="loading">Cargando...</div>;

    if (!user) return <AuthPage onSuccess={() => setCurrentPage('lobby')} />;

    const renderPage = () => {
        switch (currentPage) {
            case 'game':    return <GamePage />;
            case 'profile': return <ProfilePage />;
            case 'history': return <HistoryPage />;
            case 'ranking': return <RankingPage />;
            default:        return <LobbyPage />;
        }
    };

    return (
        <div className="App">
            <Navbar currentPage={currentPage} onNavigate={setCurrentPage} />
            <main className="main-content">
                {renderPage()}
            </main>
        </div>
    );
}

export default App;
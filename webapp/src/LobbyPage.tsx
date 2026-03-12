import { useAuth } from './context/AuthContext';

const LobbyPage: React.FC = () => {
    const { username } = useAuth();

    return (
        <div className="lobby-page">
            <h1>Bienvenido, {username ?? '...'}</h1>
        </div>
    );
};

export default LobbyPage;
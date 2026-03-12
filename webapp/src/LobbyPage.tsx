import { useAuth } from './context/AuthContext';

const LobbyPage: React.FC = () => {
    const { user } = useAuth();

    return (
        <div className="lobby-page">
            <h1>Bienvenido, {user?.displayName ?? user?.email}</h1>
        </div>
    );
};

export default LobbyPage;
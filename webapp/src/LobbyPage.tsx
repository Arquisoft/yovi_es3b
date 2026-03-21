import { useAuth } from './context/AuthContext';
import { useTranslation } from 'react-i18next'

const LobbyPage: React.FC = () => {
    const { username } = useAuth();
    const { t } = useTranslation()
    return (
        <div className="lobby-page">
            <h1>{t('lobby.welcome', { name: username ?? '...' })}</h1>
        </div>
    );
};

export default LobbyPage;
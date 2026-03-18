import { signOut } from 'firebase/auth';
import { auth } from '../firebase/firebase';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageToggle from './LanguageToggle';

interface Props {
    currentPage: string;
    onNavigate: (page: string) => void;
}

const Navbar: React.FC<Props> = ({ currentPage, onNavigate }) => {
    const { user } = useAuth();
    const { t } = useTranslation();

    const handleLogout = async () => {
        await signOut(auth);
    };

    const navItems = [
        { id: 'lobby',   label: t('nav.home') },
        { id: 'game',    label: t('nav.play') },
        { id: 'profile', label: t('nav.profile') },
        { id: 'history', label: t('nav.history') },
    ];

    return (
        <nav className="navbar">
            <span className="navbar-title" onClick={() => onNavigate('lobby')}>
                YOVI
            </span>
            <div className="navbar-links">
                {navItems.map(item => (
                    <button
                        key={item.id}
                        className={`navbar-link${currentPage === item.id ? ' navbar-link--active' : ''}`}
                        onClick={() => onNavigate(item.id)}
                    >
                        {item.label}
                    </button>
                ))}
            </div>
            <div className="navbar-right">
                <LanguageToggle />
                {user && (
                    <button className="navbar-logout" onClick={handleLogout}>
                        {t('nav.logout')}
                    </button>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
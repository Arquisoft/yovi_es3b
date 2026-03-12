import { signOut } from 'firebase/auth';
import { auth } from '../firebase/firebase';
import { useAuth } from '../context/AuthContext';

interface Props {
    currentPage: string;
    onNavigate: (page: string) => void;
}

const Navbar: React.FC<Props> = ({ currentPage, onNavigate }) => {
    const { user } = useAuth();

    const handleLogout = async () => {
        await signOut(auth);
    };

    const navItems = [
        { id: 'lobby',   label: 'Inicio' },
        { id: 'game',    label: 'Jugar' },
        { id: 'profile', label: 'Mi perfil' },
        { id: 'history', label: 'Historial' },
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
            {user && (
                <button className="navbar-logout" onClick={handleLogout}>
                    Cerrar sesión
                </button>
            )}
        </nav>
    );
};

export default Navbar;
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/firebase';
import { useAuth } from '../context/AuthContext';

const Navbar: React.FC = () => {
    const { user } = useAuth();

    const handleLogout = async () => {
        await signOut(auth);
    };

    return (
        <nav className="navbar">
            <span className="navbar-title">YOVI</span>
            {user && (
                <div className="navbar-user">
                    <span>{user.email}</span>
                    <button onClick={handleLogout}>Log out</button>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
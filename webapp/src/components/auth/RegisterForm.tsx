import { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../../firebase/firebase';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

interface Props {
    onSuccess: () => void;
    onSwitchToLogin: () => void;
}

const RegisterForm: React.FC<Props> = ({ onSuccess, onSwitchToLogin }) => {
    const { t } = useTranslation();
    const { setUsername: setContextUsername } = useAuth();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!username.trim() || !email.trim() || !password.trim()) {
            setError(t('auth.fillAllFields'));
            return;
        }
        setLoading(true);

        try {
            // Creamos usuario y actualizamos displayName por si la consulta
            // a MongoDB tarda, el usuario ya tiene su nombre en Firebase
            const credential = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(credential.user, { displayName: username });
            setContextUsername(username);
            
            const token = await credential.user.getIdToken();

            // Registramos igualmente el usuario
            const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
            try {
                const res = await fetch(`${API_URL}/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({ username }),
                });
                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.error || t('auth.serverError'));
                }
            } catch (err: any) {
                setError(err.message || t('auth.registrationError'));
            }
            
            onSuccess();
        } catch (err: any) {
            setError(err.message || t('auth.registrationError'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="register-form">
            <h2>{t('auth.createAccount')}</h2>
            <div className="form-group">
                <label htmlFor="username">{t('auth.username')}</label>
                <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="form-input"
                />
            </div>
            <div className="form-group">
                <label htmlFor="email">{t('auth.email')}</label>
                <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input"
                />
            </div>
            <div className="form-group">
                <label htmlFor="password">{t('auth.password')}</label>
                <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input"
                />
            </div>
            <button type="submit" className="submit-button" disabled={loading}>
                {loading ? t('auth.creatingAccount') : t('auth.register')}
            </button>
            {error && <div className="error-message">{error}</div>}
            <p>{t('auth.haveAccount')} <button type="button" onClick={onSwitchToLogin}>{t('auth.login')}</button></p>
        </form>
    );
};

export default RegisterForm;
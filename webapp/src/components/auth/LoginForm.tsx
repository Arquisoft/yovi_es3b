import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase/firebase';
import { useTranslation } from 'react-i18next';

interface Props {
    onSuccess: () => void;
    onSwitchToRegister: () => void;
}

const LoginForm: React.FC<Props> = ({ onSuccess, onSwitchToRegister }) => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            onSuccess();
        } catch (err: any) {
            setError(t('auth.invalidCredentials'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="register-form">
            <h2>{t('auth.login')}</h2>
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
                {loading ? t('auth.loggingIn') : t('auth.login')}
            </button>
            {error && <div className="error-message">{error}</div>}
            <p>{t('auth.noAccount')} <button type="button" onClick={onSwitchToRegister}>{t('auth.register')}</button></p>
        </form>
    );
};

export default LoginForm;
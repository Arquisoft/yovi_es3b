import { useState } from 'react';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import LanguageToggle from './components/LanguageToggle';

interface Props {
    onSuccess: () => void;
}

const AuthPage: React.FC<Props> = ({ onSuccess }) => {
    const [mode, setMode] = useState<'login' | 'register'>('login');

    return (
        <div className="auth-page">
            <div className="auth-page-header">
                <span className="auth-page-title">YOVI</span>
                <LanguageToggle />
            </div>
            <div className="auth-page-body">
                {mode === 'login' ? (
                    <LoginForm
                        onSuccess={onSuccess}
                        onSwitchToRegister={() => setMode('register')}
                    />
                ) : (
                    <RegisterForm
                        onSuccess={onSuccess}
                        onSwitchToLogin={() => setMode('login')}
                    />
                )}
            </div>
        </div>
    );
};

export default AuthPage;
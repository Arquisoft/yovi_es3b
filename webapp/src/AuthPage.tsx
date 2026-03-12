import { useState } from 'react';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';

interface Props {
    onSuccess: () => void;
}

const AuthPage: React.FC<Props> = ({ onSuccess }) => {
    const [mode, setMode] = useState<'login' | 'register'>('login');

    return (
        <div className="auth-page">
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
    );
};

export default AuthPage;
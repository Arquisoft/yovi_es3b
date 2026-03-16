import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase/firebase';

interface Props {
    onSuccess: () => void;
    onSwitchToLogin: () => void;
}

const RegisterForm: React.FC<Props> = ({ onSuccess, onSwitchToLogin }) => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!username.trim() || !email.trim() || !password.trim()) {
            setError('Please fill in all fields.');
            return;
        }
        setLoading(true);

        try {
            // 1. Crear usuario en Firebase
            const credential = await createUserWithEmailAndPassword(auth, email, password);
            const token = await credential.user.getIdToken();

            // 2. Crear perfil en nuestro backend (Mongo)
            const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
            const res = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,  // JWT de Firebase
                },
                body: JSON.stringify({ username }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Server error');

            setUsername(username);
            onSuccess();
        } catch (err: any) {
            setError(err.message || 'Registration error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="register-form">
            <h2>Create account</h2>
            <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="form-input"
                />
            </div>
            <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input"
                />
            </div>
            <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input"
                />
            </div>
            <button type="submit" className="submit-button" disabled={loading}>
                {loading ? 'Creating account...' : 'Register'}
            </button>
            {error && <div className="error-message">{error}</div>}
            <p>Already have an account? <button type="button" onClick={onSwitchToLogin}>Log in</button></p>
        </form>
    );
};

export default RegisterForm;

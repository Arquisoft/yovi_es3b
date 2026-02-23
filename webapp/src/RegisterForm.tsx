import React, { useState } from 'react';

interface Props {
  onSuccess?: (name:string) => void;
}

const RegisterForm: React.FC<Props> = ({ onSuccess }) => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [welcomeName, setWelcomeName] = useState<string | null>(null); // ← nuevo

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    // Si ya tenemos el mensaje de bienvenida, este click navega al tablero
    if (welcomeName !== null) {
      onSuccess?.(welcomeName);
      return;
    }

    if (!username.trim()) {
      setError('Please enter a username.');
      return;
    }

    setLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
      const res = await fetch(`${API_URL}/createuser`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      const data = await res.json();
      if (res.ok) {
        setWelcomeName(username); // ← guarda el nombre, no navega aún
      } else {
        setError(data.error || 'Server error');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
      <form onSubmit={handleSubmit} className="register-form">
        <div className="form-group">
          <label htmlFor="username">Whats your name?</label>
          <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="form-input"
          />
        </div>
        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? 'Entering...' : welcomeName ? 'Lets go!' : 'Lets go!'}
        </button>

        {welcomeName && (
            <div className="success-message" style={{ marginTop: 12 }}>
              Hello {welcomeName}! Welcome to the course!
            </div>
        )}
        {error && (
            <div className="error-message" style={{ marginTop: 12, color: 'red' }}>
              {error}
            </div>
        )}
      </form>
  );
};

export default RegisterForm;
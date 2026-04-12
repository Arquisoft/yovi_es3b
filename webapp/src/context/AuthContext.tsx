import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../firebase/firebase';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    token: string | null;
    username: string | null;
    setUsername: (username: string) => void;
    photoURL: string | null;
    setPhotoURL: (p: string) => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    token: null,
    username: null,
    setUsername: () => {},
    photoURL: null,
    setPhotoURL: () => {}
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [username, setUsername] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [photoURL, setPhotoURL] = useState<string|null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);
            if (firebaseUser) {
                const idToken = await firebaseUser.getIdToken();
                setToken(idToken);

                try {
                    const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
                    const res = await fetch(`${API_URL}/users/me`, {
                        headers: { Authorization: `Bearer ${idToken}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setUsername(data.username);
                        setPhotoURL(data.photoURL);
                    } else {
                        setUsername(firebaseUser.displayName);
                    }
                } catch (err) {
                    console.error('Error obteniendo perfil:', err);
                    setUsername(firebaseUser.displayName);
                }
            } else {
                setToken(null);
                setUsername(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, token, username, setUsername, photoURL, setPhotoURL}}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);

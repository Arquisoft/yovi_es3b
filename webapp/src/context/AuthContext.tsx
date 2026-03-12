/*Se va a encargar de tener la logica para que cualquier componente sepa si esta logeado el usuario en cualquier
    momento.
 */

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../firebase/firebase';

interface AuthContextType {
    user: User | null;        // usuario de Firebase (null si no logueado)
    loading: boolean;         // true mientras Firebase comprueba la sesión
    token: string | null;     // JWT para mandar al backend
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    token: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Firebase llama a este callback cada vez que cambia el estado de auth
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);
            if (firebaseUser) {
                const idToken = await firebaseUser.getIdToken();
                setToken(idToken);
            } else {
                setToken(null);
            }
            setLoading(false);
        });

        return unsubscribe; // limpia el listener al desmontar
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, token }}>
            {children}
        </AuthContext.Provider>
    );
}

// Hook para usar el contexto fácilmente en cualquier componente
export const useAuth = () => useContext(AuthContext);

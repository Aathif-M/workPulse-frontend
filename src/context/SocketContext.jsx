import { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://api.workpulse.us';
const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        if (user) {

            const newSocket = io(`${BASE_URL}`, {
                query: { userId: user.id }
            });
            setSocket(newSocket);

            if (user.role === 'MANAGER' || user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
                newSocket.emit('join_manager');
            }

            return () => newSocket.close();
        } else {
            if (socket) {
                socket.close();
                setSocket(null);
            }
        }
    }, [user]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};

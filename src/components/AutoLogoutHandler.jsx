import { useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

const AutoLogoutHandler = () => {
    const socket = useSocket();
    const { user, logout } = useAuth();
    const notificationInterval = useRef(null);

    useEffect(() => {
        if (!socket || !user) return;

        const handleForceLogout = (data) => {
            if (data.userId === user.id) {
                console.log('Force logout received:', data.reason);
                alert(data.reason || 'You have been logged out.');
                logout();
            }
        };

        const handleBreakWarning = (data) => {
            if (data.userId === user.id) {
                console.log('Break warning received');
                // Blinking Title
                let isTitleVisible = true;
                const originalTitle = document.title;

                if (notificationInterval.current) clearInterval(notificationInterval.current);

                notificationInterval.current = setInterval(() => {
                    document.title = isTitleVisible ? "⚠️ Your break is ending!" : "WorkPulse";
                    isTitleVisible = !isTitleVisible;
                }, 1000);

                // Stop blinking after 5 minutes (or when action taken - but here just timeout)
                setTimeout(() => {
                    clearInterval(notificationInterval.current);
                    document.title = originalTitle;
                }, 300000); // 5 mins

                // Also show a browser notification if permitted
                if (Notification.permission === "granted") {
                    new Notification("Break Ending Soon", {
                        body: data.message,
                        icon: "/favicon.ico"
                    });
                } else if (Notification.permission !== "denied") {
                    Notification.requestPermission().then(permission => {
                        if (permission === "granted") {
                            new Notification("Break Ending Soon", {
                                body: data.message,
                                icon: "/favicon.ico"
                            });
                        }
                    });
                }
            }
        };

        socket.on('force_logout', handleForceLogout);
        socket.on('break_warning', handleBreakWarning);

        return () => {
            socket.off('force_logout', handleForceLogout);
            socket.off('break_warning', handleBreakWarning);
            if (notificationInterval.current) clearInterval(notificationInterval.current);
            document.title = "WorkPulse"; // Reset check
        };
    }, [socket, user, logout]);

    return null; // This component handles side effects only
};

export default AutoLogoutHandler;

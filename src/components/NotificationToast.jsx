import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';
import './NotificationToast.css';

const NotificationToast = ({ message, type = 'success', onClose, duration = 0 }) => {
    const [isHovered, setIsHovered] = React.useState(false);

    useEffect(() => {
        if (duration > 0 && !isHovered) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onClose, isHovered]);

    if (!message) return null;

    return (
        <div
            className="notification-toast-container"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className={`notification-toast ${type}`}>
                <div className="icon">
                    {type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                </div>
                <div className="content">
                    <p>{message}</p>
                </div>
                <button onClick={onClose} className="close-btn" aria-label="Close notification">
                    <X size={18} />
                </button>
            </div>
        </div>
    );
};

export default NotificationToast;

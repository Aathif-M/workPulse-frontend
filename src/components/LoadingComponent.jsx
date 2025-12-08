import React from 'react';
import './LoadingComponent.css';

const LoadingComponent = ({ fullScreen = false, message = 'Loading...' }) => {
    return (
        <div className={`loading-container ${fullScreen ? 'fullscreen' : ''}`}>
            <div className="spinner"></div>
            {message && <p className="loading-message">{message}</p>}
        </div>
    );
};

export default LoadingComponent;

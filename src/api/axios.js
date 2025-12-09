import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://api.workpulse.us';

const api = axios.create({
    baseURL: BASE_URL,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// api.interceptors.response.use(async (response) => {
//     await new Promise(resolve => setTimeout(resolve, 300));
//     return response;
// }, (error) => {
//     return Promise.reject(error);
// });

export default api;

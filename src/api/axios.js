import axios from 'axios';

const api = axios.create({
    baseURL: `http://${window.location.hostname}:3000/api`,
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

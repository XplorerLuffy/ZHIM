import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

export const consoleApi = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

consoleApi.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('zhim_console_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

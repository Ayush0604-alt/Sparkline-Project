import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Centralized error handling: every consumer gets a normalized error
 * shape { message, status } regardless of whether the failure was a
 * network error, a timeout, or a non-2xx response from the API.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = 'Something went wrong. Please try again.';
    let status = null;

    if (error.response) {
      // Server responded with an error status
      status = error.response.status;
      message = error.response.data?.message || `Request failed with status ${status}`;
    } else if (error.request) {
      // Request was made but no response received
      message = 'Unable to reach the server. Is the backend running?';
    } else if (error.code === 'ECONNABORTED') {
      message = 'Request timed out. Please try again.';
    }

    return Promise.reject({ message, status, original: error });
  }
);

// ------------------------------------------------------------------
// API methods — one function per backend endpoint
// ------------------------------------------------------------------

export const getLatestReadings = () => api.get('/readings/latest').then((res) => res.data);

export const getReadingsByCrane = (craneId, params = {}) =>
  api.get(`/readings/${craneId}`, { params }).then((res) => res.data);

export const getAlerts = (craneId = null) =>
  api.get('/alerts', { params: craneId ? { crane_id: craneId } : {} }).then((res) => res.data);

export const createReading = (reading) => api.post('/readings', reading).then((res) => res.data);

export default api;

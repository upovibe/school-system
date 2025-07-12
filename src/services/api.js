/**
 * UPO UI - API Client
 * 
 * This module centralizes all API communication for the application.
 * It uses Axios for making HTTP requests.
 * 
 * Features:
 * - Pre-configured base URL for the Lumen API.
 * - Easy-to-use methods for GET, POST, etc.
 * - A helper for making authenticated requests with a bearer token.
 * - Centralized error handling (can be expanded later).
 */

const API_BASE_URL = '/api'; // Use relative path for flexibility in different environments

// Create a pre-configured instance of axios
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000, // 10 second timeout
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// --- API Methods ---

const api = {
    /**
     * Performs a GET request.
     * @param {string} endpoint - The API endpoint to call (e.g., '/users').
     * @param {object} [params] - Optional query parameters.
     * @returns {Promise<axios.AxiosResponse<any>>}
     */
    get: (endpoint, params = {}) => {
        return apiClient.get(endpoint, { params });
    },

    /**
     * Performs a POST request.
     * @param {string} endpoint - The API endpoint to call.
     * @param {object} data - The data to send in the request body.
     * @returns {Promise<axios.AxiosResponse<any>>}
     */
    post: (endpoint, data) => {
        return apiClient.post(endpoint, data);
    },

    /**
     * Performs a PUT request.
     * @param {string} endpoint - The API endpoint to call.
     * @param {object} data - The data to send in the request body.
     * @returns {Promise<axios.AxiosResponse<any>>}
     */
    put: (endpoint, data) => {
        return apiClient.put(endpoint, data);
    },

    /**
     * Performs a DELETE request.
     * @param {string} endpoint - The API endpoint to call.
     * @returns {Promise<axios.AxiosResponse<any>>}
     */
    delete: (endpoint) => {
        return apiClient.delete(endpoint);
    },

    /**
     * Creates a new Axios instance with an authorization token.
     * This is useful for making requests to protected endpoints.
     * @param {string} token - The JWT or bearer token.
     * @returns {object} An API client instance with the authorization header set.
     */
    withToken: (token) => {
        const authedApiClient = axios.create({
            baseURL: API_BASE_URL,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });

        return {
            get: (endpoint, params = {}) => authedApiClient.get(endpoint, { params }),
            post: (endpoint, data) => authedApiClient.post(endpoint, data),
            put: (endpoint, data) => authedApiClient.put(endpoint, data),
            delete: (endpoint) => authedApiClient.delete(endpoint),
        };
    },
};

// --- Centralized Error Handling (Example) ---
// Intercept all responses to handle errors globally if needed
apiClient.interceptors.response.use(
    (response) => response, // Any status code within 2xx cause this function to trigger
    (error) => {
        // Any status codes outside 2xx cause this function to trigger
        console.error('API Error:', error.response || error.message);
        
        // You could add logic here to redirect to a login page on 401 Unauthorized errors
        if (error.response && error.response.status === 401) {
            // Example: Clear user data and redirect to login
            // window.router.navigate('/login'); 
        }

        return Promise.reject(error);
    }
);

export default api; 
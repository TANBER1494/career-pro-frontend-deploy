import { BASE_URL } from '../config/constant.js';

const AuthService = {
    signup: async (userData) => {
        const response = await fetch(`${BASE_URL}/api/v1/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        if (!response.ok) throw await response.json();
        return await response.json();
    },

    login: async (credentials) => {
        const response = await fetch(`${BASE_URL}/api/v1/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });
        if (!response.ok) throw await response.json();
        return await response.json();
    },
    
    resendCode: async (email) => {
        const response = await fetch(`${BASE_URL}/api/v1/auth/resend-code`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        if (!response.ok) throw await response.json();
        return await response.json();
    },

    verifyEmail: async (data) => {
        const response = await fetch(`${BASE_URL}/api/v1/auth/verify-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw await response.json();
        return await response.json();
    }
};

export default AuthService;
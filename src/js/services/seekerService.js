import { BASE_URL } from '../config/constant.js';

const getToken = () => localStorage.getItem('authToken');

const SeekerService = {
    // Step 1: Personal Info
    updatePersonalInfo: async (data) => {
        const response = await fetch(`${BASE_URL}/api/v1/job-seeker/profile/step1`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw await response.json();
        return await response.json();
    },

    // Step 2: Education & Preferences
    updateEducation: async (data) => {
        const response = await fetch(`${BASE_URL}/api/v1/job-seeker/profile/step2`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw await response.json();
        return await response.json();
    },

    // Step 3: Upload CV
    uploadCV: async (file) => {
        const formData = new FormData();
        formData.append('cvFile', file);

        const response = await fetch(`${BASE_URL}/api/v1/job-seeker/profile/step3`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getToken()}`
            },
            body: formData
        });
        if (!response.ok) throw await response.json();
        return await response.json();
    },

    // Get Full Profile
    getProfile: async () => {
        const response = await fetch(`${BASE_URL}/api/v1/job-seeker/profile`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        if (!response.ok) throw await response.json();
        return await response.json();
    }
};

export default SeekerService;
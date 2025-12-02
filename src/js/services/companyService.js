import { BASE_URL } from '../config/constant.js';

const getToken = () => localStorage.getItem('authToken');

const CompanyService = {
    // Step 1: Basic Info
    updateCompanyInfo: async (data) => {
        const response = await fetch(`${BASE_URL}/api/v1/companies/profile/step1`, {
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

    // Step 2: Tech Stack & Benefits
    updateCompanyDetails: async (data) => {
        const response = await fetch(`${BASE_URL}/api/v1/companies/profile/step2`, {
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

    // Step 3: Upload Verification Document
    uploadVerification: async (formData) => {
        const response = await fetch(`${BASE_URL}/api/v1/companies/profile/step3`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getToken()}`
            },
            body: formData
        });
        if (!response.ok) throw await response.json();
        return await response.json();
    }
};

export default CompanyService;
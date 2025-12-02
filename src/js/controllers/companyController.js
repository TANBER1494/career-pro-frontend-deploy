import CompanyService from '../services/companyService.js';

// 1. Auth Guard
const token = localStorage.getItem('authToken');
if (!token) {
    window.location.href = '../../pages/auth/signup-login.html';
}

// ===================================================
// Step 1 Controller: Company Info
// ===================================================
const companyStep1Form = document.getElementById('companyStep1Form');

if (companyStep1Form) {
    companyStep1Form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // قراءة الحقول الاختيارية
        const phoneValue = document.getElementById('phone').value;
        const websiteValue = document.getElementById('website').value;

        // تجميع البيانات
        const companyData = {
            location: document.getElementById('location').value,
            industry: document.getElementById('industry').value,
            foundedYear: parseInt(document.getElementById('foundedYear').value),
            numberOfEmployees: document.getElementById('numberOfEmployees').value,
            phone: phoneValue ? phoneValue : "", 
            website: websiteValue ? websiteValue : "",
            companyDescription: document.getElementById('companyDescription').value
        };

        try {
            // استدعاء السيرفس
            await CompanyService.updateCompanyInfo(companyData);

            // تحديث اللوكال ستوريج
            const userData = JSON.parse(localStorage.getItem('user')) || {};
            const updatedUser = { ...userData, ...companyData };
            localStorage.setItem('user', JSON.stringify(updatedUser));

            alert('Company Info Saved!');
            window.location.href = '../../pages/company/company steps/CompanyStep2.html';

        } catch (error) {
            const errorMessage = error.message || 'Unknown Error';
            alert(`Failed to update: ${errorMessage}`);
            console.error('Server Error:', error);
        }
    });

    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.href = '../../pages/auth/signup-login.html';
        });
    }
}

// ===================================================
// Step 2 Controller: Tech Stack & Benefits
// ===================================================
const companyStep2Form = document.getElementById('companyStep2Form');

if (companyStep2Form) {
    let techList = [];
    let benefitList = [];

    // --- دوال إدارة التاقات (UI Logic) ---
    const renderTags = (list, containerId, isTech = false) => {
        const container = document.getElementById(containerId);
        container.innerHTML = ''; 

        list.forEach((item, index) => {
            const tag = document.createElement('div');
            tag.className = 'tag';
            tag.innerHTML = `
                ${item}
                <span class="tag-close" data-index="${index}" data-type="${isTech ? 'tech' : 'benefit'}">×</span>
            `;
            container.appendChild(tag);
        });

        if (isTech) {
            const counter = document.getElementById('techCounter');
            if (list.length < 3) {
                counter.style.color = '#e67e22'; 
                counter.innerText = `${list.length} of 3 minimum technologies added`;
            } else {
                counter.style.color = '#00b894'; 
                counter.innerText = `Great! ${list.length} technologies added`;
            }
        }

        document.querySelectorAll('.tag-close').forEach(btn => {
            btn.addEventListener('click', function() {
                const idx = this.getAttribute('data-index');
                const type = this.getAttribute('data-type');
                
                if (type === 'tech') {
                    techList.splice(idx, 1);
                    renderTags(techList, 'techTagsContainer', true);
                } else {
                    benefitList.splice(idx, 1);
                    renderTags(benefitList, 'benefitTagsContainer');
                }
            });
        });
    };

    const handleAddTag = (inputId, list, containerId, isTech) => {
        const input = document.getElementById(inputId);
        const value = input.value.trim();

        if (value && !list.includes(value)) {
            list.push(value);
            renderTags(list, containerId, isTech);
            input.value = '';
        } else if (list.includes(value)) {
            alert('This item is already added!');
        }
        input.focus();
    };

    // ربط الأزرار
    document.getElementById('addTechBtn').addEventListener('click', () => {
        handleAddTag('techInput', techList, 'techTagsContainer', true);
    });

    document.getElementById('addBenefitBtn').addEventListener('click', () => {
        handleAddTag('benefitInput', benefitList, 'benefitTagsContainer', false);
    });
    
    // إضافة زر Enter
    document.getElementById('techInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); document.getElementById('addTechBtn').click(); }
    });
    document.getElementById('benefitInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); document.getElementById('addBenefitBtn').click(); }
    });


    // --- إرسال النموذج ---
    companyStep2Form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (techList.length < 3) {
            alert('Please add at least 3 technologies before continuing.');
            return;
        }

        const companyDetailsData = {
            technologies: techList,
            benefits: benefitList,
            linkedin: document.getElementById('linkedin').value,
            twitter: document.getElementById('twitter').value,
            facebook: document.getElementById('facebook').value,
            instagram: document.getElementById('instagram').value
        };

        try {
            // استدعاء السيرفس
            await CompanyService.updateCompanyDetails(companyDetailsData);

            const userData = JSON.parse(localStorage.getItem('user')) || {};
            const updatedUser = { ...userData, ...companyDetailsData };
            localStorage.setItem('user', JSON.stringify(updatedUser));

            alert('Company Details Saved!');
            window.location.href = '../../pages/company/company steps/CompanyStep3.html';

        } catch (error) {
            const errorMessage = error.message || 'Failed to save details';
            alert(errorMessage);
            console.error('Network Error:', error);
        }
    });

    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.href = '../../pages/company/company steps/CompanyStep1.html';
        });
    }
}

// ===================================================
// Step 3 Controller: Verification (Real Upload)
// ===================================================
const companyStep3Form = document.getElementById('companyStep3Form');

if (companyStep3Form) {
    const fileInput = document.getElementById('verificationFile');
    const finishBtn = document.getElementById('finishBtn');
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    const backBtn = document.getElementById('backBtn');

    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.href = '../../pages/company/company steps/CompanyStep2.html';
        });
    }

    fileInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            fileNameDisplay.textContent = this.files[0].name;
            finishBtn.textContent = "Complete Registration";
            finishBtn.style.backgroundColor = "#00b894";
        } else {
            fileNameDisplay.textContent = "No file chosen";
            finishBtn.textContent = "Skip & Complete Registration";
        }
    });

    companyStep3Form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const file = fileInput.files[0];
        let verificationStatus = 'unverified';
        
        // تعطيل الزر
        const originalText = finishBtn.textContent;
        finishBtn.innerHTML = 'Processing... <i class="fas fa-spinner fa-spin"></i>';
        finishBtn.disabled = true;

        try {
            const userData = JSON.parse(localStorage.getItem('user')) || {};

            if (file) {
                // أ) لو المستخدم رفع ملف -> نستخدم السيرفس
                const formData = new FormData();
                formData.append('verificationDocument', file);

                // استدعاء السيرفس
                const responseData = await CompanyService.uploadVerification(formData);
                
                // نجاح الرفع
                verificationStatus = 'pending'; 
                
                if(responseData.data && responseData.data.documentUrl) {
                    userData.documentUrl = responseData.data.documentUrl;
                }
                
                alert('Document Uploaded! Your account is under review.');

            } else {
                // ب) لو المستخدم عمل Skip (بدون ملف)
                // هنا لا نستدعي السيرفر، فقط نحدث الحالة محلياً ونوجهه
                alert('Registration Completed! You can verify later.');
            }

            // تحديث البيانات المشتركة في الحالتين
            userData.verificationStatus = verificationStatus;
            userData.isProfileComplete = true;
            localStorage.setItem('user', JSON.stringify(userData));

            window.location.href = '../../pages/company/company portal/dashboard.html';

        } catch (error) {
            console.error('Error:', error);
            const errorMessage = error.message || 'Upload failed';
            alert(`Error: ${errorMessage}`);
            
            finishBtn.innerHTML = originalText;
            finishBtn.disabled = false;
        }
    });
}
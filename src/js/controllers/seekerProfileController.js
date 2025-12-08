const Seeker = require("../models/Seeker");
const Authentication = require("../models/Authentication");
const JobApplication = require("../models/JobApplication");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");

// ============================================================
// --- Helper: Get Seeker Document from Auth ID ---
// ============================================================
const getCurrentSeeker = async (authId) => {
    const seeker = await Seeker.findOne({ authId });
    if (!seeker) {
        throw new AppError(
            "Seeker profile not found. Please complete your profile.",
            404
        );
    }
    return seeker;
};

// ============================================================
// 💡 Helper Functions for Input Validation
// ============================================================

// للتحقق من أن النص يحتوي على أحرف ومسافات فقط (يشمل العربية والأجنبية)
const isTextOnly = (value) => {
    return typeof value === 'string' && /^[A-Za-z\s\u0600-\u06FF]{2,50}$/.test(value.trim());
};

// للتحقق من أن البريد الإلكتروني بتنسيق صالح
const isValidEmail = (email) => {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/.test(email);
};

// للتحقق من أن الهاتف يحتوي على أرقام فقط (8 إلى 15 رقمًا)
const isValidPhone = (phone) => {
    return /^[0-9]{8,15}$/.test(phone);
};

// للتحقق من أن الرابط بتنسيق URL صالح
const isValidUrl = (url) => {
    try {
        new URL(url);
        return true;
    } catch (e) {
        return false;
    }
};


// ============================================================
// Profile Update Logic with Full Validation
// ============================================================

exports.updateSeekerProfile = catchAsync(async (req, res, next) => {
    const seeker = await getCurrentSeeker(req.user.id);

    const {
        // Basic Info
        fullName,
        jobTitle,
        location,
        phone,
        email,
        birthDate,
        gender,
        summary,

        // Career Preferences
        experienceLevel,
        yearsOfExperience,
        desiredPosition,
        workType,
        industry,
        careerGoals,

        // Links
        linkedin,
        personalWebsite,
    } = req.body;

    const updateData = {};

    // 1. --- REQUIRED FIELDS CHECK (من الواجهة الأمامية) ---
    if (!fullName || !jobTitle || !email || !phone) {
        return next(new AppError("Please provide all required fields: Full Name, Job Title, Email, and Phone Number.", 400));
    }

    // 2. --- APPLYING FORMAT VALIDATION (Regex) & MAPPING FIELDS ---

    // Full Name
    if (fullName) {
        if (!isTextOnly(fullName)) {
            return next(new AppError("Full Name must contain only text and spaces (2-50 characters).", 400));
        }
        updateData.fullName = fullName;
    }

    // Job Title
    if (jobTitle) {
        if (!isTextOnly(jobTitle)) {
            return next(new AppError("Job Title must contain only text and spaces (2-50 characters).", 400));
        }
        updateData.jobTitle = jobTitle;
    }

    // Email
    if (email) {
        if (!isValidEmail(email)) {
            return next(new AppError("Invalid email format.", 400));
        }
        updateData.email = email;
    }

    // Phone Number
    if (phone) {
        if (!isValidPhone(phone)) {
            return next(new AppError("Invalid phone number format. Must be 8-15 digits only.", 400));
        }
        updateData.phone = phone;
    }

    // LinkedIn URL (اختياري، يتم التحقق إذا كان موجودًا)
    if (linkedin && linkedin.trim() !== '') {
        if (!isValidUrl(linkedin)) {
            return next(new AppError("Invalid LinkedIn URL format.", 400));
        }
        updateData.linkedinUrl = linkedin;
    } else if (linkedin === '') {
        updateData.linkedinUrl = ''; // السماح بحذف القيمة
    }

    // Personal Website URL (اختياري، يتم التحقق إذا كان موجودًا)
    if (personalWebsite && personalWebsite.trim() !== '') {
        if (!isValidUrl(personalWebsite)) {
            return next(new AppError("Invalid Personal Website URL format.", 400));
        }
        updateData.personalWebsiteUrl = personalWebsite;
    } else if (personalWebsite === '') {
        updateData.personalWebsiteUrl = ''; // السماح بحذف القيمة
    }

    // --- Mapping Remaining Fields (بدون التحقق الشامل للنمط) ---

    if (location) updateData.location = location;
    if (birthDate) updateData.birthDate = birthDate;
    if (gender) updateData.gender = gender;
    if (summary) updateData.professionalSummary = summary;

    if (experienceLevel) updateData.experienceLevel = experienceLevel;
    if (yearsOfExperience) updateData.yearsOfExperience = yearsOfExperience;
    if (desiredPosition) updateData["careerPreferences.desiredPosition"] = desiredPosition;
    if (workType) updateData["careerPreferences.workType"] = workType;
    if (industry) updateData["careerPreferences.industry"] = industry;
    if (careerGoals) updateData["careerPreferences.careerGoals"] = careerGoals;


    // 3. --- Check if any data was provided & Update DB ---
    if (Object.keys(updateData).length === 0) {
        return next(new AppError("No valid seeker data provided for update.", 400));
    }

    const updatedSeeker = await Seeker.findByIdAndUpdate(
        seeker._id,
        updateData,
        {
            new: true,
            runValidators: true,
            context: 'query'
        }
    );

    // 4. --- Registration Step Tracking Logic ---
    const isStep2Update = experienceLevel || yearsOfExperience || desiredPosition || linkedin;

    if (isStep2Update) {
        await Authentication.findByIdAndUpdate(req.user.id, {
            registrationStep: 3,
        });
    } else if (fullName || summary) {
        await Authentication.findByIdAndUpdate(req.user.id, {
            registrationStep: 2,
        });
    }

    // 5. --- Dynamic Response Construction ---
    const message = "Seeker information updated successfully";

    const responsePayload = {
        basicInfo: {
            fullName: updatedSeeker.fullName,
            jobTitle: updatedSeeker.jobTitle,
            location: updatedSeeker.location,
            phone: updatedSeeker.phone,
            email: updatedSeeker.email,
            summary: updatedSeeker.professionalSummary,
        },
        careerPreferences: updatedSeeker.careerPreferences,
        links: {
            linkedinUrl: updatedSeeker.linkedinUrl,
            personalWebsiteUrl: updatedSeeker.personalWebsiteUrl,
        }
    };

    res.status(200).json({
        status: "success",
        message: message,
        data: responsePayload,
    });
});

// ============================================================
// Profile Retrieval Logic
// ============================================================

exports.getSeekerProfile = catchAsync(async (req, res, next) => {
    const seeker = await getCurrentSeeker(req.user.id);

    res.status(200).json({
        status: "success",
        data: {
            basicInfo: {
                fullName: seeker.fullName,
                jobTitle: seeker.jobTitle,
                location: seeker.location,
                phone: seeker.phone,
                email: seeker.email,
                birthDate: seeker.birthDate,
                gender: seeker.gender,
                summary: seeker.professionalSummary,
                profileImageUrl: seeker.profileImageUrl,
            },
            experienceAndEducation: {
                experienceLevel: seeker.experienceLevel,
                yearsOfExperience: seeker.yearsOfExperience,
                // experiences: seeker.experiences,
                // education: seeker.education,
            },
            careerPreferences: seeker.careerPreferences,
            links: {
                linkedinUrl: seeker.linkedinUrl,
                personalWebsiteUrl: seeker.personalWebsiteUrl,
            }
        },
    });
});

// ============================================================
// Upload Logic (Upload Profile Image)
// ============================================================

exports.uploadProfileImage = catchAsync(async (req, res, next) => {
    // 1. Validation
    if (!req.file) {
        return next(new AppError("Please upload a profile image", 400));
    }

    // 2. Path Formatting
    let imageUrl = req.file.path.replace("public", "").replace(/\\/g, "/");

    if (!imageUrl.startsWith("/") && !imageUrl.startsWith("http")) {
        imageUrl = "/" + imageUrl;
    }

    // 3. Update DB
    const updatedSeeker = await Seeker.findOneAndUpdate(
        { authId: req.user.id },
        { profileImageUrl: imageUrl },
        { new: true, runValidators: true }
    );

    if (!updatedSeeker) {
        return next(new AppError("Seeker profile not found", 404));
    }

    // 4. Response
    res.status(200).json({
        status: "success",
        message: "Profile image updated successfully.",
        data: {
            profileImageUrl: updatedSeeker.profileImageUrl,
        },
    });
});

// ============================================================
// Seeker Dashboard Stats 
// ============================================================

exports.getSeekerStats = catchAsync(async (req, res, next) => {
    const seeker = await getCurrentSeeker(req.user.id);

    // 1. Get Stats
    const totalApplications = await JobApplication.countDocuments({
        seekerId: seeker._id,
    });

    const acceptedApplications = await JobApplication.countDocuments({
        seekerId: seeker._id,
        status: "accepted",
    });

    const pendingApplications = await JobApplication.countDocuments({
        seekerId: seeker._id,
        status: "pending",
    });

    // 2. Get Recent Applications (Limit 3)
    const recentApplications = await JobApplication.find({ seekerId: seeker._id })
        // .populate({ path: 'jobId', select: 'title companyId' }) 
        .sort({ createdAt: -1 })
        .limit(3)
        .select("status createdAt");

    res.status(200).json({
        status: "success",
        data: {
            fullName: seeker.fullName,
            stats: {
                totalApplications: totalApplications,
                acceptedApplications: acceptedApplications,
                pendingApplications: pendingApplications,
                rejections: totalApplications - acceptedApplications - pendingApplications,
            },
            recentApplications,
        },
    });
});
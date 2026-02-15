import { seekerService } from "../services/seekerService.js";
import { companyService } from "../services/companyService.js";
import Swal from "sweetalert2";

// ============================================================
// 1. Initialization & Router Logic
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  const path = window.location.pathname;

  // --- Seeker Pages ---
  if (path.includes("SeekerStep1")) initSeekerStep1();
  else if (path.includes("SeekerStep2")) initSeekerStep2();
  else if (path.includes("SeekerStep3")) initSeekerStep3();
  // --- Company Pages ---
  else if (path.includes("CompanyStep1.html")) initCompanyStep1();
  else if (path.includes("CompanyStep2.html")) initCompanyStep2();
  else if (path.includes("CompanyStep3.html")) initCompanyStep3();
});

// ============================================================
// SECTION A: JOB SEEKER LOGIC
// ============================================================

function initSeekerStep1() {
  const form = document.getElementById("step1Form");

  // Country/City Logic
  const countrySelect = document.getElementById("country");
  const citySelect = document.getElementById("city");

  if (countrySelect && citySelect) {
    const citiesByCountry = {
    "Egypt": ["Cairo", "Giza", "Alexandria", "Mansoura", "Luxor", "Aswan", "Asyut", "Port Said", "Suez", "Tanta"],
    "Saudi Arabia": ["Riyadh", "Jeddah", "Mecca", "Medina", "Dammam", "Khobar", "Abha", "Tabuk", "Hail"],
    "United Arab Emirates": ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain"],
    "Jordan": ["Amman", "Zarqa", "Irbid", "Aqaba", "Madaba", "Jerash"],
    "Lebanon": ["Beirut", "Tripoli", "Sidon", "Tyre", "Baalbek", "Zahle"],
    "Iraq": ["Baghdad", "Basra", "Mosul", "Erbil", "Kirkuk", "Najaf", "Karbala"],
    "Syria": ["Damascus", "Aleppo", "Homs", "Hama", "Latakia", "Tartus"],
    "Kuwait": ["Kuwait City", "Al Ahmadi", "Hawalli", "Al Farwaniyah", "Al Jahra"],
    "Oman": ["Muscat", "Salalah", "Sohar", "Nizwa", "Sur", "Buraimi"],
    "Qatar": ["Doha", "Al Rayyan", "Al Wakrah", "Al Khor", "Umm Salal"],
    "Bahrain": ["Manama", "Riffa", "Muharraq", "Hamad Town", "Isa Town"],
    "Yemen": ["Sana'a", "Aden", "Taiz", "Al Hudaydah", "Ibb"],
    "Palestine": ["Jerusalem", "Gaza City", "Ramallah", "Nablus", "Hebron", "Bethlehem", "Jenin", "Jericho"],
    "Libya": ["Tripoli", "Benghazi", "Misrata", "Tobruk", "Sebha"],
    "Tunisia": ["Tunis", "Sfax", "Sousse", "Kairouan", "Bizerte", "Gabes"],
    "Algeria": ["Algiers", "Oran", "Constantine", "Annaba", "Blida", "Batna"],
    "Morocco": ["Casablanca", "Rabat", "Fes", "Marrakech", "Tangier", "Agadir", "Meknes"],
    "Sudan": ["Khartoum", "Omdurman", "Port Sudan", "Nyala", "Kassala"],
    "Mauritania": ["Nouakchott", "Nouadhibou", "Kiffa", "Rosso"],
    "Somalia": ["Mogadishu", "Hargeisa", "Bosaso", "Kismayo", "Berbera"],
    "Djibouti": ["Djibouti City", "Ali Sabieh", "Tadjoura"],
    "Comoros": ["Moroni", "Mutsamudu", "Fomboni"]
    };

    countrySelect.addEventListener("change", (e) => {
      const country = e.target.value;
      citySelect.disabled = false;
      citySelect.innerHTML =
        '<option value="" disabled selected>Select city</option>';
      citySelect.classList.remove("bg-gray-200", "cursor-not-allowed");
      citySelect.classList.add("bg-gray-50");

      const cities = citiesByCountry[country] || ["Main City", "Other"];
      cities.forEach((city) => {
        const option = document.createElement("option");
        option.value = city;
        option.textContent = city;
        citySelect.appendChild(option);
      });
    });
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const originalText = btn.innerHTML;

      try {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

        const formData = {
          phoneNumber: document.getElementById("phoneNumber").value,
          birthDate: document.getElementById("birthDate").value,
          gender: document.getElementById("gender").value,
          experienceLevel: document.getElementById("experienceLevel").value,
          yearsOfExperience: document.getElementById("yearsOfExperience").value,
          industry: document.getElementById("industry").value,
          country: document.getElementById("country").value,
          city: document.getElementById("city").value,
        };

        await seekerService.updateProfileStep1(formData);
        window.location.href = "SeekerStep2";
      } catch (error) {
        console.error(error);
        Swal.fire(
          "Error",
          error.response?.data?.message || "Failed to update profile",
          "error"
        );
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    });
  }
}

function initSeekerStep2() {
  const form = document.getElementById("step2Form");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const originalText = btn.innerHTML;

      try {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

        const formData = {
          degree: document.getElementById("degree").value,
          university: document.getElementById("university").value,
          graduationYear: document.getElementById("graduationYear").value,
          gpa: document.getElementById("gpa")
            ? document.getElementById("gpa").value
            : undefined,
          jobType: document.getElementById("jobType").value,
          workplaceSetting: document.getElementById("workplaceSetting").value,
        };

        await seekerService.updateProfileStep2(formData);
        window.location.href = "SeekerStep3";
      } catch (error) {
        console.error(error);
        Swal.fire(
          "Error",
          error.response?.data?.message || "Update failed",
          "error"
        );
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    });
    document.getElementById('backBtn')?.addEventListener('click', () => {
      window.location.href = 'SeekerStep1';
  });
  }
}

function initSeekerStep3() {
  const form = document.getElementById("step3Form");
  const fileInput = document.getElementById("cvFile");
  const fileNameDisplay = document.getElementById("fileName");

  // File Name Display Logic
  if (fileInput) {
    fileInput.addEventListener("change", (e) => {
      if (e.target.files[0]) {
        fileNameDisplay.textContent = e.target.files[0].name;
        fileNameDisplay.classList.remove("hidden");
      }
    });
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!fileInput.files[0]) {
        Swal.fire("Warning", "Please upload your CV.", "warning");
        return;
      }

      const btn = form.querySelector('button[type="submit"]');
      const originalText = btn.innerHTML;

      try {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';

        await seekerService.uploadCV(fileInput.files[0]);

        Swal.fire({
          icon: "success",
          title: "Profile Completed!",
          text: "Redirecting to dashboard...",
          timer: 2000,
          showConfirmButton: false,
        }).then(() => {
          window.location.href = "/profile";
        });
      } catch (error) {
        console.error(error);
        Swal.fire(
          "Error",
          error.response?.data?.message || "Upload failed",
          "error"
        );
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    });
    document.getElementById('backBtn')?.addEventListener('click', () => {
      window.location.href = 'SeekerStep2';
  });
  }
}

// ============================================================
// SECTION B: COMPANY LOGIC
// ============================================================

function initCompanyStep1() {
  const form = document.getElementById("companyStep1Form");

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const originalText = btn.innerHTML;

      try {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

        const formData = {
          location: document.getElementById("location").value,
          industry: document.getElementById("industry").value,
          foundedYear: document.getElementById("foundedYear").value,
          numberOfEmployees: document.getElementById("numberOfEmployees").value,
          phone: document.getElementById("phone").value,
          website: document.getElementById("website").value,
          companyDescription:
            document.getElementById("companyDescription").value,
        };

        await companyService.updateProfileStep1(formData);
        window.location.href = "CompanyStep2.html";
      } catch (error) {
        console.error(error);
        Swal.fire(
          "Error",
          error.response?.data?.message || "Update failed",
          "error"
        );
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    });
  }
}

function initCompanyStep2() {
  const form = document.getElementById("companyStep2Form");

  // Tags Management Logic
  const technologies = [];
  const benefits = [];

  setupTagsInput(
    "techInput",
    "addTechBtn",
    "techTagsContainer",
    "techCounter",
    technologies,
    3
  );
  setupTagsInput(
    "benefitInput",
    "addBenefitBtn",
    "benefitTagsContainer",
    null,
    benefits,
    0
  );

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Validation
      if (technologies.length < 3) {
        Swal.fire("Warning", "Please add at least 3 technologies.", "warning");
        return;
      }

      const btn = form.querySelector('button[type="submit"]');
      const originalText = btn.innerHTML;

      try {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

        const formData = {
          technologies: technologies,
          benefits: benefits,
          linkedin: document.getElementById("linkedin").value,
          twitter: document.getElementById("twitter").value,
          facebook: document.getElementById("facebook").value,
          instagram: document.getElementById("instagram").value,
        };

        await companyService.updateProfileStep2(formData);
        window.location.href = "CompanyStep3.html";
      } catch (error) {
        console.error(error);
        Swal.fire(
          "Error",
          error.response?.data?.message || "Update failed",
          "error"
        );
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    });
    document.getElementById('backBtn')?.addEventListener('click', () => {
      window.location.href = '../../company/company steps/CompanyStep1.html';
  });
  }
}

// Helper for Tags (Tech & Benefits)
function setupTagsInput(
  inputId,
  btnId,
  containerId,
  counterId,
  dataArray,
  minRequired
) {
  const input = document.getElementById(inputId);
  const btn = document.getElementById(btnId);
  const container = document.getElementById(containerId);
  const counter = counterId ? document.getElementById(counterId) : null;

  if (!input || !btn || !container) return;

  const addTag = () => {
    const val = input.value.trim();

    const exists = dataArray.some(
      (item) => item.toLowerCase() === val.toLowerCase()
    );

    if (val && !exists) {
      dataArray.push(val);
      renderTags();
      input.value = "";
      input.classList.remove("border-red-500", "ring-red-500"); 
    } else if (exists) {
      input.classList.add("border-red-500", "focus:ring-red-500");

      input.addEventListener('input', function removeError() {
        input.classList.remove("border-red-500", "focus:ring-red-500");
        input.removeEventListener('input', removeError);
      });
    }
  };

  const renderTags = () => {
    container.innerHTML = dataArray
      .map(
        (item) => `
            <span class="tag bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm flex items-center gap-1">
                ${item}
                <i class="fas fa-times cursor-pointer hover:text-red-600" data-val="${item}"></i>
            </span>
        `
      )
      .join("");

    if (counter) {
      counter.textContent = `${dataArray.length} of ${minRequired} added`;
      counter.classList.toggle(
        "text-green-500",
        dataArray.length >= minRequired
      );
      counter.classList.toggle(
        "text-orange-500",
        dataArray.length < minRequired
      );
    }
  };

  btn.addEventListener("click", addTag);
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  });

  container.addEventListener("click", (e) => {
    if (e.target.classList.contains("fa-times")) {
      const val = e.target.getAttribute("data-val");
      const index = dataArray.indexOf(val);
      if (index > -1) {
        dataArray.splice(index, 1);
        renderTags();
      }
    }
  });
}

function initCompanyStep3() {
  const form = document.getElementById("companyStep3Form");
  const fileInput = document.getElementById("verificationFile");
  const fileNameDisplay = document.getElementById("fileNameDisplay");
  const finishBtn = document.getElementById("finishBtn");

  // UI: File Name & Button Change
  if (fileInput) {
    fileInput.addEventListener("change", (e) => {
      if (e.target.files && e.target.files[0]) {
        fileNameDisplay.textContent = e.target.files[0].name;
        fileNameDisplay.classList.add("text-green-600");

        const span = finishBtn.querySelector("span");
        if (span) span.textContent = "Complete Registration";

        finishBtn.classList.remove("bg-green-500", "hover:bg-green-600"); // Remove skip style
        finishBtn.classList.add("bg-blue-600", "hover:bg-blue-700"); // Add upload style
      } else {
        fileNameDisplay.textContent = "No file chosen";
        fileNameDisplay.classList.remove("text-green-600");
      }
    });
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = finishBtn;
      const originalText = btn.innerHTML;

      try {
        // Scenario 1: Upload File
        if (fileInput.files.length > 0) {
          btn.disabled = true;
          btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';

          await companyService.uploadVerificationDoc(fileInput.files[0]);

          Swal.fire({
            icon: "success",
            title: "Registration Complete!",
            text: "Document uploaded. Redirecting to dashboard...",
            timer: 2000,
            showConfirmButton: false,
          }).then(() => {
            window.location.href =
              "/src/pages/company/company portal/dashboard.html";
          });
        } else {
          // Scenario 2: Skip
          // بما أن الباك إند لا يحتوي على endpoint "skip" مخصص، سنوجه للداشبورد مباشرة
          // التوثيق سيظل "Unverified"
          Swal.fire({
            icon: "info",
            title: "Skipping Verification",
            text: "You can verify your company later from the dashboard.",
            timer: 2000,
            showConfirmButton: false,
          }).then(() => {
            window.location.href =
              "/src/pages/company/company portal/dashboard.html";
          });
        }
      } catch (error) {
        console.error(error);
        Swal.fire(
          "Error",
          error.response?.data?.message || "Operation failed",
          "error"
        );
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    });
    document.getElementById('backBtn')?.addEventListener('click', () => {
      window.location.href = '../../company/company steps/CompanyStep2.html';
  });
  }
}

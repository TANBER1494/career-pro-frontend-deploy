import { authService } from '../services/authService.js';
import Swal from 'sweetalert2';
import { Renderer, Program, Triangle, Mesh } from 'https://cdn.skypack.dev/ogl';

// ============================================================
// 1. Helper: Smart Redirect (التوجيه الذكي)
// ============================================================
function handleLoginRedirect(user) {
  const { accountType, registrationStep } = user;

  if (accountType === 'job_seeker') {
    switch (registrationStep) {
      case 1:
        window.location.href =
          'SeekerStep1';
        break;
      case 2:
        window.location.href =
          'SeekerStep2';
        break;
      case 3:
        window.location.href =
          'SeekerStep3';
        break;
      default:
        window.location.href = '/profile';
        break;
    }
  } else if (accountType === 'company') {
    switch (registrationStep) {
      case 1:
        window.location.href =
          '/CompanyStep1';
        break;
      case 2:
        window.location.href =
          '/CompanyStep2';
        break;
      case 3:
        window.location.href =
          '/CompanyStep3';
        break;
      default:
        window.location.href =
          '/Company_dashboard';
        break;
    }
  }
}
// ============================================================
// 2. SWALS 
// ============================================================
function swalDarkConfig(options) {
  const isDarkMode = document.documentElement.classList.contains('dark');

  return Swal.fire({
    background: isDarkMode ? '#1e1b4b' : '#ffffff',
    color: isDarkMode ? '#f8fafc' : '#1e293b',
    confirmButtonColor: '#3b82f6',
    cancelButtonColor: '#64748b',
    ...options,
  });
}
// ============================================================
// 2. Timer Logic (Exponential Backoff)
// ============================================================
const CooldownManager = {
  start(btn) {
    // 1. حساب وقت الانتظار (يتضاعف مع كل محاولة)
    let attempts = parseInt(localStorage.getItem('reset_attempts') || '0');
    let waitTime = 15 * Math.pow(2, attempts); // 15s, 30s, 60s...

    // سقف للانتظار (مثلاً لا يزيد عن 10 دقائق)
    if (waitTime > 600) waitTime = 600;

    const endTime = Date.now() + waitTime * 1000;

    // 2. الحفظ
    localStorage.setItem('reset_cooldown_end', endTime);
    localStorage.setItem('reset_attempts', attempts + 1);

    // 3. التشغيل
    this.run(btn, endTime);
  },

  check(btn) {
    const endTime = localStorage.getItem('reset_cooldown_end');
    // لو الوقت عدى أو مش موجود
    if (!endTime || Date.now() > parseInt(endTime)) {
      this.resetUI(btn);
      // لو عدى 24 ساعة من آخر محاولة، صفر العدادات
      const lastAttempt = localStorage.getItem('reset_cooldown_end');
      if (lastAttempt && Date.now() - parseInt(lastAttempt) > 86400000) {
        localStorage.setItem('reset_attempts', '0');
      }
      return;
    }
    // لو لسة فيه وقت
    this.run(btn, parseInt(endTime));
  },

  run(btn, endTime) {
    btn.disabled = true;
    btn.classList.add('opacity-50', 'cursor-not-allowed');

    const timerInterval = setInterval(() => {
      const timeLeft = Math.ceil((endTime - Date.now()) / 1000);

      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        this.resetUI(btn);
      } else {
        btn.innerHTML = `Wait ${timeLeft}s to resend`;
      }
    }, 1000);
  },

  resetUI(btn) {
    btn.disabled = false;
    btn.innerHTML = 'Send Reset Link';
    btn.classList.remove('opacity-50', 'cursor-not-allowed');
  },
};

// ============================================================
// 3. Main Event Listener
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  const forgotForm = document.getElementById('forgotForm');
  const resetForm = document.getElementById('resetForm');

  // ------------------------------------------------
  // A. Forgot Password Page Logic
  // ------------------------------------------------
  if (forgotForm) {
    const btn = document.getElementById('submitBtn');
    const emailInput = document.getElementById('email');

    // التحقق من المؤقت عند تحميل الصفحة
    CooldownManager.check(btn);

    forgotForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = emailInput.value.trim();

      if (!email) {
        swalDarkConfig({title:'Warning', text:'Please enter your email address.', icon:'warning'});
        return;
      }

      try {
        // UI Loading
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

        // API Call
        await authService.forgotPassword(email);

        // Success
        swalDarkConfig({
          icon: 'success',
          title: 'Email Sent!',
          text: 'Check your inbox for the reset link.',
          confirmButtonColor: '#3b82f6',
        });

        // تشغيل المؤقت الذكي
        CooldownManager.start(btn);
      } catch (error) {
        console.error(error);
        if (error.response?.status === 429) {
          swalDarkConfig({
            icon: 'warning',
            title: 'Too Many Requests',
            text:
              error.response.data.message || 'Please wait before trying again.',
          });
          // لو السيرفر هو اللي رفض، نشغل المؤقت بردو احتياطي
          CooldownManager.start(btn);
        } else {
          swalDarkConfig({
            icon: 'error',
            title: 'Error',
            text: error.response?.data?.message || 'Failed to send reset link.',
            confirmButtonColor: '#ef4444',
          });
          CooldownManager.resetUI(btn);
        }
      }
    });
  }

  // ------------------------------------------------
  // B. Reset Password Page Logic
  // ------------------------------------------------
  if (resetForm) {
    // التأكد من وجود التوكن في الرابط
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
      swalDarkConfig({
        icon: 'error',
        title: 'Invalid Link',
        text: 'Reset token is missing.',
        allowOutsideClick: false,
        confirmButtonText: 'Go to Login',
      }).then(() => {
        window.location.href = '/login';
      });
    }

    resetForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const password = document.getElementById('password').value;
      const passwordConfirm = document.getElementById('passwordConfirm').value;
      const btn = document.getElementById('submitBtn');

      if (password.length < 8) {
        swalDarkConfig({
          title:'Warning',
          text:'Password must be at least 8 characters.',
          icon:'warning'
      });
        return;
      }
      if (password !== passwordConfirm) {
        swalDarkConfig({title:'Warning', text:'Passwords do not match.', icon:'warning'});
        return;
      }

      try {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Resetting...';

        const response = await authService.resetPassword(
          token,
          password,
          passwordConfirm
        );

        // حفظ البيانات الجديدة للدخول المباشر
        if (response.token) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }

        await swalDarkConfig({
          icon: 'success',
          title: 'Password Changed!',
          text: 'You have been logged in automatically.',
          timer: 2000,
          showConfirmButton: false,
        });

        // التوجيه الذكي
        if (response.data && response.data.user) {
          handleLoginRedirect(response.data.user);
        } else {
          window.location.href = '/CareerPro';
        }
      } catch (error) {
        console.error(error);
        const errorMsg =
          error.response?.data?.message || 'Token is invalid or expired.';
        swalDarkConfig({
          icon: 'error',
          title: 'Reset Failed',
          text: errorMsg,
          confirmButtonColor: '#ef4444',
        });
        btn.disabled = false;
        btn.innerHTML = 'Reset Password';
      }
    });
  }
});

// 2. ثانياً: تعريف الدالة (مرة واحدة بس وبشكل صحيح)
function initRays(selector) {
  const container = document.querySelector(selector);
  if (!container) return;

  // إعدادات الخلفية
  const config = {
    raysColor: '#ffffff',
      raysSpeed: 0.5,      // قللت السرعة كمان عشان تكون أهدى
      lightSpread: 0.4,    // كانت 0.5 - تقليل الانتشار بيضعف الإضاءة
      rayLength: 1,      // كانت 3 - كده الشعاع هيقصر جداً ومش هيملى الشاشة كلها
      mouseInfluence: 0.05
  };

  const hexToRgb = hex => {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return m ? [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255] : [1, 1, 1];
  };

  const renderer = new Renderer({ dpr: Math.min(window.devicePixelRatio, 2), alpha: true });
  const gl = renderer.gl;
  container.appendChild(gl.canvas);

  const vert = `attribute vec2 position;varying vec2 vUv;void main(){vUv=position*0.5+0.5;gl_Position=vec4(position,0.0,1.0);}`;
  const frag = `
    precision highp float;
    uniform float iTime;
    uniform vec2 iResolution;
    uniform vec3 raysColor;
    uniform float lightSpread;
    uniform float rayLength;
    
    float rayStrength(vec2 source, vec2 dir, vec2 coord, float currentSpread) {
      vec2 toCoord = coord - source;
      float cosAngle = dot(normalize(toCoord), dir);
      // التغيير هنا: استخدمنا currentSpread المتحرك
      float spread = pow(max(cosAngle, 0.0), 1.0 / max(currentSpread, 0.001));
      float dist = length(toCoord);
      float falloff = clamp((iResolution.x * rayLength - dist) / (iResolution.x * rayLength), 0.0, 1.0);
      return spread * falloff;
    }

    void main() {
      vec2 coord = vec2(gl_FragCoord.x, iResolution.y - gl_FragCoord.y);
      vec2 rayPos = vec2(iResolution.x * 0.5, -iResolution.y * 0.2);
      
      // 1. حركة الأنيميشن: جعل الأشعة تتمايل يميناً ويساراً
      float move = sin(iTime * 0.8) * 0.15; 
      vec2 rayDir = normalize(vec2(move, 1.0));
      
      // 2. حركة خفيفة في انتشار الضوء (كأنه نبض)
      float dynamicSpread = lightSpread + sin(iTime * 1.5) * 0.05;

      float s = rayStrength(rayPos, rayDir, coord, dynamicSpread);
      gl_FragColor = vec4(raysColor * s, s * 0.8);
    }
  `;

  const uniforms = {
    iTime: { value: 0 },
    iResolution: { value: [0, 0] },
    raysColor: { value: hexToRgb(config.raysColor) },
    lightSpread: { value: config.lightSpread },
    rayLength: { value: config.rayLength },
    mousePos: { value: [0.5, 0.5] },
    mouseInfluence: { value: config.mouseInfluence }
  };

  const geometry = new Triangle(gl);
  const program = new Program(gl, { vertex: vert, fragment: frag, uniforms, transparent: true });
  const mesh = new Mesh(gl, { geometry, program });

  function resize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    renderer.setSize(w, h);
    uniforms.iResolution.value = [w * renderer.dpr, h * renderer.dpr];
  }
  window.addEventListener('resize', resize);
  resize();

  function update(t) {
    if (getComputedStyle(container).display === 'none') {
      requestAnimationFrame(update);
      return; 
  }

  uniforms.iTime.value = t * 0.001;
  renderer.render({ scene: mesh });
  requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

// 3. ثالثاً: تشغيل الدالة
initRays('#light-rays-container');

import * as THREE from 'https://esm.sh/three';
import { EffectComposer, EffectPass, RenderPass, Effect } from 'https://esm.sh/postprocessing';

const VERTEX_SRC = `void main() { gl_Position = vec4(position, 1.0); }`;

const FRAGMENT_SRC = `
precision highp float;
uniform vec3 uColor;
uniform vec2 uResolution;
uniform float uTime;
uniform float uPixelSize;
uniform float uScale;
uniform float uDensity;
uniform float uPixelJitter;
uniform int uEnableRipples;
uniform float uRippleSpeed;
uniform float uRippleThickness;
uniform float uRippleIntensity;
uniform float uEdgeFade;
uniform int uShapeType;
const int SHAPE_SQUARE = 0;
const int SHAPE_CIRCLE = 1;
const int SHAPE_TRIANGLE = 2;
const int SHAPE_DIAMOND = 3;
const int MAX_CLICKS = 10;
uniform vec2 uClickPos[MAX_CLICKS];
uniform float uClickTimes[MAX_CLICKS];
// out vec4 fragColor; // (Removed for Three.js WebGL1/2 compatibility usually handling this internally or define layout)
// In raw ShaderMaterial with GLSL3, we declare out:
layout(location = 0) out vec4 fragColor;

float Bayer2(vec2 a) { a = floor(a); return fract(a.x / 2. + a.y * a.y * .75); }
#define Bayer4(a) (Bayer2(.5*(a))*0.25 + Bayer2(a))
#define Bayer8(a) (Bayer4(.5*(a))*0.25 + Bayer2(a))
#define FBM_OCTAVES 5
#define FBM_LACUNARITY 1.25
#define FBM_GAIN 1.0

float hash11(float n){ return fract(sin(n)*43758.5453); }
float vnoise(vec3 p){
  vec3 ip = floor(p); vec3 fp = fract(p);
  float n000 = hash11(dot(ip, vec3(1.0,57.0,113.0)));
  float n100 = hash11(dot(ip + vec3(1.0,0.0,0.0), vec3(1.0,57.0,113.0)));
  float n010 = hash11(dot(ip + vec3(0.0,1.0,0.0), vec3(1.0,57.0,113.0)));
  float n110 = hash11(dot(ip + vec3(1.0,1.0,0.0), vec3(1.0,57.0,113.0)));
  float n001 = hash11(dot(ip + vec3(0.0,0.0,1.0), vec3(1.0,57.0,113.0)));
  float n101 = hash11(dot(ip + vec3(1.0,0.0,1.0), vec3(1.0,57.0,113.0)));
  float n011 = hash11(dot(ip + vec3(0.0,1.0,1.0), vec3(1.0,57.0,113.0)));
  float n111 = hash11(dot(ip + vec3(1.0,1.0,1.0), vec3(1.0,57.0,113.0)));
  vec3 w = fp*fp*fp*(fp*(fp*6.0-15.0)+10.0);
  return mix(mix(mix(n000,n100,w.x), mix(n010,n110,w.x),w.y), mix(mix(n001,n101,w.x), mix(n011,n111,w.x),w.y),w.z)*2.0-1.0;
}
float fbm2(vec2 uv, float t){
  vec3 p = vec3(uv * uScale, t); float amp = 1.0; float freq = 1.0; float sum = 1.0;
  for (int i = 0; i < FBM_OCTAVES; ++i){ sum += amp * vnoise(p * freq); freq *= FBM_LACUNARITY; amp *= FBM_GAIN; }
  return sum * 0.5 + 0.5;
}
float maskCircle(vec2 p, float cov){
  float r = sqrt(cov) * .25; float d = length(p - 0.5) - r; float aa = 0.5 * fwidth(d);
  return cov * (1.0 - smoothstep(-aa, aa, d * 2.0));
}
float maskTriangle(vec2 p, vec2 id, float cov){
  bool flip = mod(id.x + id.y, 2.0) > 0.5; if (flip) p.x = 1.0 - p.x;
  float r = sqrt(cov); float d = p.y - r*(1.0 - p.x); float aa = fwidth(d);
  return cov * clamp(0.5 - d/aa, 0.0, 1.0);
}
float maskDiamond(vec2 p, float cov){
  float r = sqrt(cov) * 0.564; return step(abs(p.x - 0.49) + abs(p.y - 0.49), r);
}

void main(){
  float pixelSize = uPixelSize;
  vec2 fragCoord = gl_FragCoord.xy; // Removed - uResolution * .5 to match standard coordinate system or adjust if needed
  // Adjust fragCoord to be consistent with original shader logic which expected centered coords maybe?
  // Let's stick to the original logic:
  vec2 centeredFrag = gl_FragCoord.xy - uResolution * .5;
  
  float aspectRatio = uResolution.x / uResolution.y;
  vec2 pixelId = floor(centeredFrag / pixelSize);
  vec2 pixelUV = fract(centeredFrag / pixelSize);
  float cellPixelSize = 8.0 * pixelSize;
  vec2 cellId = floor(centeredFrag / cellPixelSize);
  vec2 cellCoord = cellId * cellPixelSize;
  vec2 uv = cellCoord / uResolution * vec2(aspectRatio, 1.0);
  float base = fbm2(uv, uTime * 0.05);
  base = base * 0.5 - 0.65;
  float feed = base + (uDensity - 0.5) * 0.3;
  
  if (uEnableRipples == 1) {
    for (int i = 0; i < MAX_CLICKS; ++i){
      vec2 pos = uClickPos[i];
      if (pos.x < 0.0) continue;
      vec2 cuv = (((pos - uResolution * .5 - cellPixelSize * .5) / (uResolution))) * vec2(aspectRatio, 1.0);
      float t = max(uTime - uClickTimes[i], 0.0);
      float r = distance(uv, cuv);
      float waveR = uRippleSpeed * t;
      float ring = exp(-pow((r - waveR) / uRippleThickness, 2.0));
      float atten = exp(-1.0 * t) * exp(-10.0 * r);
      feed = max(feed, ring * atten * uRippleIntensity);
    }
  }
  
  float bayer = Bayer8(centeredFrag / uPixelSize) - 0.5;
  float bw = step(0.5, feed + bayer);
  float h = fract(sin(dot(floor(centeredFrag / uPixelSize), vec2(127.1, 311.7))) * 43758.5453);
  float jitterScale = 1.0 + (h - 0.5) * uPixelJitter;
  float coverage = bw * jitterScale;
  float M;
  if (uShapeType == SHAPE_CIRCLE) M = maskCircle(pixelUV, coverage);
  else if (uShapeType == SHAPE_TRIANGLE) M = maskTriangle(pixelUV, pixelId, coverage);
  else if (uShapeType == SHAPE_DIAMOND) M = maskDiamond(pixelUV, coverage);
  else M = coverage;
  
  if (uEdgeFade > 0.0) {
    vec2 norm = gl_FragCoord.xy / uResolution;
    float edge = min(min(norm.x, norm.y), min(1.0 - norm.x, 1.0 - norm.y));
    float fade = smoothstep(0.0, uEdgeFade, edge);
    M *= fade;
  }
  
  fragColor = vec4(uColor, M);
}`;

const createTouchTexture = () => {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const texture = new THREE.Texture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  const trail = [];
  let last = null;
  const maxAge = 64;
  let radius = 0.1 * size;
  const speed = 1 / maxAge;

  const update = () => {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Logic removal for simplicity in drawing loop, mainly just trail logic
    for (let i = trail.length - 1; i >= 0; i--) {
      const point = trail[i];
      const f = point.force * speed * (1 - point.age / maxAge);
      point.x += point.vx * f;
      point.y += point.vy * f;
      point.age++;
      if (point.age > maxAge) trail.splice(i, 1);
    }
    
    trail.forEach(p => {
        const pos = { x: p.x * size, y: (1 - p.y) * size };
        let intensity = 1;
        if (p.age < maxAge * 0.3) intensity = Math.sin((p.age / (maxAge * 0.3)) * Math.PI / 2);
        else intensity = -1 * (1 - (p.age - maxAge * 0.3) / (maxAge * 0.7)) * ((1 - (p.age - maxAge * 0.3) / (maxAge * 0.7)) - 2) || 0;
        intensity *= p.force;
        
        const offset = size * 5;
        ctx.shadowOffsetX = offset; ctx.shadowOffsetY = offset;
        ctx.shadowBlur = radius;
        ctx.shadowColor = `rgba(255, 255, 255, ${0.2 * intensity})`;
        ctx.beginPath();
        ctx.fillStyle = 'rgba(255,0,0,1)';
        ctx.arc(pos.x - offset, pos.y - offset, radius, 0, Math.PI * 2);
        ctx.fill();
    });
    texture.needsUpdate = true;
  };
  
  const addTouch = (norm) => {
      let force = 0; let vx = 0; let vy = 0;
      if (last) {
          const dx = norm.x - last.x; const dy = norm.y - last.y;
          if (dx === 0 && dy === 0) return;
          const dd = dx*dx + dy*dy;
          const d = Math.sqrt(dd);
          vx = dx / (d||1); vy = dy / (d||1);
          force = Math.min(dd * 10000, 1);
      }
      last = { x: norm.x, y: norm.y };
      trail.push({ x: norm.x, y: norm.y, age: 0, force, vx, vy });
  };
  
  return { texture, addTouch, update, setRadius: (v) => radius = 0.1 * size * v };
};

const createLiquidEffect = (texture, strength, freq) => {
    const fragment = `
    uniform sampler2D uTexture;
    uniform float uStrength;
    uniform float uTime;
    uniform float uFreq;
    void mainUv(inout vec2 uv) {
      vec4 tex = texture2D(uTexture, uv);
      float vx = tex.r * 2.0 - 1.0;
      float vy = tex.g * 2.0 - 1.0;
      float intensity = tex.b; // Or use alpha/shadow color
      // Simplified liquid logic based on provided code
      float wave = 0.5 + 0.5 * sin(uTime * uFreq + intensity * 6.28);
      uv += vec2(vx, vy) * uStrength * intensity * wave;
    }
    `;
    return new Effect('LiquidEffect', fragment, {
        uniforms: new Map([
            ['uTexture', new THREE.Uniform(texture)],
            ['uStrength', new THREE.Uniform(strength)],
            ['uTime', new THREE.Uniform(0)],
            ['uFreq', new THREE.Uniform(freq)]
        ])
    });
};

const SHAPE_MAP = { square: 0, circle: 1, triangle: 2, diamond: 3 };

// --- 2. Main Initialization Function ---

export function initPixelBlast(containerSelector, options = {}) {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    // Default Options
    const opts = {
        pixelSize: 6,
        color: '#FFFF',
        variant: 'circle',
        speed: 0.6,
        liquid: true,
        liquidStrength: 0.12,
        liquidWobbleSpeed: 5,
        liquidRadius: 1.2,
        enableRipples: true,
        rippleSpeed: 0.4,
        rippleThickness: 0.12,
        rippleIntensityScale: 1.5,
        patternScale: 3,
        patternDensity: 1.2,
        pixelSizeJitter: 0.5,
        edgeFade: 0.25,
        transparent: true,
        noiseAmount: 0,
        ...options
    };

    // Setup Three.js
    const renderer = new THREE.WebGLRenderer({ 
        alpha: true, 
        antialias: true,
        powerPreference: 'high-performance' 
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    if(opts.transparent) renderer.setClearAlpha(0);
    else renderer.setClearColor(0x000000);
    
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // Uniforms setup
    const uniforms = {
        uResolution: { value: new THREE.Vector2(container.clientWidth, container.clientHeight) },
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(opts.color) },
        uClickPos: { value: Array.from({ length: 10 }, () => new THREE.Vector2(-1, -1)) },
        uClickTimes: { value: new Float32Array(10) },
        uShapeType: { value: SHAPE_MAP[opts.variant] || 0 },
        uPixelSize: { value: opts.pixelSize * renderer.getPixelRatio() },
        uScale: { value: opts.patternScale },
        uDensity: { value: opts.patternDensity },
        uPixelJitter: { value: opts.pixelSizeJitter },
        uEnableRipples: { value: opts.enableRipples ? 1 : 0 },
        uRippleSpeed: { value: opts.rippleSpeed },
        uRippleThickness: { value: opts.rippleThickness },
        uRippleIntensity: { value: opts.rippleIntensityScale },
        uEdgeFade: { value: opts.edgeFade }
    };

    const material = new THREE.ShaderMaterial({
        vertexShader: VERTEX_SRC,
        fragmentShader: FRAGMENT_SRC,
        uniforms,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        glslVersion: THREE.GLSL3
    });

    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(quad);

    // Setup Post Processing (Liquid Effect)
    let composer, touch, liquidEffect;
    
    if (opts.liquid) {
        touch = createTouchTexture();
        touch.setRadius(opts.liquidRadius);
        
        composer = new EffectComposer(renderer);
        const renderPass = new RenderPass(scene, camera);
        composer.addPass(renderPass);
        
        liquidEffect = createLiquidEffect(touch.texture, opts.liquidStrength, opts.liquidWobbleSpeed);
        const effectPass = new EffectPass(camera, liquidEffect);
        composer.addPass(effectPass);
    }

    // Input Handling (تعديل: الاستماع للنافذة بالكامل)
    let clickIx = 0;
    
    const onPointerDown = (e) => {
        // بنجيب أبعاد ومكان الكونتينر الحالي في الصفحة
        const rect = container.getBoundingClientRect();
        
        // حساب الـ X والـ Y بالنسبة للكونتينر فقط
        const x = e.clientX - rect.left;
        const y = rect.height - (e.clientY - rect.top); // بنعكس الـ Y بناءً على ارتفاع الكونتينر
        
        uniforms.uClickPos.value[clickIx].set(x, y);
        uniforms.uClickTimes.value[clickIx] = uniforms.uTime.value;
        clickIx = (clickIx + 1) % 10;
    };

    const onPointerMove = (e) => {
        if (!touch) return;
        
        const rect = container.getBoundingClientRect();

        // حساب النسبة المئوية (0 لـ 1) بالنسبة للكونتينر
        const x = (e.clientX - rect.left) / rect.width;
        const y = 1.0 - ((e.clientY - rect.top) / rect.height);
        
        // نتأكد إن الماوس جوه الكونتينر عشان ميرسمش بره
        if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
            touch.addTouch({ x, y });
        }
    };

    // التعديل هنا: هنسمع للـ container نفسه بدل window عشان نضمن الدقة
    // وممكن نخليها window لو عايزة التأثير يلقط والماوس بره، بس الحسابات فوق بقت صحيحة
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    // Resize Handling
    const resizeObserver = new ResizeObserver(() => {
        const w = container.clientWidth;
        const h = container.clientHeight;
        renderer.setSize(w, h);
        uniforms.uResolution.value.set(w, h);
        uniforms.uPixelSize.value = opts.pixelSize * renderer.getPixelRatio();
        if(composer) composer.setSize(w, h);
    });
    resizeObserver.observe(container);

    // Animation Loop
    const clock = new THREE.Clock();
    let frameId;
    
    const animate = () => {
        const elapsed = clock.getElapsedTime();
        uniforms.uTime.value = elapsed * opts.speed;
        
        if (composer) {
            if (touch) touch.update();
            if (liquidEffect) liquidEffect.uniforms.get('uTime').value = elapsed * opts.speed;
            composer.render();
        } else {
            renderer.render(scene, camera);
        }
        
        frameId = requestAnimationFrame(animate);
    };
    
    animate();

    // Clean up function
    return () => {
        cancelAnimationFrame(frameId);
        resizeObserver.disconnect();
        container.removeEventListener('pointerdown', onPointerDown);
        container.removeEventListener('pointermove', onPointerMove);
        renderer.dispose();
        container.removeChild(renderer.domElement);
    };
}

// تشغيل الكود (تأكدي ان الكونتينر موجود في الـ HTML)
// تشغيل الكود المعدل
initPixelBlast('#pixel-blast-container', {
    color: '#FFFFFF',   // 1. ده هيخلي اللون أبيض تماماً ومفيش أي موف
    variant: 'square',  // 2. ده هيخلي شكل الـ pixels مربعات بدل دوائر
    pixelSize: 3   ,     // حجم المربعات زي ما هو
    liquid: false  ,
    patternDensity: 0.6  ,
    enableRipples: false, // <-- أضف هذا السطر لتعطيل تأثير الكليك
});
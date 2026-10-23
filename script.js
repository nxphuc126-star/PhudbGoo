// ===== Cành hoa anh đào 3D =====
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x000000, 0);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);
camera.position.set(0, 0, 11);

scene.add(new THREE.AmbientLight(0xffc8e0, 0.8));
const key = new THREE.DirectionalLight(0xffffff, 0.9);
key.position.set(3, 5, 6);
scene.add(key);

let seed = 11;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const group = new THREE.Group();
scene.add(group);

// ----- Texture vẽ bằng canvas -----
function makeTex(draw) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  draw(c.getContext('2d'));
  return new THREE.CanvasTexture(c);
}
const flowerTex = makeTex(g => {
  g.translate(64, 64);
  for (let k = 0; k < 5; k++) {
    g.save();
    g.rotate((k * Math.PI * 2) / 5);
    const grd = g.createRadialGradient(0, -26, 2, 0, -26, 30);
    grd.addColorStop(0, '#ffffff');
    grd.addColorStop(1, '#e6d6de');
    g.fillStyle = grd;
    g.beginPath();
    g.ellipse(0, -28, 17, 30, 0, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }
  g.fillStyle = '#f4c25a';
  g.beginPath(); g.arc(0, 0, 7, 0, Math.PI * 2); g.fill();
});
const petalTex = makeTex(g => {
  g.translate(64, 64);
  g.fillStyle = '#fff';
  g.beginPath(); g.ellipse(0, 0, 18, 34, 0.5, 0, Math.PI * 2); g.fill();
});
const glowTex = makeTex(g => {
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
});

// ----- Cành cây -----
const barkMat = new THREE.MeshLambertMaterial({ color: 0x2a1b1c });
const flowerPos = [], flowerCol = [];
const radii = [0.16, 0.08, 0.04, 0.022];

function addBlossoms(p, n) {
  for (let i = 0; i < n; i++) {
    flowerPos.push(p.x + (rnd() - 0.5) * 0.9, p.y + (rnd() - 0.5) * 0.9, p.z + (rnd() - 0.5) * 0.9);
    const c = new THREE.Color().setHSL(0.92 + rnd() * 0.06, 0.55 + rnd() * 0.35, 0.78 + rnd() * 0.14);
    flowerCol.push(c.r, c.g, c.b);
  }
}

function branch(start, dir, len, depth) {
  const pts = [start.clone()];
  let p = start.clone();
  const d = dir.clone().normalize();
  const steps = Math.max(4, Math.round(len * 2));
  for (let i = 0; i < steps; i++) {
    d.add(new THREE.Vector3((rnd() - 0.5) * 0.5, (rnd() - 0.5) * 0.5, (rnd() - 0.5) * 0.25)).normalize();
    p = p.clone().addScaledVector(d, len / steps);
    pts.push(p);
    addBlossoms(p, depth === 0 ? 1 : 3);
    if (depth < 3 && i > 1 && rnd() < 0.34) {
      const cd = new THREE.Vector3((rnd() - 0.5) * 1.6, (rnd() - 0.3) * 1.6, (rnd() - 0.5) * 0.8).add(d);
      branch(p, cd, len * 0.5, depth + 1);
    }
  }
  addBlossoms(p, 8);
  const curve = new THREE.CatmullRomCurve3(pts);
  group.add(new THREE.Mesh(new THREE.TubeGeometry(curve, steps * 4, radii[depth], 6), barkMat));
}
branch(new THREE.Vector3(10, 4.2, -1), new THREE.Vector3(-1, -0.32, 0.1), 15, 0);

const flowerGeo = new THREE.BufferGeometry();
flowerGeo.setAttribute('position', new THREE.Float32BufferAttribute(flowerPos, 3));
flowerGeo.setAttribute('color', new THREE.Float32BufferAttribute(flowerCol, 3));
const flowerMat = new THREE.PointsMaterial({ map: flowerTex, size: 0.55, vertexColors: true, transparent: true, alphaTest: 0.05, depthWrite: false });
group.add(new THREE.Points(flowerGeo, flowerMat));
document.getElementById('count').textContent = (flowerPos.length / 3).toLocaleString('vi-VN');

// ----- Cánh hoa rơi -----
const PET = 420;
const petalPos = new Float32Array(PET * 3), petalCol = new Float32Array(PET * 3), petalVel = [];
for (let i = 0; i < PET; i++) {
  petalPos.set([(rnd() - 0.5) * 24, (rnd() - 0.5) * 16, (rnd() - 0.5) * 10], i * 3);
  const c = new THREE.Color().setHSL(0.93 + rnd() * 0.04, 0.7, 0.8);
  petalCol.set([c.r, c.g, c.b], i * 3);
  petalVel.push({ vy: 0.25 + rnd() * 0.5, ph: rnd() * 6.28 });
}
const petalGeo = new THREE.BufferGeometry();
petalGeo.setAttribute('position', new THREE.BufferAttribute(petalPos, 3));
petalGeo.setAttribute('color', new THREE.BufferAttribute(petalCol, 3));
const petalMat = new THREE.PointsMaterial({ map: petalTex, size: 0.22, vertexColors: true, transparent: true, alphaTest: 0.05, depthWrite: false });
scene.add(new THREE.Points(petalGeo, petalMat));

// ----- Sao và ánh bokeh nền -----
function layer(count, spreadX, spreadY, z, size, color, opacity) {
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) pos.set([(rnd() - 0.5) * spreadX, (rnd() - 0.5) * spreadY, z - rnd() * 10], i * 3);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const m = new THREE.PointsMaterial({ map: glowTex, size, color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending });
  const p = new THREE.Points(g, m);
  scene.add(p);
  return m;
}
const starMat = layer(500, 70, 40, -12, 0.22, 0xffffff, 0.8);
const bokehMat = layer(30, 40, 22, -6, 3.2, 0xff8fc0, 0.1);

// ----- Camera theo chuột -----
let px = 0, py = 0;
window.addEventListener('pointermove', e => {
  px = (e.clientX / window.innerWidth - 0.5) * 2;
  py = (e.clientY / window.innerHeight - 0.5) * 2;
});

let baseY = 0.6;
function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  if (camera.aspect < 1) { baseY = 2.6; group.position.x = 0.8; group.scale.setScalar(0.62); }
  else { baseY = 0.6; group.position.x = -0.5; group.scale.setScalar(1); }
}
window.addEventListener('resize', resize);
resize();

// ===== Nhạc =====
const audio = document.getElementById('audio');
const playBtn = document.getElementById('play');
const miniBtn = document.getElementById('miniPlay');
const fileInput = document.getElementById('file');
const statusEl = document.getElementById('status');
let ctx, analyser, data, level = 0;

function setupAnalyser() {
  if (ctx) return;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    const src = ctx.createMediaElementSource(audio);
    analyser = ctx.createAnalyser();
    analyser.fftSize = 128;
    data = new Uint8Array(analyser.frequencyBinCount);
    src.connect(analyser);
    analyser.connect(ctx.destination);
  } catch (err) { analyser = null; }
}
function setLabels(playing) {
  playBtn.textContent = playing ? 'Tạm dừng' : 'Bật nhạc';
  miniBtn.textContent = playing ? 'Dừng' : 'Phát';
}
async function togglePlay() {
  setupAnalyser();
  if (ctx && ctx.state === 'suspended') await ctx.resume();
  if (audio.paused) {
    try {
      await audio.play();
      setLabels(true);
      statusEl.textContent = 'Đang phát nhạc';
    } catch (err) {
      statusEl.textContent = 'Chưa có nhạc: bấm "Chọn file nhạc"';
    }
  } else {
    audio.pause();
    setLabels(false);
    statusEl.textContent = 'Đã dừng';
  }
}
playBtn.addEventListener('click', togglePlay);
miniBtn.addEventListener('click', togglePlay);
fileInput.addEventListener('change', () => {
  const f = fileInput.files[0];
  if (!f) return;
  audio.src = URL.createObjectURL(f);
  statusEl.textContent = 'Đã chọn: ' + f.name;
  if (audio.paused) togglePlay(); else audio.play();
});
audio.addEventListener('error', () => { statusEl.textContent = 'Chưa có file nhạc: bấm "Chọn file nhạc"'; });

function readLevel(t) {
  let target = 0;
  if (!audio.paused) {
    if (analyser) {
      analyser.getByteFrequencyData(data);
      let s = 0;
      for (let i = 0; i < 12; i++) s += data[i];
      target = s / (12 * 255);
    }
    if (target < 0.01) target = 0.35 + Math.sin(t * 5) * 0.2;
  }
  level += (target - level) * 0.15;
  return level;
}

// ===== Vòng lặp =====
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta(), t = clock.elapsedTime;
  const lv = readLevel(t);

  camera.position.x += (px * 0.8 - camera.position.x) * 0.04;
  camera.position.y += (-py * 0.5 - camera.position.y) * 0.04;
  camera.lookAt(0, 0, 0);

  group.position.y = baseY + Math.min(window.scrollY, 1500) * 0.003;
  group.rotation.z = Math.sin(t * 0.5) * 0.012 + lv * Math.sin(t * 9) * 0.01;
  group.rotation.y = Math.sin(t * 0.3) * 0.05;
  flowerMat.size = 0.55 + lv * 0.18;
  bokehMat.opacity = 0.1 + lv * 0.18;
  starMat.opacity = 0.7 + Math.sin(t * 1.4) * 0.15;

  const speed = 1 + lv * 2.5;
  for (let i = 0; i < PET; i++) {
    const v = petalVel[i];
    petalPos[i * 3 + 1] -= v.vy * dt * speed;
    petalPos[i * 3] += Math.sin(t * 0.8 + v.ph) * 0.006 + 0.004;
    if (petalPos[i * 3 + 1] < -8) { petalPos[i * 3 + 1] = 8; petalPos[i * 3] = (rnd() - 0.5) * 24; }
  }
  petalGeo.attributes.position.needsUpdate = true;

  renderer.render(scene, camera);
}
animate();

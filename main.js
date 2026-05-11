import * as THREE from 'three';

/* =========================
   DOM
========================= */

const video = document.getElementById('video');
const canvas = document.getElementById('threeCanvas');

const overlay = document.getElementById('overlay');
const startBtn = document.getElementById('startBtn');

const statusEl = document.getElementById('status');

const floatingText =
document.getElementById('floatingText');

const speechText =
document.getElementById('speechText');

const birthdayMode =
document.getElementById('birthdayMode');

const birthdayContent =
document.getElementById('birthdayContent');

const saveBtn =
document.getElementById('saveBtn');

const ambientAudio =
document.getElementById('ambientAudio');

/* =========================
   THREE
========================= */

let scene;
let camera;
let renderer;

let sculpture;
let particles;
let orbitParticles;

/* =========================
   PARTICLES
========================= */

let particleVelocity = [];

let exploded = false;

/* =========================
   AUDIO
========================= */

let analyser;
let audioArray;

/* =========================
   CONTROL
========================= */

let handOpen = false;

let birthdayTriggered = false;

let speechRecognition;

let lastTrail = 0;

/* =========================
   TEXT
========================= */

const messages = [

'生日快乐',

'宇宙正在回应你',

'空间开始震荡',

'粒子已经苏醒',

'你正在创造星系',

'未来正在展开',

'黄普远生日快乐',

'宇宙记录了这一刻'
];

const poems = [

'宇宙在今晚为你留下了坐标',

'时间会记住今天的光',

'有些瞬间会成为永恒',

'今天的星空正在为你发亮'
];

/* =========================
   CAMERA
========================= */

async function initCamera(){

const stream =
await navigator.mediaDevices.getUserMedia({

video:{
facingMode:'user',
width:{ideal:960},
height:{ideal:540}
}
});

video.srcObject = stream;

await video.play();
}

/* =========================
   AUDIO
========================= */

async function initAudio(){

const stream =
await navigator.mediaDevices.getUserMedia({

audio:true
});

const ctx =
new AudioContext();

analyser =
ctx.createAnalyser();

analyser.fftSize = 64;

const source =
ctx.createMediaStreamSource(stream);

source.connect(analyser);

audioArray =
new Uint8Array(
analyser.frequencyBinCount
);
}

function getVolume(){

analyser.getByteFrequencyData(audioArray);

let sum = 0;

for(let i=0;i<audioArray.length;i++){

sum += audioArray[i];
}

return sum / (audioArray.length * 255);
}

/* =========================
   SPEECH
========================= */

function initSpeechRecognition(){

const SpeechRecognition =

window.SpeechRecognition ||

window.webkitSpeechRecognition;

if(!SpeechRecognition){

return;
}

speechRecognition =
new SpeechRecognition();

speechRecognition.lang = 'zh-CN';

speechRecognition.continuous = true;

speechRecognition.interimResults = true;

speechRecognition.onresult = (event)=>{

const text =

event.results[
event.results.length - 1
][0].transcript;

speechText.innerText = text;

speechText.style.opacity = 1;

clearTimeout(
speechText.hideTimer
);

speechText.hideTimer =
setTimeout(()=>{

speechText.style.opacity = 0;

},2000);

if(
text.includes('生日快乐') ||
text.includes('黄普远')
){

triggerBirthday();
}
};

speechRecognition.start();
}

/* =========================
   AI VOICE
========================= */

function speak(text){

const utterance =
new SpeechSynthesisUtterance(text);

utterance.lang = 'zh-CN';

utterance.rate = 0.95;

utterance.pitch = 1.05;

speechSynthesis.speak(
utterance
);
}

/* =========================
   THREE INIT
========================= */

function initThree(){

scene =
new THREE.Scene();

camera =
new THREE.PerspectiveCamera(

60,

window.innerWidth /
window.innerHeight,

0.01,

100
);

camera.position.z = 2;

renderer =
new THREE.WebGLRenderer({

canvas,

alpha:true,

antialias:true,

powerPreference:'high-performance'
});

renderer.setPixelRatio(
Math.min(window.devicePixelRatio,1.5)
);

renderer.setSize(
window.innerWidth,
window.innerHeight
);

renderer.setClearColor(
0x000000,
0
);

/* LIGHT */

scene.add(
new THREE.AmbientLight(
0xffffff,
0.7
)
);

const l1 =
new THREE.PointLight(
0x00ffff,
4
);

l1.position.set(
2,
2,
2
);

scene.add(l1);

const l2 =
new THREE.PointLight(
0xff00aa,
4
);

l2.position.set(
-2,
-2,
2
);

scene.add(l2);

createSculpture();

createParticles();

createOrbitParticles();
}

/* =========================
   SCULPTURE
========================= */

function createSculpture(){

const geometry =
new THREE.IcosahedronGeometry(
0.35,
25
);

geometry.userData.original =
new Float32Array(
geometry.attributes.position.array
);

const material =
new THREE.MeshPhysicalMaterial({

color:0xffffff,

metalness:0.1,

roughness:0.15,

transparent:true,

opacity:0.92,

clearcoat:1
});

const wire =
new THREE.MeshBasicMaterial({

color:0xffffff,

wireframe:true,

transparent:true,

opacity:0.05
});

sculpture =
new THREE.Group();

sculpture.add(
new THREE.Mesh(
geometry,
material
)
);

sculpture.add(
new THREE.Mesh(
geometry.clone(),
wire
)
);

scene.add(sculpture);
}

/* =========================
   PARTICLES
========================= */

function createParticles(){

const geometry =
new THREE.BufferGeometry();

const count = 1800;

const positions =
new Float32Array(count * 3);

particleVelocity = [];

for(let i=0;i<count;i++){

positions[i*3] =
(Math.random()-0.5) * 1.2;

positions[i*3+1] =
(Math.random()-0.5) * 1.2;

positions[i*3+2] =
(Math.random()-0.5) * 1.2;

particleVelocity.push({

x:0,
y:0,
z:0
});
}

geometry.setAttribute(

'position',

new THREE.BufferAttribute(
positions,
3
)
);

const material =
new THREE.PointsMaterial({

color:0xffffff,

size:0.015,

transparent:true,

opacity:0.85
});

particles =
new THREE.Points(
geometry,
material
);

scene.add(particles);
}

/* =========================
   ORBIT
========================= */

function createOrbitParticles(){

const geometry =
new THREE.BufferGeometry();

const count = 700;

const positions =
new Float32Array(count * 3);

for(let i=0;i<count;i++){

const angle =
Math.random() * Math.PI * 2;

const radius =
1 + Math.random() * 2;

positions[i*3] =
Math.cos(angle) * radius;

positions[i*3+1] =
(Math.random() - 0.5) * 0.5;

positions[i*3+2] =
Math.sin(angle) * radius;
}

geometry.setAttribute(

'position',

new THREE.BufferAttribute(
positions,
3
)
);

const material =
new THREE.PointsMaterial({

color:0xffffff,

size:0.008,

transparent:true,

opacity:0.45
});

orbitParticles =
new THREE.Points(
geometry,
material
);

scene.add(orbitParticles);
}

/* =========================
   TEXT
========================= */

function showFloatingText(){

const text =

messages[
Math.floor(
Math.random() *
messages.length
)
];

floatingText.innerText = text;

floatingText.style.opacity = 1;

floatingText.style.transform =
'translateY(0px)';

setTimeout(()=>{

floatingText.style.opacity = 0;

floatingText.style.transform =
'translateY(20px)';

},1600);
}

function showPoem(){

const text =

poems[
Math.floor(
Math.random() *
poems.length
)
];

floatingText.innerText = text;

floatingText.style.opacity = 1;

setTimeout(()=>{

floatingText.style.opacity = 0;

},2800);
}

/* =========================
   TRAIL
========================= */

function createTrail(x,y){

const now = performance.now();

if(now - lastTrail < 40){

return;
}

lastTrail = now;

const div =
document.createElement('div');

div.style.position = 'fixed';

div.style.left = `${x}px`;

div.style.top = `${y}px`;

div.style.width = '10px';

div.style.height = '10px';

div.style.borderRadius = '50%';

div.style.background =
'rgba(255,255,255,0.7)';

div.style.pointerEvents = 'none';

div.style.zIndex = '120';

div.style.boxShadow =
'0 0 15px white';

document.body.appendChild(div);

requestAnimationFrame(()=>{

div.style.transition =
'0.8s';

div.style.opacity = 0;

div.style.transform =
'scale(4)';
});

setTimeout(()=>{

div.remove();

},800);
}

/* =========================
   EXPLODE
========================= */

function explodeSculpture(){

exploded = true;

for(let i=0;i<particleVelocity.length;i++){

const angle =
Math.random() * Math.PI * 2;

const force =
0.08 + Math.random() * 0.2;

particleVelocity[i].x =
Math.cos(angle) * force;

particleVelocity[i].y =
(Math.random()-0.5) * force;

particleVelocity[i].z =
Math.sin(angle) * force;
}

sculpture.children.forEach(mesh=>{

mesh.material.opacity = 0.35;
});
}

/* =========================
   GATHER
========================= */

function gatherSculpture(){

exploded = false;

sculpture.children.forEach(mesh=>{

mesh.material.opacity = 0.92;
});
}

/* =========================
   BIRTHDAY
========================= */

function triggerBirthday(){

if(birthdayTriggered){

return;
}

birthdayTriggered = true;

birthdayMode.style.opacity = 1;

birthdayContent.style.opacity = 1;

birthdayContent.style.transform =
'scale(1)';

statusEl.innerText =
'生日模式已激活';

speak('黄普远，生日快乐');

showPoem();
}

/* =========================
   SAVE
========================= */

saveBtn.addEventListener('click',()=>{

const link =
document.createElement('a');

link.download =
'birthday-universe.png';

link.href =
renderer.domElement.toDataURL(
'image/png'
);

link.click();
});

/* =========================
   DEFORM
========================= */

function animateSculpture(volume){

const mesh =
sculpture.children[0];

const geo =
mesh.geometry;

const pos =
geo.attributes.position;

const arr =
pos.array;

const orig =
geo.userData.original;

const t =
performance.now() * 0.001;

for(let i=0;i<arr.length;i+=3){

const ox = orig[i];
const oy = orig[i+1];
const oz = orig[i+2];

const noise =

Math.sin(
ox * 6 + t * 2
) *

Math.cos(
oy * 6 + t * 1.5
);

const amp =
1 + volume * 2;

arr[i] =
ox +
ox *
noise *
0.12 *
amp;

arr[i+1] =
oy +
oy *
noise *
0.12 *
amp;

arr[i+2] =
oz +
oz *
noise *
0.12 *
amp;
}

pos.needsUpdate = true;
}

/* =========================
   ANIMATE
========================= */

function animate(){

requestAnimationFrame(
animate
);

const volume =
getVolume();

/* FEEDBACK */

if(volume < 0.03){

statusEl.innerText =
'宇宙正在等待你的声音';

}else if(volume < 0.07){

statusEl.innerText =
'粒子开始轻微震动';

}else if(volume < 0.12){

statusEl.innerText =
'空间正在产生共鸣';

}else if(volume < 0.18){

statusEl.innerText =
'宇宙正在回应你的情绪';

}else if(volume < 0.24){

statusEl.innerText =
'能量波动持续增强';

}else{

statusEl.innerText =
'宇宙核心正在苏醒';
}

animateSculpture(volume);

/* ROTATION */

sculpture.rotation.y +=
0.004 + volume * 0.02;

sculpture.rotation.x +=
0.0015 + volume * 0.01;

/* SCALE */

const scale =
1 + volume * 1.8;

sculpture.scale.lerp(

new THREE.Vector3(
scale,
scale,
scale
),

0.08
);

/* PARTICLE PHYSICS */

const pos =
particles.geometry.attributes.position.array;

for(let i=0;i<particleVelocity.length;i++){

const ix = i * 3;

if(exploded){

pos[ix] +=
particleVelocity[i].x;

pos[ix+1] +=
particleVelocity[i].y;

pos[ix+2] +=
particleVelocity[i].z;

particleVelocity[i].x *= 0.985;
particleVelocity[i].y *= 0.985;
particleVelocity[i].z *= 0.985;

}else{

pos[ix] +=
(0 - pos[ix]) * 0.03;

pos[ix+1] +=
(0 - pos[ix+1]) * 0.03;

pos[ix+2] +=
(0 - pos[ix+2]) * 0.03;
}
}

particles.geometry.attributes.position.needsUpdate = true;

/* PARTICLES */

particles.rotation.y +=
0.001 + volume * 0.01;

orbitParticles.rotation.y +=
0.0012 + volume * 0.015;

/* EMISSIVE */

sculpture.children.forEach(mesh=>{

mesh.material.emissive =
new THREE.Color().setHSL(

0.5 + volume * 0.2,

1,

0.5
);

mesh.material.emissiveIntensity =
0.1 + volume * 2;
});

/* CAMERA */

camera.position.x =
Math.sin(
performance.now()*0.0002
) * (0.03 + volume * 0.05);

camera.position.y =
Math.cos(
performance.now()*0.0002
) * (0.03 + volume * 0.05);

if(volume > 0.18){

if(Math.random() > 0.988){

showFloatingText();
}
}

renderer.render(
scene,
camera
);
}

/* =========================
   HANDS
========================= */

const hands =
new Hands({

locateFile:(file)=>{

return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
}
});

hands.setOptions({

maxNumHands:1,

modelComplexity:0,

minDetectionConfidence:0.5,

minTrackingConfidence:0.5
});

hands.onResults((results)=>{

if(
!results.multiHandLandmarks ||
results.multiHandLandmarks.length === 0
){

return;
}

const hand =
results.multiHandLandmarks[0];

/* POSITION */

const palm =
hand[9];

const targetX =
(0.5 - palm.x) * 2;

const targetY =
-(palm.y - 0.5) * 1.6;

sculpture.position.x +=
(targetX - sculpture.position.x)
* 0.12;

sculpture.position.y +=
(targetY - sculpture.position.y)
* 0.12;

/* OPEN HAND */

const fingerOpen = [

hand[8].y < hand[6].y,

hand[12].y < hand[10].y,

hand[16].y < hand[14].y,

hand[20].y < hand[18].y
];

const openCount =
fingerOpen.filter(Boolean).length;

if(openCount >= 3){

if(!handOpen){

handOpen = true;

explodeSculpture();

showFloatingText();
}

}else{

if(handOpen){

handOpen = false;

gatherSculpture();
}
}

/* ROTATION */

const index =
hand[8];

sculpture.rotation.y =
(index.x - 0.5) * Math.PI * 1.5;

sculpture.rotation.x =
(index.y - 0.5) * Math.PI * 0.8;
});

/* =========================
   HAND CAMERA
========================= */

const handCamera =
new Camera(video,{

onFrame:async()=>{

await hands.send({

image:video
});
},

width:640,

height:480
});

/* =========================
   INPUT
========================= */

window.addEventListener(
'mousemove',
(e)=>{

createTrail(
e.clientX,
e.clientY
);
});

window.addEventListener(
'touchmove',
(e)=>{

const t =
e.touches[0];

createTrail(
t.clientX,
t.clientY
);
});

window.addEventListener(
'dblclick',
()=>{

triggerBirthday();
});

/* =========================
   RESIZE
========================= */

window.addEventListener(
'resize',
()=>{

camera.aspect =
window.innerWidth /
window.innerHeight;

camera.updateProjectionMatrix();

renderer.setSize(
window.innerWidth,
window.innerHeight
);
});

/* =========================
   START
========================= */

startBtn.addEventListener(
'click',
async()=>{

try{

statusEl.innerText =
'正在连接摄像头';

await initCamera();

statusEl.innerText =
'正在连接麦克风';

await initAudio();

statusEl.innerText =
'正在初始化宇宙';

initThree();

initSpeechRecognition();

handCamera.start();

ambientAudio.volume = 0.35;

ambientAudio.play();

overlay.style.opacity = 0;

setTimeout(()=>{

overlay.style.display =
'none';

},1200);

statusEl.innerText =
'张开手掌释放宇宙';

showPoem();

animate();

}catch(err){

console.error(err);

statusEl.innerText =
'启动失败，请刷新页面';
}
});
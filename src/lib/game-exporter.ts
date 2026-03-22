import { Scene3D } from './gcodeforce-interpreter';

export interface ExportOptions {
  includePhysics: boolean;
  includeAudio: boolean;
  title: string;
}

export class GameExporter {
  private scene: Scene3D;
  private sourceCode: string;
  private options: ExportOptions;

  constructor(scene: Scene3D, sourceCode: string, options?: Partial<ExportOptions>) {
    this.scene = scene;
    this.sourceCode = sourceCode;
    this.options = {
      includePhysics: true,
      includeAudio: true,
      title: scene.name || 'GcodeForce Game',
      ...options,
    };
  }

  export(): string {
    const sceneJSON = JSON.stringify(this.scene);

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
<title>${this.options.title} - GcodeForce</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{overflow:hidden;background:#1a1a2e;font-family:system-ui,sans-serif}
#c{width:100vw;height:100vh;display:block}
#hud{position:fixed;top:8px;left:8px;color:#0f0;font-size:12px;font-family:monospace;z-index:10;pointer-events:none}
#info{position:fixed;bottom:8px;left:50%;transform:translateX(-50%);color:#fff8;font-size:11px;z-index:10;pointer-events:none}
#loading{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#1a1a2e;color:#fff;font-size:18px;z-index:100}
</style>
</head>
<body>
<div id="loading">Loading...</div>
<div id="hud"></div>
<div id="info">WASD to move · Space to jump</div>
<canvas id="c"></canvas>
<script src="https://unpkg.com/three@0.160.0/build/three.min.js"><\/script>
<script>
(function(){
const SCENE=${sceneJSON};
const canvas=document.getElementById('c');
const hud=document.getElementById('hud');
const loading=document.getElementById('loading');

const renderer=new THREE.WebGLRenderer({canvas,antialias:true});
renderer.setSize(window.innerWidth,window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
renderer.shadowMap.enabled=true;

const scene=new THREE.Scene();
scene.background=new THREE.Color('#1a1a2e');
scene.fog=new THREE.Fog('#1a1a2e',30,100);

const cam=SCENE.camera;
const camera=new THREE.PerspectiveCamera(cam.fov||75,window.innerWidth/window.innerHeight,0.1,1000);
camera.position.set(...cam.position);
camera.lookAt(...cam.lookAt);

// Lights
SCENE.lights.forEach(l=>{
  let light;
  switch(l.type){
    case 'ambient': light=new THREE.AmbientLight(l.color,l.intensity);break;
    case 'directional': light=new THREE.DirectionalLight(l.color,l.intensity);if(l.position)light.position.set(...l.position);light.castShadow=true;break;
    case 'point': light=new THREE.PointLight(l.color,l.intensity);if(l.position)light.position.set(...l.position);break;
    case 'spot': light=new THREE.SpotLight(l.color,l.intensity);if(l.position)light.position.set(...l.position);break;
  }
  if(light)scene.add(light);
});

// Grid
const grid=new THREE.GridHelper(50,50,0x444466,0x333355);
scene.add(grid);

// Ground
const groundGeo=new THREE.BoxGeometry(50,0.1,50);
const groundMat=new THREE.MeshStandardMaterial({color:'#2a2a3e',transparent:true,opacity:0.5});
const ground=new THREE.Mesh(groundGeo,groundMat);
ground.position.y=0;
ground.receiveShadow=true;
scene.add(ground);

// Entities
const meshes={};
const velocities={};
const controlledIds=[];
const gravity=-15;
const jumpForce=8;

function createGeometry(primitive,scale){
  switch(primitive){
    case 'sphere': return new THREE.SphereGeometry(scale[0]/2,32,32);
    case 'cylinder': return new THREE.CylinderGeometry(scale[0]/2,scale[0]/2,scale[1],32);
    case 'cone': return new THREE.ConeGeometry(scale[0]/2,scale[1],32);
    case 'torus': return new THREE.TorusGeometry(scale[0]/2,scale[0]/6,16,48);
    case 'plane': return new THREE.BoxGeometry(scale[0],0.1,scale[2]);
    default: return new THREE.BoxGeometry(...scale);
  }
}

SCENE.entities.forEach(e=>{
  const mat=e.material||{};
  const geo=createGeometry(e.primitive,e.scale);
  const material=new THREE.MeshStandardMaterial({
    color:mat.color||e.color||'#888888',
    roughness:mat.roughness??0.5,
    metalness:mat.metalness??0,
    transparent:(mat.opacity??1)<1,
    opacity:mat.opacity??1,
  });
  const mesh=new THREE.Mesh(geo,material);
  mesh.position.set(...e.position);
  mesh.rotation.set(e.rotation[0]*Math.PI/180,e.rotation[1]*Math.PI/180,e.rotation[2]*Math.PI/180);
  mesh.castShadow=true;
  mesh.receiveShadow=true;
  scene.add(mesh);
  meshes[e.id]=mesh;
  velocities[e.id]={x:0,y:0,z:0};
  if(e.control&&e.control.enabled)controlledIds.push(e.id);
});

// Input
const keys={};
window.addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;e.preventDefault()});
window.addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false});

// Touch controls
let touchMoveX=0,touchMoveZ=0,touchJump=false;
canvas.addEventListener('touchstart',e=>{
  if(e.touches[0].clientY>window.innerHeight*0.7)touchJump=true;
},{passive:true});
canvas.addEventListener('touchmove',e=>{
  const t=e.touches[0];
  touchMoveX=(t.clientX/window.innerWidth-0.5)*2;
  touchMoveZ=(t.clientY/window.innerHeight-0.5)*2;
},{passive:true});
canvas.addEventListener('touchend',()=>{touchMoveX=0;touchMoveZ=0;touchJump=false},{passive:true});

// Resize
window.addEventListener('resize',()=>{
  camera.aspect=window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth,window.innerHeight);
});

// Game loop
let lastTime=0,fpsCount=0,fpsTime=0,currentFps=0;

function animate(time){
  requestAnimationFrame(animate);
  const delta=Math.min((time-lastTime)/1000,0.05);
  lastTime=time;

  fpsCount++;
  if(time-fpsTime>=1000){currentFps=fpsCount;fpsCount=0;fpsTime=time;hud.textContent=currentFps+' FPS';}

  controlledIds.forEach(id=>{
    const mesh=meshes[id];
    const vel=velocities[id];
    const entity=SCENE.entities.find(e=>e.id===id);
    if(!mesh||!entity)return;
    const speed=entity.control?.speed||5;

    let mx=0,mz=0;
    if(keys['w']||keys['arrowup'])mz=-1;
    if(keys['s']||keys['arrowdown'])mz=1;
    if(keys['a']||keys['arrowleft'])mx=-1;
    if(keys['d']||keys['arrowright'])mx=1;
    mx+=touchMoveX;mz+=touchMoveZ;

    mesh.position.x+=mx*speed*delta;
    mesh.position.z+=mz*speed*delta;

    // Gravity
    if(entity.physics?.gravity){
      vel.y+=gravity*delta;
      mesh.position.y+=vel.y*delta;
      if(mesh.position.y<=entity.scale[1]/2){
        mesh.position.y=entity.scale[1]/2;
        vel.y=0;
        if(keys[' ']||touchJump){vel.y=jumpForce;touchJump=false;}
      }
    }
  });

  renderer.render(scene,camera);
}

loading.style.display='none';
requestAnimationFrame(animate);
})();
<\/script>
</body>
</html>`;
  }

  download(filename?: string): void {
    const html = this.export();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `${this.options.title.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

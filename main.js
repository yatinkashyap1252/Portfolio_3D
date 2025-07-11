import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// === Basic Setup ===
const scene = new THREE.Scene();
const canvas = document.getElementById("experience-canvas");
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;

// === Camera & Controls ===
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 2000);
camera.position.set(160, 80, -128);
camera.lookAt(new THREE.Vector3(128, 20, -112));
scene.add(camera);

const controls = new OrbitControls(camera, canvas);
controls.target.set(128, 40, -112);
controls.enableDamping = true;
controls.update();

// === Flags ===
let followCharacter = false;
let cameraCharacterOffset = new THREE.Vector3();
let orbitUnlockTimeout = null;
let orbitLocked = false;

// === Character Setup ===
let character = {
  instance: null,
  moveDistance: 3,
  jumpHeight: 1,
  isMoving: false,
  moveDuration: 0.2,
};

// === Ground ===
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(5000, 5000),
  new THREE.MeshStandardMaterial({ color: 0x5e9e4d })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// === Lighting ===
const sun = new THREE.DirectionalLight(0x5c4f2c);
sun.position.set(80, 80, 50);
sun.castShadow = true;
sun.shadow.camera.left = -100;
sun.shadow.camera.right = 200;
sun.shadow.camera.top = -100;
sun.shadow.camera.bottom = 100;
sun.shadow.mapSize.width = 2048;
sun.shadow.mapSize.height = 2048;
sun.shadow.normalBias = 0.5;
scene.add(sun);
scene.add(new THREE.CameraHelper(sun.shadow.camera));
scene.add(new THREE.DirectionalLightHelper(sun, 2));

const ambientLight = new THREE.AmbientLight(0x404040, 4);
scene.add(ambientLight);

// === Load Model ===
const intersectObjects = [];
const clickableGroups = [
  "Cube009", "Cube011", "Cube124", "Cube125", "Cube126", "Cube127", "Cube128",
  "Cube129", "Cube084", "Cube085", "Cube086", "Cube087", "Cube088", "Cube089",
  "Cube090", "Cube091", "Cube092", "Cube093", "Cube094", "Cube095", "face001",
];

const loader = new GLTFLoader();
loader.load("./model.glb", (glb) => {
  const model = glb.scene;
  scene.add(model);

  model.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }

    if (clickableGroups.includes(child.name)) {
      if (child.name === "face001") {
        character.instance = child;
        cameraCharacterOffset.copy(camera.position).sub(child.position);
        followCharacter = true;
      }

      child.traverse((sub) => {
        if (sub.isMesh) {
          intersectObjects.push(sub);
        }
      });
    }
  });

  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  box.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z);
  camera.zoom = 1200 / maxDim;
  camera.updateProjectionMatrix();
});

// === Input Events ===
window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  renderer.setSize(sizes.width, sizes.height);
});

window.addEventListener("pointermove", (e) => {
  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

window.addEventListener("keydown", (event) => {
  if (!character.instance || character.isMoving) return;

  const move = character.moveDistance;
  const pos = character.instance.position.clone();

  switch (event.key.toLowerCase()) {
    case "w":
    case "arrowup":
      pos.z -= move;
      break;
    case "s":
    case "arrowdown":
      pos.z += move;
      break;
    case "a":
    case "arrowleft":
      pos.x -= move;
      break;
    case "d":
    case "arrowright":
      pos.x += move;
      break;
    default:
      return;
  }

  moveCharacterTo(pos);
});

// === Character Movement ===
function moveCharacterTo(targetPosition) {
  if (!character.instance) return;

  character.isMoving = true;
  followCharacter = true;
  controls.enabled = false;
  orbitLocked = true;

  if (orbitUnlockTimeout) clearTimeout(orbitUnlockTimeout);

  const t1 = gsap.timeline({
    onComplete: () => {
      character.isMoving = false;
      orbitUnlockTimeout = setTimeout(() => {
        followCharacter = false;
        orbitLocked = false;
        controls.enabled = true;
        controls.target.copy(character.instance.position.clone());
        controls.update();
      }, 300); // delay before user gets control
    },
  });

  t1.to(character.instance.position, {
    x: targetPosition.x,
    z: targetPosition.z,
    duration: character.moveDuration,
  });

  t1.to(
    character.instance.position,
    {
      y: character.instance.position.y + character.jumpHeight,
      duration: character.moveDuration / 2,
      yoyo: true,
      repeat: 1,
    },
    0
  );
}

// === Click Modal Logic ===
canvas.addEventListener("click", (e) => {
  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(intersectObjects, true);

  if (intersects.length > 0) {
    let clicked = intersects[0].object;
    while (clicked && !clickableGroups.includes(clicked.name)) {
      clicked = clicked.parent;
    }

    if (clicked) {
      const { title, description, link } = clicked.userData || {};
      document.querySelector(".modal").classList.add("active");
      document.querySelector(".modal-title").textContent = title || clicked.name;
      document.querySelector(".modal-description").textContent = description || "";
      document.querySelector(".modal-link").href = link || "#";
    }
  }
});

document.querySelector(".modal-exit-button").addEventListener("click", () => {
  document.querySelector(".modal").classList.remove("active");
});

// === Animation Loop ===
function animate() {
  controls.update();

  if (followCharacter && character.instance) {
    const desiredPos = character.instance.position.clone().add(cameraCharacterOffset);
    camera.position.lerp(desiredPos, 0.1);
    camera.lookAt(character.instance.position);
  }

  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(intersectObjects);

  // Hover scaling effect
  for (const intersect of intersects) {
    const obj = intersect.object;
    obj.scale.set(1.15, 1.15, 1.15);
  }

  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);
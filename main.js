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
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  2000
);
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
  "Cube009",
  "Cube011",
  "Cube124",
  "Cube125",
  "Cube126",
  "Cube127",
  "Cube128",
  "Cube129",
  "Cube084",
  "Cube085",
  "Cube086",
  "Cube087",
  "Cube088",
  "Cube089",
  "Cube090",
  "Cube091",
  "Cube092",
  "Cube093",
  "Cube094",
  "Cube095",
  "face001",
];

const cubeMeta = {
  Cube084: {
    title: "Chattie",
    description:
      "This is a real-time chat application built using the MERN stack (MongoDB, Express, React, Node.js). The app supports features like real-time messaging, user authentication, cloud-based image storage, and a responsive design. It also uses several modern libraries and tools for efficient development.",
    link: "https://github.com/yatinkashyap1252/Chattie-chat_app",
  },
  Cube085: {
    title: "Fitness App",
    description:
      "A focused fitness app built with React Native that helps users understand exercises by purpose.Each movement is categorized by target muscle group — from core to upper body and beyond.Simple, clean UI delivers quick access to form tips, benefits, and structure.Perfect for beginners or anyone wanting to train smarter, not just harder.",
    link: "https://portfolio-3d-k48k.onrender.com/",
  },
  Cube086: {
    title: "Olympic Games Analysis",
    description:
      "This repository contains a comprehensive data analysis of the Olympic Games using Python. The project explores country-wise performance, medal distributions, participation trends, athlete statistics, and various other insights through visualization and data processing.",
    link: "https://github.com/yatinkashyap1252/Olympic_analysis_summer",
  },
  Cube087: {
    title: "WhatsApp UI",
    description:
      "Designed a responsive UI replica of WhatsApp with a clean and scalable layout approach.The interface adapts fluidly across screen sizes, staying true to the original user experience.Focused on structure, detail, and modern UI practices — fully front-end ready.Note: Code is not yet uploaded to GitHub but will be shared soon.",
    link: "https://portfolio-3d-k48k.onrender.com/",
  },
  Cube088: {
    title: "Globepath",
    description:
      "GlobePath is a smart travel companion app built with React Native, powered by Gemini AI and Firebase.Users answer simple, custom questions — and Gemini responds with tailored insights in JSON format.It’s a seamless blend of AI-driven personalization, real-time data, and smooth mobile UX.Designed to guide journeys, not just map them.",
    link: "https://github.com/yatinkashyap1252/globepath",
  },
  Cube089: {
    title: "Safar Go",
    description:
      "Welcome to Safargo — a feature-rich ride-booking app built with React Native. Safargo provides a seamless and intuitive experience for users to book rides, make payments, and manage accounts. With clean UI components and a scalable architecture, Safargo is designed to enhance your ride-booking experience.",
    link: "https://github.com/yatinkashyap1252/SafarGo",
  },
  Cube090: {
    title: "Corona",
    description:
      "A bold 3D e-commerce prototype merging immersive interaction with futuristic design.Crafted in Framer and Spline, it reimagines how users explore, feel, and shop products.It’s not just a concept — it’s a glimpse into the future of online retail.Where experience meets motion, and browsing becomes a journey.Information about Cube090.",
    link: "https://smaller-founders-314097.framer.app/",
  },
  Cube091: {
    title: "Profile Page",
    description:
      "Built in Figma, this design fuses playful elements with intuitive UX, turning navigation into an experience.Every click feels like a move — immersive, dynamic, and purpose-driven.Perfect for platforms aiming to excite, engage, and retain.",
    link: "https://www.figma.com/design/mmo7lP8csn2lT8l6iraLn4/Mobile-yatin?node-id=0-1&t=oNYIqeH2i9XvTJ5x-1",
  },
  Cube092: {
    title: "Safar Go",
    description:
      "A sofishticated and culturally infused design system blending aesthetics with meaning.Each screen is thoughtfully crafted to reflect both visual harmony and intuitive UX.Rooted in methodology, the layout flows with clarity while embracing cultural nuance.An experience that feels intentional, immersive, and deeply human.",
    link: "https://www.figma.com/design/mmo7lP8csn2lT8l6iraLn4/Mobile-yatin?node-id=0-1&t=oNYIqeH2i9XvTJ5x-1",
  },
  Cube093: {
    title: "Celestique",
    description:
      "Crafted a clean and minimal commercial setup to spotlight the product's design and function.Soft lighting and a neutral backdrop keep the focus sharp and professional.Perfect for modern brands aiming for elegance and clarity in presentation.",
    link: "https://www.instagram.com/p/DE9jlNEIkxn/?img_index=1",
  },
  Cube095: {
    title: "Kinematics Landing Page",
    description:
      "An interactive web experience built with Framer and Spline, simulating potential-to-kinetic energy transformation.Vibrant spheres drop through a torus-shaped path, visualizing motion, momentum, and precision.Clean layout and dynamic physics storytelling highlight innovation and technical finesse.Perfect for showcasing impact-driven design in motion.",
    link: "https://expanded-course-024994.framer.app/",
  },
  Cube094: {
    title: "Borcella Luxury Perfume",
    description:
      "Each element is thoughtfully placed to balance style and function, creating an immersive visual narrative.Swipe to explore behind‑the‑scenes styling and see how this design transforms an everyday object into a centerpiece.",
    link: "https://www.instagram.com/p/DFLG-RmoNRa/",
  },
  Cube124: {
    title: "Let’s Connect",
    description:
      "Whether you have a project in mind, a collaboration opportunity, or just want to say hi — I’d love to hear from you.Feel free to reach out through the form below or drop a message via email or social media.I’m always open to creative ideas, feedback, or just a good conversation.",
    link: "www.linkedin.com/in/yatin-kashyap-96a7412b6",
  },
  Cube125: {
    title: "The GoogGame Theory",
    description:
      "Currently interning at The GoodGame Theory, where I design intuitive UI/UX experiences for gaming-related products.Now leading the design team while also mentoring and training new trainees.Gaining hands-on experience in team management, creative direction, and real-world product design.It’s been a dynamic role blending design execution with leadership growth.",
    link: "www.linkedin.com/in/yatin-kashyap-96a7412b6",
  },
  Cube126: {
    title: "Webito Infotech - FLutter Developer",
    description:
      "Gained hands-on experience with Flutter and Dart, focusing on building responsive and visually appealing UI components for mobile applications.",
    link: "www.linkedin.com/in/yatin-kashyap-96a7412b6",
  },
  Cube127: {
    title: "Oasis Infobyte - Web Development Intern",
    description:
      "Collaborated with backend teams to integrate intelligent features and enhance personalization.",
    link: "www.linkedin.com/in/yatin-kashyap-96a7412b6",
  },
  Cube129: {
    title: "IBM - Data Analytics",
    description:
      "Completed a Data Analytics program by IBM in collaboration with Edunet Foundation.Learned to explore, clean, and visualize data using tools like Tableau and basic data handling techniques.Gained hands-on experience in interpreting datasets and uncovering insights.Built a strong foundation in data-driven thinking and storytelling with data.",
    link: "www.linkedin.com/in/yatin-kashyap-96a7412b6",
  },
  Cube128: {
    title: "Edunet Data Analytics",
    description:
      "Engaged with Edunet Foundation through industry-aligned training programs focused on emerging technologies.Participated in skill-building initiatives like Data Analytics with IBM, enhancing both technical and analytical capabilities.",
    link: "www.linkedin.com/in/yatin-kashyap-96a7412b6",
  },
  Cube009: {
    title: "HSC From A G High School",
    description:
      "Completed my Higher Secondary Education (HSC) with a focus on Science, building a strong academic foundation.This phase sharpened my analytical thinking, discipline, and subject understanding.It played a key role in shaping my curiosity and approach to problem-solving.Proud of the consistency and dedication I maintained throughout.",
    link: "www.linkedin.com/in/yatin-kashyap-96a7412b6",
  },
  Cube011: {
    title: "BE From Vishwakarma Government Engineering College,GTU",
    description:
      "Pursuing a Bachelor’s in Computer Engineering with a strong focus on software development, algorithms, and system design.This journey has equipped me with hands-on experience in coding, problem-solving, and building real-world projects.",
    link: "www.linkedin.com/in/yatin-kashyap-96a7412b6",
  },
};

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
      if (cubeMeta[child.name]) {
        child.userData = cubeMeta[child.name];
      }

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
      document.querySelector(".modal-title").textContent =
        title || clicked.name;
      document.querySelector(".modal-description").textContent =
        description || "";
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
    const desiredPos = character.instance.position
      .clone()
      .add(cameraCharacterOffset);
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

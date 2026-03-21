import { BufferGeometry, Float32BufferAttribute, LinearToneMapping, NoToneMapping, RepeatWrapping, Scene } from "three";
import { GLTF } from "three/examples/jsm/Addons.js";
import { texture } from "three/tsl";
import { Mesh, MeshBasicNodeMaterial, PerspectiveCamera, WebGPURenderer } from "three/webgpu";
import { loadAssets, loadedTextures } from "./assets";
import { Input } from "./input";
import { Player } from "./player";
import "./style.css";
import { Time } from "./time";


const renderer = new WebGPURenderer;
const scene = new Scene;
const camera = new PerspectiveCamera(90);

const input = new Input;
let player: Player;
let playerModel: GLTF;

main();

async function main() {
    await renderer.init();
    renderer.toneMapping = NoToneMapping;

    document.body.appendChild(renderer.domElement);
    input.attachKeyboard(document.body);
    resize();

    await loadAssets();
    await setup();

    window.addEventListener("resize", () => resize());
    window.addEventListener("gamepadconnected", event => {
        console.log(`%cGamepad ${event.gamepad.index} connected`, "color: cornflowerblue; font-family: system-ui; font-size: 2rem; text-stroke: 0.25rem black; font-weight:bold;")
        console.log(event.gamepad.id)
        input.attachController(event.gamepad);
    });
    window.addEventListener("gamepaddisconnected", event => {
        console.log(`%cGamepad ${event.gamepad.index} disconnected`, "color: pink; font-family: system-ui; font-size: 2rem; text-stroke: 0.25rem black; font-weight:bold;")
        console.log(event.gamepad.id)
        input.detachController(event.gamepad);
    });
    requestAnimationFrame(render);
}

function resize() {
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(devicePixelRatio);

    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
}


let lastTime: number = 0;
let nextFpsReset = 0;
function render(time: number) {
    update({
        ms: time,
        dt: (time - lastTime) / 1000
    });

    lastTime = time;

    renderer.render(scene, camera);
    requestAnimationFrame(render);
}

let fps = 0;
function update(time: Time) {
    fps++;

    if(time.ms > nextFpsReset) {
        console.log(`${fps} FPS`);

        fps = 0;
        nextFpsReset = time.ms + 1000;
    }

    player.update(time);
    input.update(time);

    
    camera.position.copy(player.camera.position);
    camera.quaternion.copy(player.camera.quaternion);
    camera.fov = player.camera.fov;
    // camera.position.set(0, 8, 8);
    // camera.rotation.order = "YXZ";
    // camera.rotation.y = player.rotation.x;
    // camera.rotation.x = player.rotation.y;
    // camera.lookAt(player.position);
}

function makeCube(width: number, height: number, depth: number): BufferGeometry {
    const geometry = new BufferGeometry();
    const xl = 0, yl = 0, zl = 0, xu = width, yu = height, zu = depth;
    const w = width, h = height, d = depth;

    geometry.setAttribute("position", new Float32BufferAttribute([
        xu, yl, zl,
        xl, yl, zl,
        xl, yu, zl,
        xu, yu, zl,

        xl, yl, zu,
        xu, yl, zu,
        xu, yu, zu,
        xl, yu, zu,

        xl, yl, zl,
        xl, yl, zu,
        xl, yu, zu,
        xl, yu, zl,

        xu, yl, zu,
        xu, yl, zl,
        xu, yu, zl,
        xu, yu, zu,

        xl, yu, zu,
        xu, yu, zu,
        xu, yu, zl,
        xl, yu, zl,

        xl, yl, zl,
        xu, yl, zl,
        xu, yl, zu,
        xl, yl, zu
    ], 3, false));
    geometry.setAttribute("uv", new Float32BufferAttribute([
        0, 0,
        w, 0,
        w, h,
        0, h,

        0, 0,
        w, 0,
        w, h,
        0, h,

        0, 0,
        d, 0,
        d, h,
        0, h,

        0, 0,
        d, 0,
        d, h,
        0, h,

        0, 0,
        w, 0,
        w, d,
        0, d,

        0, 0,
        w, 0,
        w, d,
        0, d
    ], 2, false));

    let index: number[] = new Array;

    for(let i = 0; i < 6; i++) {
        index.push(
            i * 4 + 0, i * 4 + 1, i * 4 + 2,
            i * 4 + 2, i * 4 + 3, i * 4 + 0
        );
    }
    geometry.setIndex(index);

    return geometry;
}

async function setup() {
    const grassTexture = loadedTextures.get("grass").clone();
    grassTexture.wrapS = RepeatWrapping;
    grassTexture.wrapT = RepeatWrapping;

    const geometry = makeCube(8, 1, 8);

    const ground = new Mesh(
        geometry,
        new MeshBasicNodeMaterial({
            colorNode: texture(grassTexture)
        })
    );

    scene.add(ground);
    ground.position.set(-4, -1, -4);
    
    player = new Player(input);
    player.position.set(0, 0, 0);
    
    player.animator.setup();
    player.animator.addToScene(scene);
}
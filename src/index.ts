import "./style.css";
import { Euler, Scene } from "three";
import { texture, uv } from "three/tsl";
import { BoxGeometry, Mesh, MeshBasicNodeMaterial, PerspectiveCamera, TextureLoader, WebGPURenderer } from "three/webgpu";
import { Input } from "./input";
import { Player } from "./player";
import { Time } from "./time";


const renderer = new WebGPURenderer;
const scene = new Scene;
const camera = new PerspectiveCamera(90);

const input = new Input;
const player = new Player(input);

main();

async function main() {
    await renderer.init();

    document.body.appendChild(renderer.domElement);
    input.attachKeyboard(document.body);
    resize();

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

    camera.position.copy(player.position);
    camera.rotation.order = "YXZ";
    camera.rotation.y = player.rotation.x;
    camera.rotation.x = player.rotation.y;
}

async function setup() {
    const textureLoader = new TextureLoader;
    const grassTexture = await textureLoader.loadAsync("assets/textures/grass.png");

    const ground = new Mesh(
        new BoxGeometry(8, 1, 8),
        new MeshBasicNodeMaterial({
            colorNode: texture(grassTexture, uv())
        })
    );

    scene.add(ground);

    player.position.set(0, 8, 12);
}
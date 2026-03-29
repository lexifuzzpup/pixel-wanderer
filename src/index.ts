import { BufferGeometry, Float32BufferAttribute, InstancedMesh, LinearToneMapping, Material, Matrix4, NoToneMapping, Object3D, RepeatWrapping, Scene, Vector2 } from "three";
import { GLTF } from "three/examples/jsm/Addons.js";
import { mod, texture } from "three/tsl";
import { Mesh, MeshBasicNodeMaterial, PerspectiveCamera, WebGPURenderer } from "three/webgpu";
import { loadAssets, loadedModels, loadedTextures } from "./assets";
import { Input } from "./input";
import { Player } from "./player";
import "./style.css";
import { Time } from "./time";
import { iuv } from "./shaders";


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
    input.attachMouse(renderer.domElement);

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
    document.addEventListener("mousedown", () => {
        input.mouse.lock(renderer.domElement);
    })
    document.addEventListener("pointerlockchange", (event) => {
        input.mouse.pointerLockChange(document.pointerLockElement == renderer.domElement);
    });
    requestAnimationFrame(render);

    requestAnimationFrame(() => {
        resize();
    });
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

function findThree<ObjectType extends Object3D>(object: Object3D, name: string) {
    let found: ObjectType;

    object.traverse(predicate => {
        if(found != null) return;

        if(predicate.name == name) {
            found = <ObjectType>predicate;
        }
    });

    return found;
}

export const islandMeshTemplates: InstancedMesh[] = new Array;
const islandInstanceCounts: number[] = new Array;
const islandMatrices: WeakMap<Matrix4, [ InstancedMesh, number ]> = new WeakMap;

function createIsland(islandType: number) {
    const instancer = islandMeshTemplates[islandType];
    const index = islandInstanceCounts[islandType]++;

    const matrix = new Matrix4;
    matrix.makeScale(2, 2, 2);
    instancer.setMatrixAt(index, matrix);
    islandMatrices.set(matrix, [ instancer, index ]);

    return matrix;
}
function updateIsland(matrix: Matrix4) {
    const entry = islandMatrices.get(matrix);

    if(entry == null) return;

    const [ instancedMesh, index ] = entry;
    instancedMesh.setMatrixAt(index, matrix);
}

export function hexagonalToCartesian(inVec: Vector2, outVec: Vector2): Vector2 {
    if(inVec.y % 2 < 1) {
        outVec.copy(inVec);
        outVec.multiplyScalar(2);
    } else {
        outVec.set(inVec.x * 2 + 1, inVec.y * 2);
    }

    outVec.y *= Math.sqrt(3) / 2;

    return outVec;
}

async function setup() {
    for(let i = 1; i <= 1; i++) {
        const islandTexture = loadedTextures.get("island" + i).clone();
        const model = loadedModels.get("island");
        const mesh = findThree<Mesh>(model.scene, "Island1").clone(true);

        const instancedMesh = new InstancedMesh(
            mesh.geometry,
            new MeshBasicNodeMaterial({
                colorNode: texture(islandTexture, iuv()),
                alphaTest: 0.5
            }),
            4096
        );

        islandMeshTemplates.push(instancedMesh);
        islandInstanceCounts.push(0);
        scene.add(instancedMesh);
    }

    const grassTexture = loadedTextures.get("grass").clone();
    grassTexture.wrapS = RepeatWrapping;
    grassTexture.wrapT = RepeatWrapping;

    const hexPos = new Vector2();
    const cartPos = new Vector2();

    for(hexPos.x = 0; hexPos.x < 64; hexPos.x++) {
        for(hexPos.y = 0; hexPos.y < 64; hexPos.y++) {
            hexagonalToCartesian(hexPos, cartPos);

            const island = createIsland(0);

            island.setPosition(cartPos.x, Math.random() * 16, cartPos.y);
            updateIsland(island);
        }
    }
    
    player = new Player(input);
    player.position.set(0, 0, 0);
    
    player.animator.setup();
    player.animator.addToScene(scene);
}
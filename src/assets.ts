import { LinearFilter, LoadingManager, NearestFilter, SRGBColorSpace, Texture, TextureLoader } from "three";
import { GLTF, GLTFLoader } from "three/examples/jsm/Addons.js";

export const loadedTextures: Map<string, Texture> = new Map;
export const loadedModels: Map<string, GLTF> = new Map;

export async function loadAssets() {
    const manager = new LoadingManager;
    const textureLoader = new TextureLoader(manager);
    const gltfLoader = new GLTFLoader(manager);

    loadedTextures.set("grass", await textureLoader.loadAsync("assets/textures/grass.png"));
    loadedTextures.set("player", await textureLoader.loadAsync("assets/textures/player.png"));

    for(const texture of loadedTextures.values()) {
        texture.magFilter = NearestFilter;
        texture.minFilter = LinearFilter;
        texture.colorSpace = SRGBColorSpace;
    }

    loadedModels.set("player", await gltfLoader.loadAsync("assets/models/player.glb"));
}
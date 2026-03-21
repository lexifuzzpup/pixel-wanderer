import { AnimationActionLoopStyles, AnimationBlendMode, AnimationClip, AnimationMixer, Euler, LoopOnce, LoopRepeat, Scene, Vector3 } from "three";
import { GLTF } from "three/examples/jsm/Addons.js";
import { Time } from "./time";

export class AnimationExtractor {
    private readonly clips: Map<string, AnimationClip>;
    private readonly mixer: AnimationMixer;

    constructor(gltf: GLTF, mixer: AnimationMixer) {
        const clips: Map<string, AnimationClip> = new Map;
        for(const clip of gltf.animations) {
            clips.set(clip.name, clip);
        }
        this.clips = clips;
        this.mixer = mixer;
    }

    public extract(cannonicalName: string, loopType: AnimationActionLoopStyles, blendMode: AnimationBlendMode) {
        for(const [ key, value ] of this.clips.entries()) {
            if(key != cannonicalName) continue;
            
            const action = this.mixer.clipAction(value);

            if(loopType != LoopOnce) {
                action.setLoop(loopType, Infinity);
            }
            action.blendMode = blendMode;
            return action;
        }
        return null;
    }
}

export interface AnimationState {
    position: Vector3;
    rotation: Euler;
}

export abstract class Animator<AnimationStateType extends AnimationState> {
    public readonly state = this.createBlankState();
    protected readonly previousState = this.createBlankState();
    protected gltf: GLTF;

    public abstract addToScene(scene: Scene): void;
    public abstract update(time: Time): void;
    protected abstract createBlankState(): AnimationStateType

    public setup(gltf: GLTF) {

    }
    protected savePreviousState() {
        Object.assign(this.previousState, this.state);
    }
}
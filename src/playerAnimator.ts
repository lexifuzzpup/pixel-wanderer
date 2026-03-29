import { AdditiveAnimationBlendMode, AnimationAction, AnimationMixer, DoubleSide, Euler, LoopRepeat, Mesh, MeshPhongMaterial, NormalAnimationBlendMode, Object3D, Quaternion, Scene, Vector2, Vector3 } from "three";
import { GLTF } from "three/examples/jsm/Addons.js";
import { AnimationExtractor, AnimationState, Animator } from "./animation";
import { Time } from "./time";
import { MeshBasicNodeMaterial } from "three/webgpu";
import { texture, uv, vec2 } from "three/tsl";
import { loadedModels, loadedTextures } from "./assets";
import { iuv } from "./shaders";

export interface PlayerAnimationState extends AnimationState {
    headRotation: Euler;
    runningFactor: number;
    firstPersonFactor: number;
}

export class PlayerAnimator extends Animator<PlayerAnimationState> {
    private mixer: AnimationMixer;
    private walkAnimation: AnimationAction;
    private idleAnimation: AnimationAction;
    private currentBaseAnimation: AnimationAction;
    private playerRoot: Object3D;
    private playerHead: Mesh;
    private playerBody: Mesh;

    private bodyQuaternion = new Quaternion;
    private displayBodyQuaternion = new Quaternion;
    private headQuaternion = new Quaternion;
    private displayHeadQuaternion = new Quaternion;

    private morphTargetFirstPerson: number;

    public override createBlankState() {
        return {
            position: new Vector3,
            rotation: new Euler,
            headRotation: new Euler,
            runningFactor: 0,
            firstPersonFactor: 0,
        };
    }

    public override addToScene(scene: Scene): void {
        scene.add(this.playerRoot);
    }

    public setVisible(visible: boolean) {
        this.playerRoot.visible = visible;
    }

    public override setup() {
        const gltf = loadedModels.get("player");
        super.setup(gltf);

        this.playerRoot = gltf.scene.children[0];

        this.playerRoot.traverse(object => {
            if(object.name == "Head") {
                this.playerHead = <Mesh>object;
            }
            if(object.name == "PlayerBody") {
                this.playerBody = <Mesh>object;
            }
        });

        this.morphTargetFirstPerson = this.playerBody.morphTargetDictionary["FirstPerson"];

        const playerTexture = loadedTextures.get("player");

        this.playerBody.material = new MeshBasicNodeMaterial({
            colorNode: texture(playerTexture, iuv()),
            side: DoubleSide,
            alphaTest: 0.5
        })
        
        const mixer = new AnimationMixer(this.playerRoot);
        const animations = new AnimationExtractor(gltf, mixer);

        this.mixer = mixer;
        this.walkAnimation = animations.extract("Walk", LoopRepeat, NormalAnimationBlendMode);
        this.idleAnimation = animations.extract("Idle", LoopRepeat, NormalAnimationBlendMode);

        this.walkAnimation.play();
        this.walkAnimation.weight = 0;
        
        this.idleAnimation.play();
        this.idleAnimation.weight = 1;

        this.currentBaseAnimation = this.idleAnimation;
    }

    private setWeight(action: AnimationAction, weight: number) {
        action.enabled = true;
        action.setEffectiveTimeScale(1);
        action.setEffectiveWeight(weight);
    }
    private executeCrossFade(startAction: AnimationAction, endAction: AnimationAction, duration: number) {
        if(endAction == null) {
            startAction.fadeOut(duration);
        } else {
            this.setWeight(endAction, 1);
            endAction.time = 0;

            if(startAction == null) {
                endAction.fadeIn(duration);
            } else {
                startAction.crossFadeTo(endAction, duration, true);
            }
        }
    }

    public override update(time: Time) {
        const { runningFactor } = this.state;

        this.walkAnimation.setEffectiveTimeScale(this.state.runningFactor * 0.85);
        if(runningFactor != 0 && this.previousState.runningFactor == 0) {
            console.log("walk fade in");
            this.executeCrossFade(this.currentBaseAnimation, this.walkAnimation, 0.1);
            this.currentBaseAnimation = this.walkAnimation;
        }
        if(runningFactor == 0 && this.previousState.runningFactor != 0) {
            this.executeCrossFade(this.currentBaseAnimation, this.idleAnimation, 0.2);
            this.currentBaseAnimation = this.idleAnimation;
        }

        this.playerRoot.position.copy(this.state.position);

        this.bodyQuaternion.setFromEuler(this.state.rotation);
        this.headQuaternion.setFromEuler(this.state.headRotation);

        this.displayBodyQuaternion.rotateTowards(this.bodyQuaternion, 1 - 0.5 ** (time.dt * 32));
        this.displayHeadQuaternion.rotateTowards(this.headQuaternion, 1 - 0.5 ** (time.dt * 32));

        this.playerRoot.quaternion.copy(this.displayBodyQuaternion);

        this.playerHead.quaternion.copy(this.displayBodyQuaternion).invert();
        this.playerHead.applyQuaternion(this.displayHeadQuaternion);

        this.playerBody.morphTargetInfluences[this.morphTargetFirstPerson] = this.state.firstPersonFactor;

        this.mixer.update(time.dt);

        this.savePreviousState();
    }
}
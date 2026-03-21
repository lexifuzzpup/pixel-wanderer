import { Euler, PerspectiveCamera, Vector2, Vector3 } from "three";
import { ControlBinding, Input } from "./input";
import { PlayerAnimator } from "./playerAnimator";
import { Time } from "./time";

export class Player {
    public readonly position = new Vector3;
    public readonly rotation = new Vector2;
    public readonly cameraRotation = new Vector2;
    public readonly animator = new PlayerAnimator;
    public readonly animationState = this.animator.state;
    public readonly camera = new PerspectiveCamera;
    public firstPerson = false;

    private walkTime = 0;

    public constructor(
        public readonly input: Input
    ) {}

    public update(time: Time) {
        const { dt } = time;

        // Read control inputs
        let dx = 0, dz = 0;
        let deltaYaw = 0, deltaPitch = 0;

        dx += this.input.getAnalog(ControlBinding.RIGHT);
        dx -= this.input.getAnalog(ControlBinding.LEFT);
        dz += this.input.getAnalog(ControlBinding.BACKWARD);
        dz -= this.input.getAnalog(ControlBinding.FORWARD);

        deltaYaw -= this.input.getAnalog(ControlBinding.ROTATE_CW);
        deltaYaw += this.input.getAnalog(ControlBinding.ROTATE_CCW);

        deltaPitch += this.input.getAnalog(ControlBinding.ROTATE_UP);
        deltaPitch -= this.input.getAnalog(ControlBinding.ROTATE_DOWN);

        let deltaLength = Math.sqrt(dx * dx + dz * dz);
        if(deltaLength > 1) {
            dx /= deltaLength;
            dz /= deltaLength;
            deltaLength = 1;
        }

        if(this.firstPerson) {
            this.animationState.runningFactor = deltaLength * Math.sign(-dz || dx);
        } else {
            this.animationState.runningFactor = deltaLength;
        }

        const walkingDirection = Math.atan2(dx, dz);
        const walking = dx != 0 || dz != 0;

        // Modify control inputs for deltatime
        dx *= dt * 4;
        dz *= dt * 4;
        deltaYaw *= dt;
        deltaPitch *= dt;

        if(this.firstPerson) {
            this.rotation.x += deltaYaw;
            this.rotation.y += deltaPitch;

            this.cameraRotation.copy(this.rotation);
        } else {
            this.cameraRotation.x += deltaYaw;
            this.cameraRotation.y += deltaPitch;
            
            if(walking) {
                this.rotation.x = walkingDirection + this.cameraRotation.x + Math.PI;
                this.rotation.y = 0;
            }
        }

        const cameraRotation = new Euler(this.cameraRotation.y, this.cameraRotation.x, 0, "YXZ");

        if(this.firstPerson) {
            this.position.x += Math.sin(this.rotation.x) * dz + Math.cos(this.rotation.x) * dx;
            this.position.z += Math.cos(this.rotation.x) * dz - Math.sin(this.rotation.x) * dx;
            this.camera.position.copy(this.position);
            this.camera.position.y += 1.75;
        } else {
            this.position.x += Math.sin(this.cameraRotation.x) * dz + Math.cos(this.cameraRotation.x) * dx;
            this.position.z += Math.cos(this.cameraRotation.x) * dz - Math.sin(this.cameraRotation.x) * dx;
            this.camera.position.copy(this.position);
            this.camera.position.add(new Vector3(0, 0, 5).applyEuler(cameraRotation));
            this.camera.position.y += 1.75;
        }

        this.camera.rotation.set(this.cameraRotation.y, this.cameraRotation.x, 0, "YXZ");
        
        this.animationState.position.copy(this.position);
        this.animationState.rotation.set(0, this.rotation.x, 0);
        this.animationState.headRotation.set(this.rotation.y, this.rotation.x, 0, "YXZ");
        this.animator.update(time);
    }
}
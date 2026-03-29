import { Euler, PerspectiveCamera, Vector2, Vector3 } from "three";
import { ControlBinding, Input } from "./input";
import { PlayerAnimator } from "./playerAnimator";
import { Time } from "./time";

enum CollisionAxis {
    POSITIVE, NEGATIVE, NONE
}

export class Player {
    public readonly position = new Vector3;
    public readonly velocity = new Vector3;
    public readonly rotation = new Vector2;
    public readonly cameraRotation = new Vector2;
    public readonly animator = new PlayerAnimator;
    public readonly animationState = this.animator.state;
    public readonly camera = new PerspectiveCamera;
    public firstPerson = false;

    public friction = new Vector3;

    private collisionX: CollisionAxis = CollisionAxis.NONE;
    private collisionY: CollisionAxis = CollisionAxis.NONE;
    private collisionZ: CollisionAxis = CollisionAxis.NONE;
    private walkTime = 0;
    private groundTime = 0;
    private airTime = 0;

    public constructor(
        public readonly input: Input
    ) {}

    private updatePhysics(time: Time) {
        const { dt } = time;

        this.stepX(this.velocity.x * dt);
        this.stepZ(this.velocity.z * dt);
        this.stepY(this.velocity.y * dt);

        if(this.collisionX != CollisionAxis.NONE) {
            this.velocity.x = 0;
        }
        if(this.collisionY != CollisionAxis.NONE) {
            this.velocity.y = 0;
        }
        if(this.collisionZ != CollisionAxis.NONE) {
            this.velocity.z = 0;
        }

        if(this.collisionY == CollisionAxis.NEGATIVE) {
            this.groundTime += time.dt;
            this.airTime = 0;
        } else {
            this.groundTime = 0;
            this.airTime += time.dt;
        }

        this.velocity.y -= 8 * time.dt;

        this.velocity.x = this.velocity.x * (1 - 0.5 ** (dt * 1000));
        this.velocity.y = this.velocity.y * (1 - 0.5 ** (dt * 1000));
        this.velocity.z = this.velocity.z * (1 - 0.5 ** (dt * 1000));

        this.velocity.x -= Math.min(Math.abs(this.velocity.x), 8) * Math.sign(this.velocity.x) * this.friction.x;
        this.velocity.y -= Math.min(Math.abs(this.velocity.y), 8) * Math.sign(this.velocity.y) * this.friction.y;
        this.velocity.z -= Math.min(Math.abs(this.velocity.z), 8) * Math.sign(this.velocity.z) * this.friction.z;
    }

    private stepX(dx: number) {
        this.position.x += dx;       
        this.collisionX = CollisionAxis.NONE; 
    }
    private stepY(dy: number) {
        this.position.y += dy;
        this.collisionY = CollisionAxis.NONE;

        if(this.position.y < 0) {
            this.position.y = 0;
            this.collisionY = CollisionAxis.NEGATIVE;
        }
    }
    private stepZ(dz: number) {
        this.position.z += dz;
        this.collisionZ = CollisionAxis.NONE;
    }

    public reset() {
        this.position.set(0, 0, 0);
        this.velocity.set(0, 0, 0);
    }

    public update(time: Time) {
        const { dt } = time;

        this.updatePhysics(time);

        if(this.position.y < -100) this.reset();

        // Read control inputs
        let dx = 0, dz = 0, jump = false;
        let deltaYaw = 0, deltaPitch = 0;

        dx += this.input.getAnalog(ControlBinding.RIGHT);
        dx -= this.input.getAnalog(ControlBinding.LEFT);
        dz += this.input.getAnalog(ControlBinding.BACKWARD);
        dz -= this.input.getAnalog(ControlBinding.FORWARD);

        deltaYaw -= this.input.getAnalog(ControlBinding.ROTATE_CW);
        deltaYaw += this.input.getAnalog(ControlBinding.ROTATE_CCW);

        deltaPitch += this.input.getAnalog(ControlBinding.ROTATE_UP);
        deltaPitch -= this.input.getAnalog(ControlBinding.ROTATE_DOWN);

        jump = this.input.isPressed(ControlBinding.JUMP);

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

        if(jump && this.airTime < 0.1) {
            console.log("jump");
            this.velocity.y = 10;
            this.airTime = 0.1;
        }

        if(this.firstPerson) {
            this.position.x += Math.sin(this.rotation.x) * dz + Math.cos(this.rotation.x) * dx;
            this.position.z += Math.cos(this.rotation.x) * dz - Math.sin(this.rotation.x) * dx;
            this.camera.position.copy(this.position);
            this.camera.position.y += 1.75;
            this.camera.fov = 90;
        } else {
            this.position.x += Math.sin(this.cameraRotation.x) * dz + Math.cos(this.cameraRotation.x) * dx;
            this.position.z += Math.cos(this.cameraRotation.x) * dz - Math.sin(this.cameraRotation.x) * dx;
            this.camera.position.copy(this.position);
            this.camera.position.add(new Vector3(0, 0, 12).applyEuler(cameraRotation));
            this.camera.position.y += 1.75;
            this.camera.fov = 70;
        }

        this.camera.rotation.set(this.cameraRotation.y, this.cameraRotation.x, 0, "YXZ");
        
        this.animationState.position.copy(this.position);
        this.animationState.rotation.set(0, this.rotation.x, 0);
        this.animationState.headRotation.set(this.rotation.y, this.rotation.x, 0, "YXZ");
        this.animator.update(time);
    }
}
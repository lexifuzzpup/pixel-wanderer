import { Vector2, Vector3 } from "three";
import { Time } from "./time";
import { ControlBinding, Input } from "./input";

export class Player {
    public readonly position = new Vector3;
    public readonly rotation = new Vector2;

    public constructor(
        public readonly input: Input
    ) {}

    public update(time: Time) {
        const { dt } = time;

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

        dx *= dt * 4;
        dz *= dt * 4;
        deltaYaw *= dt;
        deltaPitch *= dt;

        this.rotation.x += deltaYaw;
        this.rotation.y += deltaPitch;

        this.position.x += Math.sin(this.rotation.x) * dz + Math.cos(this.rotation.x) * dx;
        this.position.z += Math.cos(this.rotation.x) * dz - Math.sin(this.rotation.x) * dx;
    }
}
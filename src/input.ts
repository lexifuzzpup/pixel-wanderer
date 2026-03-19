import { AXES, GamepadWrapper } from "gamepad-wrapper";
import { Keyboard } from "./keyboard";
import { Time } from "./time";

export enum ControlBinding {
    RIGHT, LEFT, FORWARD, BACKWARD,

    ROTATE_CW, ROTATE_CCW,
    ROTATE_UP, ROTATE_DOWN
}

export class Input {
    public keyboard: Keyboard;
    public readonly gamepads: Map<Gamepad, GamepadWrapper> = new Map;

    public readonly keyBindings = {
        [ControlBinding.RIGHT]: "d",
        [ControlBinding.LEFT]: "a",
        [ControlBinding.FORWARD]: "w",
        [ControlBinding.BACKWARD]: "s",

        [ControlBinding.ROTATE_CW]: "e",
        [ControlBinding.ROTATE_CCW]: "q",
        [ControlBinding.ROTATE_UP]: "r",
        [ControlBinding.ROTATE_DOWN]: "f"
    }

    public attachKeyboard(body: HTMLElement) {
        this.keyboard = new Keyboard;
        this.keyboard.addListeners(body);
    }
    public attachController(controller: Gamepad) {
        const wrapper = new GamepadWrapper(controller);
        this.gamepads.set(controller, wrapper);
    }
    public detachController(controller: Gamepad) {
        this.gamepads.delete(controller);
    }

    public isPressed(binding: ControlBinding): boolean {
        return this.getAnalog(binding) > 0.5;
    }
    public getAnalog(binding: ControlBinding): number {
        let factor = 0;
        if(this.keyboard != null) {
            if(this.keyboard.isPressed(this.keyBindings[binding])) factor++;
        }

        for(const gamepad of this.gamepads.values()) {
            let gamepadLX = gamepad.getAxis(AXES.STANDARD.THUMBSTICK_LEFT_X);
            let gamepadLY = gamepad.getAxis(AXES.STANDARD.THUMBSTICK_LEFT_Y);
            let gamepadRX = gamepad.getAxis(AXES.STANDARD.THUMBSTICK_RIGHT_X);
            let gamepadRY = gamepad.getAxis(AXES.STANDARD.THUMBSTICK_RIGHT_Y);

            if(Math.abs(gamepadLX) < 0.1) gamepadLX = 0;
            if(Math.abs(gamepadLY) < 0.1) gamepadLY = 0;
            if(Math.abs(gamepadRX) < 0.1) gamepadRX = 0;
            if(Math.abs(gamepadRY) < 0.1) gamepadRY = 0;

            if(binding == ControlBinding.LEFT && gamepadLX < 0) factor += -gamepadLX;
            if(binding == ControlBinding.RIGHT && gamepadLX > 0) factor += gamepadLX;
            if(binding == ControlBinding.FORWARD && gamepadLY < 0) factor += -gamepadLY;
            if(binding == ControlBinding.BACKWARD && gamepadLY > 0) factor += gamepadLY;

            if(binding == ControlBinding.ROTATE_CW && gamepadRX > 0) factor += gamepadRX;
            if(binding == ControlBinding.ROTATE_CCW && gamepadRX < 0) factor += -gamepadRX;
            if(binding == ControlBinding.ROTATE_UP && gamepadRY < 0) factor += -gamepadRY;
            if(binding == ControlBinding.ROTATE_DOWN && gamepadRY > 0) factor += gamepadRY;
        }

        if(factor > 1) return 1;
        if(factor < 0) return 0;

        return factor;
    }

    public update(time: Time) {
        this.keyboard.update();
        for(const gamepad of this.gamepads.values()) {
            gamepad.update();
        }
    }
}
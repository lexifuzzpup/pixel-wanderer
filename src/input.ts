import { Keyboard } from "./keyboard";

export enum ControlBinding {
    RIGHT, LEFT, FORWARD, BACKWARD,

    ROTATE_CW, ROTATE_CCW,
    ROTATE_UP, ROTATE_DOWN
}

export class Input {
    public keyboard: Keyboard;

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
    public isPressed(binding: ControlBinding): boolean {
        if(this.keyboard != null) {
            return this.keyboard.isPressed(this.keyBindings[binding]);
        }

        return false;
    }
    public getAnalog(binding: ControlBinding): number {
        if(this.keyboard != null) {
            return this.keyboard.isPressed(this.keyBindings[binding]) ? 1 : 0;
        }

        return 0;
    }
}
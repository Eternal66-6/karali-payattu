export class InputManager {
  constructor() {
    this.p1Keys = {};
    this.p2Keys = {};
    this.onKeyDown = (e) => this.handleKey(e.code, true);
    this.onKeyUp = (e) => this.handleKey(e.code, false);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  destroy() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }

  handleKey(code, isDown) {
    if (isDown) {
      if (code === 'KeyW') this.p1Keys['KeyW'] = true;
      if (code === 'KeyA') this.p1Keys['KeyA'] = true;
      if (code === 'KeyS') this.p1Keys['KeyS'] = true;
      if (code === 'KeyD') this.p1Keys['KeyD'] = true;
      if (code === 'KeyF') this.p1Keys['KeyF'] = true;
      if (code === 'KeyG') this.p1Keys['KeyG'] = true;

      if (code === 'ArrowUp') this.p2Keys['ArrowUp'] = true;
      if (code === 'ArrowLeft') this.p2Keys['ArrowLeft'] = true;
      if (code === 'ArrowDown') this.p2Keys['ArrowDown'] = true;
      if (code === 'ArrowRight') this.p2Keys['ArrowRight'] = true;
      if (code === 'KeyK') this.p2Keys['KeyK'] = true;
      if (code === 'KeyL') this.p2Keys['KeyL'] = true;
    } else {
      if (code === 'KeyW') delete this.p1Keys['KeyW'];
      if (code === 'KeyA') delete this.p1Keys['KeyA'];
      if (code === 'KeyS') delete this.p1Keys['KeyS'];
      if (code === 'KeyD') delete this.p1Keys['KeyD'];
      if (code === 'KeyF') delete this.p1Keys['KeyF'];
      if (code === 'KeyG') delete this.p1Keys['KeyG'];

      if (code === 'ArrowUp') delete this.p2Keys['ArrowUp'];
      if (code === 'ArrowLeft') delete this.p2Keys['ArrowLeft'];
      if (code === 'ArrowDown') delete this.p2Keys['ArrowDown'];
      if (code === 'ArrowRight') delete this.p2Keys['ArrowRight'];
      if (code === 'KeyK') delete this.p2Keys['KeyK'];
      if (code === 'KeyL') delete this.p2Keys['KeyL'];
    }
  }

  getInputs(playerIndex) {
    const gamepadInputs = this.getGamepadInputs(playerIndex);
    const keyboardInputs = playerIndex === 0 ? this.getKeyboardInputsP1() : this.getKeyboardInputsP2();

    return {
      left: gamepadInputs.left || keyboardInputs.left,
      right: gamepadInputs.right || keyboardInputs.right,
      up: gamepadInputs.up || keyboardInputs.up,
      down: gamepadInputs.down || keyboardInputs.down,
      punch: gamepadInputs.punch || keyboardInputs.punch,
      kick: gamepadInputs.kick || keyboardInputs.kick,
    };
  }

  getKeyboardInputsP1() {
    return {
      up: !!this.p1Keys['KeyW'],
      left: !!this.p1Keys['KeyA'],
      down: !!this.p1Keys['KeyS'],
      right: !!this.p1Keys['KeyD'],
      punch: !!this.p1Keys['KeyF'],
      kick: !!this.p1Keys['KeyG'],
    };
  }

  getKeyboardInputsP2() {
    return {
      up: !!this.p2Keys['ArrowUp'],
      left: !!this.p2Keys['ArrowLeft'],
      down: !!this.p2Keys['ArrowDown'],
      right: !!this.p2Keys['ArrowRight'],
      punch: !!this.p2Keys['KeyK'],
      kick: !!this.p2Keys['KeyL'],
    };
  }

  getGamepadInputs(index) {
    try {
      const gamepads = navigator.getGamepads();
      const gp = gamepads[index];

      if (!gp || !gp.buttons || !gp.axes) {
        return { left: false, right: false, up: false, down: false, punch: false, kick: false };
      }

      // Mapping: Button 0 (A) -> Jump, Button 1 (B) -> Punch, Button 2 (X) -> Kick
      // D-Pad/Joystick for movement
      const threshold = 0.5;
      const upPressed = (gp.buttons[0] && gp.buttons[0].pressed) || (gp.axes[1] && gp.axes[1] < -threshold);
      const downPressed = gp.axes[1] && gp.axes[1] > threshold;
      const leftPressed = gp.axes[0] && gp.axes[0] < -threshold;
      const rightPressed = gp.axes[0] && gp.axes[0] > threshold;
      const punchPressed = gp.buttons[1] && gp.buttons[1].pressed;
      const kickPressed = gp.buttons[2] && gp.buttons[2].pressed;

      return {
        up: !!upPressed,
        down: !!downPressed,
        left: !!leftPressed,
        right: !!rightPressed,
        punch: !!punchPressed,
        kick: !!kickPressed,
      };
    } catch (e) {
      return { left: false, right: false, up: false, down: false, punch: false, kick: false };
    }
  }
}

import { PlayerState } from './types';

export class Player {
  constructor(x, y, color, groundY, sprite) {
    this.pos = { x, y };
    this.vel = { x: 0, y: 0 };
    this.width = 100;
    this.height = 200;
    this.color = color;
    this.health = 100;
    this.state = PlayerState.IDLE;
    this.facing = 1; // 1 for right, -1 for left
    
    this.gravity = 0.8;
    this.jumpForce = -18;
    this.moveSpeed = 6;
    this.groundY = groundY;
    
    this.stateTimer = 0;
    this.isGrounded = false;
    this.currentHitbox = null;
    this.opponent = null;

    // Sprite properties
    this.spriteSheet = null;
    this.frameWidth = 60;
    this.frameHeight = 120;
    this.animFrame = 0; // Current index in the frame array
    this.animTimer = 0;
    this.animSpeed = 10; 

    // Frame ranges as requested
    this.idleFrames = [0, 1, 2, 3];
    this.attackFrames = [7, 8, 9, 10, 11];

    if (sprite) {
      this.spriteSheet = sprite;
      this.processSpriteSheet();
    }
  }

  processSpriteSheet() {
    try {
      if (!this.spriteSheet) return;
      
      const spriteWidth = this.spriteSheet.width;
      const spriteHeight = this.spriteSheet.height;
      
      if (spriteWidth <= 10 || spriteHeight <= 10) return;

      // 6 columns, 2 rows
      this.frameWidth = Math.floor(spriteWidth / 6);
      this.frameHeight = Math.floor(spriteHeight / 2);

      console.log(`Processed Sprite: ${spriteWidth}x${spriteHeight}, Frame: ${this.frameWidth}x${this.frameHeight}`);
    } catch (e) {
      console.error("Error processing sprite sheet:", e);
      this.spriteSheet = null;
    }
  }

  update(inputs) {
    if (this.state === PlayerState.DEAD) return;

    if (this.spriteSheet && this.spriteSheet.width > 0 && this.frameWidth === 0) {
      this.processSpriteSheet();
    }

    // State Timer
    if (this.stateTimer > 0) {
      this.stateTimer--;
      if (this.stateTimer === 0) {
        if (this.state === PlayerState.PUNCH || this.state === PlayerState.KICK || this.state === PlayerState.HIT) {
          this.state = PlayerState.IDLE;
          this.currentHitbox = null;
        }
      }
    }

    // Physics
    this.vel.y += this.gravity;
    this.pos.x += this.vel.x;
    this.pos.y += this.vel.y;

    // Ground Collision
    if (this.pos.y + this.height > this.groundY) {
      this.pos.y = this.groundY - this.height;
      this.vel.y = 0;
      this.isGrounded = true;
    } else {
      this.isGrounded = false;
    }

    // Screen Bounds
    if (this.pos.x < 0) this.pos.x = 0;
    if (this.pos.x + this.width > 1280) this.pos.x = 1280 - this.width;

    // Input Handling
    const prevState = this.state;
    if (this.state !== PlayerState.HIT && this.state !== PlayerState.KNOCKDOWN && 
        this.state !== PlayerState.PUNCH && this.state !== PlayerState.KICK) {
      
      if (inputs.left) {
        this.vel.x = -this.moveSpeed;
        this.facing = -1;
        if (this.isGrounded) this.state = PlayerState.WALK;
      } else if (inputs.right) {
        this.vel.x = this.moveSpeed;
        this.facing = 1;
        if (this.isGrounded) this.state = PlayerState.WALK;
      } else {
        this.vel.x = 0;
        if (this.isGrounded) this.state = PlayerState.IDLE;
      }

      if (inputs.up && this.isGrounded) {
        this.vel.y = this.jumpForce;
        this.state = PlayerState.JUMP;
      }

      if (inputs.punch && this.isGrounded) {
        this.punch();
      } else if (inputs.kick && this.isGrounded) {
        this.kick();
      }
    } else {
      this.vel.x *= 0.9;
    }

    // Reset animation if state changed
    if (this.state !== prevState) {
      this.animFrame = 0;
      this.animTimer = 0;
    }

    if (this.opponent && (this.state === PlayerState.IDLE || this.state === PlayerState.WALK)) {
        this.facing = this.opponent.pos.x > this.pos.x ? 1 : -1;
    }

    this.animate();
  }

  animate() {
    this.animTimer++;
    if (this.animTimer >= this.animSpeed) {
      this.animTimer = 0;
      
      // Hard constraint: IDLE and WALK use frames 0-5
      // ATTACK (PUNCH/KICK), JUMP, and HIT use frames 6-11
      const isAction = this.state === PlayerState.PUNCH || 
                       this.state === PlayerState.KICK || 
                       this.state === PlayerState.JUMP ||
                       this.state === PlayerState.HIT;
                       
      const currentRange = isAction ? this.attackFrames : this.idleFrames;
      
      this.animFrame++;
      
      if (isAction) {
        // Action animation: Play once or loop depending on state
        if (this.animFrame >= currentRange.length) {
          if (this.state === PlayerState.PUNCH || this.state === PlayerState.KICK) {
            // Hold last frame of attack until state timer expires
            this.animFrame = currentRange.length - 1;
          } else {
            // Loop for jump/hit
            this.animFrame = 0;
          }
        }
      } else {
        // Idle/Walk animation: Strictly loop frames 0-5
        if (this.animFrame >= currentRange.length) {
          this.animFrame = 0;
        }
      }
    }
  }

  punch() {
    this.state = PlayerState.PUNCH;
    this.stateTimer = 20;
    this.vel.x = 0;
    this.currentHitbox = {
      x: this.facing === 1 ? this.pos.x + this.width - 20 : this.pos.x - 130,
      y: this.pos.y + 30,
      width: 80,
      height: 40,
      damage: 5,
      stun: 15
    };
  }

  kick() {
    this.state = PlayerState.KICK;
    this.stateTimer = 30;
    this.vel.x = 0;
    this.currentHitbox = {
      x: this.facing === 1 ? this.pos.x + this.width - 20 : this.pos.x - 130,
      y: this.pos.y + 80,
      width: 75,
      height: 30,
      damage: 10,
      stun: 25
    };
  }

  drawFallback(p) {
    p.noStroke();
    p.fill(this.color);
    if (this.state === PlayerState.HIT) p.fill(255);
    p.rect(this.pos.x, this.pos.y, this.width, this.height, 4);

    p.fill(0, 50);
    const eyeX = this.facing === 1 ? this.pos.x + this.width - 15 : this.pos.x + 5;
    p.rect(eyeX, this.pos.y + 15, 10, 10);
  }

  takeDamage(damage, stun) {
    this.health -= damage;
    if (this.health <= 0) {
      this.health = 0;
      this.state = PlayerState.DEAD;
    } else {
      this.state = PlayerState.HIT;
      this.stateTimer = stun;
      this.vel.x = this.opponent ? (this.pos.x > this.opponent.pos.x ? 5 : -5) : 0;
    }
  }

  draw(p) {
    p.push();
    
    if (this.spriteSheet && this.frameWidth > 0 && this.frameHeight > 0) {
      try {
        const COLS = 6;
        const ROWS = 2;
        
        p.push();
        
        const isAction = this.state === PlayerState.PUNCH || 
                         this.state === PlayerState.KICK || 
                         this.state === PlayerState.JUMP ||
                         this.state === PlayerState.HIT;
                         
        const currentRange = isAction ? this.attackFrames : this.idleFrames;
        const frameIdx = currentRange[this.animFrame] || 0;
        
        // Explicit source coordinates as requested
        const sx = (frameIdx % COLS) * (this.spriteSheet.width / COLS);
        const sy = Math.floor(frameIdx / COLS) * (this.spriteSheet.height / ROWS);
        
        // Destination dimensions - scaled for 1280x720
        const dw = this.width * 2.1;
        const dh = this.height * 1.32;

        // Grounding: Translate so the bottom of the sprite (dh) is at this.pos.y + this.height
        p.translate(this.pos.x + this.width / 2, this.pos.y + this.height - dh / 2);
        p.scale(this.facing, 1);
        
        p.imageMode(p.CENTER);
        if (this.state === PlayerState.HIT) p.tint(255, 100, 100);
        
        p.image(
          this.spriteSheet,
          0, 0,
          dw, dh,
          sx, sy,
          this.spriteSheet.width / COLS, this.spriteSheet.height / ROWS
        );
        
        p.noTint();
        p.pop();
      } catch (e) {
        console.error("Error drawing sprite:", e);
        this.drawFallback(p);
      }
    } else {
      this.drawFallback(p);
    }

    p.pop();

    // Draw Attack Hitbox (Visual only for debug)
    if (this.currentHitbox) {
      p.push();
      p.fill(255, 255, 0, 100);
      p.noStroke();
      p.rect(this.currentHitbox.x, this.currentHitbox.y, this.currentHitbox.width, this.currentHitbox.height);
      p.pop();
    }
  }
}

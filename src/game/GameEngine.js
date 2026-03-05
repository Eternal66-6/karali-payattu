import { Player } from './Player';
import { InputManager } from './InputManager';

export class GameEngine {
  constructor(p, p1Sprite, p2Sprite, bgImg, onGameOver) {
    this.timer = 99;
    this.frameCount = 0;
    this.sparks = [];
    this.bgImg = bgImg || null;
    this.onGameOver = onGameOver || (() => {});
    this.isGameOver = false;

    const h = typeof p.height === 'number' ? p.height : 720;
    const w = typeof p.width === 'number' ? p.width : 1280;
    
    // Adjusted groundY for 720p canvas to hit the red sand floor
    const groundY = h - 30; 
    this.p1 = new Player(250, groundY - 200, '#ef4444', groundY, p1Sprite);
    this.p2 = new Player(w - 310, groundY - 200, '#3b82f6', groundY, p2Sprite);
    this.p1.opponent = this.p2;
    this.p2.opponent = this.p1;
    this.inputManager = new InputManager();
  }

  reset() {
    this.isGameOver = false;
    this.timer = 99;
    this.frameCount = 0;
    this.sparks = [];
    
    // Reset players
    this.p1.health = 100;
    this.p2.health = 100;
    this.p1.pos.x = 250;
    this.p2.pos.x = 1280 - 310;
    // Reset other player states if needed (velocity, etc.)
    this.p1.vel = { x: 0, y: 0 };
    this.p2.vel = { x: 0, y: 0 };
  }

  destroy() {
    if (this.inputManager) {
      this.inputManager.destroy();
    }
  }

  update() {
    try {
      if (this.isGameOver) return;
      if (this.timer <= 0) {
        this.handleGameOver();
        return;
      }

      // Update Timer
      this.frameCount++;
      if (this.frameCount >= 60) {
        this.timer--;
        this.frameCount = 0;
      }

      // Update Players
      if (this.p1) this.p1.update(this.inputManager.getInputs(0));
      if (this.p2) this.p2.update(this.inputManager.getInputs(1));

      // Check for KO
      if (this.p1.health <= 0 || this.p2.health <= 0) {
        this.handleGameOver();
      }

      // Collision Detection (Attacks)
      if (this.p1 && this.p2) {
        this.checkHit(this.p1, this.p2);
        this.checkHit(this.p2, this.p1);
      }

      // Update Sparks
      this.sparks = this.sparks.filter(s => s && s.life > 0);
      this.sparks.forEach(s => { if (s) s.life--; });
    } catch (e) {
      console.error("GameEngine update error:", e);
    }
  }

  handleGameOver() {
    this.isGameOver = true;
    let winner = null;
    if (this.p1.health > this.p2.health) winner = 'p1';
    else if (this.p2.health > this.p1.health) winner = 'p2';
    // else draw
    
    if (this.onGameOver) {
      this.onGameOver(winner);
    }
  }

  checkHit(attacker, defender) {
    if (attacker.currentHitbox) {
      const hb = attacker.currentHitbox;
      if (
        hb.x < defender.pos.x + defender.width &&
        hb.x + hb.width > defender.pos.x &&
        hb.y < defender.pos.y + defender.height &&
        hb.y + hb.height > defender.pos.y
      ) {
        // Hit!
        defender.takeDamage(hb.damage, hb.stun);
        this.sparks.push({ 
          x: hb.x + hb.width / 2, 
          y: hb.y + hb.height / 2, 
          life: 10 
        });
        attacker.currentHitbox = null; // Consume hitbox
      }
    }
  }

  draw(p) {
    try {
      this.drawKalariBackground(p);

      // Players
      if (this.p1) this.p1.draw(p);
      if (this.p2) this.p2.draw(p);

      // Sparks
      p.noStroke();
      this.sparks.forEach(s => {
        if (s && !isNaN(s.x) && !isNaN(s.y)) {
          p.fill(255, 200, 0, Math.max(0, s.life * 25));
          p.ellipse(s.x, s.y, 20, 20);
        }
      });

      // UI
      this.drawUI(p);
    } catch (e) {
      console.error("GameEngine draw error:", e);
    }
  }

  drawKalariBackground(p) {
    try {
      const w = typeof p.width === 'number' ? p.width : 800;
      const h = typeof p.height === 'number' ? p.height : 500;
      if (w <= 0 || h <= 0) return;
      
      p.push();
      
      if (this.bgImg) {
        // Draw background image scaled to canvas
        p.image(this.bgImg, 0, 0, w, h);
      } else {
        // Fallback: Solid Background
        p.background(30, 30, 35); 
        
        // Fallback: Simple Floor
        p.noStroke();
        p.fill(194, 178, 128); // Sand color
        p.rect(0, h - 30, w, 30);
        
        // Fallback: Simple Wall Detail
        p.stroke(60, 60, 70);
        p.strokeWeight(2);
        p.line(0, h - 30, w, h - 30);
      }

      p.pop();
    } catch (e) {
      console.error("Error drawing background:", e);
    }
  }

  drawUI(p) {
    const w = typeof p.width === 'number' ? p.width : 800;
    const h = typeof p.height === 'number' ? p.height : 500;
    
    p.push();
    // Health Bars
    const barWidth = 300;
    const barHeight = 25;
    
    // P1 Health
    p.fill(50);
    p.rect(50, 30, barWidth, barHeight);
    p.fill(239, 68, 68);
    const p1HealthPercent = isNaN(this.p1.health) ? 0 : Math.max(0, this.p1.health / 100);
    p.rect(50, 30, p1HealthPercent * barWidth, barHeight);
    
    // P2 Health
    p.fill(50);
    p.rect(w - 50 - barWidth, 30, barWidth, barHeight);
    p.fill(59, 130, 246);
    const p2HealthPercent = isNaN(this.p2.health) ? 0 : Math.max(0, this.p2.health / 100);
    const p2HealthWidth = p2HealthPercent * barWidth;
    p.rect(w - 50 - p2HealthWidth, 30, p2HealthWidth, barHeight);

    // Timer
    p.fill(255);
    p.textAlign(p.CENTER);
    p.textSize(40);
    const displayTimer = isNaN(this.timer) ? 0 : Math.ceil(this.timer);
    p.text(displayTimer, w / 2, 60);

    // Win Message
    // Handled by React Overlay
    if (this.isGameOver) {
      p.fill(0, 150);
      p.rect(0, 0, w, h);
    }

    p.pop();
  }
}

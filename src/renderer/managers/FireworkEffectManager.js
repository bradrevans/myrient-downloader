import stateService from '../StateService.js';

class FireworkEffectManager {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.rockets = []; // Particles launching upwards
    this.sparks = [];  // Particles forming the explosions
    this.animationFrameId = null;
    this.running = false;
    this.maxRockets = 5; // Max rockets on screen at once
    this.minRocketLaunchInterval = 1000; // milliseconds
    this.maxRocketLaunchInterval = 3000; // milliseconds
    this.lastRocketLaunchTime = 0;
    this.headerHeight = 0;
    this.footerHeight = 0;
    this.fadingOut = false;
    this.fadeSpeed = 0.02; // For fading out spark opacity
    this.particleColors = [
      '#FF0000', // Red
      '#00FF00', // Green
      '#0000FF', // Blue
      '#FFFF00', // Yellow
      '#FF00FF', // Magenta
      '#00FFFF', // Cyan
      '#FFA500', // Orange
    ];
  }

  _getRandomColorSubset(count) {
    const shuffled = [...this.particleColors].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  init(containerElement, headerHeight, footerHeight) {
    this.headerHeight = headerHeight;
    this.footerHeight = footerHeight;

    this.canvas = document.createElement('canvas');
    this.canvas.id = 'firework-canvas';
    this.canvas.classList.add('fixed', 'top-0', 'left-0', 'pointer-events-none', 'z-10'); // z-index should be consistent with snowflakes
    containerElement.appendChild(this.canvas);

    this.ctx = this.canvas.getContext('2d');
    this.resizeCanvas();
    window.addEventListener('resize', this.resizeCanvas.bind(this));
  }

  resizeCanvas() {
    if (this.canvas) {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      // Particles will scale automatically due to vh/vw based properties
      if (this.running) {
        this.drawParticles();
      }
    }
  }

  start() {
    if (this.running) return;

    if (this.fadingOut) {
      this.fadingOut = false;
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }
      this.rockets = [];
      this.sparks = [];
      if (this.ctx) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
      this.animationFrameId = null;
    }

    this.running = true;
    this.lastRocketLaunchTime = performance.now();
    this.animate(this.lastRocketLaunchTime);
  }

  stop() {
    this.fadingOut = true;
    this.running = false; // Stop adding new rockets
  }

  createRocket() {
    // Rocket launches from bottom, random x, upward trajectory
    const xVw = Math.random() * 100;
    // Start just below the footer in vh units
    const startYPx = window.innerHeight - this.footerHeight;
    const yVh = (startYPx / window.innerHeight) * 100;

    const targetYVh = Math.random() * 50 + 10; // Explode between 10vh and 60vh
    const speedVh = Math.random() * 0.5 + 0.3; // vh per frame
    const sizeVh = 0.2; // Rocket particle size

    const color = '#FFFFFF'; // White rocket trail
    const opacity = 1;
    const trailLength = 1; // 1 particle for trail (just the rocket itself)

    return {
      type: 'rocket', xVw, yVh, targetYVh, speedVh, sizeVh, color, opacity,
      trail: [], trailLength,
      hasExploded: false
    };
  }

  createSpark(xVw, yVh, color) {
    // Explosion particle
    const speed = Math.random() * 0.5 + 0.2; // Base speed
    const angle = Math.random() * Math.PI * 2; // Random angle
    const speedXVh = speed * Math.cos(angle);
    const speedYVh = speed * Math.sin(angle);
    const friction = 0.95; // Slow down over time
    const gravity = 0.005; // Fall due to gravity (vh per frame)
    const sizeVh = Math.random() * 0.3 + 0.1; // Spark particle size
    const opacity = 1;
    const life = Math.random() * 60 + 30; // Frames until fade starts

    return {
      type: 'spark', xVw, yVh, speedXVh, speedYVh, sizeVh, color, opacity, life,
      friction, gravity
    };
  }

  updateParticles() {
    const currentViewPortHeight = window.innerHeight;
    const currentViewPortWidth = window.innerWidth;

    // Update Rockets
    this.rockets.forEach(rocket => {
      if (rocket.hasExploded) return;

      // Update trail (stores trail parts in vh/vw)
      rocket.trail.unshift({ xVw: rocket.xVw, yVh: rocket.yVh, opacity: rocket.opacity });
      if (rocket.trail.length > rocket.trailLength) {
        rocket.trail.pop();
      }

      rocket.yVh -= rocket.speedVh; // Move upwards

      if (rocket.yVh <= rocket.targetYVh) {
        rocket.hasExploded = true;
        // Explode into sparks
        const numSparks = Math.floor(Math.random() * 30 + 20); // 20 to 50 sparks
        const numColors = Math.floor(Math.random() * 2) + 2; // 2 or 3 colors
        const explosionColors = this._getRandomColorSubset(numColors);

        for (let i = 0; i < numSparks; i++) {
          const sparkColor = explosionColors[Math.floor(Math.random() * explosionColors.length)];
          this.sparks.push(this.createSpark(rocket.xVw, rocket.yVh, sparkColor));
        }
      }
    });

    // Filter out exploded rockets
    this.rockets = this.rockets.filter(rocket => !rocket.hasExploded);

    // Update Sparks
    this.sparks.forEach(spark => {
      spark.speedXVh *= spark.friction;
      spark.speedYVh *= spark.friction;
      spark.speedYVh += spark.gravity; // Gravity pulls down
      spark.xVw += spark.speedXVh;
      spark.yVh += spark.speedYVh;

      spark.life--;
      if (spark.life <= 0) {
        spark.opacity -= this.fadeSpeed; // Start fading
        if (spark.opacity < 0) spark.opacity = 0;
      }
    });

    // Filter out dead sparks
    this.sparks = this.sparks.filter(spark => spark.opacity > 0);

    // Fade out entire canvas if stopping
    if (this.fadingOut && this.rockets.length === 0 && this.sparks.length === 0) {
      // All particles are gone, stop animation
      cancelAnimationFrame(this.animationFrameId);
      if (this.ctx) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
      this.fadingOut = false; // Reset flag
      this.animationFrameId = null;
    }
  }

  drawParticles() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const currentViewPortWidth = window.innerWidth;
    const currentViewPortHeight = window.innerHeight;

    // Draw Rockets and their trails
    this.rockets.forEach(rocket => {
      // Draw trail
      rocket.trail.forEach((trailPart, index) => {
        const alpha = trailPart.opacity * (index / rocket.trail.length); // Fade trail
        const xPx = (trailPart.xVw / 100) * currentViewPortWidth;
        const yPx = (trailPart.yVh / 100) * currentViewPortHeight;
        const sizePx = (rocket.sizeVh / 100) * currentViewPortHeight; // Trail part size
        this.ctx.beginPath();
        this.ctx.arc(xPx, yPx, sizePx, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        this.ctx.fill();
      });

      // Draw rocket head
      const xPx = (rocket.xVw / 100) * currentViewPortWidth;
      const yPx = (rocket.yVh / 100) * currentViewPortHeight;
      const sizePx = (rocket.sizeVh / 100) * currentViewPortHeight;
      this.ctx.beginPath();
      this.ctx.arc(xPx, yPx, sizePx, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(255, 255, 255, ${rocket.opacity})`;
      this.ctx.fill();
    });

    // Draw Sparks
    this.sparks.forEach(spark => {
      const xPx = (spark.xVw / 100) * currentViewPortWidth;
      const yPx = (spark.yVh / 100) * currentViewPortHeight;
      const sizePx = (spark.sizeVh / 100) * currentViewPortHeight;

      // Convert hex color to rgba for opacity control
      const r = parseInt(spark.color.substring(1, 3), 16);
      const g = parseInt(spark.color.substring(3, 5), 16);
      const b = parseInt(spark.color.substring(5, 7), 16);

      this.ctx.beginPath();
      this.ctx.arc(xPx, yPx, sizePx, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${spark.opacity})`;
      this.ctx.fill();
    });
  }

  animate(currentTime) {
    // Launch new rocket if conditions met
    if (this.running && !this.fadingOut && this.rockets.length < this.maxRockets) {
      // Randomize launch interval within the min/max range
      const randomLaunchInterval = Math.random() * (this.maxRocketLaunchInterval - this.minRocketLaunchInterval) + this.minRocketLaunchInterval;
      if (currentTime - this.lastRocketLaunchTime > randomLaunchInterval) {
        this.rockets.push(this.createRocket());
        this.lastRocketLaunchTime = currentTime;
      }
    }

    this.updateParticles();
    this.drawParticles();

    // Continue animation if still running or fading out
    if (this.running || (this.fadingOut && (this.rockets.length > 0 || this.sparks.length > 0))) {
      this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
    } else if (this.fadingOut && this.rockets.length === 0 && this.sparks.length === 0) {
      // Fully faded out and no particles left
      cancelAnimationFrame(this.animationFrameId);
      if (this.ctx) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
      this.fadingOut = false; // Reset flag
      this.animationFrameId = null;
    }
  }

  destroy() {
    this.stop();
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    window.removeEventListener('resize', this.resizeCanvas.bind(this));
  }
}

export default FireworkEffectManager;

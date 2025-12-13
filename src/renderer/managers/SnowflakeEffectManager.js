class SnowflakeEffectManager {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.snowflakes = [];
        this.animationFrameId = null;
        this.running = false;
        this.maxSnowflakes = 100; // Control the total number of snowflakes
        this.headerHeight = 0;
        this.footerHeight = 0;
        this.lastSnowflakeAddTime = 0; // Timestamp of when the last snowflake was added
        this.newSnowflakeInterval = 200; // Milliseconds between adding new snowflakes
        this.fadingOut = false;
        this.fadeSpeed = 0.02;
    }

    init(containerElement, headerHeight, footerHeight) {
        this.headerHeight = headerHeight;
        this.footerHeight = footerHeight;

        this.canvas = document.createElement('canvas');
        this.canvas.id = 'snowflake-canvas';
        this.canvas.classList.add('fixed', 'top-0', 'left-0', 'pointer-events-none', 'z-10'); // Add Tailwind classes
        containerElement.appendChild(this.canvas);

        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        window.addEventListener('resize', this.resizeCanvas.bind(this));
    }

    resizeCanvas() {
        if (this.canvas) {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            // Clear existing snowflakes and re-generate them for the new canvas size
            this.snowflakes = [];
            this.generateSnowflakes(this.maxSnowflakes);
        }
    }

    start() {
        if (this.running) return;

        // If a fade-out is in progress, cancel it and restart immediately
        if (this.fadingOut) {
            this.fadingOut = false; // Cancel ongoing fade out
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId); // Stop old animation loop
            }
            this.snowflakes = []; // Clear existing (fading) snowflakes
            if (this.ctx) { // Ensure context exists before clearing
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); // Clear canvas
            }
            this.animationFrameId = null; // Clear animation frame ID
        }

        this.running = true;
        this.lastSnowflakeAddTime = performance.now(); // Initialize timestamp
        this.generateSnowflakes(this.maxSnowflakes); // Start with the maximum number of snowflakes
        this.animate(this.lastSnowflakeAddTime); // Pass initial timestamp to animate
    }

    stop() {
        this.running = false;
        this.fadingOut = true; // Start fade out process
        // The animate loop will handle fading and cleanup
    }

    generateSnowflakes(count) {
        for (let i = 0; i < count; i++) {
            this.snowflakes.push(this.createSnowflake());
        }
    }

    createSnowflake() {
        const x = Math.random() * this.canvas.width;
        // Spawn snowflakes just above the visible screen
        const y = Math.random() * -(this.headerHeight + 50); // Start from a random position slightly above the header
        const radius = Math.random() * 2 + 1; // 1 to 3px
        const speed = Math.random() * 0.5 + 0.2; // Slower or faster
        const opacity = Math.random() * 0.5 + 0.5; // 0.5 to 1
        const sway = Math.random() * 0.5 - 0.25; // Random sway magnitude
        const swayOffset = Math.random() * Math.PI * 2; // Starting point in sine wave

        return { x, y, radius, speed, opacity, sway, swayOffset };
    }

    updateSnowflakes() {
        this.snowflakes.forEach(snowflake => {
            // Update Y position
            snowflake.y += snowflake.speed;

            // Update X position for sway effect
            snowflake.x += Math.sin(snowflake.swayOffset + snowflake.y * 0.01) * snowflake.sway;

            // If snowflake goes beyond left/right, wrap it
            if (snowflake.x < 0) {
                snowflake.x = this.canvas.width;
            } else if (snowflake.x > this.canvas.width) {
                snowflake.x = 0;
            }

            if (this.fadingOut) {
                snowflake.opacity -= this.fadeSpeed; // Decrease opacity
                if (snowflake.opacity < 0) {
                    snowflake.opacity = 0;
                }
            }
        });

        // Filter out fully faded snowflakes OR snowflakes that have left the screen
        this.snowflakes = this.snowflakes.filter(snowflake => {
            const isFaded = snowflake.opacity <= 0;
            const isOffScreen = !(snowflake.y < (this.canvas.height + this.footerHeight) && snowflake.y > -(this.headerHeight + snowflake.radius));
            return !(isFaded || isOffScreen); // Keep if not faded AND not off-screen
        });
    }

    drawSnowflakes() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.snowflakes.forEach(snowflake => {
            this.ctx.beginPath();
            this.ctx.arc(snowflake.x, snowflake.y, snowflake.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 255, 255, ${snowflake.opacity})`;
            this.ctx.fill();
        });
    }

    animate(currentTime) {
        this.updateSnowflakes();
        this.drawSnowflakes();

        // Only add new snowflakes if not fading out and still running
        if (!this.fadingOut && this.running && this.snowflakes.length < this.maxSnowflakes && currentTime - this.lastSnowflakeAddTime > this.newSnowflakeInterval) {
            this.snowflakes.push(this.createSnowflake());
            this.lastSnowflakeAddTime = currentTime;
        }

        // Check if fade-out is complete
        if (this.fadingOut && this.snowflakes.length === 0) {
            cancelAnimationFrame(this.animationFrameId);
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.fadingOut = false; // Reset flag
            this.animationFrameId = null; // Clear animation frame ID
        } else {
            this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
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

export default SnowflakeEffectManager;
import React, { useEffect, useRef } from 'react';
import { useThemeStore } from '../../stores/themeStore';

const COLORS = ['#D63B6A', '#F07297', '#F9C6D0', '#F0A0B5', '#e879a9'];

export const ParticleBackground = React.memo(function ParticleBackground() {
  const canvasRef = useRef(null);
  const actualTheme = useThemeStore((s) => s.actualTheme);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const isMobile = width < 768 || 'ontouchstart' in window;
    const isDark = actualTheme === 'dark';

    // Particle count: halved on mobile, scarcer in dark mode
    let count = isMobile ? (isDark ? 16 : 22) : (isDark ? 32 : 48);

    const mouse = {
      x: -1000,
      y: -1000,
      radius: 120, // 120px influence radius
      active: false,
    };

    class Particle {
      constructor() {
        this.reset(true);
      }

      reset(initial = false) {
        this.x = Math.random() * width;
        this.y = initial ? Math.random() * height : height + 10;
        this.size = Math.random() * 5 + 3; // 3 to 8px
        this.color = COLORS[Math.floor(Math.random() * COLORS.length)];

        // Opacity: 10-25% in light, 8-15% in dark
        this.baseAlpha = isDark
          ? Math.random() * 0.07 + 0.08
          : Math.random() * 0.15 + 0.10;
        this.alpha = this.baseAlpha;

        // Anti-gravity float: gentle upward and sideways drifting
        this.vx = (Math.random() - 0.5) * 0.45;
        this.vy = -(Math.random() * 0.4 + 0.15); // gentle float up
        this.sinOffset = Math.random() * Math.PI * 2;
        this.sinSpeed = Math.random() * 0.02 + 0.01;
      }

      update() {
        // Natural organic oscillation
        this.sinOffset += this.sinSpeed;
        this.x += this.vx + Math.sin(this.sinOffset) * 0.25;
        this.y += this.vy;

        // Mouse attraction (only desktop / non-touch)
        if (!isMobile && mouse.active) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < mouse.radius && dist > 1) {
            // Gentle pull towards mouse (not violent repulsion)
            const force = (1 - dist / mouse.radius) * 0.035;
            this.x += dx * force;
            this.y += dy * force;
            this.alpha = Math.min(this.baseAlpha * 1.5, 0.4);
          } else {
            this.alpha = this.baseAlpha;
          }
        }

        // Wrap around screen seamlessly
        if (this.y < -10) this.y = height + 10;
        if (this.y > height + 10) this.y = -10;
        if (this.x < -10) this.x = width + 10;
        if (this.x > width + 10) this.x = -10;
      }

      draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    const particles = Array.from({ length: count }, () => new Particle());

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
      mouse.x = -1000;
      mouse.y = -1000;
    };

    if (!isMobile) {
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
      document.addEventListener('mouseleave', handleMouseLeave);
    }

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize, { passive: true });

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
      }
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (!isMobile) {
        window.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [actualTheme]);

  return (
    <canvas
      ref={canvasRef}
      className="particle-canvas fixed inset-0 pointer-events-none z-0"
      style={{ willChange: 'transform' }}
      aria-hidden="true"
    />
  );
});


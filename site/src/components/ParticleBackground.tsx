import React, { useEffect, useRef } from 'react';

const ParticleBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: { x: number; y: number; dx: number; dy: number; size: number; alpha: number }[] = [];
    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;
    let isMobile = window.matchMedia('(max-width: 768px)').matches;

    const resizeCanvas = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      isMobile = window.matchMedia('(max-width: 768px)').matches;
      canvas.width = width;
      canvas.height = height;
      initParticles();
    };

    const initParticles = () => {
      // Reduce particles on mobile for better performance
      const density = isMobile ? 25000 : 12000;
      const particleCount = Math.min(Math.floor(width * height / density), isMobile ? 30 : 100);
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          dx: (Math.random() - 0.5) * 0.3,
          dy: (Math.random() - 0.5) * 0.3,
          size: Math.random() * 2 + 0.5,
          alpha: Math.random() * 0.5 + 0.2
        });
      }
    };

    const drawParticles = () => {
      ctx.clearRect(0, 0, width, height);
      
      particles.forEach((p, i) => {
        p.x += p.dx;
        p.y += p.dy;

        // Wrap around screen
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(56, 189, 248, ${p.alpha})`; // sky-400
        ctx.fill();
        
        // Connect close particles - ONLY on desktop
        if (!isMobile) {
            for (let j = i + 1; j < particles.length; j++) {
                const p2 = particles[j];
                const dx = p.x - p2.x;
                const dy = p.y - p2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const maxDistance = 120;
                
                if (distance < maxDistance) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(56, 189, 248, ${0.15 * (1 - distance/maxDistance)})`;
                    ctx.lineWidth = 0.5;
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            }
        }
      });

      animationFrameId = requestAnimationFrame(drawParticles);
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    drawParticles();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />;
};

export default ParticleBackground;
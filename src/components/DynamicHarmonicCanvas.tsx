import React, { useEffect, useRef } from 'react';

interface DynamicHarmonicCanvasProps {
  theme?: 'dark' | 'light';
}

export const DynamicHarmonicCanvas: React.FC<DynamicHarmonicCanvasProps> = ({ theme = 'dark' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement.clientHeight || window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Particle nodes for knowledge galaxy
    const numParticles = 48;
    const particles = Array.from({ length: numParticles }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 1.8 + 0.8,
      alpha: Math.random() * 0.5 + 0.2,
      pulseSpeed: Math.random() * 0.02 + 0.005,
      phase: Math.random() * Math.PI * 2
    }));

    // 6 Pillars orbital representation
    const pillars = [
      { name: 'I. Bản Thể', color: '#a855f7', radius: 140, speed: 0.0035, angle: 0 },
      { name: 'II. Cơ Chế', color: '#6366f1', radius: 180, speed: -0.0028, angle: (Math.PI / 3) * 1 },
      { name: 'III. Kiến Trúc', color: '#38bdf8', radius: 220, speed: 0.0022, angle: (Math.PI / 3) * 2 },
      { name: 'IV. Biện Chứng', color: '#ec4899', radius: 260, speed: -0.0018, angle: (Math.PI / 3) * 3 },
      { name: 'V. Tĩnh Tâm', color: '#eab308', radius: 300, speed: 0.0015, angle: (Math.PI / 3) * 4 },
      { name: 'VI. Đất Trời', color: '#10b981', radius: 340, speed: -0.0012, angle: (Math.PI / 3) * 5 }
    ];

    let time = 0;

    const render = () => {
      time += 1;
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      const isDark = theme === 'dark';

      // 1. Subtle background glow in center
      const gradient = ctx.createRadialGradient(
        centerX,
        centerY,
        10,
        centerX,
        centerY,
        Math.min(width, height) * 0.7
      );
      if (isDark) {
        gradient.addColorStop(0, 'rgba(124, 58, 237, 0.12)');
        gradient.addColorStop(0.5, 'rgba(79, 70, 229, 0.04)');
        gradient.addColorStop(1, 'rgba(10, 9, 24, 0)');
      } else {
        gradient.addColorStop(0, 'rgba(147, 51, 234, 0.08)');
        gradient.addColorStop(0.5, 'rgba(99, 102, 241, 0.03)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // 2. Draw Floating Knowledge Particles
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        const currentAlpha = p.alpha + Math.sin(time * p.pulseSpeed + p.phase) * 0.2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = isDark
          ? `rgba(168, 85, 247, ${Math.max(0.05, currentAlpha)})`
          : `rgba(99, 102, 241, ${Math.max(0.05, currentAlpha * 0.6)})`;
        ctx.fill();

        // Connect nearby particles with subtle lines
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 90) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            const lineAlpha = (1 - dist / 90) * 0.15;
            ctx.strokeStyle = isDark
              ? `rgba(139, 92, 246, ${lineAlpha})`
              : `rgba(99, 102, 241, ${lineAlpha * 0.8})`;
            ctx.stroke();
          }
        }
      }

      // 3. Draw Concentric Harmonic Orbital Rings
      const ringScale = Math.min(width, height) / 900;

      pillars.forEach((pillar) => {
        pillar.angle += pillar.speed;
        const currentRadius = pillar.radius * ringScale;

        // Orbit ring
        ctx.beginPath();
        ctx.arc(centerX, centerY, currentRadius, 0, Math.PI * 2);
        ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(99, 102, 241, 0.06)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 8]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Orbit node position
        const nodeX = centerX + Math.cos(pillar.angle) * currentRadius;
        const nodeY = centerY + Math.sin(pillar.angle) * currentRadius;

        // Harmonic Ray connecting node to Center
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(nodeX, nodeY);
        ctx.strokeStyle = isDark ? 'rgba(168, 85, 247, 0.08)' : 'rgba(99, 102, 241, 0.08)';
        ctx.lineWidth = 0.75;
        ctx.stroke();

        // Node circle
        ctx.beginPath();
        ctx.arc(nodeX, nodeY, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = pillar.color;
        ctx.shadowColor = pillar.color;
        ctx.shadowBlur = isDark ? 10 : 4;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // 4. Central Shinbashira Axis (Core Pillar)
      const corePulse = 16 + Math.sin(time * 0.03) * 3;

      // Outer breathing ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, corePulse * 1.8, 0, Math.PI * 2);
      ctx.strokeStyle = isDark ? 'rgba(168, 85, 247, 0.25)' : 'rgba(99, 102, 241, 0.2)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Inner glowing core
      const coreGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, corePulse);
      coreGrad.addColorStop(0, isDark ? '#ffffff' : '#7c3aed');
      coreGrad.addColorStop(0.5, isDark ? '#c084fc' : '#6366f1');
      coreGrad.addColorStop(1, isDark ? 'rgba(147, 51, 234, 0.1)' : 'rgba(99, 102, 241, 0.05)');

      ctx.beginPath();
      ctx.arc(centerX, centerY, corePulse, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      ctx.shadowColor = '#c084fc';
      ctx.shadowBlur = isDark ? 20 : 8;
      ctx.fill();
      ctx.shadowBlur = 0;

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
    />
  );
};

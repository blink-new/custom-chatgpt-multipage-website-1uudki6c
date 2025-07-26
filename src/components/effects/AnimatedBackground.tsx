import React, { useEffect } from 'react';

export function AnimatedBackground() {
  useEffect(() => {
    // Create matrix rain effect
    const createMatrixChar = () => {
      const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
      const char = document.createElement('div');
      char.className = 'matrix-char';
      char.textContent = chars[Math.floor(Math.random() * chars.length)];
      char.style.left = Math.random() * 100 + '%';
      char.style.animationDelay = Math.random() * 10 + 's';
      char.style.animationDuration = (Math.random() * 5 + 8) + 's';
      
      const matrixRain = document.querySelector('.matrix-rain');
      if (matrixRain) {
        matrixRain.appendChild(char);
        
        // Remove char after animation
        setTimeout(() => {
          if (char.parentNode) {
            char.parentNode.removeChild(char);
          }
        }, 13000);
      }
    };

    // Create floating particles
    const createParticle = () => {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.animationDelay = Math.random() * 20 + 's';
      particle.style.animationDuration = (Math.random() * 10 + 15) + 's';
      
      const particles = document.querySelector('.particles');
      if (particles) {
        particles.appendChild(particle);
        
        // Remove particle after animation
        setTimeout(() => {
          if (particle.parentNode) {
            particle.parentNode.removeChild(particle);
          }
        }, 25000);
      }
    };

    // Initialize effects
    for (let i = 0; i < 15; i++) {
      setTimeout(createMatrixChar, i * 500);
    }
    
    for (let i = 0; i < 20; i++) {
      setTimeout(createParticle, i * 1000);
    }

    // Continue creating effects
    const matrixInterval = setInterval(createMatrixChar, 1500);
    const particleInterval = setInterval(createParticle, 2000);
    
    return () => {
      clearInterval(matrixInterval);
      clearInterval(particleInterval);
    };
  }, []);

  return (
    <>
      <div className="matrix-rain"></div>
      <div className="particles"></div>
    </>
  );
}
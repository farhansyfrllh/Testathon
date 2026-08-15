import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

interface ConfettiRewardProps {
  show: boolean;
}

// Gold / Silver / Bronze / white — pixel-art palette
const COLORS = ['#FFD700', '#C0C0C0', '#CD7F32', '#ffffff'];

export default function ConfettiReward({ show }: ConfettiRewardProps) {
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (!show) return;

    const fire = (angle: number, spread: number, delay: number) => {
      const t = setTimeout(() => {
        confetti({
          particleCount: 60,
          angle,
          spread,
          origin: { x: 0.5, y: 0.55 },
          colors: COLORS,
          scalar: 1.1,
          gravity: 0.9,
          drift: 0,
          ticks: 200,
          shapes: ['square'], // square fits pixel-art theme
        });
      }, delay);
      timerRefs.current.push(t);
    };

    // Four bursts spread over ~1.5 s with different angles
    fire(90,  60,    0);
    fire(60,  80,  500);
    fire(120, 80, 1000);
    fire(90,  120, 1500);

    return () => {
      timerRefs.current.forEach(clearTimeout);
      timerRefs.current = [];
    };
  }, [show]);

  // No DOM element — confetti renders on its own canvas overlay
  return null;
}

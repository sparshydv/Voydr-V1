import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export function useCountUp(end, duration = 1.2, delay = 0) {
  const [count, setCount] = useState(0);
  const frameRef = useRef(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const startTime = performance.now();

      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / (duration * 1000), 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        setCount(Math.round(eased * end));

        if (progress < 1) {
          frameRef.current = requestAnimationFrame(animate);
        }
      };

      frameRef.current = requestAnimationFrame(animate);
    }, delay * 1000);

    return () => {
      clearTimeout(timeout);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [end, duration, delay]);

  return count;
}

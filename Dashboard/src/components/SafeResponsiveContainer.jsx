import { useState, useEffect, useRef, cloneElement, Children } from 'react';

// Completely replaces Recharts' ResponsiveContainer.
// Measures the parent with ResizeObserver and passes explicit pixel
// width/height directly to the chart child, avoiding the -1 crash entirely.
export function SafeResponsiveContainer({ children }) {
  const containerRef = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setSize({ width: Math.floor(rect.width), height: Math.floor(rect.height) });
      }
    };

    // Initial measure
    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);

    return () => ro.disconnect();
  }, []);

  // Don't render the chart at all until we have real dimensions
  if (size.width === 0 || size.height === 0) {
    return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
  }

  // Clone the single chart child and inject explicit pixel dimensions
  const child = Children.only(children);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      {cloneElement(child, { width: size.width, height: size.height })}
    </div>
  );
}

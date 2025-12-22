import React, { useRef, useEffect } from 'react';

const CustomCursor = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const followerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }
      if (followerRef.current) {
        // Add a slight delay/smoothing to the follower
        followerRef.current.animate({
          transform: `translate3d(${e.clientX - 16}px, ${e.clientY - 16}px, 0)`
        }, {
          duration: 500,
          fill: "forwards"
        });
      }
    };

    window.addEventListener('mousemove', moveCursor);
    return () => window.removeEventListener('mousemove', moveCursor);
  }, []);

  return (
    <>
      <div 
        ref={cursorRef} 
        className="fixed top-0 left-0 w-3 h-3 bg-sky-400 rounded-full pointer-events-none z-[9999] mix-blend-difference"
        style={{ marginTop: '-6px', marginLeft: '-6px' }}
      />
      <div 
        ref={followerRef} 
        className="fixed top-0 left-0 w-8 h-8 border border-sky-400/50 rounded-full pointer-events-none z-[9998] transition-opacity duration-300"
      />
    </>
  );
};

export default CustomCursor;

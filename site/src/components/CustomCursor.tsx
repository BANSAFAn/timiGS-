import React, { useRef, useEffect, useState } from "react";

const CustomCursor = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const followerRef = useRef<HTMLDivElement>(null);
  const trailRefs = useRef<HTMLDivElement[]>([]);
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const mousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Detect touch device - don't render custom cursor on mobile/tablets
    const isTouchDevice = 
      'ontouchstart' in window || 
      navigator.maxTouchPoints > 0 ||
      window.matchMedia('(pointer: coarse)').matches;
    
    if (isTouchDevice) {
      return; // Exit early on touch devices
    }

    const moveCursor = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }

      if (followerRef.current) {
        followerRef.current.animate(
          {
            transform: `translate3d(${e.clientX - 20}px, ${
              e.clientY - 20
            }px, 0) scale(${isHovering ? 1.5 : 1})`,
          },
          {
            duration: 400,
            fill: "forwards",
            easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          }
        );
      }

      // Animate trail particles
      trailRefs.current.forEach((trail, i) => {
        if (trail) {
          setTimeout(() => {
            trail.animate(
              {
                transform: `translate3d(${e.clientX - 3}px, ${
                  e.clientY - 3
                }px, 0)`,
                opacity: [0.6, 0],
              },
              {
                duration: 600 + i * 100,
                fill: "forwards",
                easing: "ease-out",
              }
            );
          }, i * 30);
        }
      });
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);

    const handleHoverStart = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "A" ||
        target.tagName === "BUTTON" ||
        target.closest("a") ||
        target.closest("button") ||
        target.classList.contains("cursor-pointer")
      ) {
        setIsHovering(true);
      }
    };

    const handleHoverEnd = () => setIsHovering(false);

    // Hide default cursor
    document.body.style.cursor = "none";
    document.querySelectorAll("a, button").forEach((el) => {
      (el as HTMLElement).style.cursor = "none";
    });

    window.addEventListener("mousemove", moveCursor);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mouseover", handleHoverStart);
    document.addEventListener("mouseout", handleHoverEnd);

    return () => {
      document.body.style.cursor = "";
      window.removeEventListener("mousemove", moveCursor);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mouseover", handleHoverStart);
      document.removeEventListener("mouseout", handleHoverEnd);
    };
  }, [isHovering]);

  return (
    <>
      {/* Trail particles */}
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          ref={(el) => {
            if (el) trailRefs.current[i] = el;
          }}
          className="fixed top-0 left-0 w-1.5 h-1.5 rounded-full pointer-events-none z-[9996] bg-gradient-to-r from-sky-400 to-purple-500"
          style={{ opacity: 0 }}
        />
      ))}

      {/* Main cursor dot */}
      <div
        ref={cursorRef}
        className={`fixed top-0 left-0 pointer-events-none z-[9999] transition-transform duration-100 ${
          isClicking ? "scale-50" : "scale-100"
        }`}
        style={{ marginTop: "-6px", marginLeft: "-6px" }}
      >
        <div
          className={`w-3 h-3 rounded-full bg-gradient-to-r from-sky-400 to-cyan-300 shadow-[0_0_20px_4px_rgba(56,189,248,0.5)] ${
            isHovering ? "animate-pulse" : ""
          }`}
        />
      </div>

      {/* Follower ring */}
      <div
        ref={followerRef}
        className={`fixed top-0 left-0 w-10 h-10 rounded-full pointer-events-none z-[9998] transition-all duration-300 ${
          isHovering
            ? "border-2 border-sky-400 bg-sky-400/10"
            : "border border-sky-400/40"
        } ${isClicking ? "scale-75 bg-sky-400/20" : ""}`}
      >
        {isHovering && (
          <div className="absolute inset-0 rounded-full bg-sky-400/20 animate-ping" />
        )}
      </div>

      {/* Glow effect on hover */}
      {isHovering && (
        <div
          className="fixed w-32 h-32 rounded-full pointer-events-none z-[9995] bg-sky-500/10 blur-2xl transition-opacity duration-300"
          style={{
            transform: `translate3d(${mousePos.current.x - 64}px, ${
              mousePos.current.y - 64
            }px, 0)`,
          }}
        />
      )}
    </>
  );
};

export default CustomCursor;

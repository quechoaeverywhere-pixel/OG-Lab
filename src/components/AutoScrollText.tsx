import React, { useState, useEffect, useRef } from 'react';

interface AutoScrollTextProps {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
  title?: string;
  speed?: number; // pixels per second
  pauseOnHover?: boolean;
}

/**
 * AutoScrollText: Automatically detects if text content overflows its container.
 * If overflowing, animates smoothly back and forth (marquee ping-pong) so the full author & source are always readable.
 */
export const AutoScrollText: React.FC<AutoScrollTextProps> = ({
  children,
  className = '',
  innerClassName = '',
  title,
  speed = 25,
  pauseOnHover = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLSpanElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [marqueeDistance, setMarqueeDistance] = useState(0);
  const [marqueeDuration, setMarqueeDuration] = useState(8);

  const checkOverflow = () => {
    if (!containerRef.current || !contentRef.current) return;

    const containerWidth = containerRef.current.clientWidth;
    const contentWidth = contentRef.current.scrollWidth;

    if (contentWidth > containerWidth + 2) {
      const overflow = contentWidth - containerWidth;
      setIsOverflowing(true);
      setMarqueeDistance(overflow + 16);
      // Calculate smooth reading duration based on overflow distance
      const duration = Math.max(5, Math.min(25, (overflow / speed) + 3.5));
      setMarqueeDuration(duration);
    } else {
      setIsOverflowing(false);
      setMarqueeDistance(0);
    }
  };

  useEffect(() => {
    checkOverflow();

    const resizeObserver = new ResizeObserver(() => {
      checkOverflow();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }

    // Also check on window resize and font load
    window.addEventListener('resize', checkOverflow);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', checkOverflow);
    };
  }, [children]);

  return (
    <div
      ref={containerRef}
      className={`w-full max-w-full min-w-0 relative overflow-hidden flex items-center select-none ${
        isOverflowing ? 'mask-radial-edges' : ''
      } ${className}`}
      title={title}
    >
      <span
        ref={contentRef}
        style={
          isOverflowing
            ? ({
                '--marquee-distance': `-${marqueeDistance}px`,
                '--marquee-duration': `${marqueeDuration}s`
              } as React.CSSProperties)
            : undefined
        }
        className={`whitespace-nowrap inline-block ${
          isOverflowing ? 'animate-marquee-pingpong' : 'truncate max-w-full'
        } ${innerClassName} ${pauseOnHover ? 'hover:[animation-play-state:paused]' : ''}`}
      >
        {children}
      </span>
    </div>
  );
};

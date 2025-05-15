
import * as React from 'react';
import { useSwipeable } from 'react-swipeable';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [isPulling, setIsPulling] = React.useState(false);
  const [pullDistance, setPullDistance] = React.useState(0);
  const THRESHOLD = 80;

  const handlers = useSwipeable({
    onSwiping: (e) => {
      if (window.scrollY === 0 && e.deltaY > 0) {
        setIsPulling(true);
        setPullDistance(Math.min(e.deltaY, THRESHOLD));
      }
    },
    onSwipedDown: async () => {
      if (pullDistance >= THRESHOLD) {
        await onRefresh();
      }
      setIsPulling(false);
      setPullDistance(0);
    },
    preventDefaultTouchmoveEvent: true,
    trackMouse: false
  });

  return (
    <div {...handlers}>
      {isPulling && (
        <div 
          className="fixed top-0 left-0 w-full h-16 flex items-center justify-center bg-background/80 backdrop-blur-sm transition-transform"
          style={{ transform: `translateY(${pullDistance}px)` }}
        >
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
        </div>
      )}
      {children}
    </div>
  );
}

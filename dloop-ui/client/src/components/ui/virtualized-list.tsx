import { useRef, useState, useEffect, ReactNode } from 'react';

/**
 * Props for the VirtualizedList component
 * @interface VirtualizedListProps
 */
interface VirtualizedListProps<T> {
  /** Array of items to render */
  items: T[];
  /** Function to render each item */
  renderItem: (item: T, index: number) => ReactNode;
  /** Height of each item in pixels */
  itemHeight: number;
  /** Container height in pixels or CSS value */
  height: number | string;
  /** Additional class names for the container */
  className?: string;
  /** Number of buffer items to render above and below the visible area */
  overscanCount?: number;
  /** ID for the scroll container */
  id?: string;
}

/**
 * A component that efficiently renders large lists by only rendering
 * the items that are currently visible in the viewport.
 * 
 * @template T - The type of items in the list
 * @param {VirtualizedListProps<T>} props - Component props
 * @returns {ReactNode} The rendered virtualized list
 */
export function VirtualizedList<T>({
  items,
  renderItem,
  itemHeight,
  height,
  className = '',
  overscanCount = 3,
  id,
}: VirtualizedListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  // Handle scroll events
  const handleScroll = () => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  };

  // Measure container height on mount and when it changes
  useEffect(() => {
    if (containerRef.current) {
      setContainerHeight(containerRef.current.clientHeight);
    }

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === containerRef.current) {
          setContainerHeight(entry.contentRect.height);
        }
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  // Calculate the range of items to render
  const totalHeight = items.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscanCount);
  const endIndex = Math.min(
    items.length - 1,
    Math.floor((scrollTop + containerHeight) / itemHeight) + overscanCount
  );

  // Create an array of items to render
  const visibleItems = [];
  for (let i = startIndex; i <= endIndex; i++) {
    visibleItems.push({
      index: i,
      item: items[i],
      offsetTop: i * itemHeight,
    });
  }

  return (
    <div
      id={id}
      ref={containerRef}
      className={`virtualized-list-container overflow-auto ${className}`}
      style={{ height, position: 'relative' }}
      onScroll={handleScroll}
      data-testid="virtualized-list"
    >
      <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
        {visibleItems.map(({ index, item, offsetTop }) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              top: 0,
              transform: `translateY(${offsetTop}px)`,
              width: '100%',
              height: `${itemHeight}px`,
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
}

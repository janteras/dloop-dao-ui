
import React from 'react';
import { useInView } from '@react-hook/intersection-observer';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  placeholderSrc?: string;
}

export const LazyImage = React.forwardRef<HTMLImageElement, LazyImageProps>(
  ({ src, placeholderSrc = '', alt = '', className = '', ...props }, ref) => {
    const [loaded, setLoaded] = React.useState(false);
    const imgRef = React.useRef<HTMLImageElement>(null);
    
    const { isIntersecting } = useInView(imgRef, {
      threshold: 0.1,
      rootMargin: '50px',
    });

    React.useEffect(() => {
      if (isIntersecting && imgRef.current && src) {
        const img = imgRef.current;
        img.src = src;
      }
    }, [isIntersecting, src]);

    return (
      <img
        ref={imgRef}
        src={placeholderSrc}
        alt={alt}
        className={`transition-opacity duration-300 ${
          loaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        onLoad={() => setLoaded(true)}
        {...props}
      />
    );
  }
);

LazyImage.displayName = 'LazyImage';

'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from './button';

interface MobileTooltipProps {
  title: string;
  description: string;
  isOpen: boolean;
  onDismiss: () => void;
  onNeverShowAgain?: () => void;
  position?: 'bottom' | 'top' | 'center';
  showBackdrop?: boolean;
}

export function MobileTooltip({
  title,
  description,
  isOpen,
  onDismiss,
  onNeverShowAgain,
  position = 'bottom',
  showBackdrop = false
}: MobileTooltipProps) {
  const [showDelay, setShowDelay] = useState(false);
  
  // Add a slight delay before showing the tooltip for better UX
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (isOpen) {
      timeoutId = setTimeout(() => {
        setShowDelay(true);
      }, 100);
    } else {
      setShowDelay(false);
    }
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [isOpen]);
  
  // Handle ESC key to dismiss tooltip
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onDismiss();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onDismiss]);
  
  // Position class based on prop
  const positionClass = 
    position === 'bottom' ? 'bottom-24 left-4 right-4' : 
    position === 'top' ? 'top-20 left-4 right-4' :
    'top-1/2 left-4 right-4 -translate-y-1/2';
  
  return (
    <AnimatePresence>
      {(isOpen && showDelay) && (
        <>
          {/* Backdrop */}
          {showBackdrop && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 md:hidden"
              onClick={onDismiss}
            />
          )}
          
          {/* Tooltip */}
          <motion.div
            className={`fixed z-50 p-4 bg-background border border-border rounded-lg shadow-lg md:hidden ${positionClass}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-medium text-foreground">{title}</h3>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6"
                onClick={onDismiss}
              >
                <X className="h-3.5 w-3.5" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
            
            <div className="text-sm text-muted-foreground mb-3">
              {description}
            </div>
            
            <div className="flex justify-end gap-2">
              {onNeverShowAgain && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onNeverShowAgain}
                >
                  Don't show again
                </Button>
              )}
              <Button size="sm" onClick={onDismiss}>
                Got it
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useContextualHelp } from '@/hooks/useContextualHelp';
import { HelpCircle, X } from 'lucide-react';
import { Button } from './ui/button';

interface ContextualHelpTooltipProps {
  triggerId?: string;
  showTriggerButton?: boolean;
  position?: 'bottom' | 'top';
}

export function ContextualHelpTooltip({ 
  triggerId = 'contextual-help',
  showTriggerButton = true,
  position = 'bottom'
}: ContextualHelpTooltipProps) {
  const { helpText, showHelp, toggleHelp, hideHelpPanel } = useContextualHelp();
  
  // Handle ESC key to dismiss help
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showHelp) {
        hideHelpPanel();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showHelp, hideHelpPanel]);
  
  // Position class based on prop
  const positionClass = position === 'bottom' 
    ? 'bottom-[4.5rem] left-4 right-4' 
    : 'top-20 left-4 right-4';
  
  return (
    <>
      {/* Help trigger button */}
      {showTriggerButton && (
        <button
          id={triggerId}
          onClick={toggleHelp}
          className="md:hidden fixed z-50 bottom-20 right-4 bg-primary text-primary-foreground p-3 rounded-full shadow-lg"
          aria-label="Toggle contextual help"
        >
          <HelpCircle className="h-5 w-5" />
        </button>
      )}
      
      {/* Help tooltip */}
      <AnimatePresence>
        {showHelp && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 md:hidden"
              onClick={hideHelpPanel}
            />
            
            {/* Tooltip */}
            <motion.div
              className={`fixed z-50 p-4 bg-background border border-border rounded-lg shadow-lg md:hidden ${positionClass}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Help & Tips</h3>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={hideHelpPanel}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </Button>
              </div>
              
              <div className="text-sm text-muted-foreground mb-4 prose-sm prose-p:mt-2 prose-p:mb-2">
                {helpText}
              </div>
              
              <div className="flex justify-end">
                <Button size="sm" onClick={hideHelpPanel}>
                  Got it
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
import { useState, useEffect } from 'react';
import { tooltipService } from '@/services/tooltip-service';

interface UseTooltipParams {
  id: string;
  showDelay?: number;     // Delay before showing tooltip (in ms)
  triggerCount?: number;  // Number of times user needs to visit before showing
  maxTriggerCount?: number; // Maximum number of times to show the tooltip
}

interface UseTooltipResult {
  isVisible: boolean;
  show: () => void;
  hide: () => void;
  neverShowAgain: () => void;
}

/**
 * Custom hook to manage tooltip visibility based on user preferences and visit count
 */
export function useTooltip({
  id,
  showDelay = 500,
  triggerCount = 3,
  maxTriggerCount = 5
}: UseTooltipParams): UseTooltipResult {
  const [isVisible, setIsVisible] = useState(false);
  const [visitCount, setVisitCount] = useState(0);
  const [hasShownTooltip, setHasShownTooltip] = useState(false);

  useEffect(() => {
    // Check if tooltip should be shown based on user preferences
    const shouldShow = tooltipService.shouldShowTooltip(id);
    
    if (!shouldShow || hasShownTooltip) {
      return;
    }

    // Update visit count
    const newCount = visitCount + 1;
    setVisitCount(newCount);
    
    // Set up timer to show tooltip if conditions are met
    let timer: NodeJS.Timeout | null = null;
    if (newCount >= triggerCount && newCount <= maxTriggerCount && !isVisible) {
      timer = setTimeout(() => {
        setIsVisible(true);
        setHasShownTooltip(true);
      }, showDelay);
    }
    
    // Clean up timer
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [id, showDelay, triggerCount, maxTriggerCount, isVisible, hasShownTooltip, visitCount]);

  const show = () => {
    if (tooltipService.shouldShowTooltip(id)) {
      setIsVisible(true);
    }
  };

  const hide = () => {
    setIsVisible(false);
  };

  const neverShowAgain = () => {
    tooltipService.hideTooltipPermanently(id);
    setIsVisible(false);
  };

  return {
    isVisible,
    show,
    hide,
    neverShowAgain
  };
}
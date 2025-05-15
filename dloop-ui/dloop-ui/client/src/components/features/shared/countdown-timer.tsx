import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  endTime: string | Date;
  onComplete?: () => void;
  compact?: boolean;
  className?: string;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

export function CountdownTimer({
  endTime,
  onComplete,
  compact = false,
  className = ''
}: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  // Calculate the time remaining
  const calculateTimeRemaining = (): TimeRemaining | null => {
    try {
      const endTimeDate = typeof endTime === 'string' ? new Date(endTime) : endTime;
      
      // Check if endTime is valid
      if (isNaN(endTimeDate.getTime())) {
        console.error('Invalid end time provided to CountdownTimer');
        return null;
      }
      
      const total = endTimeDate.getTime() - Date.now();
      
      // If countdown is completed
      if (total <= 0) {
        if (!isCompleted) {
          setIsCompleted(true);
          onComplete?.();
        }
        return {
          total: 0,
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0
        };
      }
      
      // Calculate all time units
      const days = Math.floor(total / (1000 * 60 * 60 * 24));
      const hours = Math.floor((total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((total % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((total % (1000 * 60)) / 1000);
      
      return {
        total,
        days,
        hours,
        minutes,
        seconds
      };
    } catch (error) {
      console.error('Error in countdown calculation:', error);
      return null;
    }
  };

  useEffect(() => {
    // Initial calculation
    setTimeRemaining(calculateTimeRemaining());
    
    // Update every second
    const timer = setInterval(() => {
      const remaining = calculateTimeRemaining();
      setTimeRemaining(remaining);
      
      // Clear interval if countdown completed
      if (remaining && remaining.total <= 0) {
        clearInterval(timer);
      }
    }, 1000);
    
    // Cleanup on unmount
    return () => clearInterval(timer);
  }, [endTime]);

  // Render nothing if we couldn't calculate time remaining
  if (!timeRemaining) {
    return null;
  }

  // Format time unit with leading zero
  const formatTimeUnit = (unit: number): string => {
    return unit < 10 ? `0${unit}` : `${unit}`;
  };

  // Compact mode just shows the most significant unit
  if (compact) {
    if (timeRemaining.days > 0) {
      return (
        <div className={`flex items-center text-xs ${className}`}>
          <Clock className="w-3 h-3 mr-1 text-muted-foreground" />
          <span>
            {timeRemaining.days}d left
          </span>
        </div>
      );
    } else if (timeRemaining.hours > 0) {
      return (
        <div className={`flex items-center text-xs ${className}`}>
          <Clock className="w-3 h-3 mr-1 text-muted-foreground" />
          <span>
            {timeRemaining.hours}h left
          </span>
        </div>
      );
    } else {
      return (
        <div className={`flex items-center text-xs ${className}`}>
          <Clock className="w-3 h-3 mr-1 text-warning-red" />
          <span className="text-warning-red">{timeRemaining.minutes}m left</span>
        </div>
      );
    }
  }

  // Full display with all time units
  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex items-center text-sm mb-1">
        <Clock className="w-4 h-4 mr-1.5 text-primary" />
        <span>Time Remaining</span>
      </div>
      
      <div className="grid grid-cols-4 gap-1 text-center">
        <div className="flex flex-col">
          <span className="text-lg font-mono font-bold">
            {formatTimeUnit(timeRemaining.days)}
          </span>
          <span className="text-xs text-muted-foreground">Days</span>
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-mono font-bold">
            {formatTimeUnit(timeRemaining.hours)}
          </span>
          <span className="text-xs text-muted-foreground">Hours</span>
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-mono font-bold">
            {formatTimeUnit(timeRemaining.minutes)}
          </span>
          <span className="text-xs text-muted-foreground">Min</span>
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-mono font-bold">
            {formatTimeUnit(timeRemaining.seconds)}
          </span>
          <span className="text-xs text-muted-foreground">Sec</span>
        </div>
      </div>
    </div>
  );
}
/**
 * Telemetry Provider
 * 
 * Provides application-wide telemetry context and initialization.
 * This provider sets up user and session IDs for tracking and
 * provides access to telemetry services.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { appConfig } from '@/config/app-config';

interface TelemetryContextType {
  isEnabled: boolean;
  anonymousUserId: string;
  sessionId: string;
  trackEvent: (category: string, action: string, label?: string, value?: number) => void;
}

const TelemetryContext = createContext<TelemetryContextType | null>(null);

export interface TelemetryProviderProps {
  children: React.ReactNode;
}

export const TelemetryProvider: React.FC<TelemetryProviderProps> = ({ children }) => {
  const [anonymousUserId, setAnonymousUserId] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');
  const isEnabled = appConfig.featureFlags.enableTelemetry;

  // Set up user and session IDs
  useEffect(() => {
    if (!isEnabled) return;

    // Set up anonymous user ID (persists across sessions)
    let userId = localStorage.getItem('anonymousUserId');
    if (!userId) {
      userId = uuidv4();
      localStorage.setItem('anonymousUserId', userId);
    }
    setAnonymousUserId(userId);

    // Set up session ID (new for each session)
    let sId = sessionStorage.getItem('sessionId');
    if (!sId) {
      sId = uuidv4();
      sessionStorage.setItem('sessionId', sId);
    }
    setSessionId(sId);
  }, [isEnabled]);

  // Track page views
  useEffect(() => {
    if (!isEnabled || !anonymousUserId) return;

    const trackPageView = () => {
      // Send page view event
      trackEvent('pageView', window.location.pathname);
    };

    // Track initial page view
    trackPageView();

    // Set up history change listener
    const handleRouteChange = () => {
      trackPageView();
    };

    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [isEnabled, anonymousUserId]);

  // Generic event tracking function
  const trackEvent = (category: string, action: string, label?: string, value?: number) => {
    if (!isEnabled) return;

    try {
      // Send event to backend
      fetch('/api/telemetry/event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category,
          action,
          label,
          value,
          userId: anonymousUserId,
          sessionId,
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent,
        }),
      });
    } catch (error) {
      console.error('Failed to track event:', error);
      // Don't throw - telemetry errors shouldn't affect application
    }
  };

  const contextValue: TelemetryContextType = {
    isEnabled,
    anonymousUserId,
    sessionId,
    trackEvent,
  };

  return (
    <TelemetryContext.Provider value={contextValue}>
      {children}
    </TelemetryContext.Provider>
  );
};

/**
 * Hook to use telemetry context
 */
export const useTelemetry = () => {
  const context = useContext(TelemetryContext);
  
  if (!context) {
    throw new Error('useTelemetry must be used within a TelemetryProvider');
  }
  
  return context;
};

export default TelemetryProvider;

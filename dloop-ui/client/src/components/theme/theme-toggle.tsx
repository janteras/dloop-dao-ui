import React, { useState, useEffect } from 'react';
import { useTheme } from '@/components/common/theme-provider';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Laptop, Stars, Sparkles } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
  variant?: 'default' | 'mini' | 'animated';
}

export function ThemeToggle({ className, variant = 'default' }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showRipple, setShowRipple] = useState(false);

  // Ensure component is mounted to access localStorage/window
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Get the effective theme (resolving system preference)
  const getEffectiveTheme = () => {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme;
  };

  const effectiveTheme = getEffectiveTheme();
  
  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setIsAnimating(true);
    setShowRipple(true);
    
    // Apply theme morphing classes to the document root
    const root = window.document.documentElement;
    root.classList.add('theme-morph');
    
    // After a small delay, change the theme (allowing transition to start)
    setTimeout(() => {
      setTheme(newTheme);
    }, 50);
    
    // Reset animation states after animations complete
    setTimeout(() => {
      setIsAnimating(false);
      root.classList.remove('theme-morph');
    }, 2000);
    
    setTimeout(() => {
      setShowRipple(false);
    }, 1000);
  };

  // Animated toggle switch
  if (variant === 'animated') {
    return (
      <div className={cn('relative', className)}>
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleThemeChange(effectiveTheme === 'dark' ? 'light' : 'dark')}
          className={cn(
            'relative w-14 h-8 rounded-full overflow-hidden transition-colors',
            effectiveTheme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-sky-100 border-sky-200',
            isAnimating && 'theme-toggle-animate'
          )}
          aria-label={`Switch to ${effectiveTheme === 'dark' ? 'light' : 'dark'} mode`}
        >
          <div 
            className={cn(
              'absolute inset-0 flex items-center transition-transform duration-500 ease-in-out',
              effectiveTheme === 'dark' ? 'justify-end' : 'justify-start'
            )}
          >
            <div className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center mx-1 transform transition-all duration-500',
              effectiveTheme === 'dark' 
                ? 'bg-slate-700 text-yellow-300' 
                : 'bg-sky-50 text-yellow-500'
            )}>
              {effectiveTheme === 'dark' ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </div>
          </div>
          {/* Background decorative elements */}
          {effectiveTheme === 'dark' ? (
            <div className="absolute inset-0 opacity-40">
              <div className="absolute top-1 right-8 w-1 h-1 bg-white rounded-full"></div>
              <div className="absolute top-3 right-6 w-0.5 h-0.5 bg-white rounded-full"></div>
              <div className="absolute top-5 right-10 w-0.5 h-0.5 bg-white rounded-full"></div>
            </div>
          ) : (
            <div className="absolute inset-0 opacity-0">
              <div className="absolute top-1 left-8 w-1 h-1 bg-yellow-200 rounded-full"></div>
            </div>
          )}
        </Button>
      </div>
    );
  }

  // Mini variant
  if (variant === 'mini') {
    return (
      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleThemeChange(effectiveTheme === 'dark' ? 'light' : 'dark')}
          aria-label={`Switch to ${effectiveTheme === 'dark' ? 'light' : 'dark'} mode`}
          className={cn(
            'rounded-full w-8 h-8 transition-all transform',
            isAnimating && 'animate-flip',
            showRipple && 'theme-ripple',
            className
          )}
        >
          {effectiveTheme === 'dark' ? (
            <Sun className="h-4 w-4 text-yellow-400" />
          ) : (
            <Moon className="h-4 w-4 text-slate-700" />
          )}
          {/* Subtle particle effects */}
          {isAnimating && effectiveTheme === 'dark' && (
            <Sparkles className="absolute top-0 right-0 w-3 h-3 text-yellow-300 animate-in zoom-in-50 fade-in duration-500" />
          )}
          {isAnimating && effectiveTheme === 'light' && (
            <Stars className="absolute bottom-0 left-0 w-3 h-3 text-indigo-400 animate-in zoom-in-50 fade-in duration-500" />
          )}
        </Button>
      </div>
    );
  }

  // Default dropdown variant
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="relative">
          <Button 
            variant="ghost" 
            size="icon"
            className={cn(
              'rounded-full focus-visible:ring-0 focus-visible:ring-offset-0 relative overflow-hidden',
              isAnimating && 'animate-pulse',
              showRipple && 'theme-ripple',
              className
            )}
          >
            {/* Animated icon with transition effects */}
            <div className="relative">
              {effectiveTheme === 'dark' ? (
                <Sun className={cn(
                  "h-5 w-5 transition-all text-yellow-400",
                  isAnimating && "animate-in zoom-in-50 duration-500"
                )} />
              ) : (
                <Moon className={cn(
                  "h-5 w-5 transition-all text-slate-700",
                  isAnimating && "animate-in zoom-in-50 duration-500"
                )} />
              )}
              
              {/* Glow effect behind the icon */}
              {isAnimating && (
                <div className={cn(
                  "absolute inset-0 rounded-full blur-sm -z-10 opacity-70 animate-in fade-in duration-500",
                  effectiveTheme === 'dark' 
                    ? "bg-yellow-400/30" 
                    : "bg-indigo-400/30"
                )}></div>
              )}
            </div>
            
            <span className="sr-only">Toggle theme</span>
          </Button>
          
          {/* Particle effects around the button during transition */}
          {isAnimating && (
            <div className="absolute inset-0 pointer-events-none">
              {effectiveTheme === 'dark' ? (
                <>
                  <Sparkles className="absolute -top-1 right-0 w-3 h-3 text-yellow-300 animate-in fade-in zoom-in-50 duration-700" />
                  <Sparkles className="absolute bottom-0 -left-1 w-2 h-2 text-yellow-300 animate-in fade-in zoom-in-50 duration-1000 delay-100" />
                </>
              ) : (
                <>
                  <Stars className="absolute -top-1 right-0 w-3 h-3 text-indigo-400 animate-in fade-in zoom-in-50 duration-700" />
                  <Stars className="absolute bottom-0 -left-1 w-2 h-2 text-indigo-400 animate-in fade-in zoom-in-50 duration-1000 delay-100" />
                </>
              )}
            </div>
          )}
        </div>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="right"
        className={cn(
          "animate-in fade-in-50 slide-in-from-top-5 duration-300",
          effectiveTheme === 'dark' ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
        )}
      >
        <DropdownMenuItem 
          onClick={() => handleThemeChange('light')}
          className="group"
        >
          <div className="flex items-center w-full">
            <div className={cn(
              "mr-2 h-6 w-6 rounded-full flex items-center justify-center transition-colors",
              theme === 'light' ? "bg-yellow-100" : "bg-transparent group-hover:bg-yellow-50"
            )}>
              <Sun className="h-4 w-4 text-yellow-500" />
            </div>
            <span className="relative">
              Light
              {theme === 'light' && (
                <span className="absolute -bottom-0.5 left-0 w-full h-0.5 bg-yellow-400/50 rounded-full"></span>
              )}
            </span>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => handleThemeChange('dark')}
          className="group"
        >
          <div className="flex items-center w-full">
            <div className={cn(
              "mr-2 h-6 w-6 rounded-full flex items-center justify-center transition-colors",
              theme === 'dark' ? "bg-slate-700" : "bg-transparent group-hover:bg-slate-100 dark:group-hover:bg-slate-800"
            )}>
              <Moon className="h-4 w-4 text-slate-700 dark:text-slate-400" />
            </div>
            <span className="relative">
              Dark
              {theme === 'dark' && (
                <span className="absolute -bottom-0.5 left-0 w-full h-0.5 bg-slate-400/50 rounded-full"></span>
              )}
            </span>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => handleThemeChange('system')}
          className="group"
        >
          <div className="flex items-center w-full">
            <div className={cn(
              "mr-2 h-6 w-6 rounded-full flex items-center justify-center transition-colors",
              theme === 'system' ? "bg-sky-100 dark:bg-sky-900/30" : "bg-transparent group-hover:bg-sky-50 dark:group-hover:bg-sky-900/20"
            )}>
              <Laptop className="h-4 w-4 text-sky-700 dark:text-sky-400" />
            </div>
            <span className="relative">
              System
              {theme === 'system' && (
                <span className="absolute -bottom-0.5 left-0 w-full h-0.5 bg-sky-400/50 rounded-full"></span>
              )}
            </span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
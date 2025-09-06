'use client';

import React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '../../contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  variant?: 'default' | 'compact' | 'icon-only';
  className?: string;
}

export function ThemeToggle({ variant = 'default', className }: ThemeToggleProps) {
  const { theme, setTheme, actualTheme } = useTheme();

  const getThemeIcon = (themeType: string) => {
    switch (themeType) {
      case 'light':
        return Sun;
      case 'dark':
        return Moon;
      case 'system':
        return Monitor;
      default:
        return Sun;
    }
  };

  const getThemeLabel = (themeType: string) => {
    switch (themeType) {
      case 'light':
        return 'Claro';
      case 'dark':
        return 'Escuro';
      case 'system':
        return 'Sistema';
      default:
        return 'Claro';
    }
  };

  const cycleTheme = () => {
    const themes = ['light', 'dark', 'system'] as const;
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const CurrentIcon = getThemeIcon(theme);

  if (variant === 'icon-only') {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={cycleTheme}
        className={cn(
          "relative h-9 w-9 p-0 transition-all duration-300",
          "hover:bg-slate-100 dark:hover:bg-slate-800",
          "focus:ring-2 focus:ring-sky-500 focus:ring-offset-2",
          "dark:focus:ring-offset-slate-900",
          className
        )}
        title={`Tema atual: ${getThemeLabel(theme)}`}
      >
        <div className="relative">
          <CurrentIcon className={cn(
            "h-4 w-4 transition-all duration-300",
            "text-slate-600 dark:text-slate-400",
            "hover:text-slate-900 dark:hover:text-slate-100",
            "hover:scale-110"
          )} />
          
          {/* Indicator dot */}
          <div className={cn(
            "absolute -bottom-1 -right-1 h-2 w-2 rounded-full transition-all duration-300",
            theme === 'light' && "bg-amber-400",
            theme === 'dark' && "bg-slate-600",
            theme === 'system' && "bg-blue-500"
          )} />
        </div>
      </Button>
    );
  }

  if (variant === 'compact') {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={cycleTheme}
        className={cn(
          "flex items-center space-x-2 transition-all duration-300",
          "hover:shadow-md hover:-translate-y-0.5",
          "border-slate-200 dark:border-slate-700",
          "bg-white dark:bg-slate-800",
          "hover:bg-slate-50 dark:hover:bg-slate-700",
          className
        )}
      >
        <CurrentIcon className="h-4 w-4" />
        <span className="text-sm font-medium">{getThemeLabel(theme)}</span>
      </Button>
    );
  }

  return (
    <div className={cn("flex items-center space-x-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg", className)}>
      {(['light', 'dark', 'system'] as const).map((themeOption) => {
        const Icon = getThemeIcon(themeOption);
        const isActive = theme === themeOption;
        
        return (
          <Button
            key={themeOption}
            variant="ghost"
            size="sm"
            onClick={() => setTheme(themeOption)}
            className={cn(
              "relative h-8 px-3 transition-all duration-300",
              "hover:bg-white dark:hover:bg-slate-700",
              "focus:ring-2 focus:ring-sky-500 focus:ring-offset-2",
              "dark:focus:ring-offset-slate-800",
              isActive && [
                "bg-white dark:bg-slate-700",
                "shadow-sm",
                "text-slate-900 dark:text-slate-100"
              ],
              !isActive && "text-slate-600 dark:text-slate-400"
            )}
          >
            <div className="flex items-center space-x-2">
              <Icon className={cn(
                "h-4 w-4 transition-all duration-300",
                isActive && "scale-110"
              )} />
              <span className="text-xs font-medium">
                {getThemeLabel(themeOption)}
              </span>
            </div>
            
            {/* Active indicator */}
            {isActive && (
              <div className="absolute inset-0 rounded-md ring-2 ring-sky-500/20 dark:ring-sky-400/20" />
            )}
          </Button>
        );
      })}
    </div>
  );
}

// Floating theme toggle for quick access
export function FloatingThemeToggle() {
  const { theme, actualTheme, setTheme } = useTheme();
  const [isExpanded, setIsExpanded] = React.useState(false);

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  const CurrentIcon = actualTheme === 'dark' ? Moon : Sun;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className={cn(
        "flex flex-col items-end space-y-2 transition-all duration-300",
        isExpanded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
      )}>
        {/* Theme options */}
        <div className="flex flex-col space-y-1 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-1">
          {(['light', 'dark', 'system'] as const).map((themeOption) => {
            const Icon = getThemeIcon(themeOption);
            const isActive = theme === themeOption;
            
            return (
              <Button
                key={themeOption}
                variant="ghost"
                size="sm"
                onClick={() => {
                  setTheme(themeOption);
                  setIsExpanded(false);
                }}
                className={cn(
                  "h-8 px-3 justify-start transition-all duration-200",
                  isActive && "bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300"
                )}
              >
                <Icon className="h-4 w-4 mr-2" />
                <span className="text-sm">{getThemeLabel(themeOption)}</span>
              </Button>
            );
          })}
        </div>
      </div>
      
      {/* Main toggle button */}
      <Button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "h-12 w-12 rounded-full shadow-lg transition-all duration-300",
          "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700",
          "hover:shadow-xl hover:scale-110",
          "text-slate-700 dark:text-slate-300",
          "hover:bg-slate-50 dark:hover:bg-slate-700",
          isExpanded && "rotate-180"
        )}
        variant="ghost"
      >
        <CurrentIcon className="h-5 w-5" />
      </Button>
    </div>
  );
}
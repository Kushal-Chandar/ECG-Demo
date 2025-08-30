import React from 'react';
import { Clock, Share2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavigationBarProps {
  activeTab?: 'history' | 'share' | 'emergency';
  onTabChange?: (tab: 'history' | 'share' | 'emergency') => void;
  className?: string;
}

const NavigationBar: React.FC<NavigationBarProps> = ({ 
  activeTab = 'history', 
  onTabChange,
  className 
}) => {
  const tabs = [
    { id: 'history' as const, label: 'History', icon: Clock },
    { id: 'share' as const, label: 'Share', icon: Share2 },
    { id: 'emergency' as const, label: 'Emergency', icon: AlertTriangle },
  ];

  return (
    <div className={cn(
      'flex justify-around items-center py-4 px-6 bg-card border-t border-border',
      className
    )}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        const isEmergency = tab.id === 'emergency';
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange?.(tab.id)}
            className={cn(
              'flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition-all',
              'hover:bg-secondary/50',
              isActive && !isEmergency && 'text-primary',
              isActive && isEmergency && 'text-destructive',
              !isActive && 'text-muted-foreground'
            )}
          >
            <Icon 
              className={cn(
                'w-5 h-5 transition-colors',
                isEmergency && 'text-destructive'
              )} 
            />
            <span className="text-xs font-medium">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default NavigationBar;
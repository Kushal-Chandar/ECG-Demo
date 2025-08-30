import React, { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import ECGGraph from './ECGGraph';
import NavigationBar from './NavigationBar';
import { cn } from '@/lib/utils';

interface ECGMonitorProps {
  isRisk?: boolean;
  onNavigate?: (screen: string) => void;
}

const ECGMonitor: React.FC<ECGMonitorProps> = ({ isRisk = false, onNavigate }) => {
  const [heartRate, setHeartRate] = useState(72);
  const [respiratoryRate, setRespiratoryRate] = useState(isRisk ? 1.3 : 0.9);
  const [signalQuality, setSignalQuality] = useState(isRisk ? 'Poor' : 'Good');

  useEffect(() => {
    // Simulate vital signs fluctuation
    const interval = setInterval(() => {
      if (isRisk) {
        setHeartRate(prev => prev + Math.floor(Math.random() * 5 - 2));
        setRespiratoryRate(prev => +(prev + (Math.random() * 0.2 - 0.1)).toFixed(1));
      } else {
        setHeartRate(prev => Math.min(75, Math.max(68, prev + Math.floor(Math.random() * 3 - 1))));
        setRespiratoryRate(prev => +(Math.min(1.0, Math.max(0.8, prev + (Math.random() * 0.1 - 0.05))).toFixed(1)));
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isRisk]);

  const handleTabChange = (tab: string) => {
    if (tab === 'emergency' && onNavigate) {
      onNavigate('emergency');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-card border-b border-border">
        <button className="text-foreground">&lt;</button>
        <h1 className="text-lg font-semibold text-foreground">ECG</h1>
        <Heart className="w-5 h-5 text-foreground" />
      </div>

      {/* ECG Graph Container */}
      <div className="flex-1 flex flex-col px-6 py-4">
        <div className="relative flex-1 min-h-[200px] mb-6">
          <ECGGraph isRisk={isRisk} className="absolute inset-0" />
        </div>

        {/* Status Badge */}
        <div className="flex justify-center mb-6">
          <div className={cn(
            'px-8 py-3 rounded-full font-semibold text-lg shadow-lg transition-all',
            isRisk
              ? 'bg-gradient-emergency text-destructive-foreground shadow-glow-red'
              : 'bg-gradient-success text-success-foreground shadow-glow-green'
          )}>
            {isRisk ? 'Risk' : 'Normal'}
          </div>
        </div>

        {/* Vital Signs */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-vital-text text-sm mb-1">HR</div>
            <div className="text-2xl font-bold text-foreground">{heartRate}</div>
          </div>

          <div className="text-center">
            <div className="text-vital-text text-sm mb-1">RR</div>
            <div className="text-2xl font-bold text-foreground">{respiratoryRate}</div>
          </div>

          <div className="text-center">
            <div className="text-vital-text text-sm mb-1">Signal Quality</div>
            <div className={cn(
              'text-sm font-medium flex items-center justify-center gap-1',
              isRisk ? 'text-destructive' : 'text-success'
            )}>
              <span className={cn(
                'w-2 h-2 rounded-full',
                isRisk ? 'bg-destructive' : 'bg-success'
              )} />
              {signalQuality}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <NavigationBar
        activeTab={isRisk ? 'emergency' : 'history'}
        onTabChange={handleTabChange}
      />
    </div>
  );
};

export default ECGMonitor;
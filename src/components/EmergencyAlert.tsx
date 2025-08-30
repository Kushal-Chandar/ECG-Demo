import React, { useEffect, useState } from 'react';
import { AlertTriangle, Phone, MapPin, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmergencyAlertProps {
  onShowHospitals?: () => void;
  onCallEmergency?: () => void;
  onNotifyContacts?: () => void;
}

const EmergencyAlert: React.FC<EmergencyAlertProps> = ({
  onShowHospitals,
  onCallEmergency,
  onNotifyContacts
}) => {
  const [isPulsing, setIsPulsing] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsPulsing(prev => !prev);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-dark flex items-center justify-center p-6">
      <div className={cn(
        'w-full max-w-md bg-gradient-emergency rounded-3xl p-8 shadow-card transition-all duration-500',
        isPulsing && 'shadow-glow-red scale-[1.02]'
      )}>
        {/* Alert Icon */}
        <div className="flex justify-center mb-6">
          <div className={cn(
            'w-24 h-24 rounded-full bg-background/10 flex items-center justify-center',
            'border-4 border-destructive-foreground/50'
          )}>
            <AlertTriangle className="w-12 h-12 text-destructive-foreground animate-pulse" />
          </div>
        </div>

        {/* Alert Title */}
        <h1 className="text-2xl font-bold text-center text-destructive-foreground mb-3">
          Possible Cardiac<br />Arrest Risk
        </h1>
        
        {/* Alert Message */}
        <p className="text-center text-destructive-foreground/90 mb-8">
          Seek Help Immediately
        </p>

        {/* Emergency Actions */}
        <div className="space-y-3">
          {/* Call Emergency Button */}
          <button
            onClick={onCallEmergency}
            className={cn(
              'w-full bg-destructive-foreground text-destructive font-semibold py-4 px-6 rounded-2xl',
              'flex items-center justify-center gap-3',
              'hover:bg-destructive-foreground/90 transition-all',
              'shadow-lg hover:shadow-xl'
            )}
          >
            <Phone className="w-5 h-5" />
            Call Emergency
          </button>

          {/* Show Nearby Hospitals Button */}
          <button
            onClick={onShowHospitals}
            className={cn(
              'w-full bg-background/20 backdrop-blur text-destructive-foreground font-semibold py-4 px-6 rounded-2xl',
              'flex items-center justify-center gap-3',
              'hover:bg-background/30 transition-all',
              'border border-destructive-foreground/20'
            )}
          >
            <MapPin className="w-5 h-5" />
            Show Nearby Hospitals
          </button>

          {/* Notify Contacts Button */}
          <button
            onClick={onNotifyContacts}
            className={cn(
              'w-full bg-background/20 backdrop-blur text-destructive-foreground font-semibold py-4 px-6 rounded-2xl',
              'flex items-center justify-center gap-3',
              'hover:bg-background/30 transition-all',
              'border border-destructive-foreground/20'
            )}
          >
            <Users className="w-5 h-5" />
            Notify Contacts
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmergencyAlert;
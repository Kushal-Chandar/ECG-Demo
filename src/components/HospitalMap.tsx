import React, { useEffect, useRef } from 'react';
import { ChevronLeft, MapPin, Navigation, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HospitalMapProps {
  onBack?: () => void;
  onNavigate?: () => void;
}

const HospitalMap: React.FC<HospitalMapProps> = ({ onBack, onNavigate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      drawMap();
    };

    const drawMap = () => {
      // Clear canvas
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw streets (simplified map visualization)
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 8;
      
      // Main streets
      ctx.beginPath();
      ctx.moveTo(0, canvas.height * 0.3);
      ctx.lineTo(canvas.width, canvas.height * 0.3);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(canvas.width * 0.4, 0);
      ctx.lineTo(canvas.width * 0.4, canvas.height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, canvas.height * 0.7);
      ctx.lineTo(canvas.width, canvas.height * 0.7);
      ctx.stroke();

      // Secondary streets
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#e0e0e0';
      
      for (let i = 0.1; i < 1; i += 0.2) {
        ctx.beginPath();
        ctx.moveTo(canvas.width * i, 0);
        ctx.lineTo(canvas.width * i, canvas.height);
        ctx.stroke();
      }

      // Draw route
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 4;
      ctx.setLineDash([10, 5]);
      ctx.beginPath();
      ctx.moveTo(canvas.width * 0.2, canvas.height * 0.8);
      ctx.quadraticCurveTo(
        canvas.width * 0.4, canvas.height * 0.6,
        canvas.width * 0.6, canvas.height * 0.4
      );
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw current location marker
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(canvas.width * 0.2, canvas.height * 0.8, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw hospital marker
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(canvas.width * 0.6, canvas.height * 0.4, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 bg-card border-b border-border">
        <button onClick={onBack} className="text-foreground">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">Nearby hospitals</h1>
      </div>

      {/* Distance Filter */}
      <div className="px-6 py-3 bg-card border-b border-border">
        <select className="bg-secondary text-foreground px-4 py-2 rounded-lg w-32 border border-border">
          <option>Distance</option>
          <option>1 km</option>
          <option>5 km</option>
          <option>10 km</option>
        </select>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ display: 'block' }}
        />
        
        {/* Blue location dot overlay */}
        <div className="absolute bottom-32 left-8">
          <div className="w-4 h-4 bg-primary rounded-full animate-pulse" />
        </div>

        {/* Hospital marker overlay */}
        <div className="absolute top-48 right-32">
          <div className="bg-destructive text-destructive-foreground w-8 h-8 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-xs font-bold">H</span>
          </div>
        </div>
      </div>

      {/* Hospital Info Card */}
      <div className="bg-card border-t border-border p-6">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-foreground mb-2">City Hospital</h2>
          <div className="flex items-center gap-4 text-vital-text">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">2.3 km</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span className="text-sm">8 min</span>
            </div>
          </div>
        </div>

        {/* Navigate Button */}
        <button
          onClick={onNavigate}
          className={cn(
            'w-full bg-primary text-primary-foreground font-semibold py-4 px-6 rounded-2xl',
            'flex items-center justify-center gap-3',
            'hover:bg-primary/90 transition-all',
            'shadow-lg hover:shadow-xl'
          )}
        >
          <Navigation className="w-5 h-5" />
          Navigate
        </button>
      </div>
    </div>
  );
};

export default HospitalMap;
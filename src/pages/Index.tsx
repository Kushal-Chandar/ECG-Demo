import React, { useState } from 'react';
import ECGMonitor from '@/components/ECGMonitor';
import EmergencyAlert from '@/components/EmergencyAlert';
import HospitalMap from '@/components/HospitalMap';

type Screen = 'normal-ecg' | 'risk-ecg' | 'emergency' | 'hospital-map';

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('normal-ecg');

  const handleNavigation = (screen: Screen) => {
    setCurrentScreen(screen);
  };

  const handleCallEmergency = () => {
    // In a real app, this would trigger an emergency call
    console.log('Calling emergency services...');
    alert('Emergency services would be called in a real application');
  };

  const handleNotifyContacts = () => {
    // In a real app, this would notify emergency contacts
    console.log('Notifying emergency contacts...');
    alert('Emergency contacts would be notified in a real application');
  };

  const handleNavigateToHospital = () => {
    // In a real app, this would open navigation
    console.log('Opening navigation to hospital...');
    alert('Navigation would open in a real application');
  };

  // Demo navigation between screens
  React.useEffect(() => {
    // Auto-cycle through screens for demo
    const screens: Screen[] = ['normal-ecg', 'risk-ecg', 'emergency', 'hospital-map'];
    let currentIndex = 0;
    
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        currentIndex = (currentIndex + 1) % screens.length;
        setCurrentScreen(screens[currentIndex]);
      } else if (e.key === 'ArrowLeft') {
        currentIndex = (currentIndex - 1 + screens.length) % screens.length;
        setCurrentScreen(screens[currentIndex]);
      } else if (e.key >= '1' && e.key <= '4') {
        const index = parseInt(e.key) - 1;
        currentIndex = index;
        setCurrentScreen(screens[index]);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <div className="relative min-h-screen bg-background">
      {/* Screen selector for demo */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-card/95 backdrop-blur rounded-full px-4 py-2 shadow-card border border-border">
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentScreen('normal-ecg')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              currentScreen === 'normal-ecg' 
                ? 'bg-success text-success-foreground' 
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            1. Normal ECG
          </button>
          <button
            onClick={() => setCurrentScreen('risk-ecg')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              currentScreen === 'risk-ecg' 
                ? 'bg-destructive text-destructive-foreground' 
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            2. Risk ECG
          </button>
          <button
            onClick={() => setCurrentScreen('emergency')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              currentScreen === 'emergency' 
                ? 'bg-destructive text-destructive-foreground' 
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            3. Emergency
          </button>
          <button
            onClick={() => setCurrentScreen('hospital-map')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              currentScreen === 'hospital-map' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            4. Hospital Map
          </button>
        </div>
        <div className="text-center mt-2 text-xs text-muted-foreground">
          Use arrow keys or number keys 1-4 to navigate
        </div>
      </div>

      {/* Screen content */}
      <div className="max-w-md mx-auto h-screen">
        {currentScreen === 'normal-ecg' && (
          <ECGMonitor 
            isRisk={false} 
            onNavigate={() => handleNavigation('emergency')}
          />
        )}
        
        {currentScreen === 'risk-ecg' && (
          <ECGMonitor 
            isRisk={true} 
            onNavigate={() => handleNavigation('emergency')}
          />
        )}
        
        {currentScreen === 'emergency' && (
          <EmergencyAlert
            onShowHospitals={() => handleNavigation('hospital-map')}
            onCallEmergency={handleCallEmergency}
            onNotifyContacts={handleNotifyContacts}
          />
        )}
        
        {currentScreen === 'hospital-map' && (
          <HospitalMap
            onBack={() => handleNavigation('emergency')}
            onNavigate={handleNavigateToHospital}
          />
        )}
      </div>
    </div>
  );
};

export default Index;

/**
 * Real-time Updates Hook
 * 
 * Polls for live occupancy changes and notifies users
 * Simulates WebSocket behavior with smart polling
 */

import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

export const useRealTimeUpdates = (hospitalId, onUpdate, interval = 30000) => {
  const intervalRef = useRef(null);
  const previousDataRef = useRef(null);

  useEffect(() => {
    if (!hospitalId) return;

    const checkForUpdates = async () => {
      try {
        const response = await fetch(`/api/public/availability/${hospitalId}`);
        const newData = await response.json();

        // Compare with previous data
        if (previousDataRef.current) {
          const oldOccupancy = previousDataRef.current.utilization_percentage;
          const newOccupancy = newData.utilization_percentage;
          
          // Notify if significant change (>5%)
          if (Math.abs(newOccupancy - oldOccupancy) > 5) {
            if (newOccupancy > oldOccupancy) {
              toast('🔴 Occupancy increased', {
                description: `Now at ${newOccupancy.toFixed(1)}%`,
                duration: 4000,
              });
            } else {
              toast('🟢 Occupancy decreased', {
                description: `Now at ${newOccupancy.toFixed(1)}%`,
                duration: 4000,
              });
            }
          }

          // Critical alert
          if (newOccupancy >= 90 && oldOccupancy < 90) {
            toast.error('⚠️ Critical capacity reached!', {
              duration: 5000,
            });
          }
        }

        previousDataRef.current = newData;
        
        if (onUpdate) {
          onUpdate(newData);
        }
      } catch (error) {
        console.error('Error checking for updates:', error);
      }
    };

    // Initial check
    checkForUpdates();

    // Set up polling
    intervalRef.current = setInterval(checkForUpdates, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [hospitalId, interval, onUpdate]);

  return { isActive: !!intervalRef.current };
};

export default useRealTimeUpdates;

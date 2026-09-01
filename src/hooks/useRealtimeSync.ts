import { useEffect, useState } from 'react';
import { realtimeService } from '../services/realtime';
import { RealtimeConnectionStatus, RealtimeEvent } from '../types';

interface UseRealtimeSyncProps {
  tenantId: string | undefined;
  onSync: (event?: RealtimeEvent) => void;
}

export function useRealtimeSync({ tenantId, onSync }: UseRealtimeSyncProps) {
  const [status, setStatus] = useState<RealtimeConnectionStatus>(realtimeService.getStatus());
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());

  useEffect(() => {
    if (!tenantId) return;

    // Connect to realtime server
    realtimeService.connect(tenantId);

    // Subscribe to status changes
    const unsubStatus = realtimeService.onStatusChange((newStatus) => {
      setStatus(newStatus);
    });

    // Subscribe to incoming data sync events
    const unsubEvents = realtimeService.subscribe((event) => {
      setLastSyncTime(new Date());
      onSync(event);
    });

    // Mobile & Desktop resume handlers: when window gains focus or visibility becomes 'visible'
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        onSync();
      }
    };

    const handleOnline = () => {
      realtimeService.connect(tenantId);
      onSync();
    };

    const handleFocus = () => {
      onSync();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('focus', handleFocus);

    return () => {
      unsubStatus();
      unsubEvents();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('focus', handleFocus);
    };
  }, [tenantId, onSync]);

  return {
    status,
    lastSyncTime,
    isConnected: status === 'connected' || status === 'fallback_sse',
  };
}

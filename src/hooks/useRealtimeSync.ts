import { useEffect, useState } from 'react';
import { realtimeService } from '../services/realtime';
import { RealtimeConnectionStatus, RealtimeEvent } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

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

    // Supabase Realtime subscription for instant multi-device / cloud cross-platform sync
    let supabaseChannel: any = null;
    if (isSupabaseConfigured) {
      try {
        supabaseChannel = supabase
          .channel(`clinic-realtime-${tenantId}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'patients' },
            () => {
              setLastSyncTime(new Date());
              onSync();
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'anamneses' },
            () => {
              setLastSyncTime(new Date());
              onSync();
            }
          )
          .subscribe((chanStatus) => {
            if (chanStatus === 'SUBSCRIBED') {
              setStatus('connected');
            }
          });
      } catch (err) {
        console.warn('Supabase realtime channel setup notice:', err);
      }
    }

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

    // Periodic sync check every 4 seconds for multi-device instant consistency
    const pollInterval = setInterval(() => {
      onSync();
    }, 4000);

    return () => {
      unsubStatus();
      unsubEvents();
      if (supabaseChannel) {
        supabase.removeChannel(supabaseChannel);
      }
      clearInterval(pollInterval);
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

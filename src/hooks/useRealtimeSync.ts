import { useEffect, useState, useRef, useCallback } from 'react';
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

  // Keep latest onSync callback without triggering useEffect re-runs
  const onSyncRef = useRef(onSync);
  useEffect(() => {
    onSyncRef.current = onSync;
  }, [onSync]);

  // Debounced trigger to prevent rapid repeated calls
  const debounceTimerRef = useRef<any>(null);
  const triggerSync = useCallback((event?: RealtimeEvent) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setLastSyncTime(new Date());
      onSyncRef.current?.(event);
    }, 300);
  }, []);

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
      triggerSync(event);
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
              triggerSync();
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'anamneses' },
            () => {
              triggerSync();
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

    // Resume handlers: when window gains focus or visibility becomes 'visible'
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        triggerSync();
      }
    };

    const handleOnline = () => {
      realtimeService.connect(tenantId);
      triggerSync();
    };

    const handleFocus = () => {
      triggerSync();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('focus', handleFocus);

    // Gentle background poll every 30 seconds for resiliency if WebSocket/SSE drops
    const pollInterval = setInterval(() => {
      triggerSync();
    }, 30000);

    return () => {
      unsubStatus();
      unsubEvents();
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (supabaseChannel) {
        supabase.removeChannel(supabaseChannel);
      }
      clearInterval(pollInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('focus', handleFocus);
    };
  }, [tenantId, triggerSync]);

  return {
    status,
    lastSyncTime,
    isConnected: status === 'connected' || status === 'fallback_sse',
  };
}

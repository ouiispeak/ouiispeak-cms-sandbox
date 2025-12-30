/**
 * Hook to fetch slide type configuration
 * 
 * Fetches the configuration for a given slide type from the database.
 * Uses React Query or SWR pattern for caching and revalidation.
 * 
 * Usage:
 *   const { config, loading, error } = useSlideTypeConfig("text-slide");
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getSlideTypeConfig } from "../../data/slideTypeConfigs";
import type { SlideTypeConfig } from "../../schemas/slideTypeConfig";
import { recordToConfig, type SlideTypeConfigRecord } from "../../schemas/slideTypeConfig";
import { supabase } from "../../supabase";

interface UseSlideTypeConfigResult {
  config: SlideTypeConfig | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * Hook to fetch and cache slide type configuration
 * 
 * @param typeKey - The slide type key (e.g., "text-slide", "ai-speak-student-repeat")
 * @returns Object with config, loading state, error, and reload function
 */
export function useSlideTypeConfig(typeKey: string | null | undefined): UseSlideTypeConfigResult {
  const [config, setConfig] = useState<SlideTypeConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadTrigger, setReloadTrigger] = useState<number>(0);

  // Debug: Track renders
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;
  console.log(`[RENDER] useSlideTypeConfig render #${renderCountRef.current} for typeKey: ${typeKey}`);

  const fetchConfig = useCallback((options?: { silent?: boolean }) => {
    // Don't fetch if typeKey is not provided
    if (!typeKey) {
      setLoading(false);
      setError("No slide type provided");
      return;
    }

    if (!options?.silent) {
      setLoading(true);
    }
    setError(null);

    // Fetch configuration
    getSlideTypeConfig(typeKey)
      .then((result) => {
        if (result.error) {
          setError(result.error);
          setConfig(null);
        } else {
          setConfig(result.data);
          setError(null);
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load configuration");
        setConfig(null);
      })
      .finally(() => {
        if (!options?.silent) {
          setLoading(false);
        }
      });
  }, [typeKey]);

  // Use ref to access latest fetchConfig without adding it to dependency arrays
  const fetchConfigRef = useRef(fetchConfig);
  useEffect(() => {
    fetchConfigRef.current = fetchConfig;
  }, [fetchConfig]);

  useEffect(() => {
    console.log(`[EFFECT] Fetch effect triggered - typeKey: ${typeKey}, reloadTrigger: ${reloadTrigger}`);
    // Reset state when typeKey changes
    setConfig(null);
    setError(null);
    fetchConfigRef.current();
  }, [typeKey, reloadTrigger]); // Removed fetchConfig from dependencies - use ref instead

  // Track subscription per typeKey - only clean up when typeKey actually changes
  const subscriptionRef = useRef<{ typeKey: string | null; channel: ReturnType<typeof supabase.channel> | null }>({
    typeKey: null,
    channel: null
  });

  useEffect(() => {
    if (!typeKey) {
      // Clean up if typeKey becomes null
      if (subscriptionRef.current.channel) {
        console.log(`[SUBSCRIPTION] Cleaning up subscription for ${subscriptionRef.current.typeKey} (typeKey became null)`);
        supabase.removeChannel(subscriptionRef.current.channel);
        subscriptionRef.current = { typeKey: null, channel: null };
      }
      return;
    }

    // Only create subscription if we don't already have one for this typeKey
    if (subscriptionRef.current.typeKey === typeKey && subscriptionRef.current.channel) {
      console.log(`[SUBSCRIPTION] Subscription already exists for ${typeKey}, skipping creation`);
      return;
    }

    // Clean up previous subscription if typeKey changed (handled here, not in cleanup function)
    if (subscriptionRef.current.channel && subscriptionRef.current.typeKey !== typeKey) {
      console.log(`[SUBSCRIPTION] Cleaning up old subscription for ${subscriptionRef.current.typeKey} (switching to ${typeKey})`);
      supabase.removeChannel(subscriptionRef.current.channel);
    }

    console.log(`[SUBSCRIPTION] Creating subscription for ${typeKey} at ${new Date().toISOString()}`);

    const channel = supabase
      .channel(`slide-type-configs:${typeKey}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "slide_type_configs",
          filter: `type_key=eq.${typeKey}`,
        },
        (payload) => {
          console.log(`[SUBSCRIPTION] Realtime event received for ${typeKey}:`, {
            eventType: payload.eventType,
            hasNew: !!payload.new,
            hasOld: !!payload.old,
            timestamp: new Date().toISOString()
          });

          if (payload.eventType === "DELETE") {
            setConfig(null);
            setError(`No configuration found for type "${typeKey}"`);
            return;
          }

          if (payload.new) {
            setConfig(recordToConfig(payload.new as SlideTypeConfigRecord));
            setError(null);
          } else {
            // Fallback: refetch directly if payload.new is missing
            // This shouldn't happen for UPDATE events, but handle it gracefully
            getSlideTypeConfig(typeKey)
              .then((result) => {
                if (result.data) {
                  setConfig(result.data);
                  setError(null);
                }
              })
              .catch(() => {
                // Silent fail - config might be fine, just refetch failed
              });
          }
        }
      )
      .subscribe((status) => {
        console.log(`[SUBSCRIPTION] Status for ${typeKey}:`, status, `at ${new Date().toISOString()}`);
      });

    subscriptionRef.current = { typeKey, channel };

    // Don't clean up in the return function - React Strict Mode will call it unnecessarily
    // Cleanup is handled at the start of the effect when typeKey changes
    return () => {
      // Only clean up if typeKey actually changed (check ref, not closure)
      if (subscriptionRef.current.typeKey !== typeKey) {
        console.log(`[SUBSCRIPTION] Cleaning up subscription for ${typeKey} (typeKey changed to ${subscriptionRef.current.typeKey})`);
        supabase.removeChannel(channel);
      } else {
        console.log(`[SUBSCRIPTION] Skipping cleanup for ${typeKey} (React Strict Mode - typeKey unchanged)`);
      }
    };
  }, [typeKey]); // Removed fetchConfig from dependencies - subscription should only recreate when typeKey changes

  useEffect(() => {
    if (!typeKey) return;

    const handleFocus = () => {
      fetchConfigRef.current({ silent: true });
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [typeKey]); // Removed fetchConfig from dependencies - use ref instead

  const reload = () => {
    setReloadTrigger(prev => prev + 1);
  };

  return { config, loading, error, reload };
}

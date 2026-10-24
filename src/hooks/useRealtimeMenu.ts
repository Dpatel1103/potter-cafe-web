"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured, fetchDbMenuItems } from "@/lib/supabaseClient";
import { DbMenuItem } from "@/types";
import { soundEffects } from "@/components/SoundEffects";

export type MenuRealtimeStatus =
  | "INITIALIZING"
  | "CONNECTING"
  | "SUBSCRIBED"
  | "ERROR"
  | "DISCONNECTED"
  | "FALLBACK_LOCAL";

interface UseRealtimeMenuOptions {
  onItemUpdated?: (item: DbMenuItem) => void;
}

export function useRealtimeMenu(options: UseRealtimeMenuOptions = {}) {
  const { onItemUpdated } = options;

  const [menuItems, setMenuItems] = useState<DbMenuItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<MenuRealtimeStatus>("INITIALIZING");

  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch initial menu items from Supabase
  const loadMenu = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setConnectionStatus("FALLBACK_LOCAL");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchDbMenuItems();
      if (data) {
        setMenuItems(data);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load menu items";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  // Realtime subscription to 'menu_items' table changes
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setConnectionStatus("FALLBACK_LOCAL");
      return;
    }

    setConnectionStatus("CONNECTING");

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel("espresso-patronum-menu-channel")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "menu_items",
        },
        (payload) => {
          const updatedItem = payload.new as DbMenuItem;

          setMenuItems((prev) =>
            prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
          );

          soundEffects.playWandClick();

          if (onItemUpdated) {
            onItemUpdated(updatedItem);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "menu_items",
        },
        (payload) => {
          const newItem = payload.new as DbMenuItem;
          setMenuItems((prev) => {
            if (prev.some((m) => m.id === newItem.id)) return prev;
            return [...prev, newItem];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "menu_items",
        },
        (payload) => {
          const deletedId = (payload.old as { id?: string })?.id;
          if (deletedId) {
            setMenuItems((prev) => prev.filter((m) => m.id !== deletedId));
          }
        }
      )
      .subscribe((status, subError) => {
        if (status === "SUBSCRIBED") {
          setConnectionStatus("SUBSCRIBED");
          setError(null);
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setConnectionStatus("ERROR");
          setError(subError?.message || "Realtime menu connection interrupted");

          if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = setTimeout(() => {
            loadMenu();
          }, 5000);
        } else if (status === "CLOSED") {
          setConnectionStatus("DISCONNECTED");
        }
      });

    channelRef.current = channel;

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [onItemUpdated, loadMenu]);

  return {
    menuItems,
    isLoading,
    error,
    connectionStatus,
    refreshMenu: loadMenu,
  };
}

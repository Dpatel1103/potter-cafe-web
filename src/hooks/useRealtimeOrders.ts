"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured, fetchDbOrders } from "@/lib/supabaseClient";
import { DbOrder } from "@/types";
import { soundEffects } from "@/components/SoundEffects";

export type RealtimeConnectionStatus =
  | "INITIALIZING"
  | "CONNECTING"
  | "SUBSCRIBED"
  | "ERROR"
  | "DISCONNECTED"
  | "FALLBACK_LOCAL";

interface UseRealtimeOrdersOptions {
  activeOrderId?: string | null;
  onOrderInserted?: (order: DbOrder) => void;
  onOrderUpdated?: (order: DbOrder) => void;
}

export function useRealtimeOrders(options: UseRealtimeOrdersOptions = {}) {
  const { activeOrderId, onOrderInserted, onOrderUpdated } = options;

  const [orders, setOrders] = useState<DbOrder[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<RealtimeConnectionStatus>("INITIALIZING");

  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load initial orders from Supabase (or fallback)
  const loadOrders = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setConnectionStatus("FALLBACK_LOCAL");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchDbOrders();
      if (data) {
        setOrders(data);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load orders";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Set up Supabase Realtime subscription
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setConnectionStatus("FALLBACK_LOCAL");
      return;
    }

    setConnectionStatus("CONNECTING");

    // Clean up any existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel("espresso-patronum-orders-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          const newOrder = payload.new as DbOrder;
          setOrders((prev) => {
            // Prevent duplicate insertions
            if (prev.some((o) => o.id === newOrder.id)) return prev;
            return [newOrder, ...prev];
          });

          // Play sound notification for staff
          soundEffects.playStaffChime();

          if (onOrderInserted) {
            onOrderInserted(newOrder);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          const updatedOrder = payload.new as DbOrder;

          setOrders((prev) =>
            prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
          );

          // If this order corresponds to the active customer's tracker
          if (activeOrderId && updatedOrder.id === activeOrderId) {
            if (updatedOrder.status === "Delivered") {
              soundEffects.playDeliveredFanfare();
            } else {
              soundEffects.playStaffChime();
            }
          }

          if (onOrderUpdated) {
            onOrderUpdated(updatedOrder);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          const deletedId = (payload.old as { id?: string })?.id;
          if (deletedId) {
            setOrders((prev) => prev.filter((o) => o.id !== deletedId));
          }
        }
      )
      .subscribe((status, subError) => {
        if (status === "SUBSCRIBED") {
          setConnectionStatus("SUBSCRIBED");
          setError(null);
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setConnectionStatus("ERROR");
          setError(subError?.message || "Realtime connection interrupted");

          // Schedule auto-reconnection attempt after 5 seconds
          if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = setTimeout(() => {
            loadOrders();
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
  }, [activeOrderId, onOrderInserted, onOrderUpdated, loadOrders]);

  // Derived active order for tracker
  const activeOrder = orders.find((o) => o.id === activeOrderId) || null;

  return {
    orders,
    activeOrder,
    isLoading,
    error,
    connectionStatus,
    refreshOrders: loadOrders,
  };
}

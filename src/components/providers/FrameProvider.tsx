"use client";

import { useEffect, useState, useCallback, createContext, useContext, ReactNode } from "react";
import sdk, { type Context, type FrameNotificationDetails } from "@farcaster/frame-sdk";
import { createStore } from "mipd";
import React from "react";
import { logEvent } from "../../lib/amplitude";

export interface FrameContextType {
  context: Context.FrameContext | undefined;
  notifications: FrameNotificationDetails[];
  addNotification: (notification: FrameNotificationDetails) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  isSDKLoaded: boolean;
  isConnected: boolean;
}

const FrameContext = createContext<FrameContextType | undefined>(undefined);

export function FrameProvider({ children }: { children: ReactNode }) {
  const [context, setContext] = useState<Context.FrameContext>();
  const [notifications, setNotifications] = useState<FrameNotificationDetails[]>([]);
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const addNotification = useCallback((notification: FrameNotificationDetails) => {
    setNotifications((prev) => [...prev, notification]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.token !== id));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    const initializeSDK = async () => {
      try {
        console.log('Initializing Frame SDK...');
        
        // Wait for the SDK to be ready
        await sdk.ready;
        console.log('Frame SDK ready');
        
        // Get the context
        const ctx = await sdk.context;
        console.log('Frame SDK context:', ctx);
        
        if (isMounted) {
          setContext(ctx);
          setIsSDKLoaded(true);
          setIsConnected(!!ctx?.user?.fid);
        }
      } catch (err) {
        console.error('Failed to initialize Frame SDK:', err);
      }
    };

    initializeSDK();

    const handleFrameAdded = (details: { notificationDetails?: FrameNotificationDetails }) => {
      if (details.notificationDetails) {
        addNotification(details.notificationDetails);
      }
    };

    const handleContextUpdate = (ctx: Context.FrameContext) => {
      console.log('Frame context updated:', ctx);
      if (isMounted) {
        setContext(ctx);
        setIsConnected(!!ctx?.user?.fid);
      }
    };

    sdk.on("frameAdded", handleFrameAdded);
    sdk.on("contextUpdate", handleContextUpdate);

    return () => {
      isMounted = false;
      sdk.off("frameAdded", handleFrameAdded);
      sdk.off("contextUpdate", handleContextUpdate);
    };
  }, [addNotification]);

  return (
    <FrameContext.Provider
      value={{
        context,
        notifications,
        addNotification,
        removeNotification,
        clearNotifications,
        isSDKLoaded,
        isConnected,
      }}
    >
      {children}
    </FrameContext.Provider>
  );
}

export function useFrame() {
  const context = useContext(FrameContext);
  if (context === undefined) {
    throw new Error("useFrame must be used within a FrameProvider");
  }
  return context;
} 
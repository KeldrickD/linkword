import * as amplitude from '@amplitude/analytics-browser';
import { APP_URL } from "./constants";

// Initialize Amplitude
if (process.env.NEXT_PUBLIC_ANALYTICS_ENABLED?.toLowerCase() === 'true' && process.env.NODE_ENV === "production") {
  amplitude.init('0c4fe46171b9bb8eca2ca61eb71f2e19', undefined, {
    defaultTracking: true,
  });
}

// Amplitude tracking -- only runs if configured via the CLI or in the .env file
export function logEvent(
  eventType: string, 
  eventProperties: Record<string, any> = {}, 
  deviceId: string | null = null
) {
  if (process.env.NEXT_PUBLIC_ANALYTICS_ENABLED?.toLowerCase() !== 'true' || process.env.NODE_ENV !== "production") {
    return;
  }

  amplitude.track(eventType, {
    ...eventProperties,
    ...(deviceId && { device_id: deviceId }),
    user_id: APP_URL,
  });
}
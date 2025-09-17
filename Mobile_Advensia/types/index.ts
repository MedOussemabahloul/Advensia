export interface GPSDevice {
  id: string;
  name: string;
  macAddress: string;
  latitude: number;
  longitude: number;
  temperature: number;
  temperatureThreshold: number;
  batteryLevel: number;
  lastUpdate: Date;
  status: 'online' | 'offline' | 'warning' | 'critical';
  isInGeofence: boolean;
}

export interface Geofence {
  id: string;
  name: string;
  center: {
    latitude: number;
    longitude: number;
  };
  radius: number;
  isActive: boolean;
  alertOnExit: boolean;
  alertOnEntry: boolean;
}

export interface Alert {
  id: string;
  deviceId: string;
  deviceName: string;
  type: 'temperature' | 'geofence' | 'battery' | 'offline';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  isRead: boolean;
  isResolved: boolean;
}

export interface AnalyticsData {
  totalDevices: number;
  activeDevices: number;
  offlineDevices: number;
  criticalAlerts: number;
  averageTemperature: number;
  devicesByStatus: {
    online: number;
    offline: number;
    warning: number;
    critical: number;
  };
  temperatureHistory: Array<{
    timestamp: Date;
    value: number;
    deviceId: string;
  }>;
}
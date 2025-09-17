import { GPSDevice, Geofence, Alert, AnalyticsData } from '@/types';

// Simulation de données pour la démonstration
const mockDevices: GPSDevice[] = [
  {
    id: '1',
    name: 'Capteur Zone A',
    macAddress: '00:1B:44:11:3A:B7',
    latitude: 48.8566,
    longitude: 2.3522,
    temperature: 23.5,
    temperatureThreshold: 25.0,
    batteryLevel: 85,
    lastUpdate: new Date(),
    status: 'online',
    isInGeofence: true,
  },
  {
    id: '2',
    name: 'Capteur Zone B',
    macAddress: '00:1B:44:11:3A:B8',
    latitude: 48.8576,
    longitude: 2.3532,
    temperature: 28.2,
    temperatureThreshold: 25.0,
    batteryLevel: 45,
    lastUpdate: new Date(),
    status: 'critical',
    isInGeofence: false,
  },
  {
    id: '3',
    name: 'Capteur Zone C',
    macAddress: '00:1B:44:11:3A:B9',
    latitude: 48.8556,
    longitude: 2.3512,
    temperature: 21.8,
    temperatureThreshold: 25.0,
    batteryLevel: 92,
    lastUpdate: new Date(),
    status: 'online',
    isInGeofence: true,
  },
  {
    id: '4',
    name: 'Capteur Zone D',
    macAddress: '00:1B:44:11:3A:C0',
    latitude: 48.8546,
    longitude: 2.3542,
    temperature: 19.5,
    temperatureThreshold: 25.0,
    batteryLevel: 68,
    lastUpdate: new Date(Date.now() - 300000), // 5 minutes ago
    status: 'offline',
    isInGeofence: true,
  },
];

const mockGeofences: Geofence[] = [
  {
    id: '1',
    name: 'Zone Sécurisée Principale',
    center: {
      latitude: 48.8566,
      longitude: 2.3522,
    },
    radius: 500,
    isActive: true,
    alertOnExit: true,
    alertOnEntry: false,
  },
];

const mockAlerts: Alert[] = [
  {
    id: '1',
    deviceId: '2',
    deviceName: 'Capteur Zone B',
    type: 'temperature',
    severity: 'critical',
    message: 'Température critique détectée: 28.2°C (seuil: 25.0°C)',
    timestamp: new Date(),
    isRead: false,
    isResolved: false,
  },
  {
    id: '2',
    deviceId: '2',
    deviceName: 'Capteur Zone B',
    type: 'geofence',
    severity: 'high',
    message: 'Périphérique sorti de la zone de sécurité',
    timestamp: new Date(Date.now() - 120000),
    isRead: false,
    isResolved: false,
  },
  {
    id: '3',
    deviceId: '4',
    deviceName: 'Capteur Zone D',
    type: 'offline',
    severity: 'medium',
    message: 'Périphérique hors ligne depuis 5 minutes',
    timestamp: new Date(Date.now() - 300000),
    isRead: true,
    isResolved: false,
  },
];

class RTLSService {
  private devices: GPSDevice[] = mockDevices;
  private geofences: Geofence[] = mockGeofences;
  private alerts: Alert[] = mockAlerts;

  // Devices
  async getDevices(): Promise<GPSDevice[]> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    return [...this.devices];
  }

  async getDevice(id: string): Promise<GPSDevice | null> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return this.devices.find(device => device.id === id) || null;
  }

  async updateDeviceThreshold(deviceId: string, threshold: number): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const device = this.devices.find(d => d.id === deviceId);
    if (device) {
      device.temperatureThreshold = threshold;
      return true;
    }
    return false;
  }

  // Geofences
  async getGeofences(): Promise<Geofence[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return [...this.geofences];
  }

  async updateGeofence(geofence: Geofence): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const index = this.geofences.findIndex(g => g.id === geofence.id);
    if (index !== -1) {
      this.geofences[index] = geofence;
      return true;
    }
    return false;
  }

  // Alerts
  async getAlerts(): Promise<Alert[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return [...this.alerts].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async markAlertAsRead(alertId: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.isRead = true;
      return true;
    }
    return false;
  }

  async resolveAlert(alertId: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.isResolved = true;
      alert.isRead = true;
      return true;
    }
    return false;
  }

  // Analytics
  async getAnalytics(): Promise<AnalyticsData> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const totalDevices = this.devices.length;
    const activeDevices = this.devices.filter(d => d.status === 'online').length;
    const offlineDevices = this.devices.filter(d => d.status === 'offline').length;
    const criticalAlerts = this.alerts.filter(a => !a.isResolved && a.severity === 'critical').length;
    
    const averageTemperature = this.devices.reduce((sum, d) => sum + d.temperature, 0) / totalDevices;
    
    const devicesByStatus = {
      online: this.devices.filter(d => d.status === 'online').length,
      offline: this.devices.filter(d => d.status === 'offline').length,
      warning: this.devices.filter(d => d.status === 'warning').length,
      critical: this.devices.filter(d => d.status === 'critical').length,
    };

    const temperatureHistory = this.devices.flatMap(device => 
      Array.from({ length: 10 }, (_, i) => ({
        timestamp: new Date(Date.now() - i * 3600000), // Every hour for last 10 hours
        value: device.temperature + (Math.random() - 0.5) * 4,
        deviceId: device.id,
      }))
    );

    return {
      totalDevices,
      activeDevices,
      offlineDevices,
      criticalAlerts,
      averageTemperature,
      devicesByStatus,
      temperatureHistory,
    };
  }

  // Simulate real-time updates
  startRealtimeUpdates(callback: (devices: GPSDevice[]) => void) {
    const interval = setInterval(() => {
      // Simulate temperature fluctuations
      this.devices.forEach(device => {
        if (device.status === 'online' || device.status === 'critical') {
          device.temperature += (Math.random() - 0.5) * 2;
          device.temperature = Math.max(15, Math.min(35, device.temperature));
          
          // Update status based on temperature
          if (device.temperature > device.temperatureThreshold) {
            device.status = 'critical';
          } else if (device.temperature > device.temperatureThreshold - 2) {
            device.status = 'warning';
          } else {
            device.status = 'online';
          }
        }
      });
      
      callback([...this.devices]);
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }
}

export const rtlsService = new RTLSService();
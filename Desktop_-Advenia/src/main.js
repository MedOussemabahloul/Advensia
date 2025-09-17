const { app, BrowserWindow, Menu, ipcMain, dialog, shell, Notification } = require('electron');
const path = require('path');

let mainWindow;

// Configuration de l'application
const APP_CONFIG = {
  width: 1600,
  height: 1000,
  minWidth: 1400,
  minHeight: 800
};

// Données simulées pour les capteurs GPS
let gpsDevices = [
  {
    id: '1',
    name: 'Capteur Bureau Principal',
    macAddress: '00:1B:44:11:3A:B7',
    latitude: 52.5200,
    longitude: 13.4050,
    temperature: 22.5,
    temperatureThreshold: 25.0,
    status: 'online',
    lastUpdate: new Date().toISOString(),
    batteryLevel: 85,
    signalStrength: -45,
    zone: 'Zone A',
    firmware: '2.1.3'
  },
  {
    id: '2',
    name: 'Capteur Entrepôt Nord',
    macAddress: '00:1B:44:11:3A:B8',
    latitude: 52.5300,
    longitude: 13.3900,
    temperature: 28.3,
    temperatureThreshold: 25.0,
    status: 'critical',
    lastUpdate: new Date().toISOString(),
    batteryLevel: 62,
    signalStrength: -52,
    zone: 'Zone B',
    firmware: '2.1.3'
  },
  {
    id: '3',
    name: 'Capteur Parking Ouest',
    macAddress: '00:1B:44:11:3A:B9',
    latitude: 52.5150,
    longitude: 13.4100,
    temperature: 19.8,
    temperatureThreshold: 25.0,
    status: 'online',
    lastUpdate: new Date().toISOString(),
    batteryLevel: 91,
    signalStrength: -38,
    zone: 'Zone A',
    firmware: '2.1.2'
  },
  {
    id: '4',
    name: 'Capteur Salle Serveur',
    macAddress: '00:1B:44:11:3A:C0',
    latitude: 52.5250,
    longitude: 13.4200,
    temperature: 16.2,
    temperatureThreshold: 20.0,
    status: 'offline',
    lastUpdate: new Date(Date.now() - 300000).toISOString(),
    batteryLevel: 0,
    signalStrength: 0,
    zone: 'Zone C',
    firmware: '2.0.8'
  },
  {
    id: '5',
    name: 'Capteur Production Est',
    macAddress: '00:1B:44:11:3A:C1',
    latitude: 52.5180,
    longitude: 13.4250,
    temperature: 24.1,
    temperatureThreshold: 30.0,
    status: 'online',
    lastUpdate: new Date().toISOString(),
    batteryLevel: 76,
    signalStrength: -41,
    zone: 'Zone B',
    firmware: '2.1.3'
  }
];

// Données simulées pour les zones de sécurité
let geofences = [
  {
    id: '1',
    name: 'Zone Sécurisée A',
    centerLat: 52.5200,
    centerLng: 13.4050,
    radius: 500,
    alertOnEntry: true,
    alertOnExit: true,
    isActive: true,
    color: '#0066CC',
    description: 'Zone principale avec accès contrôlé'
  },
  {
    id: '2',
    name: 'Périmètre Entrepôt B',
    centerLat: 52.5300,
    centerLng: 13.3900,
    radius: 300,
    alertOnEntry: false,
    alertOnExit: true,
    isActive: true,
    color: '#FF6B35',
    description: 'Zone de stockage sensible'
  },
  {
    id: '3',
    name: 'Zone Critique C',
    centerLat: 52.5250,
    centerLng: 13.4200,
    radius: 200,
    alertOnEntry: true,
    alertOnExit: true,
    isActive: false,
    color: '#E74C3C',
    description: 'Accès restreint - Salle serveur'
  }
];

// Données simulées pour les alertes
let alerts = [
  {
    id: '1',
    deviceId: '2',
    deviceName: 'Capteur Entrepôt Nord',
    type: 'temperature',
    severity: 'critical',
    message: 'Température critique détectée (28.3°C)',
    timestamp: new Date().toISOString(),
    status: 'active',
    zone: 'Zone B'
  },
  {
    id: '2',
    deviceId: '4',
    deviceName: 'Capteur Salle Serveur',
    type: 'offline',
    severity: 'high',
    message: 'Périphérique hors ligne depuis 5 minutes',
    timestamp: new Date(Date.now() - 300000).toISOString(),
    status: 'active',
    zone: 'Zone C'
  },
  {
    id: '3',
    deviceId: '1',
    deviceName: 'Capteur Bureau Principal',
    type: 'battery',
    severity: 'medium',
    message: 'Niveau de batterie faible (15%)',
    timestamp: new Date(Date.now() - 600000).toISOString(),
    status: 'resolved',
    zone: 'Zone A'
  }
];

// Paramètres système
let systemSettings = {
  temperatureUnit: 'celsius',
  defaultTemperatureThreshold: 25.0,
  updateInterval: 30,
  alertRetention: 30,
  enableSoundAlerts: true,
  enableDesktopNotifications: true,
  mapProvider: 'openstreetmap',
  language: 'fr'
};

// Statistiques système
let systemStats = {
  totalDevices: 5,
  onlineDevices: 3,
  criticalDevices: 1,
  offlineDevices: 1,
  totalAlerts: 3,
  activeAlerts: 2,
  resolvedAlerts: 1,
  averageTemperature: 22.2,
  systemUptime: '15 jours 8h 32min'
};

function createWindow() {
  mainWindow = new BrowserWindow({
    width: APP_CONFIG.width,
    height: APP_CONFIG.height,
    minWidth: APP_CONFIG.minWidth,
    minHeight: APP_CONFIG.minHeight,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    icon: path.join(__dirname, '../assets/icon.png'),
    title: 'RTLS Advensia Desktop - Interface Administrateur',
    show: false,
    titleBarStyle: 'default'
  });

  mainWindow.loadFile('src/renderer/index.html');

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Affichage d'une notification de bienvenue
    if (Notification.isSupported()) {
      new Notification({
        title: 'RTLS Advensia Desktop',
        body: 'Interface administrateur initialisée avec succès'
      }).show();
    }
  });

  // Menu de l'application
  const template = [
    {
      label: 'Fichier',
      submenu: [
        {
          label: 'Nouveau capteur',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu-action', 'new-device');
          }
        },
        {
          label: 'Importer configuration',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ['openFile'],
              filters: [{ name: 'JSON', extensions: ['json'] }]
            });
            if (!result.canceled) {
              mainWindow.webContents.send('menu-action', 'import-config', result.filePaths[0]);
            }
          }
        },
        {
          label: 'Exporter configuration',
          click: async () => {
            const result = await dialog.showSaveDialog(mainWindow, {
              filters: [{ name: 'JSON', extensions: ['json'] }]
            });
            if (!result.canceled) {
              mainWindow.webContents.send('menu-action', 'export-config', result.filePath);
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Quitter',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Affichage',
      submenu: [
        {
          label: 'Actualiser',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow.webContents.send('menu-action', 'refresh');
          }
        },
        {
          label: 'Plein écran',
          accelerator: 'F11',
          click: () => {
            mainWindow.setFullScreen(!mainWindow.isFullScreen());
          }
        },
        { type: 'separator' },
        {
          label: 'Outils de développement',
          accelerator: 'F12',
          click: () => {
            mainWindow.webContents.toggleDevTools();
          }
        }
      ]
    },
    {
      label: 'Aide',
      submenu: [
        {
          label: 'Documentation',
          click: () => {
            shell.openExternal('https://advensia.de/documentation');
          }
        },
        {
          label: 'Support technique',
          click: () => {
            shell.openExternal('https://advensia.de/support');
          }
        },
        { type: 'separator' },
        {
          label: 'À propos',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'À propos',
              message: 'RTLS Advensia Desktop',
              detail: 'Interface Administrateur v1.0.0\n© 2025 Advensia\nhttps://advensia.de'
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Handlers IPC pour les données
ipcMain.handle('get-gps-devices', () => {
  return gpsDevices;
});

ipcMain.handle('get-device-by-id', (event, id) => {
  return gpsDevices.find(device => device.id === id);
});

ipcMain.handle('create-device', (event, deviceData) => {
  const newDevice = {
    id: Date.now().toString(),
    ...deviceData,
    status: 'online',
    lastUpdate: new Date().toISOString(),
    batteryLevel: 100,
    signalStrength: -40,
    firmware: '2.1.3'
  };
  gpsDevices.push(newDevice);
  
  // Notification de création
  if (Notification.isSupported()) {
    new Notification({
      title: 'Nouveau capteur ajouté',
      body: `${newDevice.name} a été ajouté avec succès`
    }).show();
  }
  
  return newDevice;
});

ipcMain.handle('update-device', (event, id, updates) => {
  const deviceIndex = gpsDevices.findIndex(device => device.id === id);
  if (deviceIndex !== -1) {
    gpsDevices[deviceIndex] = {
      ...gpsDevices[deviceIndex],
      ...updates,
      lastUpdate: new Date().toISOString()
    };
    
    // Notification de mise à jour
    if (Notification.isSupported()) {
      new Notification({
        title: 'Capteur mis à jour',
        body: `${gpsDevices[deviceIndex].name} a été modifié`
      }).show();
    }
    
    return gpsDevices[deviceIndex];
  }
  return null;
});

ipcMain.handle('delete-device', (event, id) => {
  const deviceIndex = gpsDevices.findIndex(device => device.id === id);
  if (deviceIndex !== -1) {
    const deletedDevice = gpsDevices.splice(deviceIndex, 1)[0];
    
    // Notification de suppression
    if (Notification.isSupported()) {
      new Notification({
        title: 'Capteur supprimé',
        body: `${deletedDevice.name} a été supprimé`
      }).show();
    }
    
    return true;
  }
  return false;
});

// Handlers pour les zones de sécurité
ipcMain.handle('get-geofences', () => {
  return geofences;
});

ipcMain.handle('create-geofence', (event, geofenceData) => {
  const newGeofence = {
    id: Date.now().toString(),
    ...geofenceData
  };
  geofences.push(newGeofence);
  return newGeofence;
});

ipcMain.handle('update-geofence', (event, id, updates) => {
  const geofenceIndex = geofences.findIndex(geofence => geofence.id === id);
  if (geofenceIndex !== -1) {
    geofences[geofenceIndex] = { ...geofences[geofenceIndex], ...updates };
    return geofences[geofenceIndex];
  }
  return null;
});

ipcMain.handle('delete-geofence', (event, id) => {
  const geofenceIndex = geofences.findIndex(geofence => geofence.id === id);
  if (geofenceIndex !== -1) {
    geofences.splice(geofenceIndex, 1);
    return true;
  }
  return false;
});

// Handlers pour les alertes
ipcMain.handle('get-alerts', () => {
  return alerts;
});

ipcMain.handle('resolve-alert', (event, id) => {
  const alertIndex = alerts.findIndex(alert => alert.id === id);
  if (alertIndex !== -1) {
    alerts[alertIndex].status = 'resolved';
    return alerts[alertIndex];
  }
  return null;
});

ipcMain.handle('delete-alert', (event, id) => {
  const alertIndex = alerts.findIndex(alert => alert.id === id);
  if (alertIndex !== -1) {
    alerts.splice(alertIndex, 1);
    return true;
  }
  return false;
});

// Handlers pour les paramètres système
ipcMain.handle('get-system-settings', () => {
  return systemSettings;
});

ipcMain.handle('update-system-settings', (event, updates) => {
  systemSettings = { ...systemSettings, ...updates };
  return systemSettings;
});

// Handler pour les statistiques
ipcMain.handle('get-system-stats', () => {
  // Calcul en temps réel des statistiques
  const online = gpsDevices.filter(d => d.status === 'online').length;
  const critical = gpsDevices.filter(d => d.status === 'critical').length;
  const offline = gpsDevices.filter(d => d.status === 'offline').length;
  const activeAlerts = alerts.filter(a => a.status === 'active').length;
  const resolvedAlerts = alerts.filter(a => a.status === 'resolved').length;
  const avgTemp = gpsDevices.reduce((sum, d) => sum + d.temperature, 0) / gpsDevices.length;
  
  return {
    ...systemStats,
    totalDevices: gpsDevices.length,
    onlineDevices: online,
    criticalDevices: critical,
    offlineDevices: offline,
    totalAlerts: alerts.length,
    activeAlerts,
    resolvedAlerts,
    averageTemperature: Math.round(avgTemp * 10) / 10
  };
});

// Simulation des mises à jour en temps réel
setInterval(() => {
  // Simulation de changements de température et statuts
  gpsDevices.forEach(device => {
    if (device.status !== 'offline') {
      // Variation aléatoire de température (±0.5°C)
      const tempVariation = (Math.random() - 0.5) * 1.0;
      device.temperature = Math.max(0, device.temperature + tempVariation);
      device.temperature = Math.round(device.temperature * 10) / 10;
      
      // Mise à jour du statut basé sur la température
      if (device.temperature > device.temperatureThreshold) {
        if (device.status !== 'critical') {
          device.status = 'critical';
          // Créer une nouvelle alerte
          const newAlert = {
            id: Date.now().toString(),
            deviceId: device.id,
            deviceName: device.name,
            type: 'temperature',
            severity: 'critical',
            message: `Température critique détectée (${device.temperature}°C)`,
            timestamp: new Date().toISOString(),
            status: 'active',
            zone: device.zone
          };
          alerts.unshift(newAlert);
          
          // Notification push
          if (Notification.isSupported() && systemSettings.enableDesktopNotifications) {
            new Notification({
              title: 'Alerte Critique',
              body: newAlert.message
            }).show();
          }
        }
      } else {
        if (device.status === 'critical') {
          device.status = 'online';
        }
      }
      
      device.lastUpdate = new Date().toISOString();
      
      // Variation du niveau de batterie
      if (Math.random() < 0.1) { // 10% de chance
        device.batteryLevel = Math.max(0, device.batteryLevel - 1);
      }
    }
  });
  
  // Envoyer les mises à jour au renderer
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('data-updated', {
      devices: gpsDevices,
      alerts: alerts
    });
  }
}, 10000); // Mise à jour toutes les 10 secondes

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
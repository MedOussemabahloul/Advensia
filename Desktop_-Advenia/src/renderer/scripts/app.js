const { ipcRenderer } = require('electron');

// Variables globales
let map;
let geofenceMap;
let markers = [];
let geofenceLayer;
let selectedDevice = null;
let allDevices = [];
let allGeofences = [];
let allAlerts = [];
let filteredDevices = [];
let currentPage = 1;
const itemsPerPage = 10;

// Configuration des cartes
const mapConfig = {
  center: [52.5200, 13.4050], // Berlin, Allemagne
  zoom: 12,
  maxZoom: 18
};

// État de l'application
const appState = {
  showDevices: true,
  showGeofences: true,
  showLabels: true,
  currentSection: 'dashboard'
};

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Initialisation de l\'application RTLS Advensia');
  
  try {
    await initializeApp();
    setupEventListeners();
    await loadInitialData();
    
    console.log('✅ Application initialisée avec succès');
    showToast('Application initialisée avec succès', 'success');
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    showToast('Erreur lors de l\'initialisation de l\'application', 'error');
  }
});

// Initialisation de l'application
async function initializeApp() {
  // Initialiser les cartes
  await initializeMaps();
  
  // Charger les paramètres système
  await loadSystemSettings();
  
  // Mettre en place les mises à jour temps réel
  setupRealTimeUpdates();
  
  // Initialiser les graphiques
  initializeCharts();
}

// Initialisation des cartes
async function initializeMaps() {
  try {
    // Carte principale du dashboard
    map = L.map('map').setView(mapConfig.center, mapConfig.zoom);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: mapConfig.maxZoom
    }).addTo(map);
    
    // Carte des geofences
    if (document.getElementById('geofence-map')) {
      geofenceMap = L.map('geofence-map').setView(mapConfig.center, mapConfig.zoom);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: mapConfig.maxZoom
      }).addTo(geofenceMap);
    }
    
    console.log('✅ Cartes initialisées');
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation des cartes:', error);
    throw error;
  }
}

// Chargement des données initiales
async function loadInitialData() {
  showLoading(true);
  
  try {
    // Charger les données depuis le main process
    allDevices = await ipcRenderer.invoke('get-gps-devices');
    allGeofences = await ipcRenderer.invoke('get-geofences');
    allAlerts = await ipcRenderer.invoke('get-alerts');
    
    console.log('📊 Données chargées:', {
      devices: allDevices.length,
      geofences: allGeofences.length,
      alerts: allAlerts.length
    });
    
    // Mettre à jour l'interface
    await updateDashboard();
    await updateDevicesTable();
    await updateGeofencesList();
    await updateAlertsView();
    await updateAnalytics();
    
    // Initialiser la carte avec les données
    updateMapMarkers();
    updateGeofenceMap();
    
  } catch (error) {
    console.error('❌ Erreur lors du chargement des données:', error);
    showToast('Erreur lors du chargement des données', 'error');
  } finally {
    showLoading(false);
  }
}

// Configuration des écouteurs d'événements
function setupEventListeners() {
  // Navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => handleNavigation(item.dataset.section));
  });
  
  // Actions du header
  document.getElementById('refresh-btn')?.addEventListener('click', refreshData);
  document.getElementById('notifications-btn')?.addEventListener('click', toggleNotifications);
  
  // Contrôles de la carte
  document.getElementById('toggle-devices')?.addEventListener('click', () => toggleMapLayer('devices'));
  document.getElementById('toggle-zones')?.addEventListener('click', () => toggleMapLayer('zones'));
  document.getElementById('center-map')?.addEventListener('click', centerMap);
  
  // Gestion des capteurs
  document.getElementById('add-device-btn')?.addEventListener('click', () => openDeviceModal());
  document.getElementById('device-form')?.addEventListener('submit', handleDeviceSubmit);
  document.getElementById('device-search')?.addEventListener('input', handleDeviceSearch);
  document.getElementById('status-filter')?.addEventListener('change', handleDeviceFilter);
  document.getElementById('zone-filter')?.addEventListener('change', handleDeviceFilter);
  
  // Gestion des geofences
  document.getElementById('add-geofence-btn')?.addEventListener('click', () => openGeofenceModal());
  document.getElementById('geofence-form')?.addEventListener('submit', handleGeofenceSubmit);
  
  // Gestion des alertes
  document.getElementById('alert-severity-filter')?.addEventListener('change', handleAlertFilter);
  document.getElementById('alert-status-filter')?.addEventListener('change', handleAlertFilter);
  document.getElementById('clear-resolved-alerts')?.addEventListener('click', clearResolvedAlerts);
  
  // Analytics
  document.getElementById('analytics-period')?.addEventListener('change', updateAnalytics);
  document.getElementById('export-report')?.addEventListener('click', exportReport);
  
  // Paramètres
  document.getElementById('save-settings')?.addEventListener('click', saveSettings);
  
  // Modals
  document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', (e) => closeModal(e.target.dataset.modal));
  });
  
  document.querySelectorAll('[data-modal]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-secondary')) {
        closeModal(e.target.dataset.modal);
      }
    });
  });
  
  // Liens de navigation internes
  document.querySelectorAll('[data-section]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      handleNavigation(e.target.dataset.section);
    });
  });
  
  // Écouter les mises à jour depuis le main process
  ipcRenderer.on('data-updated', (event, data) => {
    console.log('🔄 Données mises à jour depuis le main process');
    allDevices = data.devices;
    allAlerts = data.alerts;
    updateDashboard();
    updateMapMarkers();
    updateDevicesTable();
    updateAlertsView();
  });
  
  // Écouter les actions du menu
  ipcRenderer.on('menu-action', (event, action, ...args) => {
    handleMenuAction(action, ...args);
  });
}

// Gestion de la navigation
function handleNavigation(section) {
  // Mettre à jour la navigation active
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  document.querySelector(`[data-section="${section}"]`).classList.add('active');
  
  // Afficher la section correspondante
  document.querySelectorAll('.content-section').forEach(sec => {
    sec.classList.remove('active');
  });
  document.getElementById(`${section}-section`).classList.add('active');
  
  // Mettre à jour le titre et le breadcrumb
  updatePageHeader(section);
  
  // Actions spécifiques par section
  switch (section) {
    case 'dashboard':
      updateDashboard();
      break;
    case 'devices':
      updateDevicesTable();
      break;
    case 'geofences':
      updateGeofencesList();
      updateGeofenceMap();
      break;
    case 'alerts':
      updateAlertsView();
      break;
    case 'analytics':
      updateAnalytics();
      break;
    case 'settings':
      loadSettingsForm();
      break;
  }
  
  appState.currentSection = section;
}

// Mise à jour du header de page
function updatePageHeader(section) {
  const titles = {
    dashboard: 'Dashboard',
    devices: 'Gestion des Capteurs GPS',
    geofences: 'Zones de Sécurité',
    alerts: 'Gestion des Alertes',
    analytics: 'Analytics et Rapports',
    settings: 'Paramètres Système'
  };
  
  const breadcrumbs = {
    dashboard: 'Aperçu général du système',
    devices: 'Configuration et monitoring des capteurs',
    geofences: 'Gestion des zones de sécurité (geofencing)',
    alerts: 'Surveillance et résolution des incidents',
    analytics: 'Analyse des performances et tendances',
    settings: 'Configuration des paramètres système'
  };
  
  document.getElementById('page-title').textContent = titles[section];
  document.getElementById('breadcrumb-text').textContent = breadcrumbs[section];
}

// Mise à jour du dashboard
async function updateDashboard() {
  try {
    const stats = await ipcRenderer.invoke('get-system-stats');
    
    // Mettre à jour les cartes de statistiques
    document.getElementById('total-devices').textContent = stats.totalDevices;
    document.getElementById('online-devices').textContent = stats.onlineDevices;
    document.getElementById('critical-devices').textContent = stats.criticalDevices;
    document.getElementById('offline-devices').textContent = stats.offlineDevices;
    
    // Mettre à jour le badge des alertes
    const alertBadge = document.getElementById('alert-badge');
    if (alertBadge) {
      alertBadge.textContent = stats.activeAlerts;
      alertBadge.style.display = stats.activeAlerts > 0 ? 'block' : 'none';
    }
    
    // Mettre à jour les alertes récentes
    updateRecentAlerts();
    
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour du dashboard:', error);
    showToast('Erreur lors de la mise à jour du dashboard', 'error');
  }
}

// Mise à jour des marqueurs sur la carte
function updateMapMarkers() {
  if (!map) return;
  
  // Supprimer tous les marqueurs existants
  markers.forEach(marker => map.removeLayer(marker));
  markers = [];
  
  if (!appState.showDevices) return;
  
  // Ajouter les nouveaux marqueurs
  allDevices.forEach(device => {
    const marker = createDeviceMarker(device);
    if (marker) {
      markers.push(marker);
      marker.addTo(map);
    }
  });
  
  // Mettre à jour les geofences sur la carte
  updateMapGeofences();
}

// Création d'un marqueur de capteur
function createDeviceMarker(device) {
  try {
    const icon = createDeviceIcon(device.status);
    const marker = L.marker([device.latitude, device.longitude], { icon });
    
    // Popup avec informations du capteur
    const popupContent = `
      <div class="marker-popup">
        <div class="popup-header">
          <strong>${device.name}</strong>
          <span class="device-status ${device.status}">${getStatusText(device.status)}</span>
        </div>
        <div class="popup-content">
          <p><strong>MAC:</strong> ${device.macAddress}</p>
          <p><strong>Température:</strong> <span class="temperature ${device.temperature > device.temperatureThreshold ? 'critical' : 'normal'}">${device.temperature}°C</span></p>
          <p><strong>Zone:</strong> ${device.zone}</p>
          <p><strong>Batterie:</strong> ${device.batteryLevel}%</p>
          <p><strong>Signal:</strong> ${device.signalStrength} dBm</p>
          <div class="popup-actions">
            <button class="btn-xs btn-primary" onclick="selectDevice('${device.id}')">Détails</button>
            <button class="btn-xs btn-secondary" onclick="editDevice('${device.id}')">Modifier</button>
          </div>
        </div>
      </div>
    `;
    
    marker.bindPopup(popupContent);
    marker.on('click', () => selectDevice(device.id));
    
    return marker;
  } catch (error) {
    console.error('❌ Erreur lors de la création du marqueur:', error);
    return null;
  }
}

// Création d'une icône de capteur
function createDeviceIcon(status) {
  const colors = {
    online: '#10B981',
    critical: '#EF4444',
    offline: '#6B7280'
  };
  
  const color = colors[status] || colors.offline;
  
  return L.divIcon({
    html: `
      <div class="device-marker ${status}">
        <div class="marker-icon">
          <i class="fas fa-microchip"></i>
        </div>
      </div>
    `,
    className: 'custom-div-icon',
    iconSize: [30, 30],
    iconAnchor: [15, 30]
  });
}

// Sélection d'un capteur
function selectDevice(deviceId) {
  selectedDevice = allDevices.find(device => device.id === deviceId);
  if (selectedDevice) {
    displaySelectedDevice(selectedDevice);
    
    // Centrer la carte sur le capteur sélectionné
    if (map) {
      map.setView([selectedDevice.latitude, selectedDevice.longitude], 15);
    }
  }
}

// Affichage des détails du capteur sélectionné
function displaySelectedDevice(device) {
  const container = document.getElementById('selected-device-info');
  if (!container) return;
  
  container.innerHTML = `
    <div class="selected-device fade-in">
      <div class="device-header">
        <div class="device-name">${device.name}</div>
        <div class="device-status ${device.status}">${getStatusText(device.status)}</div>
      </div>
      <div class="device-details-grid">
        <div class="detail-item">
          <span class="detail-label">Adresse MAC</span>
          <span class="detail-value">${device.macAddress}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Zone</span>
          <span class="detail-value">${device.zone}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Température</span>
          <span class="detail-value temperature ${device.temperature > device.temperatureThreshold ? 'critical' : 'normal'}">
            ${device.temperature}°C
          </span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Seuil</span>
          <span class="detail-value">${device.temperatureThreshold}°C</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Batterie</span>
          <span class="detail-value">${device.batteryLevel}%</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Signal</span>
          <span class="detail-value">${device.signalStrength} dBm</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Firmware</span>
          <span class="detail-value">${device.firmware}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Dernière Mise à Jour</span>
          <span class="detail-value">${formatTimestamp(device.lastUpdate)}</span>
        </div>
      </div>
      <div class="device-actions" style="margin-top: 1rem; display: flex; gap: 0.5rem;">
        <button class="btn-sm btn-primary" onclick="editDevice('${device.id}')">
          <i class="fas fa-edit"></i> Modifier
        </button>
        <button class="btn-sm btn-secondary" onclick="showDeviceHistory('${device.id}')">
          <i class="fas fa-history"></i> Historique
        </button>
      </div>
    </div>
  `;
}

// Mise à jour des alertes récentes
function updateRecentAlerts() {
  const container = document.getElementById('recent-alerts');
  if (!container) return;
  
  const recentAlerts = allAlerts
    .filter(alert => alert.status === 'active')
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 5);
    
  if (recentAlerts.length === 0) {
    container.innerHTML = `
      <div class="no-alerts">
        <i class="fas fa-check-circle"></i>
        <p>Aucune alerte active</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = recentAlerts.map(alert => `
    <div class="alert-item">
      <div class="alert-icon ${alert.severity}">
        <i class="fas fa-${getAlertIcon(alert.type)}"></i>
      </div>
      <div class="alert-content">
        <div class="alert-message">${alert.message}</div>
        <div class="alert-meta">
          <span>${alert.deviceName}</span>
          <span>${alert.zone}</span>
          <span>${formatTimestamp(alert.timestamp)}</span>
        </div>
      </div>
      <div class="alert-actions">
        <button class="btn-xs btn-primary" onclick="goToDevice('${alert.deviceId}')">Voir</button>
        <button class="btn-xs btn-secondary" onclick="resolveAlert('${alert.id}')">Résoudre</button>
      </div>
    </div>
  `).join('');
}

// Mise à jour du tableau des capteurs
function updateDevicesTable() {
  filteredDevices = [...allDevices];
  applyDeviceFilters();
  renderDevicesTable();
  updateDevicesPagination();
}

// Application des filtres des capteurs
function applyDeviceFilters() {
  const searchTerm = document.getElementById('device-search')?.value.toLowerCase() || '';
  const statusFilter = document.getElementById('status-filter')?.value || '';
  const zoneFilter = document.getElementById('zone-filter')?.value || '';
  
  filteredDevices = allDevices.filter(device => {
    const matchesSearch = device.name.toLowerCase().includes(searchTerm) ||
                         device.macAddress.toLowerCase().includes(searchTerm);
    const matchesStatus = !statusFilter || device.status === statusFilter;
    const matchesZone = !zoneFilter || device.zone === zoneFilter;
    
    return matchesSearch && matchesStatus && matchesZone;
  });
}

// Rendu du tableau des capteurs
function renderDevicesTable() {
  const tbody = document.getElementById('devices-table-body');
  if (!tbody) return;
  
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pageDevices = filteredDevices.slice(startIndex, endIndex);
  
  tbody.innerHTML = pageDevices.map(device => `
    <tr>
      <td><input type="checkbox" class="device-checkbox" value="${device.id}"></td>
      <td>${device.name}</td>
      <td><code>${device.macAddress}</code></td>
      <td><span class="zone-badge">${device.zone}</span></td>
      <td>
        <span class="temperature ${device.temperature > device.temperatureThreshold ? 'critical' : 'normal'}">
          ${device.temperature}°C
        </span>
      </td>
      <td><span class="status-badge ${device.status}">${getStatusText(device.status)}</span></td>
      <td>
        <div class="battery-container">
          <div class="battery-bar">
            <div class="battery-fill ${getBatteryClass(device.batteryLevel)}" 
                 style="width: ${device.batteryLevel}%"></div>
          </div>
          <span class="battery-text">${device.batteryLevel}%</span>
        </div>
      </td>
      <td>
        <div class="signal-strength">
          ${generateSignalBars(device.signalStrength)}
          <span class="signal-text">${device.signalStrength} dBm</span>
        </div>
      </td>
      <td>${formatTimestamp(device.lastUpdate)}</td>
      <td>
        <div class="action-buttons">
          <button class="btn-table edit" onclick="editDevice('${device.id}')" title="Modifier">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-table" onclick="selectDevice('${device.id}')" title="Localiser">
            <i class="fas fa-map-marker-alt"></i>
          </button>
          <button class="btn-table delete" onclick="deleteDevice('${device.id}')" title="Supprimer">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

// Gestion des geofences
function updateGeofencesList() {
  const container = document.getElementById('geofences-container');
  if (!container) return;
  
  container.innerHTML = allGeofences.map(geofence => `
    <div class="geofence-card">
      <div class="geofence-header">
        <div>
          <div class="geofence-name">${geofence.name}</div>
          <div class="geofence-description">${geofence.description || 'Aucune description'}</div>
        </div>
        <div class="geofence-color" style="background-color: ${geofence.color}"></div>
      </div>
      <div class="geofence-details">
        <div class="detail-item">
          <span class="detail-label">Centre</span>
          <span class="detail-value">${geofence.centerLat.toFixed(4)}, ${geofence.centerLng.toFixed(4)}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Rayon</span>
          <span class="detail-value">${geofence.radius} m</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Alerte Entrée</span>
          <span class="detail-value">${geofence.alertOnEntry ? 'Oui' : 'Non'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Alerte Sortie</span>
          <span class="detail-value">${geofence.alertOnExit ? 'Oui' : 'Non'}</span>
        </div>
      </div>
      <div class="geofence-controls">
        <div class="geofence-toggle">
          <label class="switch">
            <input type="checkbox" ${geofence.isActive ? 'checked' : ''} 
                   onchange="toggleGeofence('${geofence.id}', this.checked)">
            <span class="slider"></span>
          </label>
          <span>Zone active</span>
        </div>
        <div class="geofence-actions">
          <button class="btn-sm btn-secondary" onclick="editGeofence('${geofence.id}')">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-sm btn-secondary" onclick="deleteGeofence('${geofence.id}')">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

// Mise à jour de la carte des geofences
function updateGeofenceMap() {
  if (!geofenceMap) return;
  
  // Supprimer les couches existantes
  if (geofenceLayer) {
    geofenceMap.removeLayer(geofenceLayer);
  }
  
  // Créer un nouveau groupe de couches
  geofenceLayer = L.layerGroup();
  
  // Ajouter les geofences actives
  allGeofences
    .filter(geofence => geofence.isActive && appState.showGeofences)
    .forEach(geofence => {
      const circle = L.circle([geofence.centerLat, geofence.centerLng], {
        radius: geofence.radius,
        color: geofence.color,
        fillColor: geofence.color,
        fillOpacity: 0.2,
        weight: 3
      });
      
      circle.bindPopup(`
        <div class="geofence-popup">
          <h4>${geofence.name}</h4>
          <p>${geofence.description || 'Aucune description'}</p>
          <p><strong>Rayon:</strong> ${geofence.radius} m</p>
          <p><strong>Alertes:</strong> 
            ${geofence.alertOnEntry ? 'Entrée' : ''}
            ${geofence.alertOnEntry && geofence.alertOnExit ? ', ' : ''}
            ${geofence.alertOnExit ? 'Sortie' : ''}
          </p>
        </div>
      `);
      
      geofenceLayer.addLayer(circle);
    });
  
  geofenceLayer.addTo(geofenceMap);
  
  // Ajouter les marqueurs des capteurs sur la carte des geofences
  allDevices.forEach(device => {
    const marker = createDeviceMarker(device);
    if (marker) {
      geofenceLayer.addLayer(marker);
    }
  });
}

// Mise à jour de la vue des alertes
function updateAlertsView() {
  const container = document.getElementById('alerts-container');
  if (!container) return;
  
  let filteredAlerts = [...allAlerts];
  
  // Appliquer les filtres
  const severityFilter = document.getElementById('alert-severity-filter')?.value;
  const statusFilter = document.getElementById('alert-status-filter')?.value;
  
  if (severityFilter) {
    filteredAlerts = filteredAlerts.filter(alert => alert.severity === severityFilter);
  }
  
  if (statusFilter) {
    filteredAlerts = filteredAlerts.filter(alert => alert.status === statusFilter);
  }
  
  // Trier par timestamp décroissant
  filteredAlerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  if (filteredAlerts.length === 0) {
    container.innerHTML = `
      <div class="no-alerts">
        <i class="fas fa-check-circle"></i>
        <p>Aucune alerte correspondant aux critères</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = filteredAlerts.map(alert => `
    <div class="alert-item ${alert.status}">
      <div class="alert-icon ${alert.severity}">
        <i class="fas fa-${getAlertIcon(alert.type)}"></i>
      </div>
      <div class="alert-content">
        <div class="alert-message">${alert.message}</div>
        <div class="alert-meta">
          <span><strong>Capteur:</strong> ${alert.deviceName}</span>
          <span><strong>Zone:</strong> ${alert.zone}</span>
          <span><strong>Heure:</strong> ${formatTimestamp(alert.timestamp)}</span>
          <span><strong>Sévérité:</strong> ${getSeverityText(alert.severity)}</span>
        </div>
      </div>
      <div class="alert-actions">
        ${alert.status === 'active' ? `
          <button class="btn-xs btn-primary" onclick="resolveAlert('${alert.id}')">
            <i class="fas fa-check"></i> Résoudre
          </button>
        ` : `
          <span class="resolved-badge">Résolue</span>
        `}
        <button class="btn-xs btn-secondary" onclick="goToDevice('${alert.deviceId}')">
          <i class="fas fa-map-marker-alt"></i> Localiser
        </button>
        <button class="btn-xs btn-secondary" onclick="deleteAlert('${alert.id}')">
          <i class="fas fa-trash"></i> Supprimer
        </button>
      </div>
    </div>
  `).join('');
}

// Initialisation des graphiques
function initializeCharts() {
  // Configuration par défaut pour Chart.js
  Chart.defaults.font.family = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  Chart.defaults.color = '#64748B';
  
  initializeStatusChart();
  initializeTemperatureChart();
  initializeUptimeChart();
}

// Graphique des statuts
function initializeStatusChart() {
  const ctx = document.getElementById('status-chart');
  if (!ctx) return;
  
  const statusCounts = allDevices.reduce((acc, device) => {
    acc[device.status] = (acc[device.status] || 0) + 1;
    return acc;
  }, {});
  
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['En Ligne', 'Critique', 'Hors Ligne'],
      datasets: [{
        data: [
          statusCounts.online || 0,
          statusCounts.critical || 0,
          statusCounts.offline || 0
        ],
        backgroundColor: ['#10B981', '#EF4444', '#6B7280'],
        borderWidth: 0,
        cutout: '60%'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            usePointStyle: true
          }
        }
      }
    }
  });
}

// Graphique des températures
function initializeTemperatureChart() {
  const ctx = document.getElementById('temperature-chart');
  if (!ctx) return;
  
  // Données simulées pour les dernières 24h
  const hours = Array.from({length: 24}, (_, i) => {
    const hour = new Date();
    hour.setHours(hour.getHours() - (23 - i));
    return hour.getHours() + 'h';
  });
  
  const deviceData = allDevices.map(device => ({
    label: device.name,
    data: Array.from({length: 24}, () => device.temperature + (Math.random() - 0.5) * 2),
    borderColor: device.status === 'critical' ? '#EF4444' : '#3B82F6',
    backgroundColor: device.status === 'critical' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
    fill: false,
    tension: 0.4
  }));
  
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: hours,
      datasets: deviceData.slice(0, 3) // Limiter à 3 capteurs pour la lisibilité
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: false,
          grid: {
            color: '#E2E8F0'
          },
          ticks: {
            callback: function(value) {
              return value + '°C';
            }
          }
        },
        x: {
          grid: {
            color: '#E2E8F0'
          }
        }
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            usePointStyle: true
          }
        }
      }
    }
  });
}

// Graphique de disponibilité
function initializeUptimeChart() {
  const ctx = document.getElementById('uptime-chart');
  if (!ctx) return;
  
  const days = Array.from({length: 7}, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toLocaleDateString('fr-FR', { weekday: 'short' });
  });
  
  // Données simulées de disponibilité
  const uptimeData = days.map(() => 95 + Math.random() * 5); // 95-100% de disponibilité
  
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: days,
      datasets: [{
        label: 'Disponibilité (%)',
        data: uptimeData,
        backgroundColor: '#10B981',
        borderRadius: 4,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: false,
          min: 90,
          max: 100,
          grid: {
            color: '#E2E8F0'
          },
          ticks: {
            callback: function(value) {
              return value + '%';
            }
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      },
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });
}

// Fonctions utilitaires
function getStatusText(status) {
  const statusTexts = {
    online: 'En Ligne',
    critical: 'Critique',
    offline: 'Hors Ligne'
  };
  return statusTexts[status] || 'Inconnu';
}

function getSeverityText(severity) {
  const severityTexts = {
    critical: 'Critique',
    high: 'Élevée',
    medium: 'Moyenne',
    low: 'Faible'
  };
  return severityTexts[severity] || 'Inconnue';
}

function getAlertIcon(type) {
  const icons = {
    temperature: 'thermometer-three-quarters',
    offline: 'power-off',
    battery: 'battery-quarter',
    signal: 'wifi',
    geofence: 'map-marker-alt'
  };
  return icons[type] || 'exclamation-triangle';
}

function getBatteryClass(level) {
  if (level > 70) return 'high';
  if (level > 30) return 'medium';
  return 'low';
}

function generateSignalBars(strength) {
  const bars = 4;
  const threshold = [-80, -70, -60, -50]; // Seuils de signal en dBm
  
  let html = '';
  for (let i = 0; i < bars; i++) {
    const active = strength >= threshold[i] ? 'active' : '';
    html += `<div class="signal-bar ${active}"></div>`;
  }
  
  return html;
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMinutes = Math.floor((now - date) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'À l\'instant';
  if (diffInMinutes < 60) return `Il y a ${diffInMinutes}min`;
  if (diffInMinutes < 1440) return `Il y a ${Math.floor(diffInMinutes / 60)}h`;
  
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Fonctions d'actions
async function refreshData() {
  console.log('🔄 Actualisation des données...');
  showToast('Actualisation des données...', 'info');
  await loadInitialData();
  showToast('Données actualisées avec succès', 'success');
}

function toggleNotifications() {
  // Implémentation des notifications
  showToast('Notifications activées', 'info');
}

function toggleMapLayer(layer) {
  if (layer === 'devices') {
    appState.showDevices = !appState.showDevices;
    updateMapMarkers();
  } else if (layer === 'zones') {
    appState.showGeofences = !appState.showGeofences;
    updateMapGeofences();
    updateGeofenceMap();
  }
}

function centerMap() {
  if (map && allDevices.length > 0) {
    const group = new L.featureGroup(markers);
    map.fitBounds(group.getBounds().pad(0.1));
  }
}

// Gestion des modals
function openDeviceModal(deviceId = null) {
  const modal = document.getElementById('device-modal');
  const title = document.getElementById('device-modal-title');
  const form = document.getElementById('device-form');
  
  if (deviceId) {
    // Mode édition
    const device = allDevices.find(d => d.id === deviceId);
    if (!device) return;
    
    title.textContent = 'Modifier le Capteur';
    document.getElementById('device-name').value = device.name;
    document.getElementById('device-mac').value = device.macAddress;
    document.getElementById('device-zone').value = device.zone;
    document.getElementById('device-threshold').value = device.temperatureThreshold;
    document.getElementById('device-latitude').value = device.latitude;
    document.getElementById('device-longitude').value = device.longitude;
    
    form.dataset.deviceId = deviceId;
  } else {
    // Mode création
    title.textContent = 'Ajouter un Capteur';
    form.reset();
    delete form.dataset.deviceId;
    
    // Valeurs par défaut
    document.getElementById('device-threshold').value = 25.0;
    document.getElementById('device-zone').value = 'Zone A';
    
    // Position par défaut (centre de la carte)
    if (map) {
      const center = map.getCenter();
      document.getElementById('device-latitude').value = center.lat.toFixed(6);
      document.getElementById('device-longitude').value = center.lng.toFixed(6);
    }
  }
  
  modal.classList.add('active');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
  }
}

function openGeofenceModal(geofenceId = null) {
  const modal = document.getElementById('geofence-modal');
  const title = document.getElementById('geofence-modal-title');
  const form = document.getElementById('geofence-form');
  
  if (geofenceId) {
    // Mode édition
    const geofence = allGeofences.find(g => g.id === geofenceId);
    if (!geofence) return;
    
    title.textContent = 'Modifier la Zone de Sécurité';
    document.getElementById('geofence-name').value = geofence.name;
    document.getElementById('geofence-description').value = geofence.description || '';
    document.getElementById('geofence-center-lat').value = geofence.centerLat;
    document.getElementById('geofence-center-lng').value = geofence.centerLng;
    document.getElementById('geofence-radius').value = geofence.radius;
    document.getElementById('geofence-color').value = geofence.color;
    document.getElementById('geofence-alert-entry').checked = geofence.alertOnEntry;
    document.getElementById('geofence-alert-exit').checked = geofence.alertOnExit;
    document.getElementById('geofence-active').checked = geofence.isActive;
    
    form.dataset.geofenceId = geofenceId;
  } else {
    // Mode création
    title.textContent = 'Créer une Zone de Sécurité';
    form.reset();
    delete form.dataset.geofenceId;
    
    // Valeurs par défaut
    document.getElementById('geofence-radius').value = 300;
    document.getElementById('geofence-color').value = '#0066CC';
    document.getElementById('geofence-active').checked = true;
    
    // Position par défaut (centre de la carte)
    if (map) {
      const center = map.getCenter();
      document.getElementById('geofence-center-lat').value = center.lat.toFixed(6);
      document.getElementById('geofence-center-lng').value = center.lng.toFixed(6);
    }
  }
  
  modal.classList.add('active');
}

// Gestionnaires d'événements
async function handleDeviceSubmit(e) {
  e.preventDefault();
  
  const form = e.target;
  const deviceId = form.dataset.deviceId;
  
  const deviceData = {
    name: document.getElementById('device-name').value,
    macAddress: document.getElementById('device-mac').value,
    zone: document.getElementById('device-zone').value,
    temperatureThreshold: parseFloat(document.getElementById('device-threshold').value),
    latitude: parseFloat(document.getElementById('device-latitude').value),
    longitude: parseFloat(document.getElementById('device-longitude').value),
    temperature: deviceId ? undefined : 20 + Math.random() * 10 // Température initiale aléatoire pour nouveaux capteurs
  };
  
  try {
    showLoading(true);
    
    if (deviceId) {
      // Mise à jour
      await ipcRenderer.invoke('update-device', deviceId, deviceData);
      showToast('Capteur mis à jour avec succès', 'success');
    } else {
      // Création
      await ipcRenderer.invoke('create-device', deviceData);
      showToast('Capteur créé avec succès', 'success');
    }
    
    // Recharger les données
    await loadInitialData();
    closeModal('device-modal');
    
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde du capteur:', error);
    showToast('Erreur lors de la sauvegarde du capteur', 'error');
  } finally {
    showLoading(false);
  }
}

async function handleGeofenceSubmit(e) {
  e.preventDefault();
  
  const form = e.target;
  const geofenceId = form.dataset.geofenceId;
  
  const geofenceData = {
    name: document.getElementById('geofence-name').value,
    description: document.getElementById('geofence-description').value,
    centerLat: parseFloat(document.getElementById('geofence-center-lat').value),
    centerLng: parseFloat(document.getElementById('geofence-center-lng').value),
    radius: parseInt(document.getElementById('geofence-radius').value),
    color: document.getElementById('geofence-color').value,
    alertOnEntry: document.getElementById('geofence-alert-entry').checked,
    alertOnExit: document.getElementById('geofence-alert-exit').checked,
    isActive: document.getElementById('geofence-active').checked
  };
  
  try {
    showLoading(true);
    
    if (geofenceId) {
      // Mise à jour
      await ipcRenderer.invoke('update-geofence', geofenceId, geofenceData);
      showToast('Zone de sécurité mise à jour avec succès', 'success');
    } else {
      // Création
      await ipcRenderer.invoke('create-geofence', geofenceData);
      showToast('Zone de sécurité créée avec succès', 'success');
    }
    
    // Recharger les données
    await loadInitialData();
    closeModal('geofence-modal');
    
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde de la zone:', error);
    showToast('Erreur lors de la sauvegarde de la zone', 'error');
  } finally {
    showLoading(false);
  }
}

function handleDeviceSearch() {
  updateDevicesTable();
}

function handleDeviceFilter() {
  currentPage = 1;
  updateDevicesTable();
}

function handleAlertFilter() {
  updateAlertsView();
}

// Actions sur les capteurs
async function editDevice(deviceId) {
  openDeviceModal(deviceId);
}

async function deleteDevice(deviceId) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce capteur ?')) return;
  
  try {
    showLoading(true);
    await ipcRenderer.invoke('delete-device', deviceId);
    await loadInitialData();
    showToast('Capteur supprimé avec succès', 'success');
  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error);
    showToast('Erreur lors de la suppression du capteur', 'error');
  } finally {
    showLoading(false);
  }
}

// Actions sur les geofences
async function editGeofence(geofenceId) {
  openGeofenceModal(geofenceId);
}

async function deleteGeofence(geofenceId) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cette zone de sécurité ?')) return;
  
  try {
    showLoading(true);
    await ipcRenderer.invoke('delete-geofence', geofenceId);
    await loadInitialData();
    showToast('Zone de sécurité supprimée avec succès', 'success');
  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error);
    showToast('Erreur lors de la suppression de la zone', 'error');
  } finally {
    showLoading(false);
  }
}

async function toggleGeofence(geofenceId, isActive) {
  try {
    await ipcRenderer.invoke('update-geofence', geofenceId, { isActive });
    await loadInitialData();
    showToast(`Zone ${isActive ? 'activée' : 'désactivée'} avec succès`, 'success');
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error);
    showToast('Erreur lors de la mise à jour de la zone', 'error');
  }
}

// Actions sur les alertes
async function resolveAlert(alertId) {
  try {
    await ipcRenderer.invoke('resolve-alert', alertId);
    await loadInitialData();
    showToast('Alerte résolue avec succès', 'success');
  } catch (error) {
    console.error('❌ Erreur lors de la résolution de l\'alerte:', error);
    showToast('Erreur lors de la résolution de l\'alerte', 'error');
  }
}

async function deleteAlert(alertId) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cette alerte ?')) return;
  
  try {
    await ipcRenderer.invoke('delete-alert', alertId);
    await loadInitialData();
    showToast('Alerte supprimée avec succès', 'success');
  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error);
    showToast('Erreur lors de la suppression de l\'alerte', 'error');
  }
}

async function clearResolvedAlerts() {
  if (!confirm('Êtes-vous sûr de vouloir supprimer toutes les alertes résolues ?')) return;
  
  try {
    showLoading(true);
    const resolvedAlerts = allAlerts.filter(alert => alert.status === 'resolved');
    
    for (const alert of resolvedAlerts) {
      await ipcRenderer.invoke('delete-alert', alert.id);
    }
    
    await loadInitialData();
    showToast('Alertes résolues supprimées avec succès', 'success');
  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error);
    showToast('Erreur lors de la suppression des alertes', 'error');
  } finally {
    showLoading(false);
  }
}

function goToDevice(deviceId) {
  handleNavigation('dashboard');
  setTimeout(() => {
    selectDevice(deviceId);
  }, 500);
}

// Analytics
function updateAnalytics() {
  // Mettre à jour les métriques affichées
  const stats = {
    totalDevices: allDevices.length,
    onlineDevices: allDevices.filter(d => d.status === 'online').length,
    criticalDevices: allDevices.filter(d => d.status === 'critical').length,
    offlineDevices: allDevices.filter(d => d.status === 'offline').length,
    totalAlerts: allAlerts.length,
    activeAlerts: allAlerts.filter(a => a.status === 'active').length,
    averageTemperature: allDevices.reduce((sum, d) => sum + d.temperature, 0) / allDevices.length
  };
  
  document.getElementById('avg-temperature').textContent = `${stats.averageTemperature.toFixed(1)}°C`;
  document.getElementById('total-alerts').textContent = stats.totalAlerts;
  document.getElementById('system-uptime').textContent = '15j 8h 32min';
  document.getElementById('availability-rate').textContent = '98.5%';
}

function exportReport() {
  const reportData = {
    timestamp: new Date().toISOString(),
    devices: allDevices,
    geofences: allGeofences,
    alerts: allAlerts,
    statistics: {
      totalDevices: allDevices.length,
      onlineDevices: allDevices.filter(d => d.status === 'online').length,
      criticalDevices: allDevices.filter(d => d.status === 'critical').length,
      offlineDevices: allDevices.filter(d => d.status === 'offline').length,
      activeAlerts: allAlerts.filter(a => a.status === 'active').length,
      averageTemperature: allDevices.reduce((sum, d) => sum + d.temperature, 0) / allDevices.length
    }
  };
  
  const reportHtml = generateReportHtml(reportData);
  const blob = new Blob([reportHtml], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `rtls-report-${new Date().toISOString().split('T')[0]}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showToast('Rapport exporté avec succès', 'success');
}

function generateReportHtml(data) {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <title>Rapport RTLS Advensia - ${new Date(data.timestamp).toLocaleDateString('fr-FR')}</title>
      <style>
        body { font-family: Inter, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        .table th, .table td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        .table th { background: #f8f9fa; }
        .status-online { color: #10B981; }
        .status-critical { color: #EF4444; }
        .status-offline { color: #6B7280; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Rapport RTLS Advensia</h1>
        <p>Généré le ${new Date(data.timestamp).toLocaleString('fr-FR')}</p>
      </div>
      
      <div class="stats">
        <div class="stat-card">
          <h3>${data.statistics.totalDevices}</h3>
          <p>Capteurs Total</p>
        </div>
        <div class="stat-card">
          <h3>${data.statistics.onlineDevices}</h3>
          <p>En Ligne</p>
        </div>
        <div class="stat-card">
          <h3>${data.statistics.criticalDevices}</h3>
          <p>Critiques</p>
        </div>
        <div class="stat-card">
          <h3>${data.statistics.activeAlerts}</h3>
          <p>Alertes Actives</p>
        </div>
      </div>
      
      <h2>Capteurs GPS</h2>
      <table class="table">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Adresse MAC</th>
            <th>Zone</th>
            <th>Température</th>
            <th>Statut</th>
            <th>Batterie</th>
          </tr>
        </thead>
        <tbody>
          ${data.devices.map(device => `
            <tr>
              <td>${device.name}</td>
              <td>${device.macAddress}</td>
              <td>${device.zone}</td>
              <td>${device.temperature}°C</td>
              <td class="status-${device.status}">${getStatusText(device.status)}</td>
              <td>${device.batteryLevel}%</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <h2>Alertes Actives</h2>
      <table class="table">
        <thead>
          <tr>
            <th>Capteur</th>
            <th>Type</th>
            <th>Sévérité</th>
            <th>Message</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          ${data.alerts.filter(a => a.status === 'active').map(alert => `
            <tr>
              <td>${alert.deviceName}</td>
              <td>${alert.type}</td>
              <td>${alert.severity}</td>
              <td>${alert.message}</td>
              <td>${new Date(alert.timestamp).toLocaleString('fr-FR')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;
}

// Paramètres
async function loadSettingsForm() {
  try {
    const settings = await ipcRenderer.invoke('get-system-settings');
    
    document.getElementById('temperature-unit').value = settings.temperatureUnit;
    document.getElementById('default-threshold').value = settings.defaultTemperatureThreshold;
    document.getElementById('update-interval').value = settings.updateInterval;
    document.getElementById('sound-alerts').checked = settings.enableSoundAlerts;
    document.getElementById('desktop-notifications').checked = settings.enableDesktopNotifications;
    document.getElementById('alert-retention').value = settings.alertRetention;
    document.getElementById('map-provider').value = settings.mapProvider;
    document.getElementById('language').value = settings.language;
    
  } catch (error) {
    console.error('❌ Erreur lors du chargement des paramètres:', error);
    showToast('Erreur lors du chargement des paramètres', 'error');
  }
}

async function saveSettings() {
  try {
    const settings = {
      temperatureUnit: document.getElementById('temperature-unit').value,
      defaultTemperatureThreshold: parseFloat(document.getElementById('default-threshold').value),
      updateInterval: parseInt(document.getElementById('update-interval').value),
      enableSoundAlerts: document.getElementById('sound-alerts').checked,
      enableDesktopNotifications: document.getElementById('desktop-notifications').checked,
      alertRetention: parseInt(document.getElementById('alert-retention').value),
      mapProvider: document.getElementById('map-provider').value,
      language: document.getElementById('language').value
    };
    
    showLoading(true);
    await ipcRenderer.invoke('update-system-settings', settings);
    showToast('Paramètres sauvegardés avec succès', 'success');
    
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde des paramètres:', error);
    showToast('Erreur lors de la sauvegarde des paramètres', 'error');
  } finally {
    showLoading(false);
  }
}

// Fonctions de chargement et notification
function showLoading(show) {
  const loading = document.getElementById('loading');
  if (loading) {
    loading.classList.toggle('hidden', !show);
  }
}

function showToast(message, type = 'info', title = null) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const titles = {
    success: 'Succès',
    error: 'Erreur',
    warning: 'Attention',
    info: 'Information'
  };
  
  toast.innerHTML = `
    <div class="toast-header">
      <span class="toast-title">${title || titles[type]}</span>
      <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
    </div>
    <div class="toast-message">${message}</div>
  `;
  
  container.appendChild(toast);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (toast.parentElement) {
      toast.remove();
    }
  }, 5000);
}

// Gestion des actions du menu
function handleMenuAction(action, ...args) {
  switch (action) {
    case 'new-device':
      openDeviceModal();
      break;
    case 'refresh':
      refreshData();
      break;
    case 'import-config':
      importConfiguration(args[0]);
      break;
    case 'export-config':
      exportConfiguration(args[0]);
      break;
    default:
      console.log('Action de menu non gérée:', action);
  }
}

// Configuration des mises à jour temps réel
function setupRealTimeUpdates() {
  // Les mises à jour sont gérées par l'IPC depuis le main process
  console.log('✅ Mises à jour temps réel configurées');
}

// Fonctions de la pagination
function updateDevicesPagination() {
  const totalPages = Math.ceil(filteredDevices.length / itemsPerPage);
  const paginationInfo = document.getElementById('pagination-info');
  const prevBtn = document.getElementById('prev-page');
  const nextBtn = document.getElementById('next-page');
  
  if (paginationInfo) {
    const start = (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(currentPage * itemsPerPage, filteredDevices.length);
    paginationInfo.textContent = `Affichage de ${start}-${end} sur ${filteredDevices.length} capteurs`;
  }
  
  if (prevBtn) {
    prevBtn.disabled = currentPage <= 1;
    prevBtn.onclick = () => {
      if (currentPage > 1) {
        currentPage--;
        renderDevicesTable();
        updateDevicesPagination();
      }
    };
  }
  
  if (nextBtn) {
    nextBtn.disabled = currentPage >= totalPages;
    nextBtn.onclick = () => {
      if (currentPage < totalPages) {
        currentPage++;
        renderDevicesTable();
        updateDevicesPagination();
      }
    };
  }
}

// Mise à jour des geofences sur la carte principale
function updateMapGeofences() {
  if (!map) return;
  
  // Cette fonction serait appelée pour mettre à jour les geofences sur la carte principale
  // Implémentation similaire à updateGeofenceMap mais pour la carte du dashboard
}

// Fonctions d'import/export
async function importConfiguration(filePath) {
  // Implémentation de l'import de configuration
  showToast('Fonction d\'import en développement', 'info');
}

async function exportConfiguration(filePath) {
  // Implémentation de l'export de configuration
  showToast('Fonction d\'export en développement', 'info');
}

// Chargement des paramètres système
async function loadSystemSettings() {
  try {
    const settings = await ipcRenderer.invoke('get-system-settings');
    console.log('⚙️ Paramètres système chargés:', settings);
    return settings;
  } catch (error) {
    console.error('❌ Erreur lors du chargement des paramètres système:', error);
    return {};
  }
}

console.log('📱 Script de l\'application RTLS Advensia chargé');
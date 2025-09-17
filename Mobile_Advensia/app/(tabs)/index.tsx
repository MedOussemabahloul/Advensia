import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  MapPin, 
  Thermometer, 
  Battery, 
  Wifi, 
  WifiOff,
  RefreshCw,
  Settings,
  AlertCircle
} from 'lucide-react-native';
import MapViewComponent from '@/components/MapView';
import DeviceCard from '@/components/DeviceCard';
import { rtlsService } from '@/services/rtlsService';
import { useNotifications } from '@/providers/NotificationProvider';
import { GPSDevice, Geofence } from '@/types';
import { useAuth } from '@/providers/AuthProvider';
import { useNavigation } from '@react-navigation/native';

const { height } = Dimensions.get('window');

export default function DashboardScreen() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigation = useNavigation();

  const [devices, setDevices] = useState<GPSDevice[]>([]);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<GPSDevice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  
  const { sendNotification } = useNotifications();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'auth' }], // replace 'Auth' with your actual auth screen name
      });
    }
  }, [authLoading, isAuthenticated, navigation]);

  const loadData = useCallback(async () => {
    try {
      const [devicesData, geofencesData] = await Promise.all([
        rtlsService.getDevices(),
        rtlsService.getGeofences(),
      ]);
      
      setDevices(devicesData);
      setGeofences(geofencesData);
      
      if (!selectedDevice && devicesData.length > 0) {
        setSelectedDevice(devicesData[0]);
      }
      
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Erreur', 'Impossible de charger les données');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [selectedDevice]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const handleDeviceSelect = useCallback((device: GPSDevice) => {
    setSelectedDevice(device);
  }, []);

  const getStatusSummary = () => {
    const online = devices.filter(d => d.status === 'online').length;
    const critical = devices.filter(d => d.status === 'critical').length;
    const offline = devices.filter(d => d.status === 'offline').length;
    
    return { online, critical, offline, total: devices.length };
  };

  const formatLastUpdate = () => {
    const now = new Date();
    const diff = now.getTime() - lastUpdate.getTime();
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return 'À l\'instant';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Il y a ${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `Il y a ${hours}h`;
  };

  useEffect(() => {
    loadData();
    
    const cleanup = rtlsService.startRealtimeUpdates((updatedDevices) => {
      setDevices(prev => {
        updatedDevices.forEach(device => {
          const prevDevice = prev.find(d => d.id === device.id);
          if (prevDevice && prevDevice.status !== 'critical' && device.status === 'critical') {
            sendNotification(
              'Alerte Critique',
              `${device.name}: Température critique détectée (${device.temperature.toFixed(1)}°C)`
            );
          }
        });
        return updatedDevices;
      });
      
      setSelectedDevice(prev => {
        if (prev) {
          const updated = updatedDevices.find(d => d.id === prev.id);
          return updated || prev;
        }
        return prev;
      });
      
      setLastUpdate(new Date());
    });

    return cleanup;
  }, [sendNotification]);

  if (authLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#1E40AF', '#3B82F6']}
          style={styles.loadingContainer}
        >
          <RefreshCw size={48} color="#FFFFFF" />
          <Text style={styles.loadingText}>Vérification de l'authentification...</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#1E40AF', '#3B82F6']}
          style={styles.loadingContainer}
        >
          <RefreshCw size={48} color="#FFFFFF" />
          <Text style={styles.loadingText}>Chargement des données...</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  const statusSummary = getStatusSummary();

  return (
    <SafeAreaView style={styles.container}>
      <Text className='text-2xl text-red-500'> AHLA</Text>
      <LinearGradient colors={['#1E40AF', '#3B82F6']} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>ADVENSIA</Text>
            <Text style={styles.logoSubtext}>RTLS Dashboard</Text>
          </View>
          <View style={styles.statusSummary}>
            <View style={styles.statusItem}>
              <Text style={styles.statusNumber}>{statusSummary.online}</Text>
              <Text style={styles.statusLabel}>En ligne</Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={[styles.statusNumber, { color: '#FEF3C7' }]}>
                {statusSummary.critical}
              </Text>
              <Text style={styles.statusLabel}>Critiques</Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={[styles.statusNumber, { color: '#FEE2E2' }]}>
                {statusSummary.offline}
              </Text>
              <Text style={styles.statusLabel}>Hors ligne</Text>
            </View>
          </View>
        </View>
        <View style={styles.lastUpdateContainer}>
          <Text style={styles.lastUpdateText}>
            Dernière mise à jour: {formatLastUpdate()}
          </Text>
          <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
            <RefreshCw size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.mapContainer}>
          <MapViewComponent
            devices={devices}
            geofences={geofences}
            selectedDevice={selectedDevice}
            onDeviceSelect={handleDeviceSelect}
          />
          {selectedDevice && (
            <View style={styles.mapOverlay}>
              <View style={styles.selectedDeviceInfo}>
                <Text style={styles.selectedDeviceName}>{selectedDevice.name}</Text>
                <View style={styles.selectedDeviceStats}>
                  <View style={styles.statItem}>
                    <Thermometer 
                      size={16} 
                      color={selectedDevice.temperature > selectedDevice.temperatureThreshold ? '#EF4444' : '#10B981'} 
                    />
                    <Text style={[
                      styles.statValue,
                      { color: selectedDevice.temperature > selectedDevice.temperatureThreshold ? '#EF4444' : '#10B981' }
                    ]}>
                      {selectedDevice.temperature.toFixed(1)}°C
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Battery 
                      size={16} 
                      color={selectedDevice.batteryLevel <= 20 ? '#EF4444' : '#10B981'} 
                    />
                    <Text style={styles.statValue}>{selectedDevice.batteryLevel}%</Text>
                  </View>
                  <View style={styles.statItem}>
                    {selectedDevice.status === 'offline' ? (
                      <WifiOff size={16} color="#6B7280" />
                    ) : (
                      <Wifi size={16} color="#10B981" />
                    )}
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>

        {selectedDevice && (
          <View style={styles.deviceDetailsSection}>
            <Text style={styles.sectionTitle}>Détails du Périphérique</Text>
            <View style={styles.deviceDetailsCard}>
              <View style={styles.deviceDetailsHeader}>
                <Text style={styles.deviceDetailsName}>{selectedDevice.name}</Text>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(selectedDevice.status) }
                ]}>
                  <Text style={styles.statusBadgeText}>
                    {getStatusText(selectedDevice.status)}
                  </Text>
                </View>
              </View>
              <View style={styles.deviceDetailsGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Adresse MAC</Text>
                  <Text style={styles.detailValue}>{selectedDevice.macAddress}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Position</Text>
                  <Text style={styles.detailValue}>
                    {selectedDevice.latitude.toFixed(6)}, {selectedDevice.longitude.toFixed(6)}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Température</Text>
                  <Text style={[
                    styles.detailValue,
                    { color: selectedDevice.temperature > selectedDevice.temperatureThreshold ? '#EF4444' : '#10B981' }
                  ]}>
                    {selectedDevice.temperature.toFixed(1)}°C
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Seuil de Température</Text>
                  <Text style={styles.detailValue}>
                    {selectedDevice.temperatureThreshold.toFixed(1)}°C
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Niveau de Batterie</Text>
                  <Text style={[
                    styles.detailValue,
                    { color: selectedDevice.batteryLevel <= 20 ? '#EF4444' : '#10B981' }
                  ]}>
                    {selectedDevice.batteryLevel}%
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Zone de Sécurité</Text>
                  <Text style={[
                    styles.detailValue,
                    { color: selectedDevice.isInGeofence ? '#10B981' : '#EF4444' }
                  ]}>
                    {selectedDevice.isInGeofence ? 'Dans la zone' : 'Hors de la zone'}
                  </Text>
                </View>
              </View>
              {selectedDevice.temperature > selectedDevice.temperatureThreshold && (
                <View style={styles.alertBanner}>
                  <AlertCircle size={20} color="#EF4444" />
                  <Text style={styles.alertText}>
                    Température critique détectée! Intervention nécessaire.
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        <View style={styles.devicesSection}>
          <Text style={styles.sectionTitle}>
            Tous les Périphériques ({devices.length})
          </Text>
          {devices.map(device => (
            <DeviceCard
              key={device.id}
              device={device}
              onPress={() => handleDeviceSelect(device)}
              isSelected={selectedDevice?.id === device.id}
            />
          ))}
        </View>
        
      </ScrollView>
    </SafeAreaView>
  );
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'online': return '#10B981';
    case 'warning': return '#F59E0B';
    case 'critical': return '#EF4444';
    case 'offline': return '#6B7280';
    default: return '#6B7280';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'online': return 'En ligne';
    case 'warning': return 'Attention';
    case 'critical': return 'Critique';
    case 'offline': return 'Hors ligne';
    default: return status;
  }
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Roboto-Medium',
    marginTop: 16,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoContainer: {
    flex: 1,
  },
  logoText: {
    fontSize: 24,
    fontFamily: 'Roboto-Bold',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  logoSubtext: {
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  statusSummary: {
    flexDirection: 'row',
    gap: 20,
  },
  statusItem: {
    alignItems: 'center',
  },
  statusNumber: {
    fontSize: 20,
    fontFamily: 'Roboto-Bold',
    color: '#FFFFFF',
  },
  statusLabel: {
    fontSize: 12,
    fontFamily: 'Roboto-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  lastUpdateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastUpdateText: {
    fontSize: 12,
    fontFamily: 'Roboto-Regular',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  refreshButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  mapContainer: {
    height: height * 0.4,
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  mapOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
  },
  selectedDeviceInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedDeviceName: {
    fontSize: 16,
    fontFamily: 'Roboto-Bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  selectedDeviceStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 14,
    fontFamily: 'Roboto-Medium',
    color: '#1E293B',
  },
  deviceDetailsSection: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Roboto-Bold',
    color: '#1E293B',
    marginBottom: 12,
  },
  deviceDetailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  deviceDetailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  deviceDetailsName: {
    fontSize: 18,
    fontFamily: 'Roboto-Bold',
    color: '#1E293B',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 12,
    fontFamily: 'Roboto-Bold',
    color: '#FFFFFF',
  },
  deviceDetailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  detailItem: {
    width: '48%',
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 12,
    fontFamily: 'Roboto-Medium',
    color: '#64748B',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    color: '#1E293B',
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    gap: 8,
  },
  alertText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Roboto-Medium',
    color: '#EF4444',
  },
  devicesSection: {
    marginTop: 8,
    paddingBottom: 20,
  },
});
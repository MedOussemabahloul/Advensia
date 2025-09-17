import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Thermometer, Wifi, WifiOff, Battery, MapPin } from 'lucide-react-native';
import { GPSDevice } from '@/types';

interface DeviceCardProps {
  device: GPSDevice;
  onPress: () => void;
  isSelected: boolean;
}

export default function DeviceCard({ device, onPress, isSelected }: DeviceCardProps) {
  const getStatusColor = () => {
    switch (device.status) {
      case 'online':
        return '#10B981';
      case 'warning':
        return '#F59E0B';
      case 'critical':
        return '#EF4444';
      case 'offline':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = () => {
    switch (device.status) {
      case 'online':
        return 'En ligne';
      case 'warning':
        return 'Attention';
      case 'critical':
        return 'Critique';
      case 'offline':
        return 'Hors ligne';
      default:
        return device.status;
    }
  };

  const getTemperatureColor = () => {
    if (device.temperature > device.temperatureThreshold) {
      return '#EF4444';
    } else if (device.temperature > device.temperatureThreshold - 2) {
      return '#F59E0B';
    }
    return '#10B981';
  };

  const getBatteryColor = () => {
    if (device.batteryLevel <= 20) return '#EF4444';
    if (device.batteryLevel <= 50) return '#F59E0B';
    return '#10B981';
  };

  const formatLastUpdate = () => {
    const now = new Date();
    const diff = now.getTime() - device.lastUpdate.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes}m`;
    
    const hours = Math.floor(minutes / 60);
    return `Il y a ${hours}h`;
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isSelected && styles.selectedContainer,
        { borderLeftColor: getStatusColor() }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.deviceName}>{device.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
            <Text style={styles.statusText}>{getStatusText()}</Text>
          </View>
        </View>
        <View style={styles.connectionIcon}>
          {device.status === 'offline' ? (
            <WifiOff size={20} color="#6B7280" />
          ) : (
            <Wifi size={20} color={getStatusColor()} />
          )}
        </View>
      </View>

      <View style={styles.macContainer}>
        <Text style={styles.macLabel}>MAC:</Text>
        <Text style={styles.macAddress}>{device.macAddress}</Text>
      </View>

      <View style={styles.metricsContainer}>
        <View style={styles.metric}>
          <Thermometer size={16} color={getTemperatureColor()} />
          <Text style={[styles.metricValue, { color: getTemperatureColor() }]}>
            {device.temperature.toFixed(1)}°C
          </Text>
          <Text style={styles.metricLabel}>
            (Seuil: {device.temperatureThreshold.toFixed(1)}°C)
          </Text>
        </View>

        <View style={styles.metric}>
          <Battery size={16} color={getBatteryColor()} />
          <Text style={[styles.metricValue, { color: getBatteryColor() }]}>
            {device.batteryLevel}%
          </Text>
        </View>

        <View style={styles.metric}>
          <MapPin size={16} color={device.isInGeofence ? '#10B981' : '#EF4444'} />
          <Text style={[
            styles.metricValue,
            { color: device.isInGeofence ? '#10B981' : '#EF4444' }
          ]}>
            {device.isInGeofence ? 'Zone OK' : 'Hors zone'}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.lastUpdate}>
          Dernière mise à jour: {formatLastUpdate()}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedContainer: {
    borderColor: '#1E40AF',
    borderWidth: 2,
    borderLeftWidth: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  deviceName: {
    fontSize: 16,
    fontFamily: 'Roboto-Bold',
    color: '#1E293B',
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Roboto-Medium',
    color: '#FFFFFF',
  },
  connectionIcon: {
    marginLeft: 8,
  },
  macContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  macLabel: {
    fontSize: 12,
    fontFamily: 'Roboto-Medium',
    color: '#64748B',
    marginRight: 4,
  },
  macAddress: {
    fontSize: 12,
    fontFamily: 'Roboto-Regular',
    color: '#1E293B',
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    fontSize: 14,
    fontFamily: 'Roboto-Bold',
    marginLeft: 4,
    marginRight: 4,
  },
  metricLabel: {
    fontSize: 10,
    fontFamily: 'Roboto-Regular',
    color: '#64748B',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
  },
  lastUpdate: {
    fontSize: 12,
    fontFamily: 'Roboto-Regular',
    color: '#64748B',
    textAlign: 'center',
  },
});
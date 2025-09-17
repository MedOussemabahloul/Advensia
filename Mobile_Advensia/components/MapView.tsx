import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { GPSDevice, Geofence } from '@/types';

interface MapViewComponentProps {
  devices: GPSDevice[];
  geofences: Geofence[];
  selectedDevice: GPSDevice | null;
  onDeviceSelect: (device: GPSDevice) => void;
}

export default function MapViewComponent({
  devices,
  geofences,
  selectedDevice,
  onDeviceSelect,
}: MapViewComponentProps) {
  const [mapRegion, setMapRegion] = useState({
    latitude: 48.8566,
    longitude: 2.3522,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  useEffect(() => {
    if (devices.length > 0) {
      // Calculate center and zoom to fit all devices
      const latitudes = devices.map(d => d.latitude);
      const longitudes = devices.map(d => d.longitude);
      
      const minLat = Math.min(...latitudes);
      const maxLat = Math.max(...latitudes);
      const minLng = Math.min(...longitudes);
      const maxLng = Math.max(...longitudes);
      
      const centerLat = (minLat + maxLat) / 2;
      const centerLng = (minLng + maxLng) / 2;
      const latDelta = Math.max(0.005, (maxLat - minLat) * 1.2);
      const lngDelta = Math.max(0.005, (maxLng - minLng) * 1.2);
      
      setMapRegion({
        latitude: centerLat,
        longitude: centerLng,
        latitudeDelta: latDelta,
        longitudeDelta: lngDelta,
      });
    }
  }, [devices]);

  const getMarkerColor = (device: GPSDevice) => {
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

  const getMarkerSize = (device: GPSDevice) => {
    return selectedDevice?.id === device.id ? 40 : 30;
  };

  return (
    <View style={styles.container}>
      <MapView
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        style={styles.map}
        region={mapRegion}
        onRegionChangeComplete={setMapRegion}
      >
        {/* Render geofences */}
        {geofences.map(geofence => (
          <Circle
            key={geofence.id}
            center={geofence.center}
            radius={geofence.radius}
            strokeColor="rgba(30, 64, 175, 0.5)"
            fillColor="rgba(30, 64, 175, 0.1)"
            strokeWidth={2}
          />
        ))}

        {/* Render device markers */}
        {devices.map(device => (
          <Marker
            key={device.id}
            coordinate={{
              latitude: device.latitude,
              longitude: device.longitude,
            }}
            onPress={() => onDeviceSelect(device)}
            pinColor={getMarkerColor(device)}
          >
            <View
              style={[
                styles.customMarker,
                { 
                  backgroundColor: getMarkerColor(device),
                  width: getMarkerSize(device),
                  height: getMarkerSize(device),
                  borderWidth: selectedDevice?.id === device.id ? 3 : 2,
                }
              ]}
            />
          </Marker>
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  customMarker: {
    borderRadius: 20,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});
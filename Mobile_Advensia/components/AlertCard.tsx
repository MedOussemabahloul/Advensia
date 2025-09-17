import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import {
  AlertTriangle,
  Thermometer,
  MapPin,
  Battery,
  WifiOff,
  Clock,
  CheckCircle,
  X,
} from 'lucide-react-native';
import { Alert } from '@/types';

interface AlertCardProps {
  alert: Alert;
  onMarkAsRead?: (alertId: string) => void;
  onResolve?: (alertId: string) => void;
  style?: any;
}

export default function AlertCard({ 
  alert, 
  onMarkAsRead, 
  onResolve, 
  style 
}: AlertCardProps) {
  const getAlertIcon = () => {
    switch (alert.type) {
      case 'temperature': return Thermometer;
      case 'geofence': return MapPin;
      case 'battery': return Battery;
      case 'offline': return WifiOff;
      default: return AlertTriangle;
    }
  };

  const getSeverityColor = () => {
    switch (alert.severity) {
      case 'critical': return '#DC2626';
      case 'high': return '#EA580C';
      case 'medium': return '#D97706';
      case 'low': return '#059669';
      default: return '#6B7280';
    }
  };

  const getSeverityBgColor = () => {
    switch (alert.severity) {
      case 'critical': return '#FEF2F2';
      case 'high': return '#FFF7ED';
      case 'medium': return '#FFFBEB';
      case 'low': return '#F0FDF4';
      default: return '#F9FAFB';
    }
  };

  const getSeverityLabel = () => {
    switch (alert.severity) {
      case 'critical': return 'Critique';
      case 'high': return 'Élevée';
      case 'medium': return 'Moyenne';
      case 'low': return 'Faible';
      default: return alert.severity;
    }
  };

  const formatTimestamp = () => {
    const now = new Date();
    const diff = now.getTime() - alert.timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes}m`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Il y a ${hours}h`;
    
    const days = Math.floor(hours / 24);
    return `Il y a ${days}j`;
  };

  const AlertIcon = getAlertIcon();
  const severityColor = getSeverityColor();
  const severityBgColor = getSeverityBgColor();

  return (
    <Animated.View
      style={[
        styles.container,
        { borderLeftColor: severityColor },
        !alert.isRead && styles.unreadCard,
        alert.isResolved && styles.resolvedCard,
        style,
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: severityBgColor }]}>
          <AlertIcon size={20} color={severityColor} />
        </View>
        
        <View style={styles.alertInfo}>
          <View style={styles.titleRow}>
            <Text style={styles.deviceName}>{alert.deviceName}</Text>
            {!alert.isRead && <View style={styles.unreadDot} />}
          </View>
          
          <View style={styles.metaRow}>
            <View style={[styles.severityBadge, { backgroundColor: severityColor }]}>
              <Text style={styles.severityText}>{getSeverityLabel()}</Text>
            </View>
            
            <View style={styles.timestampContainer}>
              <Clock size={12} color="#64748B" />
              <Text style={styles.timestamp}>{formatTimestamp()}</Text>
            </View>
          </View>
        </View>
      </View>

      <Text style={styles.message}>{alert.message}</Text>

      {alert.isResolved ? (
        <View style={styles.resolvedBanner}>
          <CheckCircle size={16} color="#059669" />
          <Text style={styles.resolvedText}>Alerte résolue</Text>
        </View>
      ) : (
        <View style={styles.actions}>
          {!alert.isRead && onMarkAsRead && (
            <TouchableOpacity
              style={[styles.actionButton, styles.readButton]}
              onPress={() => onMarkAsRead(alert.id)}
            >
              <CheckCircle size={14} color="#1E40AF" />
              <Text style={styles.readButtonText}>Marquer comme lue</Text>
            </TouchableOpacity>
          )}
          
          {onResolve && (
            <TouchableOpacity
              style={[styles.actionButton, styles.resolveButton]}
              onPress={() => onResolve(alert.id)}
            >
              <X size={14} color="#059669" />
              <Text style={styles.resolveButtonText}>Résoudre</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderLeftWidth: 4,
    marginVertical: 6,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  unreadCard: {
    shadowOpacity: 0.12,
    elevation: 4,
  },
  resolvedCard: {
    opacity: 0.75,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  deviceName: {
    fontSize: 16,
    fontFamily: 'Roboto-Bold',
    color: '#1E293B',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1E40AF',
    marginLeft: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  severityText: {
    fontSize: 11,
    fontFamily: 'Roboto-Bold',
    color: '#FFFFFF',
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timestamp: {
    fontSize: 12,
    fontFamily: 'Roboto-Regular',
    color: '#64748B',
  },
  message: {
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    color: '#64748B',
    lineHeight: 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  readButton: {
    backgroundColor: '#EFF6FF',
  },
  readButtonText: {
    fontSize: 12,
    fontFamily: 'Roboto-Medium',
    color: '#1E40AF',
  },
  resolveButton: {
    backgroundColor: '#F0FDF4',
  },
  resolveButtonText: {
    fontSize: 12,
    fontFamily: 'Roboto-Medium',
    color: '#059669',
  },
  resolvedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  resolvedText: {
    fontSize: 12,
    fontFamily: 'Roboto-Medium',
    color: '#059669',
  },
});
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Bell,
  AlertTriangle,
  Thermometer,
  MapPin,
  Battery,
  WifiOff,
  CheckCircle,
  X,
  Clock,
} from 'lucide-react-native';
import { rtlsService } from '@/services/rtlsService';
import { Alert as AlertType } from '@/types';

export default function NotificationsScreen() {
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAlerts = async () => {
    try {
      const alertsData = await rtlsService.getAlerts();
      setAlerts(alertsData);
    } catch (error) {
      console.error('Error loading alerts:', error);
      Alert.alert('Erreur', 'Impossible de charger les alertes');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAlerts();
  };

  const handleMarkAsRead = async (alertId: string) => {
    try {
      const success = await rtlsService.markAlertAsRead(alertId);
      if (success) {
        setAlerts(prev => 
          prev.map(alert => 
            alert.id === alertId ? { ...alert, isRead: true } : alert
          )
        );
      }
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      const success = await rtlsService.resolveAlert(alertId);
      if (success) {
        setAlerts(prev => 
          prev.map(alert => 
            alert.id === alertId 
              ? { ...alert, isResolved: true, isRead: true } 
              : alert
          )
        );
      }
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#1E40AF', '#3B82F6']}
          style={styles.loadingContainer}
        >
          <Bell size={48} color="#FFFFFF" />
          <Text style={styles.loadingText}>Chargement des alertes...</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  const unreadAlerts = alerts.filter(alert => !alert.isRead);
  const unresolvedAlerts = alerts.filter(alert => !alert.isResolved);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'temperature': return Thermometer;
      case 'geofence': return MapPin;
      case 'battery': return Battery;
      case 'offline': return WifiOff;
      default: return AlertTriangle;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#DC2626';
      case 'high': return '#EA580C';
      case 'medium': return '#D97706';
      case 'low': return '#16A34A';
      default: return '#6B7280';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'critical': return 'Critique';
      case 'high': return 'Élevée';
      case 'medium': return 'Moyenne';
      case 'low': return 'Faible';
      default: return severity;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes}m`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Il y a ${hours}h`;
    
    const days = Math.floor(hours / 24);
    return `Il y a ${days}j`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#1E40AF', '#3B82F6']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Alertes</Text>
        <Text style={styles.headerSubtitle}>
          Surveillance en temps réel de vos périphériques
        </Text>
        
        <View style={styles.alertsSummary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{unreadAlerts.length}</Text>
            <Text style={styles.summaryLabel}>Non lues</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{unresolvedAlerts.length}</Text>
            <Text style={styles.summaryLabel}>Non résolues</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{alerts.length}</Text>
            <Text style={styles.summaryLabel}>Total</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {alerts.length === 0 ? (
          <View style={styles.emptyState}>
            <CheckCircle size={64} color="#10B981" />
            <Text style={styles.emptyStateTitle}>Aucune alerte</Text>
            <Text style={styles.emptyStateText}>
              Tous vos périphériques fonctionnent normalement
            </Text>
          </View>
        ) : (
          <View style={styles.alertsList}>
            {alerts.map((alert) => {
              const AlertIcon = getAlertIcon(alert.type);
              const severityColor = getSeverityColor(alert.severity);
              
              return (
                <View
                  key={alert.id}
                  style={[
                    styles.alertCard,
                    !alert.isRead && styles.unreadAlert,
                    alert.isResolved && styles.resolvedAlert,
                  ]}
                >
                  <View style={styles.alertHeader}>
                    <View style={styles.alertIconContainer}>
                      <AlertIcon size={20} color={severityColor} />
                    </View>
                    
                    <View style={styles.alertInfo}>
                      <Text style={styles.alertDevice}>{alert.deviceName}</Text>
                      <View style={styles.alertMeta}>
                        <View style={[
                          styles.severityBadge,
                          { backgroundColor: severityColor }
                        ]}>
                          <Text style={styles.severityText}>
                            {getSeverityLabel(alert.severity)}
                          </Text>
                        </View>
                        <View style={styles.timestampContainer}>
                          <Clock size={12} color="#64748B" />
                          <Text style={styles.timestamp}>
                            {formatTimestamp(alert.timestamp)}
                          </Text>
                        </View>
                      </View>
                    </View>
                    
                    {!alert.isRead && (
                      <View style={styles.unreadIndicator} />
                    )}
                  </View>
                  
                  <Text style={styles.alertMessage}>{alert.message}</Text>
                  
                  {!alert.isResolved && (
                    <View style={styles.alertActions}>
                      {!alert.isRead && (
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleMarkAsRead(alert.id)}
                        >
                          <CheckCircle size={16} color="#1E40AF" />
                          <Text style={styles.actionButtonText}>
                            Marquer comme lue
                          </Text>
                        </TouchableOpacity>
                      )}
                      
                      <TouchableOpacity
                        style={[styles.actionButton, styles.resolveButton]}
                        onPress={() => handleResolveAlert(alert.id)}
                      >
                        <X size={16} color="#16A34A" />
                        <Text style={[styles.actionButtonText, { color: '#16A34A' }]}>
                          Résoudre
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  
                  {alert.isResolved && (
                    <View style={styles.resolvedBanner}>
                      <CheckCircle size={16} color="#16A34A" />
                      <Text style={styles.resolvedText}>Alerte résolue</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

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
    paddingVertical: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Roboto-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 20,
  },
  alertsSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 24,
    fontFamily: 'Roboto-Bold',
    color: '#FFFFFF',
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: 'Roboto-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontFamily: 'Roboto-Bold',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  alertsList: {
    padding: 16,
    paddingBottom: 32,
  },
  alertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  unreadAlert: {
    borderLeftWidth: 4,
    borderLeftColor: '#1E40AF',
  },
  resolvedAlert: {
    opacity: 0.7,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  alertIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertInfo: {
    flex: 1,
  },
  alertDevice: {
    fontSize: 16,
    fontFamily: 'Roboto-Bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  alertMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1E40AF',
    marginLeft: 8,
  },
  alertMessage: {
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 12,
  },
  alertActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    gap: 6,
  },
  resolveButton: {
    backgroundColor: '#F0FDF4',
  },
  actionButtonText: {
    fontSize: 12,
    fontFamily: 'Roboto-Medium',
    color: '#1E40AF',
  },
  resolvedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    gap: 8,
  },
  resolvedText: {
    fontSize: 12,
    fontFamily: 'Roboto-Medium',
    color: '#16A34A',
  },
});
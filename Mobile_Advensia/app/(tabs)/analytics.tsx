import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  Thermometer,
  Wifi,
  WifiOff,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react-native';
import { rtlsService } from '@/services/rtlsService';
import { AnalyticsData } from '@/types';

const { width } = Dimensions.get('window');

export default function AnalyticsScreen() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAnalytics = async () => {
    try {
      const data = await rtlsService.getAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAnalytics();
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (isLoading || !analytics) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#1E40AF', '#3B82F6']}
          style={styles.loadingContainer}
        >
          <BarChart3 size={48} color="#FFFFFF" />
          <Text style={styles.loadingText}>Chargement des analytics...</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  const deviceStatusPercentages = {
    online: (analytics.devicesByStatus.online / analytics.totalDevices) * 100,
    offline: (analytics.devicesByStatus.offline / analytics.totalDevices) * 100,
    warning: (analytics.devicesByStatus.warning / analytics.totalDevices) * 100,
    critical: (analytics.devicesByStatus.critical / analytics.totalDevices) * 100,
  };

  const recentTemperatures = analytics.temperatureHistory
    .slice(0, 7)
    .reverse();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#1E40AF', '#3B82F6']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Analytics</Text>
        <Text style={styles.headerSubtitle}>
          Vue d'ensemble de vos périphériques RTLS
        </Text>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Overview Cards */}
        <View style={styles.overviewSection}>
          <Text style={styles.sectionTitle}>Vue d'ensemble</Text>
          
          <View style={styles.cardsGrid}>
            <View style={[styles.overviewCard, { backgroundColor: '#EFF6FF' }]}>
              <View style={styles.cardHeader}>
                <Wifi size={24} color="#1E40AF" />
                <Text style={styles.cardTitle}>Périphériques</Text>
              </View>
              <Text style={[styles.cardValue, { color: '#1E40AF' }]}>
                {analytics.totalDevices}
              </Text>
              <Text style={styles.cardSubtext}>Total</Text>
            </View>

            <View style={[styles.overviewCard, { backgroundColor: '#F0FDF4' }]}>
              <View style={styles.cardHeader}>
                <CheckCircle size={24} color="#16A34A" />
                <Text style={styles.cardTitle}>En ligne</Text>
              </View>
              <Text style={[styles.cardValue, { color: '#16A34A' }]}>
                {analytics.activeDevices}
              </Text>
              <Text style={styles.cardSubtext}>
                {deviceStatusPercentages.online.toFixed(0)}%
              </Text>
            </View>

            <View style={[styles.overviewCard, { backgroundColor: '#FEF2F2' }]}>
              <View style={styles.cardHeader}>
                <AlertTriangle size={24} color="#DC2626" />
                <Text style={styles.cardTitle}>Critiques</Text>
              </View>
              <Text style={[styles.cardValue, { color: '#DC2626' }]}>
                {analytics.criticalAlerts}
              </Text>
              <Text style={styles.cardSubtext}>Alertes</Text>
            </View>

            <View style={[styles.overviewCard, { backgroundColor: '#FFFBEB' }]}>
              <View style={styles.cardHeader}>
                <Thermometer size={24} color="#D97706" />
                <Text style={styles.cardTitle}>Température</Text>
              </View>
              <Text style={[styles.cardValue, { color: '#D97706' }]}>
                {analytics.averageTemperature.toFixed(1)}°C
              </Text>
              <Text style={styles.cardSubtext}>Moyenne</Text>
            </View>
          </View>
        </View>

        {/* Device Status Distribution */}
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>Répartition des Statuts</Text>
          
          <View style={styles.chartCard}>
            <View style={styles.statusChart}>
              {Object.entries(deviceStatusPercentages).map(([status, percentage]) => (
                <View key={status} style={styles.statusRow}>
                  <View style={styles.statusInfo}>
                    <View style={[
                      styles.statusIndicator,
                      { backgroundColor: getStatusColor(status) }
                    ]} />
                    <Text style={styles.statusLabel}>
                      {getStatusLabel(status)}
                    </Text>
                  </View>
                  <View style={styles.statusBar}>
                    <View
                      style={[
                        styles.statusBarFill,
                        {
                          width: `${percentage}%`,
                          backgroundColor: getStatusColor(status),
                        }
                      ]}
                    />
                  </View>
                  <Text style={styles.statusPercentage}>
                    {percentage.toFixed(0)}%
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Temperature Trend */}
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>Tendance des Températures</Text>
          
          <View style={styles.chartCard}>
            <View style={styles.temperatureChart}>
              <View style={styles.chartGrid}>
                {recentTemperatures.map((temp, index) => {
                  const height = Math.max(20, (temp.value / 35) * 120);
                  const isHigh = temp.value > 25; // Assuming 25°C threshold
                  
                  return (
                    <View key={index} style={styles.chartBar}>
                      <View
                        style={[
                          styles.chartBarFill,
                          {
                            height,
                            backgroundColor: isHigh ? '#EF4444' : '#10B981',
                          }
                        ]}
                      />
                      <Text style={styles.chartBarLabel}>
                        {temp.value.toFixed(0)}°
                      </Text>
                      <Text style={styles.chartBarTime}>
                        {new Date(temp.timestamp).getHours()}h
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        </View>

        {/* Performance Metrics */}
        <View style={styles.metricsSection}>
          <Text style={styles.sectionTitle}>Métriques de Performance</Text>
          
          <View style={styles.metricCard}>
            <View style={styles.metricRow}>
              <View style={styles.metricInfo}>
                <Activity size={20} color="#1E40AF" />
                <Text style={styles.metricLabel}>Disponibilité</Text>
              </View>
              <View style={styles.metricValue}>
                <Text style={[styles.metricNumber, { color: '#16A34A' }]}>
                  {((analytics.activeDevices / analytics.totalDevices) * 100).toFixed(1)}%
                </Text>
                <TrendingUp size={16} color="#16A34A" />
              </View>
            </View>

            <View style={styles.metricRow}>
              <View style={styles.metricInfo}>
                <WifiOff size={20} color="#1E40AF" />
                <Text style={styles.metricLabel}>Déconnexions</Text>
              </View>
              <View style={styles.metricValue}>
                <Text style={[styles.metricNumber, { color: '#DC2626' }]}>
                  {analytics.offlineDevices}
                </Text>
                <TrendingDown size={16} color="#DC2626" />
              </View>
            </View>

            <View style={styles.metricRow}>
              <View style={styles.metricInfo}>
                <AlertTriangle size={20} color="#1E40AF" />
                <Text style={styles.metricLabel}>Alertes du jour</Text>
              </View>
              <View style={styles.metricValue}>
                <Text style={[styles.metricNumber, { color: '#F59E0B' }]}>
                  {analytics.criticalAlerts}
                </Text>
                <TrendingUp size={16} color="#F59E0B" />
              </View>
            </View>
          </View>
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

const getStatusLabel = (status: string) => {
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
  },
  content: {
    flex: 1,
  },
  overviewSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Roboto-Bold',
    color: '#1E293B',
    marginBottom: 16,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  overviewCard: {
    width: (width - 44) / 2,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: 'Roboto-Medium',
    color: '#64748B',
    marginLeft: 8,
  },
  cardValue: {
    fontSize: 28,
    fontFamily: 'Roboto-Bold',
    marginBottom: 4,
  },
  cardSubtext: {
    fontSize: 12,
    fontFamily: 'Roboto-Regular',
    color: '#64748B',
  },
  chartSection: {
    padding: 16,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statusChart: {
    gap: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusLabel: {
    fontSize: 12,
    fontFamily: 'Roboto-Regular',
    color: '#64748B',
  },
  statusBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  statusBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  statusPercentage: {
    fontSize: 12,
    fontFamily: 'Roboto-Bold',
    color: '#1E293B',
    width: 40,
    textAlign: 'right',
  },
  temperatureChart: {
    height: 180,
  },
  chartGrid: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  chartBar: {
    alignItems: 'center',
    flex: 1,
  },
  chartBarFill: {
    width: 20,
    borderRadius: 10,
    marginBottom: 8,
  },
  chartBarLabel: {
    fontSize: 10,
    fontFamily: 'Roboto-Bold',
    color: '#1E293B',
    marginBottom: 2,
  },
  chartBarTime: {
    fontSize: 10,
    fontFamily: 'Roboto-Regular',
    color: '#64748B',
  },
  metricsSection: {
    padding: 16,
    paddingBottom: 32,
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 16,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metricLabel: {
    fontSize: 16,
    fontFamily: 'Roboto-Regular',
    color: '#1E293B',
  },
  metricValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricNumber: {
    fontSize: 18,
    fontFamily: 'Roboto-Bold',
  },
});
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { 
  Wifi, 
  WifiOff, 
  AlertTriangle, 
  CheckCircle,
  Activity,
  Clock
} from 'lucide-react-native';

interface DeviceStatusSummary {
  online: number;
  offline: number;
  warning: number;
  critical: number;
  total: number;
}

interface DeviceStatusCardProps {
  summary: DeviceStatusSummary;
  onStatusPress?: (status: string) => void;
  lastUpdate?: Date;
  style?: any;
}

export default function DeviceStatusCard({ 
  summary, 
  onStatusPress, 
  lastUpdate,
  style 
}: DeviceStatusCardProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return CheckCircle;
      case 'offline': return WifiOff;
      case 'warning': return AlertTriangle;
      case 'critical': return AlertTriangle;
      default: return Activity;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return '#10B981';
      case 'offline': return '#6B7280';
      case 'warning': return '#F59E0B';
      case 'critical': return '#EF4444';
      default: return '#64748B';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'online': return 'En ligne';
      case 'offline': return 'Hors ligne';
      case 'warning': return 'Attention';
      case 'critical': return 'Critique';
      default: return status;
    }
  };

  const getPercentage = (count: number) => {
    return summary.total > 0 ? (count / summary.total) * 100 : 0;
  };

  const formatLastUpdate = () => {
    if (!lastUpdate) return 'Jamais';
    
    const now = new Date();
    const diff = now.getTime() - lastUpdate.getTime();
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return 'À l\'instant';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Il y a ${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `Il y a ${hours}h`;
  };

  const statusItems = [
    { key: 'online', count: summary.online },
    { key: 'critical', count: summary.critical },
    { key: 'warning', count: summary.warning },
    { key: 'offline', count: summary.offline },
  ];

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Activity size={20} color="#1E40AF" />
          <Text style={styles.title}>État des Périphériques</Text>
        </View>
        <View style={styles.totalBadge}>
          <Text style={styles.totalText}>{summary.total}</Text>
        </View>
      </View>

      <View style={styles.statusGrid}>
        {statusItems.map(({ key, count }) => {
          const StatusIcon = getStatusIcon(key);
          const color = getStatusColor(key);
          const percentage = getPercentage(count);
          
          return (
            <TouchableOpacity
              key={key}
              style={styles.statusItem}
              onPress={() => onStatusPress?.(key)}
              activeOpacity={0.7}
            >
              <View style={[styles.statusIcon, { backgroundColor: `${color}15` }]}>
                <StatusIcon size={20} color={color} />
              </View>
              <Text style={styles.statusCount}>{count}</Text>
              <Text style={styles.statusLabel}>{getStatusLabel(key)}</Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { 
                      width: `${percentage}%`,
                      backgroundColor: color,
                    }
                  ]} 
                />
              </View>
              <Text style={styles.statusPercentage}>
                {percentage.toFixed(0)}%
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.footer}>
        <View style={styles.lastUpdateContainer}>
          <Clock size={14} color="#64748B" />
          <Text style={styles.lastUpdateText}>
            Dernière mise à jour: {formatLastUpdate()}
          </Text>
        </View>
        
        <View style={styles.healthIndicator}>
          <View style={[
            styles.healthDot,
            { 
              backgroundColor: summary.critical > 0 
                ? '#EF4444' 
                : summary.warning > 0 
                  ? '#F59E0B' 
                  : '#10B981' 
            }
          ]} />
          <Text style={[
            styles.healthText,
            { 
              color: summary.critical > 0 
                ? '#EF4444' 
                : summary.warning > 0 
                  ? '#F59E0B' 
                  : '#10B981' 
            }
          ]}>
            {summary.critical > 0 
              ? 'Critique' 
              : summary.warning > 0 
                ? 'Attention' 
                : 'Normal'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Roboto-Bold',
    color: '#1E293B',
  },
  totalBadge: {
    backgroundColor: '#1E40AF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  totalText: {
    fontSize: 14,
    fontFamily: 'Roboto-Bold',
    color: '#FFFFFF',
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 20,
  },
  statusItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusCount: {
    fontSize: 24,
    fontFamily: 'Roboto-Bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  statusLabel: {
    fontSize: 12,
    fontFamily: 'Roboto-Medium',
    color: '#64748B',
    marginBottom: 8,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  statusPercentage: {
    fontSize: 10,
    fontFamily: 'Roboto-Bold',
    color: '#64748B',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  lastUpdateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lastUpdateText: {
    fontSize: 12,
    fontFamily: 'Roboto-Regular',
    color: '#64748B',
  },
  healthIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  healthDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  healthText: {
    fontSize: 12,
    fontFamily: 'Roboto-Bold',
  },
});
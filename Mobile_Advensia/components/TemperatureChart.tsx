import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Thermometer, TrendingUp, TrendingDown } from 'lucide-react-native';

interface TemperatureDataPoint {
  timestamp: Date;
  value: number;
  deviceId: string;
}

interface TemperatureChartProps {
  data: TemperatureDataPoint[];
  threshold?: number;
  title?: string;
}

const { width } = Dimensions.get('window');
const chartWidth = width - 64;
const chartHeight = 180;

export default function TemperatureChart({ 
  data, 
  threshold = 25, 
  title = "Tendance des Températures" 
}: TemperatureChartProps) {
  // Sort data by timestamp and take last 10 points
  const sortedData = data
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    .slice(-10);

  const maxTemp = Math.max(...sortedData.map(d => d.value), threshold + 5);
  const minTemp = Math.min(...sortedData.map(d => d.value), threshold - 5);
  const tempRange = maxTemp - minTemp;

  const getBarHeight = (value: number) => {
    const percentage = (value - minTemp) / tempRange;
    return Math.max(20, percentage * (chartHeight - 40));
  };

  const getBarColor = (value: number) => {
    if (value > threshold + 2) return '#EF4444'; // Critical
    if (value > threshold) return '#F59E0B'; // Warning
    return '#10B981'; // Normal
  };

  const getTrendIndicator = () => {
    if (sortedData.length < 2) return null;
    
    const lastValue = sortedData[sortedData.length - 1].value;
    const previousValue = sortedData[sortedData.length - 2].value;
    const trend = lastValue - previousValue;
    
    if (Math.abs(trend) < 0.1) return null;
    
    return trend > 0 ? (
      <View style={styles.trendUp}>
        <TrendingUp size={16} color="#EF4444" />
        <Text style={[styles.trendText, { color: '#EF4444' }]}>
          +{trend.toFixed(1)}°C
        </Text>
      </View>
    ) : (
      <View style={styles.trendDown}>
        <TrendingDown size={16} color="#10B981" />
        <Text style={[styles.trendText, { color: '#10B981' }]}>
          {trend.toFixed(1)}°C
        </Text>
      </View>
    );
  };

  const formatTime = (timestamp: Date) => {
    return `${timestamp.getHours()}:${timestamp.getMinutes().toString().padStart(2, '0')}`;
  };

  const averageTemp = sortedData.length > 0 
    ? sortedData.reduce((sum, point) => sum + point.value, 0) / sortedData.length
    : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Thermometer size={20} color="#1E40AF" />
          <Text style={styles.title}>{title}</Text>
        </View>
        {getTrendIndicator()}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Moyenne</Text>
          <Text style={[styles.statValue, { color: '#1E40AF' }]}>
            {averageTemp.toFixed(1)}°C
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Seuil</Text>
          <Text style={[styles.statValue, { color: '#F59E0B' }]}>
            {threshold.toFixed(1)}°C
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Actuelle</Text>
          <Text style={[
            styles.statValue, 
            { color: sortedData.length > 0 ? getBarColor(sortedData[sortedData.length - 1].value) : '#64748B' }
          ]}>
            {sortedData.length > 0 ? sortedData[sortedData.length - 1].value.toFixed(1) : '--'}°C
          </Text>
        </View>
      </View>

      <View style={styles.chartContainer}>
        {/* Threshold line */}
        <View 
          style={[
            styles.thresholdLine,
            {
              bottom: ((threshold - minTemp) / tempRange) * (chartHeight - 40) + 20,
            }
          ]}
        >
          <View style={styles.thresholdDot} />
          <Text style={styles.thresholdLabel}>Seuil</Text>
        </View>

        {/* Chart bars */}
        <View style={styles.chartBars}>
          {sortedData.map((point, index) => {
            const barHeight = getBarHeight(point.value);
            const barColor = getBarColor(point.value);
            
            return (
              <View key={index} style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: barHeight,
                      backgroundColor: barColor,
                    }
                  ]}
                />
                <Text style={styles.barValue}>
                  {point.value.toFixed(0)}°
                </Text>
                <Text style={styles.barTime}>
                  {formatTime(point.timestamp)}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Roboto-Bold',
    color: '#1E293B',
  },
  trendUp: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  trendDown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontFamily: 'Roboto-Bold',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Roboto-Regular',
    color: '#64748B',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontFamily: 'Roboto-Bold',
  },
  chartContainer: {
    height: chartHeight,
    position: 'relative',
  },
  thresholdLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  thresholdDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
    marginRight: 6,
  },
  thresholdLabel: {
    fontSize: 10,
    fontFamily: 'Roboto-Medium',
    color: '#F59E0B',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 4,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: '100%',
    paddingHorizontal: 8,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 2,
  },
  bar: {
    width: 16,
    borderRadius: 8,
    marginBottom: 8,
    minHeight: 20,
  },
  barValue: {
    fontSize: 10,
    fontFamily: 'Roboto-Bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  barTime: {
    fontSize: 9,
    fontFamily: 'Roboto-Regular',
    color: '#64748B',
  },
});
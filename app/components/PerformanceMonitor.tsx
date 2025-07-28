import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { performanceMonitor } from '../../lib/utils';
import { IconSymbol } from './ui/IconSymbol';

interface PerformanceMonitorProps {
  visible: boolean;
  onClose: () => void;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ visible, onClose }) => {
  const [metrics, setMetrics] = useState(performanceMonitor.getMetricsSummary());
  const [slowestQueries, setSlowestQueries] = useState(performanceMonitor.getSlowestQueries());

  useEffect(() => {
    if (visible) {
      const interval = setInterval(() => {
        setMetrics(performanceMonitor.getMetricsSummary());
        setSlowestQueries(performanceMonitor.getSlowestQueries());
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [visible]);

  const getPerformanceColor = (performance: 'good' | 'warning' | 'poor') => {
    switch (performance) {
      case 'good': return '#28A745';
      case 'warning': return '#FFC107';
      case 'poor': return '#DC3545';
    }
  };

  const formatTime = (ms: number) => {
    if (ms < 1) return '<1ms';
    if (ms < 1000) return `${ms.toFixed(1)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const clearMetrics = () => {
    performanceMonitor.clearMetrics();
    setMetrics(performanceMonitor.getMetricsSummary());
    setSlowestQueries(performanceMonitor.getSlowestQueries());
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Performance Monitor</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <IconSymbol name="xmark" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* Summary Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Summary</Text>
              <View style={styles.summaryGrid}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Total Queries</Text>
                  <Text style={styles.summaryValue}>{metrics.totalQueries}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Avg Query Time</Text>
                  <Text style={styles.summaryValue}>{formatTime(metrics.avgQueryTime)}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Avg Calc Time</Text>
                  <Text style={styles.summaryValue}>{formatTime(metrics.avgCalculationTime)}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Avg Items</Text>
                  <Text style={styles.summaryValue}>{metrics.avgItemCount.toFixed(1)}</Text>
                </View>
              </View>
              
              <View style={styles.performanceIndicator}>
                <Text style={styles.performanceLabel}>Recent Performance:</Text>
                <View style={[styles.performanceBadge, { backgroundColor: getPerformanceColor(metrics.recentPerformance) }]}>
                  <Text style={styles.performanceText}>{metrics.recentPerformance.toUpperCase()}</Text>
                </View>
              </View>
            </View>

            {/* Slowest Queries Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Slowest Queries</Text>
              {slowestQueries.length === 0 ? (
                <Text style={styles.noData}>No data available</Text>
              ) : (
                slowestQueries.map((query, index) => (
                  <View key={index} style={styles.queryItem}>
                    <View style={styles.queryHeader}>
                      <Text style={styles.queryTime}>{formatTime(query.queryTime)}</Text>
                      <Text style={styles.queryItems}>{query.itemCount} items</Text>
                    </View>
                    <Text style={styles.queryDate}>
                      {new Date(query.timestamp).toLocaleTimeString()}
                    </Text>
                  </View>
                ))
              )}
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.clearButton} onPress={clearMetrics}>
                <Text style={styles.clearButtonText}>Clear Metrics</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 12,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6C757D',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
  },
  performanceIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  performanceLabel: {
    fontSize: 14,
    color: '#212529',
  },
  performanceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  performanceText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  queryItem: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  queryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  queryTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#DC3545',
  },
  queryItems: {
    fontSize: 14,
    color: '#6C757D',
  },
  queryDate: {
    fontSize: 12,
    color: '#ADB5BD',
  },
  noData: {
    textAlign: 'center',
    color: '#6C757D',
    fontStyle: 'italic',
  },
  actions: {
    marginTop: 16,
  },
  clearButton: {
    backgroundColor: '#DC3545',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
}); 
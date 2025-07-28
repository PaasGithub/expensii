// lib/utils.ts
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export const formatAmount = (amount: number): string => {
  return `₵${amount.toLocaleString()}`;
};

export const calculateRemainingAmount = (totalAmount: number, items: Array<{ amount: number }>, groupType: 'add' | 'subtract' = 'subtract'): number => {
  const spentAmount = items.reduce((sum, item) => sum + item.amount, 0);
  
  if (groupType === 'add') {
    return spentAmount; // For Add groups, return the total accumulated amount
  } else {
    return totalAmount - spentAmount; // For Subtract groups, return remaining amount
  }
};

export const calculateTotalAmount = (baseAmount: number, items: Array<{ amount: number }>, groupType: 'add' | 'subtract' = 'subtract'): number => {
  const spentAmount = items.reduce((sum, item) => sum + item.amount, 0);
  
  if (groupType === 'add') {
    return spentAmount; // For Add groups, total is the sum of all items
  } else {
    return baseAmount; // For Subtract groups, total is the original amount
  }
};

// Performance monitoring utilities
export interface PerformanceMetrics {
  queryTime: number;
  calculationTime: number;
  itemCount: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private maxMetrics = 100; // Keep last 100 measurements

  startTimer(): () => number {
    const start = performance.now();
    return () => performance.now() - start;
  }

  recordMetric(metric: Omit<PerformanceMetrics, 'timestamp'>) {
    this.metrics.push({
      ...metric,
      timestamp: Date.now()
    });

    // Keep only the last maxMetrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  getAverageQueryTime(): number {
    if (this.metrics.length === 0) return 0;
    const total = this.metrics.reduce((sum, m) => sum + m.queryTime, 0);
    return total / this.metrics.length;
  }

  getAverageCalculationTime(): number {
    if (this.metrics.length === 0) return 0;
    const total = this.metrics.reduce((sum, m) => sum + m.calculationTime, 0);
    return total / this.metrics.length;
  }

  getAverageItemCount(): number {
    if (this.metrics.length === 0) return 0;
    const total = this.metrics.reduce((sum, m) => sum + m.itemCount, 0);
    return total / this.metrics.length;
  }

  getSlowestQueries(limit: number = 5): PerformanceMetrics[] {
    return [...this.metrics]
      .sort((a, b) => b.queryTime - a.queryTime)
      .slice(0, limit);
  }

  getMetricsSummary(): {
    totalQueries: number;
    avgQueryTime: number;
    avgCalculationTime: number;
    avgItemCount: number;
    slowestQuery: number;
    recentPerformance: 'good' | 'warning' | 'poor';
  } {
    if (this.metrics.length === 0) {
      return {
        totalQueries: 0,
        avgQueryTime: 0,
        avgCalculationTime: 0,
        avgItemCount: 0,
        slowestQuery: 0,
        recentPerformance: 'good'
      };
    }

    const avgQueryTime = this.getAverageQueryTime();
    const avgCalculationTime = this.getAverageCalculationTime();
    const avgItemCount = this.getAverageItemCount();
    const slowestQuery = Math.max(...this.metrics.map(m => m.queryTime));

    // Get recent performance (last 10 queries)
    const recentMetrics = this.metrics.slice(-10);
    const recentAvgQueryTime = recentMetrics.reduce((sum, m) => sum + m.queryTime, 0) / recentMetrics.length;

    let recentPerformance: 'good' | 'warning' | 'poor' = 'good';
    if (recentAvgQueryTime > 1000) { // > 1 second
      recentPerformance = 'poor';
    } else if (recentAvgQueryTime > 500) { // > 500ms
      recentPerformance = 'warning';
    }

    return {
      totalQueries: this.metrics.length,
      avgQueryTime,
      avgCalculationTime,
      avgItemCount,
      slowestQuery,
      recentPerformance
    };
  }

  clearMetrics() {
    this.metrics = [];
  }

  exportMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  logPerformanceSummary() {
    const summary = this.getMetricsSummary();
    console.log('🚀 Performance Summary:');
    console.log(`   Total Queries: ${summary.totalQueries}`);
    console.log(`   Avg Query Time: ${summary.avgQueryTime.toFixed(2)}ms`);
    console.log(`   Avg Calc Time: ${summary.avgCalculationTime.toFixed(2)}ms`);
    console.log(`   Avg Items: ${summary.avgItemCount.toFixed(1)}`);
    console.log(`   Slowest Query: ${summary.slowestQuery.toFixed(2)}ms`);
    console.log(`   Recent Performance: ${summary.recentPerformance.toUpperCase()}`);
    
    if (summary.recentPerformance === 'poor') {
      console.warn('⚠️  Performance is poor! Consider optimizing your queries.');
    } else if (summary.recentPerformance === 'warning') {
      console.warn('⚠️  Performance is showing warning signs.');
    } else {
      console.log('✅ Performance is good!');
    }
  }
}

export const performanceMonitor = new PerformanceMonitor(); 
import { AggregationType } from '../types/dataset';

export interface AggregationResult {
  label: string;
  value: number;
  count: number;
  groupedValues?: Record<string, number>;
}

export function computeAggregation(
  values: number[],
  type: AggregationType
): number {
  if (values.length === 0) return 0;

  switch (type) {
    case 'count':
      return values.length;
    case 'sum':
      return values.reduce((a, b) => a + b, 0);
    case 'avg':
      return values.reduce((a, b) => a + b, 0) / values.length;
    case 'min':
      return Math.min(...values);
    case 'max':
      return Math.max(...values);
    case 'median': {
      const sorted = [...values].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 !== 0
        ? sorted[mid]
        : (sorted[mid - 1] + sorted[mid]) / 2;
    }
    default:
      return values.reduce((a, b) => a + b, 0);
  }
}

/**
 * Group records by x-axis column and aggregate y-axis metric
 */
export function aggregateData(
  records: Record<string, any>[],
  xKey: string,
  yKey: string,
  aggType: AggregationType,
  groupByKey?: string
): AggregationResult[] {
  if (!xKey || !yKey || records.length === 0) return [];

  const groups = new Map<string, { yValues: number[]; groupedMap: Map<string, number[]> }>();

  for (const row of records) {
    const rawX = row[xKey];
    const xVal = rawX === null || rawX === undefined ? '(Blank)' : String(rawX);
    const rawY = row[yKey];
    const numY = typeof rawY === 'number' ? rawY : Number(rawY);

    if (isNaN(numY) && aggType !== 'count') continue;

    if (!groups.has(xVal)) {
      groups.set(xVal, { yValues: [], groupedMap: new Map() });
    }

    const group = groups.get(xVal)!;
    group.yValues.push(isNaN(numY) ? 1 : numY);

    if (groupByKey) {
      const subKey = String(row[groupByKey] ?? 'Other');
      if (!group.groupedMap.has(subKey)) {
        group.groupedMap.set(subKey, []);
      }
      group.groupedMap.get(subKey)!.push(isNaN(numY) ? 1 : numY);
    }
  }

  const results: AggregationResult[] = [];
  groups.forEach((data, label) => {
    const val = computeAggregation(data.yValues, aggType);
    const subValues: Record<string, number> = {};

    if (groupByKey) {
      data.groupedMap.forEach((vals, subK) => {
        subValues[subK] = computeAggregation(vals, aggType);
      });
    }

    results.push({
      label,
      value: Number(val.toFixed(2)),
      count: data.yValues.length,
      groupedValues: subValues,
    });
  });

  return results;
}

/**
 * Linear regression calculation for scatter plots
 */
export function calculateLinearRegression(points: { x: number; y: number }[]): {
  slope: number;
  intercept: number;
  rSquared: number;
  minX: number;
  maxX: number;
} | null {
  const n = points.length;
  if (n < 2) return null;

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  let sumY2 = 0;
  let minX = Infinity;
  let maxX = -Infinity;

  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumX2 += p.x * p.x;
    sumY2 += p.y * p.y;
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
  }

  const denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0) return null;

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  // Correlation coefficient r
  const numR = n * sumXY - sumX * sumY;
  const denR = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  const rSquared = denR !== 0 ? Math.pow(numR / denR, 2) : 0;

  return {
    slope,
    intercept,
    rSquared: Math.min(1, Math.max(0, rSquared)),
    minX,
    maxX,
  };
}

/**
 * Color palettes tailored for high visual clarity
 */
export const COLOR_PALETTES: Record<string, { name: string; colors: string[] }> = {
  indigo: {
    name: 'Modern Slate & Indigo',
    colors: ['#4F46E5', '#06B6D4', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#3B82F6', '#14B8A6'],
  },
  emerald: {
    name: 'Forest Emerald',
    colors: ['#059669', '#10B981', '#34D399', '#0284C7', '#0D9488', '#65A30D', '#D97706', '#047857'],
  },
  warmth: {
    name: 'Amber & Sunset',
    colors: ['#D97706', '#EA580C', '#E11D48', '#C026D3', '#7C3AED', '#4F46E5', '#F59E0B', '#F97316'],
  },
  monochrome: {
    name: 'Technical Monochrome',
    colors: ['#0F172A', '#334155', '#475569', '#64748B', '#94A3B8', '#CBD5E1', '#1E293B', '#0284C7'],
  },
};

/**
 * Format numeric value nicely
 */
export function formatMetricValue(val: number | undefined | null, isCurrency?: boolean): string {
  if (val === undefined || val === null || isNaN(val)) return '—';

  const abs = Math.abs(val);
  const prefix = isCurrency ? '$' : '';

  if (abs >= 1_000_000_000) {
    return `${prefix}${(val / 1_000_000_000).toFixed(2)}B`;
  }
  if (abs >= 1_000_000) {
    return `${prefix}${(val / 1_000_000).toFixed(2)}M`;
  }
  if (abs >= 10_000) {
    return `${prefix}${(val / 1_000).toFixed(1)}k`;
  }
  if (abs % 1 === 0) {
    return `${prefix}${val.toLocaleString()}`;
  }
  return `${prefix}${val.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}`;
}

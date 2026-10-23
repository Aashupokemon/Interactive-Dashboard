import React from 'react';
import { ColumnMeta } from '../types/dataset';
import { formatMetricValue } from '../utils/aggregations';

interface MetricCardsProps {
  columns: ColumnMeta[];
  recordsCount: number;
  totalAvailableCount: number;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  columns,
  recordsCount,
  totalAvailableCount,
}) => {
  // Grab top 4 numeric columns
  const numericCols = columns.filter((c) => c.type === 'number').slice(0, 4);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Primary Volume Metric */}
      <div className="p-4 rounded-lg border border-slate-200 bg-white">
        <div className="text-xs font-medium text-slate-500">
          Filtered Records
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {recordsCount.toLocaleString()}
          </span>
          <span className="text-xs text-slate-400 font-mono tabular-nums">
            of {totalAvailableCount.toLocaleString()}
          </span>
        </div>
        <div className="mt-2 text-[11px] text-slate-500">
          Active cohort volume · {columns.length} attributes
        </div>
      </div>

      {/* Numerical Metrics */}
      {numericCols.map((col) => {
        const hasSum = col.sum !== undefined;
        const isLikelyCurrency = col.label.toLowerCase().includes('mrr') ||
          col.label.toLowerCase().includes('sales') ||
          col.label.toLowerCase().includes('cac') ||
          col.label.toLowerCase().includes('ltv') ||
          col.label.toLowerCase().includes('profit') ||
          col.label.toLowerCase().includes('cost');

        return (
          <div key={col.key} className="p-4 rounded-lg border border-slate-200 bg-white">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span className="truncate">{col.label}</span>
              <span className="text-[10px] text-slate-400 uppercase font-mono">
                {hasSum ? 'Sum' : 'Avg'}
              </span>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 truncate">
                {formatMetricValue(hasSum ? col.sum : col.avg, isLikelyCurrency)}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500 font-mono tabular-nums">
              <span>Avg: {formatMetricValue(col.avg, isLikelyCurrency)}</span>
              <span className="text-slate-300">·</span>
              <span>Max: {formatMetricValue(col.max, isLikelyCurrency)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

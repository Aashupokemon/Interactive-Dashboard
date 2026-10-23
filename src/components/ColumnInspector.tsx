import React from 'react';
import { ColumnMeta } from '../types/dataset';
import { formatMetricValue } from '../utils/aggregations';
import { Hash, Calendar, Type, CheckSquare } from 'lucide-react';

interface ColumnInspectorProps {
  columns: ColumnMeta[];
  recordsCount: number;
  onSetAsX: (colKey: string) => void;
  onSetAsY: (colKey: string) => void;
}

export const ColumnInspector: React.FC<ColumnInspectorProps> = ({
  columns,
  recordsCount,
  onSetAsX,
  onSetAsY,
}) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'number':
        return <Hash className="h-4 w-4 text-emerald-600" />;
      case 'date':
        return <Calendar className="h-4 w-4 text-blue-600" />;
      case 'boolean':
        return <CheckSquare className="h-4 w-4 text-purple-600" />;
      default:
        return <Type className="h-4 w-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Attribute Schema & Column Profiles
          </h3>
          <p className="text-xs text-slate-500">
            Statistical summaries and data distributions across {columns.length} detected attributes.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {columns.map((col) => {
          const completeness = recordsCount > 0 ? (((recordsCount - col.nullCount) / recordsCount) * 100).toFixed(0) : '100';

          return (
            <div
              key={col.key}
              className="p-4 rounded-lg border border-slate-200 bg-white space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getTypeIcon(col.type)}
                  <span className="text-xs font-bold text-slate-800 truncate max-w-[150px]">
                    {col.label}
                  </span>
                </div>
                <span className="text-[10px] font-mono uppercase text-slate-400">
                  {col.type}
                </span>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-100 font-mono tabular-nums text-slate-600">
                <div>
                  <span className="text-slate-400 block text-[10px]">Unique values</span>
                  <span className="font-semibold text-slate-800">{col.distinctCount.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Completeness</span>
                  <span className="font-semibold text-slate-800">{completeness}%</span>
                </div>

                {col.type === 'number' && (
                  <>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Average</span>
                      <span>{formatMetricValue(col.avg)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Median</span>
                      <span>{formatMetricValue(col.median)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Min</span>
                      <span>{formatMetricValue(col.min)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Max</span>
                      <span>{formatMetricValue(col.max)}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Sample values preview */}
              <div className="text-[11px] pt-1">
                <span className="text-slate-400 block text-[10px] mb-1">Samples:</span>
                <div className="flex flex-wrap gap-1">
                  {col.sampleValues.slice(0, 4).map((s, i) => (
                    <span
                      key={i}
                      className="px-1.5 py-0.5 rounded bg-slate-50 text-slate-600 text-[10px] truncate max-w-[120px] font-mono"
                    >
                      {String(s)}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs">
                <button
                  onClick={() => onSetAsX(col.key)}
                  className="flex-1 py-1 px-2 text-center text-[11px] font-medium text-slate-700 bg-slate-50 rounded hover:bg-slate-100 transition-colors"
                >
                  Set as X-Axis
                </button>
                {col.type === 'number' && (
                  <button
                    onClick={() => onSetAsY(col.key)}
                    className="flex-1 py-1 px-2 text-center text-[11px] font-medium text-indigo-700 bg-indigo-50 rounded hover:bg-indigo-100 transition-colors"
                  >
                    Set as Y-Axis
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

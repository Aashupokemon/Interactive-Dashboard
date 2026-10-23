import React from 'react';
import { AggregationType, ChartConfig, ChartType, ColumnMeta } from '../types/dataset';
import { 
  BarChart3, 
  LineChart as LineIcon, 
  PieChart as PieIcon, 
  Grid, 
  TrendingUp, 
  Table2,
  SlidersHorizontal,
  Layers,
  Palette
} from 'lucide-react';
import { COLOR_PALETTES } from '../utils/aggregations';

interface FilterToolbarProps {
  columns: ColumnMeta[];
  config: ChartConfig;
  onChangeConfig: (newConfig: Partial<ChartConfig>) => void;
  allCategories?: string[];
  selectedCategories?: string[];
  onToggleCategory?: (cat: string) => void;
}

export const FilterToolbar: React.FC<FilterToolbarProps> = ({
  columns,
  config,
  onChangeConfig,
  allCategories = [],
  selectedCategories = [],
  onToggleCategory,
}) => {
  const chartTypes: { id: ChartType; label: string; icon: React.ReactNode }[] = [
    { id: 'bar', label: 'Column', icon: <BarChart3 className="h-3.5 w-3.5" /> },
    { id: 'horizontal-bar', label: 'Bar', icon: <BarChart3 className="h-3.5 w-3.5 rotate-90" /> },
    { id: 'line', label: 'Line', icon: <LineIcon className="h-3.5 w-3.5" /> },
    { id: 'area', label: 'Area', icon: <TrendingUp className="h-3.5 w-3.5" /> },
    { id: 'scatter', label: 'Scatter', icon: <Grid className="h-3.5 w-3.5" /> },
    { id: 'donut', label: 'Donut', icon: <PieIcon className="h-3.5 w-3.5" /> },
    { id: 'heatmap', label: 'Heatmap', icon: <Layers className="h-3.5 w-3.5" /> },
    { id: 'pivot', label: 'Pivot', icon: <Table2 className="h-3.5 w-3.5" /> },
  ];

  const aggregations: { id: AggregationType; label: string }[] = [
    { id: 'sum', label: 'Sum' },
    { id: 'avg', label: 'Average' },
    { id: 'count', label: 'Count' },
    { id: 'max', label: 'Maximum' },
    { id: 'min', label: 'Minimum' },
    { id: 'median', label: 'Median' },
  ];

  const numericColumns = columns.filter((c) => c.type === 'number');
  const categoricalOrDateColumns = columns.filter((c) => c.type !== 'number' || c.distinctCount < 15);

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
      {/* Top Row: Chart Type Buttons + Palette Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        {/* Chart type tabs */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
          {chartTypes.map((tab) => {
            const isActive = config.type === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onChangeConfig({ type: tab.id })}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Color Palette Selector */}
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <Palette className="h-3.5 w-3.5 text-slate-400" />
          <span className="font-medium text-slate-500">Theme:</span>
          <select
            value={config.colorPalette}
            onChange={(e) => onChangeConfig({ colorPalette: e.target.value })}
            className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:outline-none"
          >
            {Object.entries(COLOR_PALETTES).map(([k, p]) => (
              <option key={k} value={k}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Second Row: Axis & Dimension Pickers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        {/* X Axis */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">
            {config.type === 'scatter' ? 'X-Axis (Numeric)' : config.type === 'heatmap' || config.type === 'pivot' ? 'Row Dimension' : 'X-Axis (Category / Date)'}
          </label>
          <select
            value={config.xAxis}
            onChange={(e) => onChangeConfig({ xAxis: e.target.value })}
            className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            {(config.type === 'scatter' ? numericColumns : columns).map((col) => (
              <option key={col.key} value={col.key}>
                {col.label} ({col.type})
              </option>
            ))}
          </select>
        </div>

        {/* Y Axis */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">
            {config.type === 'heatmap' || config.type === 'pivot' ? 'Column Dimension' : 'Y-Axis (Metric / Value)'}
          </label>
          <select
            value={config.yAxis}
            onChange={(e) => onChangeConfig({ yAxis: e.target.value })}
            className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            {(config.type === 'heatmap' || config.type === 'pivot' ? categoricalOrDateColumns : numericColumns).map((col) => (
              <option key={col.key} value={col.key}>
                {col.label} ({col.type})
              </option>
            ))}
          </select>
        </div>

        {/* Group By / Secondary Series */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">
            {config.type === 'heatmap' || config.type === 'pivot' ? 'Metric Value' : 'Breakdown / Series (Optional)'}
          </label>
          <select
            value={config.groupBy || ''}
            onChange={(e) => onChangeConfig({ groupBy: e.target.value || undefined })}
            className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            {config.type === 'heatmap' || config.type === 'pivot' ? (
              numericColumns.map((col) => (
                <option key={col.key} value={col.key}>
                  {col.label} (Metric)
                </option>
              ))
            ) : (
              <>
                <option value="">None (Single Series)</option>
                {categoricalOrDateColumns.map((col) => (
                  <option key={col.key} value={col.key}>
                    {col.label}
                  </option>
                ))}
              </>
            )}
          </select>
        </div>

        {/* Aggregation Function */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">
            Aggregation Method
          </label>
          <select
            value={config.aggregation}
            onChange={(e) => onChangeConfig({ aggregation: e.target.value as AggregationType })}
            className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            {aggregations.map((agg) => (
              <option key={agg.id} value={agg.id}>
                {agg.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Chart Specific Quick Toggles */}
      <div className="flex flex-wrap items-center gap-4 text-xs pt-1 border-t border-slate-100">
        {(config.type === 'bar' || config.type === 'horizontal-bar') && config.groupBy && (
          <label className="flex items-center gap-2 cursor-pointer text-slate-600">
            <input
              type="checkbox"
              checked={!!config.stacked}
              onChange={(e) => onChangeConfig({ stacked: e.target.checked })}
              className="rounded border-slate-300 text-indigo-600 focus:ring-0"
            />
            <span>Stack series bars</span>
          </label>
        )}

        {config.type === 'scatter' && (
          <label className="flex items-center gap-2 cursor-pointer text-slate-600">
            <input
              type="checkbox"
              checked={config.showRegressionLine !== false}
              onChange={(e) => onChangeConfig({ showRegressionLine: e.target.checked })}
              className="rounded border-slate-300 text-indigo-600 focus:ring-0"
            />
            <span>Display linear trendline (R²)</span>
          </label>
        )}

        {/* Quick Category filter chips if categories available */}
        {allCategories.length > 0 && onToggleCategory && (
          <div className="flex flex-wrap items-center gap-2 ml-auto">
            <span className="text-[11px] text-slate-400">Filter {config.xAxis}:</span>
            {allCategories.slice(0, 6).map((cat) => {
              const isSelected = selectedCategories.length === 0 || selectedCategories.includes(cat);
              return (
                <button
                  key={cat}
                  onClick={() => onToggleCategory(cat)}
                  className={`px-2 py-0.5 text-[11px] rounded transition-colors ${
                    isSelected
                      ? 'bg-slate-900 text-white font-medium'
                      : 'bg-slate-100 text-slate-500 line-through'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

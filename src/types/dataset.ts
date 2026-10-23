export type ColumnType = 'number' | 'string' | 'date' | 'boolean';

export interface ColumnMeta {
  key: string;
  label: string;
  type: ColumnType;
  distinctCount: number;
  sampleValues: (string | number | boolean)[];
  min?: number;
  max?: number;
  avg?: number;
  sum?: number;
  median?: number;
  nullCount: number;
}

export type AggregationType = 'sum' | 'avg' | 'count' | 'min' | 'max' | 'median';

export type ChartType = 
  | 'bar' 
  | 'horizontal-bar' 
  | 'line' 
  | 'area' 
  | 'scatter' 
  | 'donut' 
  | 'heatmap' 
  | 'pivot' 
  | 'table';

export interface ChartConfig {
  type: ChartType;
  xAxis: string;
  yAxis: string;
  secondaryYAxis?: string;
  groupBy?: string;
  aggregation: AggregationType;
  sortBy?: 'label' | 'value' | 'none';
  sortOrder?: 'asc' | 'desc';
  topN?: number; // e.g. top 10
  stacked?: boolean;
  showRegressionLine?: boolean;
  colorPalette: string;
}

export interface Dataset {
  id: string;
  name: string;
  description: string;
  records: Record<string, any>[];
  columns: ColumnMeta[];
  createdAt: string;
}

export interface ActiveFilters {
  searchQuery: string;
  categoricalFilters: Record<string, string[]>;
  numericRanges: Record<string, { min: number; max: number }>;
}

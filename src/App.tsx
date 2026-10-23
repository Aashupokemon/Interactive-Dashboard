import React, { useState, useMemo } from 'react';
import { ChartConfig, Dataset } from './types/dataset';
import { SAMPLE_DATASETS } from './data/sampleDatasets';
import { aggregateData } from './utils/aggregations';
import { Header } from './components/Header';
import { MetricCards } from './components/MetricCards';
import { FilterToolbar } from './components/FilterToolbar';
import { BarChart } from './components/charts/BarChart';
import { LineChart } from './components/charts/LineChart';
import { ScatterPlot } from './components/charts/ScatterPlot';
import { DonutChart } from './components/charts/DonutChart';
import { HeatmapMatrix } from './components/charts/HeatmapMatrix';
import { PivotTable } from './components/charts/PivotTable';
import { DataGrid } from './components/charts/DataGrid';
import { ColumnInspector } from './components/ColumnInspector';
import { DataImportModal } from './components/DataImportModal';
import { Columns, Maximize2, SplitSquareVertical, Upload, FileText } from 'lucide-react';

export default function App() {
  const [dataset, setDataset] = useState<Dataset>(SAMPLE_DATASETS[0]);
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isSplitView, setIsSplitView] = useState(false);

  // Initialize primary chart config
  const defaultNumCol = dataset.columns.find((c) => c.type === 'number')?.key || dataset.columns[1]?.key || '';
  const defaultCatCol = dataset.columns.find((c) => c.type === 'string' || c.type === 'date')?.key || dataset.columns[0]?.key || '';

  const [chartConfig, setChartConfig] = useState<ChartConfig>({
    type: 'bar',
    xAxis: defaultCatCol,
    yAxis: defaultNumCol,
    aggregation: 'sum',
    colorPalette: 'indigo',
    stacked: false,
    showRegressionLine: true,
  });

  // Secondary chart config for split view
  const [secondaryConfig, setSecondaryConfig] = useState<ChartConfig>({
    type: 'donut',
    xAxis: defaultCatCol,
    yAxis: defaultNumCol,
    aggregation: 'sum',
    colorPalette: 'emerald',
  });

  // When dataset changes, ensure axes point to valid columns in new dataset
  const handleDatasetLoaded = (newDataset: Dataset) => {
    setDataset(newDataset);
    setSelectedCategories([]);

    const numCol = newDataset.columns.find((c) => c.type === 'number')?.key || newDataset.columns[1]?.key || '';
    const catCol = newDataset.columns.find((c) => c.type === 'string' || c.type === 'date')?.key || newDataset.columns[0]?.key || '';

    setChartConfig({
      type: 'bar',
      xAxis: catCol,
      yAxis: numCol,
      aggregation: 'sum',
      colorPalette: 'indigo',
      stacked: false,
      showRegressionLine: true,
    });

    setSecondaryConfig({
      type: 'donut',
      xAxis: catCol,
      yAxis: numCol,
      aggregation: 'sum',
      colorPalette: 'emerald',
    });
  };

  // Filter records based on selected categories if any
  const filteredRecords = useMemo(() => {
    if (selectedCategories.length === 0) return dataset.records;
    return dataset.records.filter((r) => {
      const val = String(r[chartConfig.xAxis] ?? '');
      return selectedCategories.includes(val);
    });
  }, [dataset.records, chartConfig.xAxis, selectedCategories]);

  // Aggregate data for Primary Chart
  const aggregatedData = useMemo(() => {
    return aggregateData(
      filteredRecords,
      chartConfig.xAxis,
      chartConfig.yAxis,
      chartConfig.aggregation,
      chartConfig.groupBy
    );
  }, [filteredRecords, chartConfig]);

  // Aggregate data for Secondary Chart
  const secondaryAggregatedData = useMemo(() => {
    return aggregateData(
      filteredRecords,
      secondaryConfig.xAxis,
      secondaryConfig.yAxis,
      secondaryConfig.aggregation,
      secondaryConfig.groupBy
    );
  }, [filteredRecords, secondaryConfig]);

  // All distinct values in current X axis for filtering
  const allXCategories = useMemo(() => {
    const set = new Set<string>();
    dataset.records.forEach((r) => {
      const val = r[chartConfig.xAxis];
      if (val !== null && val !== undefined) set.add(String(val));
    });
    return Array.from(set);
  }, [dataset.records, chartConfig.xAxis]);

  const toggleCategoryFilter = (cat: string) => {
    setSelectedCategories((prev) => {
      if (prev.length === 0) {
        // Start by deselecting this one
        return allXCategories.filter((c) => c !== cat);
      }
      if (prev.includes(cat)) {
        const next = prev.filter((c) => c !== cat);
        return next.length === 0 ? [] : next;
      } else {
        const next = [...prev, cat];
        return next.length === allXCategories.length ? [] : next;
      }
    });
  };

  const handleUpdateConfig = (updates: Partial<ChartConfig>) => {
    setChartConfig((prev) => ({ ...prev, ...updates }));
  };

  // Render chart view according to type
  const renderChart = (config: ChartConfig, data: typeof aggregatedData) => {
    const xMeta = dataset.columns.find((c) => c.key === config.xAxis);
    const yMeta = dataset.columns.find((c) => c.key === config.yAxis);

    switch (config.type) {
      case 'bar':
      case 'horizontal-bar':
        return (
          <BarChart
            data={data}
            config={config}
            xAxisLabel={xMeta?.label || config.xAxis}
            yAxisLabel={yMeta?.label || config.yAxis}
            onSelectCategory={(cat) => toggleCategoryFilter(cat)}
          />
        );
      case 'line':
      case 'area':
        return (
          <LineChart
            data={data}
            config={config}
            xAxisLabel={xMeta?.label || config.xAxis}
            yAxisLabel={yMeta?.label || config.yAxis}
          />
        );
      case 'scatter':
        return (
          <ScatterPlot
            records={filteredRecords}
            config={config}
            xKey={config.xAxis}
            yKey={config.yAxis}
            sizeKey={config.secondaryYAxis}
            groupKey={config.groupBy}
          />
        );
      case 'donut':
        return (
          <DonutChart
            data={data}
            config={config}
            onSelectCategory={(cat) => toggleCategoryFilter(cat)}
          />
        );
      case 'heatmap':
        return (
          <HeatmapMatrix
            records={filteredRecords}
            rowKey={config.xAxis}
            colKey={config.yAxis}
            valKey={config.groupBy || defaultNumCol}
            aggType={config.aggregation}
            colorPalette={config.colorPalette}
          />
        );
      case 'pivot':
        return (
          <PivotTable
            records={filteredRecords}
            rowKey={config.xAxis}
            colKey={config.yAxis}
            valKey={config.groupBy || defaultNumCol}
            aggType={config.aggregation}
          />
        );
      default:
        return (
          <BarChart
            data={data}
            config={config}
            xAxisLabel={xMeta?.label || config.xAxis}
            yAxisLabel={yMeta?.label || config.yAxis}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Bar strictly following contract */}
      <Header
        activeView={activeView}
        onNavigate={(v) => setActiveView(v)}
        onOpenImport={() => setIsImportModalOpen(true)}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Dataset Banner & Context strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-white border border-slate-200">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900">{dataset.name}</span>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-slate-500 font-mono tabular-nums">
                {dataset.records.length.toLocaleString()} total rows
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-slate-500 font-mono tabular-nums">
                {dataset.columns.length} columns
              </span>
            </div>
            <p className="text-xs text-slate-500 max-w-3xl">
              {dataset.description}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
            >
              <Upload className="h-3.5 w-3.5" />
              Replace / Import Data
            </button>
          </div>
        </div>

        {/* Dynamic Metric Overview Strip */}
        <MetricCards
          columns={dataset.columns}
          recordsCount={filteredRecords.length}
          totalAvailableCount={dataset.records.length}
        />

        {/* View Switcher Container */}
        {activeView === 'dashboard' && (
          <div className="space-y-6">
            {/* Interactive Dimension & Aggregator Toolbar */}
            <FilterToolbar
              columns={dataset.columns}
              config={chartConfig}
              onChangeConfig={handleUpdateConfig}
              allCategories={allXCategories}
              selectedCategories={selectedCategories}
              onToggleCategory={toggleCategoryFilter}
            />

            {/* Visualizer Display Canvas */}
            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    {chartConfig.aggregation.toUpperCase()} of {chartConfig.yAxis} by {chartConfig.xAxis}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <span>Chart: {chartConfig.type.toUpperCase()}</span>
                    {chartConfig.groupBy && (
                      <>
                        <span>·</span>
                        <span>Grouped by: {chartConfig.groupBy}</span>
                      </>
                    )}
                    {selectedCategories.length > 0 && (
                      <>
                        <span>·</span>
                        <span className="text-indigo-600 font-medium">
                          {selectedCategories.length} items filtered
                        </span>
                        <button
                          onClick={() => setSelectedCategories([])}
                          className="text-[11px] underline text-slate-500 hover:text-slate-800"
                        >
                          Clear filter
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsSplitView(!isSplitView)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border transition-colors ${
                      isSplitView
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <SplitSquareVertical className="h-3.5 w-3.5" />
                    <span>Compare View</span>
                  </button>
                </div>
              </div>

              {/* Chart Container: Single or Split Comparison */}
              {isSplitView ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Primary Visualizer */}
                  <div>
                    <div className="text-xs font-medium text-slate-600 mb-2">
                      Primary: {chartConfig.type.toUpperCase()}
                    </div>
                    {renderChart(chartConfig, aggregatedData)}
                  </div>

                  {/* Secondary Visualizer */}
                  <div className="border-t lg:border-t-0 lg:border-l border-slate-200 pt-6 lg:pt-0 lg:pl-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-slate-600">
                        Comparison Chart:
                      </span>
                      <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded text-xs">
                        <button
                          onClick={() => setSecondaryConfig((s) => ({ ...s, type: 'donut' }))}
                          className={`px-2 py-0.5 rounded text-[11px] ${
                            secondaryConfig.type === 'donut' ? 'bg-white font-medium text-slate-900 shadow-2xs' : 'text-slate-600'
                          }`}
                        >
                          Donut
                        </button>
                        <button
                          onClick={() => setSecondaryConfig((s) => ({ ...s, type: 'line' }))}
                          className={`px-2 py-0.5 rounded text-[11px] ${
                            secondaryConfig.type === 'line' ? 'bg-white font-medium text-slate-900 shadow-2xs' : 'text-slate-600'
                          }`}
                        >
                          Line
                        </button>
                        <button
                          onClick={() => setSecondaryConfig((s) => ({ ...s, type: 'horizontal-bar' }))}
                          className={`px-2 py-0.5 rounded text-[11px] ${
                            secondaryConfig.type === 'horizontal-bar' ? 'bg-white font-medium text-slate-900 shadow-2xs' : 'text-slate-600'
                          }`}
                        >
                          Bar
                        </button>
                      </div>
                    </div>
                    {renderChart(secondaryConfig, secondaryAggregatedData)}
                  </div>
                </div>
              ) : (
                renderChart(chartConfig, aggregatedData)
              )}
            </div>

            {/* Quick Data Grid Preview below the chart */}
            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-900">
                  Data Records Table
                </h3>
                <span className="text-xs text-slate-400 font-mono tabular-nums">
                  {filteredRecords.length} rows loaded
                </span>
              </div>
              <DataGrid records={filteredRecords} columns={dataset.columns} />
            </div>
          </div>
        )}

        {/* Data Records View */}
        {activeView === 'grid' && (
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-slate-900">
                Complete Data Records Explorer
              </h3>
              <p className="text-xs text-slate-500">
                Sort, search, filter, and inspect values across all {dataset.columns.length} detected columns.
              </p>
            </div>
            <DataGrid records={filteredRecords} columns={dataset.columns} />
          </div>
        )}

        {/* Schema / Columns View */}
        {activeView === 'columns' && (
          <ColumnInspector
            columns={dataset.columns}
            recordsCount={dataset.records.length}
            onSetAsX={(key) => {
              setChartConfig((c) => ({ ...c, xAxis: key }));
              setActiveView('dashboard');
            }}
            onSetAsY={(key) => {
              setChartConfig((c) => ({ ...c, yAxis: key }));
              setActiveView('dashboard');
            }}
          />
        )}

        {/* Sample Datasets Explorer View */}
        {activeView === 'datasets' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Curated Sample Datasets
              </h3>
              <p className="text-xs text-slate-500">
                Select a dataset to immediately explore different domain scenarios or load your own custom data.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {SAMPLE_DATASETS.map((s) => {
                const isCurrent = s.id === dataset.id;
                return (
                  <div
                    key={s.id}
                    className={`p-5 rounded-lg border bg-white flex flex-col justify-between transition-all ${
                      isCurrent ? 'border-slate-900 ring-1 ring-slate-900' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-slate-700" />
                        <h4 className="text-sm font-bold text-slate-900">{s.name}</h4>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {s.description}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-slate-400 font-mono pt-2">
                        <span>{s.records.length} rows</span>
                        <span>·</span>
                        <span>{s.columns.length} columns</span>
                      </div>
                    </div>

                    <div className="pt-4 mt-2 border-t border-slate-100">
                      {isCurrent ? (
                        <span className="text-xs font-semibold text-slate-900">
                          Active Dataset
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            handleDatasetLoaded(s);
                            setActiveView('dashboard');
                          }}
                          className="w-full py-1.5 text-center text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                        >
                          Activate Dataset
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Data Import & Paste Modal */}
      <DataImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onDatasetLoaded={handleDatasetLoaded}
        currentDatasetId={dataset.id}
      />
    </div>
  );
}

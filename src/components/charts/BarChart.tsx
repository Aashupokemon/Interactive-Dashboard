import React, { useState, useMemo } from 'react';
import { AggregationResult, COLOR_PALETTES, formatMetricValue } from '../../utils/aggregations';
import { ChartConfig } from '../../types/dataset';

interface BarChartProps {
  data: AggregationResult[];
  config: ChartConfig;
  xAxisLabel: string;
  yAxisLabel: string;
  onSelectCategory?: (category: string) => void;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  config,
  xAxisLabel,
  yAxisLabel,
  onSelectCategory,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoveredSubKey, setHoveredSubKey] = useState<string | null>(null);

  const palette = COLOR_PALETTES[config.colorPalette]?.colors || COLOR_PALETTES.indigo.colors;
  const isHorizontal = config.type === 'horizontal-bar';
  const isStacked = config.stacked;

  // Process sub-group keys if grouped
  const subKeys = useMemo(() => {
    const keys = new Set<string>();
    data.forEach((d) => {
      if (d.groupedValues) {
        Object.keys(d.groupedValues).forEach((k) => keys.add(k));
      }
    });
    return Array.from(keys);
  }, [data]);

  // Max value calculation
  const maxValue = useMemo(() => {
    if (data.length === 0) return 100;
    if (isStacked && subKeys.length > 0) {
      return Math.max(
        ...data.map((d) => {
          if (!d.groupedValues) return d.value;
          return Object.values(d.groupedValues).reduce((a, b) => a + b, 0);
        })
      );
    }
    if (subKeys.length > 0 && !isStacked) {
      let maxSub = 0;
      data.forEach((d) => {
        if (d.groupedValues) {
          Object.values(d.groupedValues).forEach((v) => {
            if (v > maxSub) maxSub = v;
          });
        }
      });
      return maxSub || Math.max(...data.map((d) => d.value));
    }
    return Math.max(...data.map((d) => d.value), 10);
  }, [data, isStacked, subKeys]);

  if (data.length === 0) {
    return (
      <div className="flex h-72 w-full flex-col items-center justify-center text-sm text-slate-500">
        <span>No matching data for this selection</span>
        <span className="text-xs text-slate-400 mt-1">Adjust your filters or change the selected axes</span>
      </div>
    );
  }

  // Dimensions
  const height = isHorizontal ? Math.max(340, data.length * 36 + 60) : 340;
  const padding = { top: 20, right: 28, bottom: isHorizontal ? 30 : 64, left: isHorizontal ? 120 : 65 };
  const chartWidth = 720;
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // Grid tick lines
  const tickCount = 5;
  const yTicks = Array.from({ length: tickCount + 1 }, (_, i) => {
    const ratio = i / tickCount;
    return {
      value: maxValue * ratio,
      yPos: plotHeight - plotHeight * ratio,
      xPos: plotWidth * ratio,
    };
  });

  return (
    <div className="relative w-full overflow-x-auto">
      {/* Sub-groups Legend if present */}
      {subKeys.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-slate-600">
          <span className="text-slate-400 font-medium">Series:</span>
          {subKeys.map((key, i) => (
            <div key={key} className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: palette[i % palette.length] }}
              />
              <span className="font-medium text-slate-700">{key}</span>
            </div>
          ))}
        </div>
      )}

      <svg
        viewBox={`0 0 ${chartWidth} ${height}`}
        className="w-full h-auto select-none overflow-visible"
        style={{ minWidth: 500 }}
      >
        <g transform={`translate(${padding.left}, ${padding.top})`}>
          {/* Background Gridlines */}
          {!isHorizontal
            ? yTicks.map((tick, i) => (
                <g key={i}>
                  <line
                    x1={0}
                    y1={tick.yPos}
                    x2={plotWidth}
                    y2={tick.yPos}
                    stroke="#E2E8F0"
                    strokeDasharray="3 3"
                    strokeWidth={1}
                  />
                  <text
                    x={-10}
                    y={tick.yPos + 4}
                    textAnchor="end"
                    className="text-[11px] fill-slate-400 font-mono tabular-nums"
                  >
                    {formatMetricValue(tick.value)}
                  </text>
                </g>
              ))
            : yTicks.map((tick, i) => (
                <g key={i}>
                  <line
                    x1={tick.xPos}
                    y1={0}
                    x2={tick.xPos}
                    y2={plotHeight}
                    stroke="#E2E8F0"
                    strokeDasharray="3 3"
                    strokeWidth={1}
                  />
                  <text
                    x={tick.xPos}
                    y={plotHeight + 18}
                    textAnchor="middle"
                    className="text-[11px] fill-slate-400 font-mono tabular-nums"
                  >
                    {formatMetricValue(tick.value)}
                  </text>
                </g>
              ))}

          {/* Vertical Bar Rendering */}
          {!isHorizontal && (
            <>
              {data.map((item, idx) => {
                const barSlotWidth = plotWidth / data.length;
                const barSpacing = Math.max(6, barSlotWidth * 0.2);
                const availableBarWidth = Math.min(48, barSlotWidth - barSpacing);
                const xCenter = idx * barSlotWidth + barSlotWidth / 2;
                const isHovered = hoveredIndex === idx;

                if (isStacked && subKeys.length > 0 && item.groupedValues) {
                  let currentY = plotHeight;
                  return (
                    <g
                      key={item.label}
                      className="cursor-pointer transition-opacity"
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      onClick={() => onSelectCategory?.(item.label)}
                    >
                      {subKeys.map((subK, sIdx) => {
                        const val = item.groupedValues?.[subK] || 0;
                        const barH = maxValue > 0 ? (val / maxValue) * plotHeight : 0;
                        currentY -= barH;
                        return (
                          <rect
                            key={subK}
                            x={xCenter - availableBarWidth / 2}
                            y={currentY}
                            width={availableBarWidth}
                            height={Math.max(0, barH)}
                            fill={palette[sIdx % palette.length]}
                            opacity={isHovered ? 0.95 : 0.85}
                            rx={sIdx === subKeys.length - 1 ? 2 : 0}
                            className="transition-all duration-150"
                          />
                        );
                      })}
                      {/* X label */}
                      <text
                        x={xCenter}
                        y={plotHeight + 18}
                        textAnchor="end"
                        transform={`rotate(-35, ${xCenter}, ${plotHeight + 18})`}
                        className={`text-[11px] transition-colors ${
                          isHovered ? 'fill-slate-900 font-medium' : 'fill-slate-500'
                        }`}
                      >
                        {item.label}
                      </text>
                    </g>
                  );
                }

                if (subKeys.length > 0 && !isStacked && item.groupedValues) {
                  const subBarWidth = Math.max(4, availableBarWidth / subKeys.length);
                  return (
                    <g
                      key={item.label}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      onClick={() => onSelectCategory?.(item.label)}
                    >
                      {subKeys.map((subK, sIdx) => {
                        const val = item.groupedValues?.[subK] || 0;
                        const barH = maxValue > 0 ? (val / maxValue) * plotHeight : 0;
                        const subX = xCenter - availableBarWidth / 2 + sIdx * subBarWidth;
                        return (
                          <rect
                            key={subK}
                            x={subX}
                            y={plotHeight - barH}
                            width={Math.max(2, subBarWidth - 2)}
                            height={Math.max(0, barH)}
                            fill={palette[sIdx % palette.length]}
                            opacity={isHovered ? 1 : 0.85}
                            rx={2}
                          />
                        );
                      })}
                      <text
                        x={xCenter}
                        y={plotHeight + 18}
                        textAnchor="end"
                        transform={`rotate(-35, ${xCenter}, ${plotHeight + 18})`}
                        className={`text-[11px] ${
                          isHovered ? 'fill-slate-900 font-medium' : 'fill-slate-500'
                        }`}
                      >
                        {item.label}
                      </text>
                    </g>
                  );
                }

                // Standard Single-Series Bar
                const barHeight = maxValue > 0 ? (item.value / maxValue) * plotHeight : 0;
                const barX = xCenter - availableBarWidth / 2;
                const barY = plotHeight - barHeight;

                return (
                  <g
                    key={item.label}
                    className="cursor-pointer group"
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onClick={() => onSelectCategory?.(item.label)}
                  >
                    {/* Hover column background strip */}
                    <rect
                      x={idx * barSlotWidth}
                      y={0}
                      width={barSlotWidth}
                      height={plotHeight}
                      fill={isHovered ? 'rgba(79, 70, 229, 0.04)' : 'transparent'}
                      className="transition-colors"
                    />
                    <rect
                      x={barX}
                      y={barY}
                      width={availableBarWidth}
                      height={Math.max(2, barHeight)}
                      fill={palette[idx % palette.length]}
                      rx={3}
                      opacity={isHovered ? 1 : 0.88}
                      className="transition-all duration-150"
                    />
                    <text
                      x={xCenter}
                      y={plotHeight + 18}
                      textAnchor="end"
                      transform={`rotate(-35, ${xCenter}, ${plotHeight + 18})`}
                      className={`text-[11px] transition-colors ${
                        isHovered ? 'fill-slate-900 font-medium' : 'fill-slate-500'
                      }`}
                    >
                      {item.label}
                    </text>
                  </g>
                );
              })}
            </>
          )}

          {/* Horizontal Bar Rendering */}
          {isHorizontal && (
            <>
              {data.map((item, idx) => {
                const barSlotHeight = plotHeight / data.length;
                const barSpacing = Math.max(4, barSlotHeight * 0.25);
                const barHeight = Math.min(28, barSlotHeight - barSpacing);
                const yCenter = idx * barSlotHeight + barSlotHeight / 2;
                const barWidth = maxValue > 0 ? (item.value / maxValue) * plotWidth : 0;
                const isHovered = hoveredIndex === idx;

                return (
                  <g
                    key={item.label}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onClick={() => onSelectCategory?.(item.label)}
                  >
                    {/* Hover row highlight */}
                    <rect
                      x={-padding.left + 10}
                      y={idx * barSlotHeight}
                      width={plotWidth + padding.left + padding.right - 10}
                      height={barSlotHeight}
                      fill={isHovered ? 'rgba(79, 70, 229, 0.04)' : 'transparent'}
                      className="transition-colors"
                    />
                    {/* Y label */}
                    <text
                      x={-12}
                      y={yCenter + 4}
                      textAnchor="end"
                      className={`text-[11px] transition-colors truncate ${
                        isHovered ? 'fill-slate-900 font-medium' : 'fill-slate-600'
                      }`}
                    >
                      {item.label.length > 16 ? `${item.label.slice(0, 15)}…` : item.label}
                    </text>
                    {/* Bar */}
                    <rect
                      x={0}
                      y={yCenter - barHeight / 2}
                      width={Math.max(2, barWidth)}
                      height={barHeight}
                      fill={palette[idx % palette.length]}
                      rx={3}
                      opacity={isHovered ? 1 : 0.85}
                      className="transition-all duration-150"
                    />
                    {/* Value label next to bar */}
                    <text
                      x={barWidth + 8}
                      y={yCenter + 4}
                      className="text-[11px] fill-slate-500 font-mono tabular-nums"
                    >
                      {formatMetricValue(item.value)}
                    </text>
                  </g>
                );
              })}
            </>
          )}

          {/* Axes Base Lines */}
          <line x1={0} y1={plotHeight} x2={plotWidth} y2={plotHeight} stroke="#CBD5E1" strokeWidth={1} />
          <line x1={0} y1={0} x2={0} y2={plotHeight} stroke="#CBD5E1" strokeWidth={1} />
        </g>
      </svg>

      {/* Floating Hover Tooltip */}
      {hoveredIndex !== null && data[hoveredIndex] && (
        <div className="pointer-events-none mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">{data[hoveredIndex].label}</span>
            <span className="text-slate-400">·</span>
            <span>{config.aggregation.toUpperCase()}: <span className="font-mono tabular-nums font-semibold text-slate-900">{formatMetricValue(data[hoveredIndex].value)}</span></span>
          </div>
          <div className="text-[11px] text-slate-500 font-mono tabular-nums">
            {data[hoveredIndex].count} records
          </div>
        </div>
      )}
    </div>
  );
};

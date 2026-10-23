import React, { useState, useMemo } from 'react';
import { AggregationResult, COLOR_PALETTES, formatMetricValue } from '../../utils/aggregations';
import { ChartConfig } from '../../types/dataset';

interface DonutChartProps {
  data: AggregationResult[];
  config: ChartConfig;
  onSelectCategory?: (category: string) => void;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  config,
  onSelectCategory,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const palette = COLOR_PALETTES[config.colorPalette]?.colors || COLOR_PALETTES.indigo.colors;

  // Process data: take top 7 and group remainder as "Other"
  const processedData = useMemo(() => {
    if (data.length <= 7) return data;
    const sorted = [...data].sort((a, b) => b.value - a.value);
    const top = sorted.slice(0, 6);
    const remainder = sorted.slice(6);
    const otherVal = remainder.reduce((sum, item) => sum + item.value, 0);
    const otherCount = remainder.reduce((sum, item) => sum + item.count, 0);

    return [
      ...top,
      {
        label: 'Other Categories',
        value: Number(otherVal.toFixed(2)),
        count: otherCount,
      },
    ];
  }, [data]);

  const totalValue = useMemo(() => {
    return processedData.reduce((sum, item) => sum + item.value, 0);
  }, [processedData]);

  if (processedData.length === 0 || totalValue === 0) {
    return (
      <div className="flex h-72 w-full flex-col items-center justify-center text-sm text-slate-500">
        <span>No positive distribution data available</span>
        <span className="text-xs text-slate-400 mt-1">Select a category column and numeric metric</span>
      </div>
    );
  }

  const size = 300;
  const strokeWidth = 38;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const innerRadius = radius - strokeWidth / 2;

  // Calculate arc angles
  let cumulativeAngle = -Math.PI / 2;
  const slices = processedData.map((item, idx) => {
    const fraction = totalValue > 0 ? item.value / totalValue : 0;
    const angle = fraction * 2 * Math.PI;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angle;
    cumulativeAngle = endAngle;

    const startX = center + radius * Math.cos(startAngle);
    const startY = center + radius * Math.sin(startAngle);
    const endX = center + radius * Math.cos(endAngle);
    const endY = center + radius * Math.sin(endAngle);
    const largeArcFlag = angle > Math.PI ? 1 : 0;

    const pathData = [
      `M ${startX} ${startY}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
    ].join(' ');

    return {
      item,
      fraction,
      percentage: (fraction * 100).toFixed(1),
      pathData,
      color: palette[idx % palette.length],
      idx,
    };
  });

  const activeSlice = hoveredIdx !== null ? slices[hoveredIdx] : null;

  return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-8 py-4">
      {/* Donut SVG */}
      <div className="relative shrink-0 select-none">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Base track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#F1F5F9"
            strokeWidth={strokeWidth}
          />
          {slices.map((slice) => {
            const isHovered = hoveredIdx === slice.idx;
            return (
              <path
                key={slice.item.label}
                d={slice.pathData}
                fill="none"
                stroke={slice.color}
                strokeWidth={isHovered ? strokeWidth + 6 : strokeWidth}
                strokeLinecap="round"
                className="cursor-pointer transition-all duration-200"
                style={{
                  transformOrigin: `${center}px ${center}px`,
                  filter: isHovered ? 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' : 'none',
                }}
                onMouseEnter={() => setHoveredIdx(slice.idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => onSelectCategory?.(slice.item.label)}
              />
            );
          })}
        </svg>

        {/* Center Text */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          {activeSlice ? (
            <>
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider truncate max-w-[140px]">
                {activeSlice.item.label}
              </span>
              <span className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                {formatMetricValue(activeSlice.item.value)}
              </span>
              <span className="text-xs font-mono text-slate-500">
                {activeSlice.percentage}%
              </span>
            </>
          ) : (
            <>
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Total Share
              </span>
              <span className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                {formatMetricValue(totalValue)}
              </span>
              <span className="text-[11px] text-slate-400">
                {processedData.length} categories
              </span>
            </>
          )}
        </div>
      </div>

      {/* Legend & Breakdown Table */}
      <div className="w-full max-w-sm space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-100 pb-1.5 font-medium">
          <span>Category</span>
          <div className="flex items-center gap-4">
            <span>Value</span>
            <span className="w-10 text-right">Share</span>
          </div>
        </div>
        {slices.map((slice) => {
          const isHovered = hoveredIdx === slice.idx;
          return (
            <div
              key={slice.item.label}
              className={`flex items-center justify-between text-xs py-1 px-1.5 rounded transition-colors cursor-pointer ${
                isHovered ? 'bg-slate-50' : 'hover:bg-slate-50/60'
              }`}
              onMouseEnter={() => setHoveredIdx(slice.idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              onClick={() => onSelectCategory?.(slice.item.label)}
            >
              <div className="flex items-center gap-2 truncate pr-2">
                <span
                  className="h-2.5 w-2.5 rounded-sm shrink-0"
                  style={{ backgroundColor: slice.color }}
                />
                <span className={`truncate ${isHovered ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                  {slice.item.label}
                </span>
              </div>
              <div className="flex items-center gap-4 shrink-0 font-mono tabular-nums">
                <span className="text-slate-900">{formatMetricValue(slice.item.value)}</span>
                <span className="w-10 text-right text-slate-500">{slice.percentage}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

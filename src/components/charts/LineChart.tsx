import React, { useState, useMemo } from 'react';
import { AggregationResult, COLOR_PALETTES, formatMetricValue } from '../../utils/aggregations';
import { ChartConfig } from '../../types/dataset';

interface LineChartProps {
  data: AggregationResult[];
  config: ChartConfig;
  xAxisLabel: string;
  yAxisLabel: string;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  config,
  xAxisLabel,
  yAxisLabel,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const palette = COLOR_PALETTES[config.colorPalette]?.colors || COLOR_PALETTES.indigo.colors;
  const isArea = config.type === 'area';

  const subKeys = useMemo(() => {
    const keys = new Set<string>();
    data.forEach((d) => {
      if (d.groupedValues) {
        Object.keys(d.groupedValues).forEach((k) => keys.add(k));
      }
    });
    return Array.from(keys);
  }, [data]);

  const { minValue, maxValue } = useMemo(() => {
    if (data.length === 0) return { minValue: 0, maxValue: 100 };
    let min = Infinity;
    let max = -Infinity;

    data.forEach((d) => {
      if (d.value < min) min = d.value;
      if (d.value > max) max = d.value;
      if (d.groupedValues) {
        Object.values(d.groupedValues).forEach((v) => {
          if (v < min) min = v;
          if (v > max) max = v;
        });
      }
    });

    if (min === Infinity) min = 0;
    if (max === -Infinity) max = 100;
    if (min > 0) min = 0; // standard baseline 0

    return { minValue: min, maxValue: max * 1.1 };
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="flex h-72 w-full flex-col items-center justify-center text-sm text-slate-500">
        <span>No data points for this line series</span>
        <span className="text-xs text-slate-400 mt-1">Adjust filters or select continuous date/numeric axes</span>
      </div>
    );
  }

  const height = 340;
  const chartWidth = 720;
  const padding = { top: 24, right: 28, bottom: 64, left: 65 };
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const tickCount = 5;
  const yTicks = Array.from({ length: tickCount + 1 }, (_, i) => {
    const ratio = i / tickCount;
    return {
      value: minValue + (maxValue - minValue) * ratio,
      yPos: plotHeight - plotHeight * ratio,
    };
  });

  const getX = (index: number) => {
    if (data.length <= 1) return plotWidth / 2;
    return (index / (data.length - 1)) * plotWidth;
  };

  const getY = (val: number) => {
    const range = maxValue - minValue || 1;
    return plotHeight - ((val - minValue) / range) * plotHeight;
  };

  // Generate SVG path for a series of values
  const generatePath = (values: number[]) => {
    if (values.length === 0) return '';
    return values
      .map((val, idx) => {
        const x = getX(idx);
        const y = getY(val);
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  };

  const generateAreaPath = (values: number[]) => {
    if (values.length === 0) return '';
    const linePath = values
      .map((val, idx) => {
        const x = getX(idx);
        const y = getY(val);
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
    const lastX = getX(values.length - 1);
    const firstX = getX(0);
    return `${linePath} L ${lastX.toFixed(1)} ${plotHeight} L ${firstX.toFixed(1)} ${plotHeight} Z`;
  };

  const primaryValues = data.map((d) => d.value);

  return (
    <div className="relative w-full overflow-x-auto">
      {/* Subkeys Legend */}
      {subKeys.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-slate-600">
          <span className="text-slate-400 font-medium">Series:</span>
          {subKeys.map((key, i) => (
            <div key={key} className="flex items-center gap-1.5">
              <span
                className="h-2 w-5 rounded-full"
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
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={palette[0]} stopOpacity="0.25" />
            <stop offset="100%" stopColor={palette[0]} stopOpacity="0.01" />
          </linearGradient>
        </defs>

        <g transform={`translate(${padding.left}, ${padding.top})`}>
          {/* Horizontal Gridlines */}
          {yTicks.map((tick, i) => (
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
          ))}

          {/* Area Fill for primary series */}
          {isArea && subKeys.length === 0 && (
            <path
              d={generateAreaPath(primaryValues)}
              fill="url(#areaGradient)"
              className="transition-all duration-300"
            />
          )}

          {/* Subgrouped Lines */}
          {subKeys.length > 0 ? (
            subKeys.map((subK, sIdx) => {
              const vals = data.map((d) => d.groupedValues?.[subK] || 0);
              const pathStr = generatePath(vals);
              const strokeColor = palette[sIdx % palette.length];

              return (
                <g key={subK}>
                  <path
                    d={pathStr}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-all duration-200"
                  />
                  {vals.map((v, idx) => (
                    <circle
                      key={idx}
                      cx={getX(idx)}
                      cy={getY(v)}
                      r={hoveredIdx === idx ? 5 : 3}
                      fill="#FFFFFF"
                      stroke={strokeColor}
                      strokeWidth={2}
                      className="transition-all duration-150"
                    />
                  ))}
                </g>
              );
            })
          ) : (
            <>
              {/* Primary Single Line */}
              <path
                d={generatePath(primaryValues)}
                fill="none"
                stroke={palette[0]}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-200"
              />
              {primaryValues.map((v, idx) => (
                <circle
                  key={idx}
                  cx={getX(idx)}
                  cy={getY(v)}
                  r={hoveredIdx === idx ? 5 : 3.5}
                  fill="#FFFFFF"
                  stroke={palette[0]}
                  strokeWidth={2}
                  className="transition-all duration-150"
                />
              ))}
            </>
          )}

          {/* Vertical Crosshair on Hover */}
          {hoveredIdx !== null && (
            <line
              x1={getX(hoveredIdx)}
              y1={0}
              x2={getX(hoveredIdx)}
              y2={plotHeight}
              stroke="#64748B"
              strokeDasharray="2 2"
              strokeWidth={1}
            />
          )}

          {/* X Axis Labels */}
          {data.map((item, idx) => {
            const x = getX(idx);
            // Hide every second label if too crowded
            const shouldRender = data.length <= 12 || idx % Math.ceil(data.length / 10) === 0;
            if (!shouldRender && idx !== data.length - 1) return null;

            return (
              <text
                key={idx}
                x={x}
                y={plotHeight + 18}
                textAnchor="end"
                transform={`rotate(-35, ${x}, ${plotHeight + 18})`}
                className="text-[11px] fill-slate-500 font-normal select-none"
              >
                {item.label}
              </text>
            );
          })}

          {/* Interactive invisible hover overlay slices */}
          {data.map((_, idx) => {
            const colWidth = plotWidth / (data.length - 1 || 1);
            const x = Math.max(0, getX(idx) - colWidth / 2);
            return (
              <rect
                key={idx}
                x={x}
                y={0}
                width={colWidth}
                height={plotHeight}
                fill="transparent"
                className="cursor-crosshair"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            );
          })}

          {/* Axes Base Lines */}
          <line x1={0} y1={plotHeight} x2={plotWidth} y2={plotHeight} stroke="#CBD5E1" strokeWidth={1} />
          <line x1={0} y1={0} x2={0} y2={plotHeight} stroke="#CBD5E1" strokeWidth={1} />
        </g>
      </svg>

      {/* Dynamic Hover Inspector */}
      {hoveredIdx !== null && data[hoveredIdx] && (
        <div className="pointer-events-none mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">{data[hoveredIdx].label}</span>
            <span className="text-slate-400">·</span>
            <span>
              {yAxisLabel}: <span className="font-mono tabular-nums font-semibold text-slate-900">{formatMetricValue(data[hoveredIdx].value)}</span>
            </span>
          </div>
          {subKeys.length > 0 && data[hoveredIdx].groupedValues && (
            <div className="flex items-center gap-3 font-mono text-[11px]">
              {subKeys.map((k, i) => (
                <span key={k} style={{ color: palette[i % palette.length] }}>
                  {k}: {formatMetricValue(data[hoveredIdx].groupedValues?.[k])}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { ChartConfig } from '../../types/dataset';
import { calculateLinearRegression, COLOR_PALETTES, formatMetricValue } from '../../utils/aggregations';

interface ScatterPlotProps {
  records: Record<string, any>[];
  config: ChartConfig;
  xKey: string;
  yKey: string;
  sizeKey?: string;
  groupKey?: string;
}

export const ScatterPlot: React.FC<ScatterPlotProps> = ({
  records,
  config,
  xKey,
  yKey,
  sizeKey,
  groupKey,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<any | null>(null);

  const palette = COLOR_PALETTES[config.colorPalette]?.colors || COLOR_PALETTES.indigo.colors;

  // Extract valid numerical points
  const points = useMemo(() => {
    return records
      .map((row) => {
        const rawX = Number(row[xKey]);
        const rawY = Number(row[yKey]);
        const rawSize = sizeKey ? Number(row[sizeKey]) : 1;
        const groupVal = groupKey ? String(row[groupKey] ?? 'General') : 'General';

        if (isNaN(rawX) || isNaN(rawY)) return null;
        return {
          x: rawX,
          y: rawY,
          size: isNaN(rawSize) ? 1 : rawSize,
          group: groupVal,
          rawRow: row,
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);
  }, [records, xKey, yKey, sizeKey, groupKey]);

  // Unique groups
  const groups = useMemo(() => {
    const set = new Set<string>();
    points.forEach((p) => set.add(p.group));
    return Array.from(set);
  }, [points]);

  // Bounds
  const { minX, maxX, minY, maxY, minSize, maxSize } = useMemo(() => {
    if (points.length === 0) return { minX: 0, maxX: 100, minY: 0, maxY: 100, minSize: 1, maxSize: 1 };
    let mx = Infinity, Mx = -Infinity, my = Infinity, My = -Infinity, ms = Infinity, Ms = -Infinity;
    points.forEach((p) => {
      if (p.x < mx) mx = p.x;
      if (p.x > Mx) Mx = p.x;
      if (p.y < my) my = p.y;
      if (p.y > My) My = p.y;
      if (p.size < ms) ms = p.size;
      if (p.size > Ms) Ms = p.size;
    });

    const xPad = (Mx - mx) * 0.08 || 1;
    const yPad = (My - my) * 0.08 || 1;

    return {
      minX: Math.max(0, mx - xPad),
      maxX: Mx + xPad,
      minY: Math.max(0, my - yPad),
      maxY: My + yPad,
      minSize: ms,
      maxSize: Ms,
    };
  }, [points]);

  // Linear Regression
  const regression = useMemo(() => {
    if (!config.showRegressionLine && config.showRegressionLine !== undefined) return null;
    return calculateLinearRegression(points.map((p) => ({ x: p.x, y: p.y })));
  }, [points, config.showRegressionLine]);

  if (points.length === 0) {
    return (
      <div className="flex h-72 w-full flex-col items-center justify-center text-sm text-slate-500">
        <span>Both X-axis and Y-axis must be numeric columns to render a Scatter Plot</span>
        <span className="text-xs text-slate-400 mt-1">Please select numeric dimensions in the control toolbar above</span>
      </div>
    );
  }

  const height = 340;
  const chartWidth = 720;
  const padding = { top: 24, right: 30, bottom: 50, left: 65 };
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const scaleX = (val: number) => {
    const range = maxX - minX || 1;
    return ((val - minX) / range) * plotWidth;
  };

  const scaleY = (val: number) => {
    const range = maxY - minY || 1;
    return plotHeight - ((val - minY) / range) * plotHeight;
  };

  const scaleRadius = (sizeVal: number) => {
    if (!sizeKey || minSize === maxSize) return 5;
    const norm = (sizeVal - minSize) / (maxSize - minSize || 1);
    return 3.5 + norm * 12;
  };

  const xTicks = Array.from({ length: 6 }, (_, i) => {
    const val = minX + (maxX - minX) * (i / 5);
    return { val, x: scaleX(val) };
  });

  const yTicks = Array.from({ length: 5 }, (_, i) => {
    const val = minY + (maxY - minY) * (i / 4);
    return { val, y: scaleY(val) };
  });

  return (
    <div className="relative w-full overflow-x-auto">
      {/* Header Info / Regression details & Group Legend */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
        {groups.length > 1 && (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-slate-400 font-medium">Cohort / Group:</span>
            {groups.map((grp, i) => (
              <div key={grp} className="flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: palette[i % palette.length] }}
                />
                <span className="font-medium text-slate-700">{grp}</span>
              </div>
            ))}
          </div>
        )}

        {regression && (
          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
            <span>Regression: y = {regression.slope.toFixed(2)}x {regression.intercept >= 0 ? '+' : '-'} {Math.abs(regression.intercept).toFixed(1)}</span>
            <span>·</span>
            <span>R² = {regression.rSquared.toFixed(3)}</span>
          </div>
        )}
      </div>

      <svg
        viewBox={`0 0 ${chartWidth} ${height}`}
        className="w-full h-auto select-none overflow-visible"
        style={{ minWidth: 500 }}
      >
        <g transform={`translate(${padding.left}, ${padding.top})`}>
          {/* Horizontal Gridlines */}
          {yTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={0}
                y1={tick.y}
                x2={plotWidth}
                y2={tick.y}
                stroke="#E2E8F0"
                strokeDasharray="3 3"
                strokeWidth={1}
              />
              <text
                x={-10}
                y={tick.y + 4}
                textAnchor="end"
                className="text-[11px] fill-slate-400 font-mono tabular-nums"
              >
                {formatMetricValue(tick.val)}
              </text>
            </g>
          ))}

          {/* Vertical Gridlines */}
          {xTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={tick.x}
                y1={0}
                x2={tick.x}
                y2={plotHeight}
                stroke="#E2E8F0"
                strokeDasharray="3 3"
                strokeWidth={1}
              />
              <text
                x={tick.x}
                y={plotHeight + 18}
                textAnchor="middle"
                className="text-[11px] fill-slate-400 font-mono tabular-nums"
              >
                {formatMetricValue(tick.val)}
              </text>
            </g>
          ))}

          {/* Regression Line */}
          {regression && (
            <line
              x1={scaleX(regression.minX)}
              y1={scaleY(regression.slope * regression.minX + regression.intercept)}
              x2={scaleX(regression.maxX)}
              y2={scaleY(regression.slope * regression.maxX + regression.intercept)}
              stroke="#64748B"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              opacity={0.8}
            />
          )}

          {/* Points */}
          {points.map((p, idx) => {
            const cx = scaleX(p.x);
            const cy = scaleY(p.y);
            const r = scaleRadius(p.size);
            const groupIdx = groups.indexOf(p.group);
            const color = palette[groupIdx >= 0 ? groupIdx % palette.length : 0];
            const isHovered = hoveredPoint === p;

            return (
              <circle
                key={idx}
                cx={cx}
                cy={cy}
                r={isHovered ? r + 3 : r}
                fill={color}
                fillOpacity={isHovered ? 0.95 : 0.7}
                stroke="#FFFFFF"
                strokeWidth={1.5}
                className="cursor-pointer transition-all duration-150"
                onMouseEnter={() => setHoveredPoint(p)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            );
          })}

          {/* Axes Base Lines */}
          <line x1={0} y1={plotHeight} x2={plotWidth} y2={plotHeight} stroke="#CBD5E1" strokeWidth={1} />
          <line x1={0} y1={0} x2={0} y2={plotHeight} stroke="#CBD5E1" strokeWidth={1} />
        </g>
      </svg>

      {/* Point Inspector Bar */}
      {hoveredPoint && (
        <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">{hoveredPoint.group}</span>
            <span className="text-slate-400">·</span>
            <span>{xKey}: <span className="font-mono tabular-nums font-semibold text-slate-900">{formatMetricValue(hoveredPoint.x)}</span></span>
            <span className="text-slate-400">·</span>
            <span>{yKey}: <span className="font-mono tabular-nums font-semibold text-slate-900">{formatMetricValue(hoveredPoint.y)}</span></span>
            {sizeKey && (
              <>
                <span className="text-slate-400">·</span>
                <span>{sizeKey}: <span className="font-mono tabular-nums">{formatMetricValue(hoveredPoint.size)}</span></span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { AggregationType } from '../../types/dataset';
import { computeAggregation, formatMetricValue } from '../../utils/aggregations';

interface HeatmapMatrixProps {
  records: Record<string, any>[];
  rowKey: string;
  colKey: string;
  valKey: string;
  aggType: AggregationType;
  colorPalette?: string;
}

export const HeatmapMatrix: React.FC<HeatmapMatrixProps> = ({
  records,
  rowKey,
  colKey,
  valKey,
  aggType,
  colorPalette = 'indigo',
}) => {
  const [hoveredCell, setHoveredCell] = useState<{ row: string; col: string; val: number; count: number } | null>(null);

  // Extract unique rows and cols
  const { rowHeaders, colHeaders, matrix, maxVal, minVal } = useMemo(() => {
    const rowSet = new Set<string>();
    const colSet = new Set<string>();
    const cellMap = new Map<string, number[]>();

    for (const r of records) {
      const rowVal = String(r[rowKey] ?? '(Blank)');
      const colVal = String(r[colKey] ?? '(Blank)');
      const metric = Number(r[valKey]);

      rowSet.add(rowVal);
      colSet.add(colVal);

      const cellKey = `${rowVal}___${colVal}`;
      if (!cellMap.has(cellKey)) {
        cellMap.set(cellKey, []);
      }
      cellMap.get(cellKey)!.push(isNaN(metric) ? 1 : metric);
    }

    const rHeaders = Array.from(rowSet).slice(0, 15);
    const cHeaders = Array.from(colSet).slice(0, 15);

    let max = -Infinity;
    let min = Infinity;
    const computedMatrix: Record<string, Record<string, { val: number; count: number }>> = {};

    rHeaders.forEach((r) => {
      computedMatrix[r] = {};
      cHeaders.forEach((c) => {
        const vals = cellMap.get(`${r}___${c}`) || [];
        const aggregated = vals.length > 0 ? computeAggregation(vals, aggType) : 0;
        computedMatrix[r][c] = { val: aggregated, count: vals.length };
        if (aggregated > max) max = aggregated;
        if (aggregated < min) min = aggregated;
      });
    });

    return {
      rowHeaders: rHeaders,
      colHeaders: cHeaders,
      matrix: computedMatrix,
      maxVal: max === -Infinity ? 100 : max,
      minVal: min === Infinity ? 0 : min,
    };
  }, [records, rowKey, colKey, valKey, aggType]);

  if (rowHeaders.length === 0 || colHeaders.length === 0) {
    return (
      <div className="flex h-72 w-full flex-col items-center justify-center text-sm text-slate-500">
        <span>Insufficient categorical dimensions to construct a matrix</span>
        <span className="text-xs text-slate-400 mt-1">Select row and column dimensions from the toolbar</span>
      </div>
    );
  }

  // Color interpolation
  const getCellBg = (val: number, count: number) => {
    if (count === 0) return 'bg-slate-50 text-slate-300';
    const range = maxVal - minVal || 1;
    const norm = Math.max(0, Math.min(1, (val - minVal) / range));

    // Tailwind-like color step interpolation
    if (norm < 0.2) return 'bg-indigo-50 text-indigo-900';
    if (norm < 0.4) return 'bg-indigo-100 text-indigo-900';
    if (norm < 0.6) return 'bg-indigo-200 text-indigo-950 font-medium';
    if (norm < 0.8) return 'bg-indigo-400 text-white font-medium';
    return 'bg-indigo-600 text-white font-semibold';
  };

  return (
    <div className="w-full space-y-3">
      {/* Matrix Controls & Legend */}
      <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Matrix:</span>
          <span>{rowKey} (Rows)</span>
          <span className="text-slate-300">×</span>
          <span>{colKey} (Columns)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400">Low ({formatMetricValue(minVal)})</span>
          <div className="flex h-2.5 w-24 rounded overflow-hidden">
            <span className="h-full w-1/4 bg-indigo-50" />
            <span className="h-full w-1/4 bg-indigo-200" />
            <span className="h-full w-1/4 bg-indigo-400" />
            <span className="h-full w-1/4 bg-indigo-600" />
          </div>
          <span className="text-[11px] text-slate-400">High ({formatMetricValue(maxVal)})</span>
        </div>
      </div>

      {/* Grid container */}
      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="p-3 font-semibold text-slate-600 sticky left-0 bg-slate-50 z-10 w-44">
                {rowKey}
              </th>
              {colHeaders.map((col) => (
                <th key={col} className="p-3 font-semibold text-slate-600 text-right min-w-[90px]">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowHeaders.map((row) => (
              <tr key={row} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50">
                <td className="p-3 font-medium text-slate-800 sticky left-0 bg-white z-10 border-r border-slate-100 truncate max-w-[170px]">
                  {row}
                </td>
                {colHeaders.map((col) => {
                  const cell = matrix[row]?.[col] || { val: 0, count: 0 };
                  const colorClass = getCellBg(cell.val, cell.count);
                  const isHovered = hoveredCell?.row === row && hoveredCell?.col === col;

                  return (
                    <td
                      key={col}
                      className={`p-2.5 text-right font-mono tabular-nums transition-all cursor-pointer ${colorClass} ${
                        isHovered ? 'ring-2 ring-indigo-500 ring-inset z-20' : ''
                      }`}
                      onMouseEnter={() => setHoveredCell({ row, col, val: cell.val, count: cell.count })}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      {cell.count > 0 ? formatMetricValue(cell.val) : '—'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Hover Inspect Banner */}
      {hoveredCell && (
        <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-900">{hoveredCell.row}</span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-700">{hoveredCell.col}</span>
            <span className="text-slate-400">·</span>
            <span>
              {aggType.toUpperCase()} of {valKey}:{' '}
              <span className="font-mono tabular-nums font-semibold text-slate-900">
                {formatMetricValue(hoveredCell.val)}
              </span>
            </span>
          </div>
          <span className="font-mono text-[11px] text-slate-400">
            {hoveredCell.count} sample {hoveredCell.count === 1 ? 'row' : 'rows'}
          </span>
        </div>
      )}
    </div>
  );
};

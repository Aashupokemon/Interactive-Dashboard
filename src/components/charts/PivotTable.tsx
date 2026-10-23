import React, { useMemo } from 'react';
import { AggregationType } from '../../types/dataset';
import { computeAggregation, formatMetricValue } from '../../utils/aggregations';

interface PivotTableProps {
  records: Record<string, any>[];
  rowKey: string;
  colKey: string;
  valKey: string;
  aggType: AggregationType;
}

export const PivotTable: React.FC<PivotTableProps> = ({
  records,
  rowKey,
  colKey,
  valKey,
  aggType,
}) => {
  const { rowHeaders, colHeaders, dataMatrix, rowTotals, colTotals, grandTotal } = useMemo(() => {
    const rowSet = new Set<string>();
    const colSet = new Set<string>();
    const cellMap = new Map<string, number[]>();
    const allValues: number[] = [];

    records.forEach((r) => {
      const rVal = String(r[rowKey] ?? '(Blank)');
      const cVal = String(r[colKey] ?? '(Blank)');
      const v = Number(r[valKey]);

      rowSet.add(rVal);
      colSet.add(cVal);

      const cellKey = `${rVal}___${cVal}`;
      if (!cellMap.has(cellKey)) cellMap.set(cellKey, []);

      const validNum = isNaN(v) ? 1 : v;
      cellMap.get(cellKey)!.push(validNum);
      allValues.push(validNum);
    });

    const rList = Array.from(rowSet).slice(0, 20);
    const cList = Array.from(colSet).slice(0, 15);

    const matrix: Record<string, Record<string, number>> = {};
    const rTotals: Record<string, number> = {};
    const cValuesMap: Record<string, number[]> = {};

    cList.forEach((c) => (cValuesMap[c] = []));

    rList.forEach((r) => {
      matrix[r] = {};
      const rowVals: number[] = [];

      cList.forEach((c) => {
        const vals = cellMap.get(`${r}___${c}`) || [];
        const res = vals.length > 0 ? computeAggregation(vals, aggType) : 0;
        matrix[r][c] = res;
        if (vals.length > 0) {
          rowVals.push(...vals);
          cValuesMap[c].push(...vals);
        }
      });

      rTotals[r] = rowVals.length > 0 ? computeAggregation(rowVals, aggType) : 0;
    });

    const cTotals: Record<string, number> = {};
    cList.forEach((c) => {
      cTotals[c] = cValuesMap[c].length > 0 ? computeAggregation(cValuesMap[c], aggType) : 0;
    });

    const gTotal = allValues.length > 0 ? computeAggregation(allValues, aggType) : 0;

    return {
      rowHeaders: rList,
      colHeaders: cList,
      dataMatrix: matrix,
      rowTotals: rTotals,
      colTotals: cTotals,
      grandTotal: gTotal,
    };
  }, [records, rowKey, colKey, valKey, aggType]);

  if (rowHeaders.length === 0 || colHeaders.length === 0) {
    return (
      <div className="flex h-72 w-full flex-col items-center justify-center text-sm text-slate-500">
        <span>Select Row Dimension, Column Dimension, and a Metric for Pivot Analysis</span>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200 text-slate-700">
              <th className="p-3 font-semibold sticky left-0 bg-slate-100 z-10 w-44">
                {rowKey} \ {colKey}
              </th>
              {colHeaders.map((col) => (
                <th key={col} className="p-3 font-semibold text-right min-w-[95px]">
                  {col}
                </th>
              ))}
              <th className="p-3 font-semibold text-right bg-slate-200/60 min-w-[100px]">
                Total ({aggType.toUpperCase()})
              </th>
            </tr>
          </thead>
          <tbody>
            {rowHeaders.map((r) => (
              <tr key={r} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/70">
                <td className="p-3 font-medium text-slate-800 sticky left-0 bg-white z-10 border-r border-slate-100 truncate max-w-[170px]">
                  {r}
                </td>
                {colHeaders.map((c) => {
                  const val = dataMatrix[r]?.[c] ?? 0;
                  return (
                    <td key={c} className="p-2.5 text-right font-mono tabular-nums text-slate-700">
                      {val !== 0 ? formatMetricValue(val) : '—'}
                    </td>
                  );
                })}
                <td className="p-2.5 text-right font-mono tabular-nums font-semibold bg-slate-50 text-slate-900 border-l border-slate-200">
                  {formatMetricValue(rowTotals[r])}
                </td>
              </tr>
            ))}
            {/* Grand Summary Bottom Row */}
            <tr className="bg-slate-100/80 font-semibold border-t-2 border-slate-300 text-slate-900">
              <td className="p-3 sticky left-0 bg-slate-100 z-10">
                Total ({aggType.toUpperCase()})
              </td>
              {colHeaders.map((c) => (
                <td key={c} className="p-2.5 text-right font-mono tabular-nums">
                  {formatMetricValue(colTotals[c])}
                </td>
              ))}
              <td className="p-2.5 text-right font-mono tabular-nums font-bold bg-slate-200 text-slate-950 border-l border-slate-300">
                {formatMetricValue(grandTotal)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

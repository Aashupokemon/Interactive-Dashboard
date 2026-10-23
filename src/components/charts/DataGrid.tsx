import React, { useState, useMemo } from 'react';
import { ColumnMeta } from '../../types/dataset';
import { ArrowDown, ArrowUp, ArrowUpDown, Download, Search } from 'lucide-react';
import { exportToCSV } from '../../utils/dataParser';
import { formatMetricValue } from '../../utils/aggregations';

interface DataGridProps {
  records: Record<string, any>[];
  columns: ColumnMeta[];
  onOpenColumnStats?: (column: ColumnMeta) => void;
}

export const DataGrid: React.FC<DataGridProps> = ({
  records,
  columns,
  onOpenColumnStats,
}) => {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Filter records by search
  const filteredRecords = useMemo(() => {
    if (!search.trim()) return records;
    const q = search.toLowerCase();
    return records.filter((r) =>
      Object.values(r).some((v) => v !== null && v !== undefined && String(v).toLowerCase().includes(q))
    );
  }, [records, search]);

  // Sort
  const sortedRecords = useMemo(() => {
    if (!sortKey) return filteredRecords;
    return [...filteredRecords].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDir === 'asc' ? valA - valB : valB - valA;
      }
      return sortDir === 'asc'
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [filteredRecords, sortKey, sortDir]);

  // Pagination
  const totalPages = Math.ceil(sortedRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedRecords.slice(start, start + pageSize);
  }, [sortedRecords, page, pageSize]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDir === 'asc') setSortDir('desc');
      else {
        setSortKey(null);
        setSortDir('asc');
      }
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const handleExportCSV = () => {
    const csvStr = exportToCSV(sortedRecords);
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `dataset_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full space-y-3">
      {/* Search and Table Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative flex items-center min-w-[240px]">
          <Search className="absolute left-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search records across all fields..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-8 pr-3 py-1.5 rounded-md border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-slate-500 font-mono tabular-nums">
            Showing {filteredRecords.length.toLocaleString()} of {records.length.toLocaleString()} records
          </span>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* High-Density Data Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <th className="py-2.5 px-3 w-12 text-slate-400 font-mono">#</th>
              {columns.map((col) => {
                const isSorted = sortKey === col.key;
                const isNum = col.type === 'number';

                return (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className={`py-2.5 px-3 font-semibold select-none cursor-pointer transition-colors hover:bg-slate-100 ${
                      isNum ? 'text-right' : 'text-left'
                    }`}
                  >
                    <div className={`inline-flex items-center gap-1.5 ${isNum ? 'justify-end w-full' : ''}`}>
                      <span className="truncate max-w-[140px]">{col.label}</span>
                      <span className="text-slate-400 text-[10px] font-normal uppercase">
                        {col.type === 'number' ? '#' : col.type === 'date' ? 'date' : 'abc'}
                      </span>
                      {isSorted ? (
                        sortDir === 'asc' ? (
                          <ArrowUp className="h-3 w-3 text-slate-900" />
                        ) : (
                          <ArrowDown className="h-3 w-3 text-slate-900" />
                        )
                      ) : (
                        <ArrowUpDown className="h-2.5 w-2.5 text-slate-300 opacity-0 group-hover:opacity-100" />
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedRecords.length > 0 ? (
              paginatedRecords.map((row, rIdx) => {
                const absoluteIdx = (page - 1) * pageSize + rIdx + 1;
                return (
                  <tr
                    key={rIdx}
                    className="hover:bg-slate-50/70 transition-colors h-[38px]"
                  >
                    <td className="py-2 px-3 text-slate-400 font-mono tabular-nums text-[11px]">
                      {absoluteIdx}
                    </td>
                    {columns.map((col) => {
                      const val = row[col.key];
                      const isNum = col.type === 'number';
                      const formatted = isNum && typeof val === 'number' ? formatMetricValue(val) : String(val ?? '—');

                      return (
                        <td
                          key={col.key}
                          className={`py-2 px-3 truncate max-w-[200px] ${
                            isNum ? 'text-right font-mono tabular-nums text-slate-800' : 'text-slate-700'
                          }`}
                        >
                          {val === null || val === undefined ? (
                            <span className="text-slate-300">null</span>
                          ) : (
                            formatted
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="py-12 text-center text-sm text-slate-400"
                >
                  No records match your query
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:outline-none"
          >
            <option value={15}>15</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono tabular-nums">
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-2.5 py-1 rounded border border-slate-200 bg-white text-slate-700 disabled:opacity-40 hover:bg-slate-50 transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-2.5 py-1 rounded border border-slate-200 bg-white text-slate-700 disabled:opacity-40 hover:bg-slate-50 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

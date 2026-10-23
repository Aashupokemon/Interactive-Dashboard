import Papa from 'papaparse';
import { ColumnMeta, ColumnType, Dataset } from '../types/dataset';

/**
 * Clean and coerce a value based on heuristic checks
 */
function cleanValue(val: any): any {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number') return isNaN(val) ? null : val;
  if (typeof val === 'boolean') return val;

  const str = String(val).trim();
  if (str === '' || str.toLowerCase() === 'null' || str.toLowerCase() === 'na' || str.toLowerCase() === 'n/a') {
    return null;
  }

  // Boolean check
  if (str.toLowerCase() === 'true' || str.toLowerCase() === 'yes') return true;
  if (str.toLowerCase() === 'false' || str.toLowerCase() === 'no') return false;

  // Number with currency or comma: e.g. "$1,240.50" or "45.5%"
  const cleanNumStr = str.replace(/^[$\u20AC\u00A3\u00A5]/, '').replace(/,/g, '').replace(/%$/, '').trim();
  if (cleanNumStr !== '' && !isNaN(Number(cleanNumStr)) && !str.includes('/') && !str.includes('-')) {
    // avoid dates like 2024-01-01 being parsed as numbers or 01/02
    return Number(cleanNumStr);
  }

  // Date check
  if (str.length >= 8 && (str.includes('-') || str.includes('/')) && !isNaN(Date.parse(str))) {
    const d = new Date(str);
    if (!isNaN(d.getTime()) && d.getFullYear() > 1970 && d.getFullYear() < 2100) {
      return str;
    }
  }

  return str;
}

/**
 * Infer the predominant column type and calculate statistics
 */
export function analyzeColumns(records: Record<string, any>[]): ColumnMeta[] {
  if (records.length === 0) return [];

  const keys = Object.keys(records[0] || {});
  return keys.map((key) => {
    let numCount = 0;
    let strCount = 0;
    let dateCount = 0;
    let boolCount = 0;
    let nullCount = 0;

    const values: any[] = [];
    const numValues: number[] = [];

    for (const row of records) {
      const v = row[key];
      if (v === null || v === undefined || v === '') {
        nullCount++;
        continue;
      }

      values.push(v);
      if (typeof v === 'number') {
        numCount++;
        numValues.push(v);
      } else if (typeof v === 'boolean') {
        boolCount++;
      } else if (typeof v === 'string') {
        if (!isNaN(Date.parse(v)) && (v.includes('-') || v.includes('/')) && isNaN(Number(v))) {
          dateCount++;
        } else {
          strCount++;
        }
      }
    }

    // Determine type by majority
    let type: ColumnType = 'string';
    if (numCount >= Math.max(strCount, dateCount, boolCount) && numCount > 0) {
      type = 'number';
    } else if (dateCount > Math.max(strCount, boolCount)) {
      type = 'date';
    } else if (boolCount > strCount) {
      type = 'boolean';
    }

    const uniqueValues = Array.from(new Set(values));
    const distinctCount = uniqueValues.length;
    const sampleValues = uniqueValues.slice(0, 5);

    let min: number | undefined;
    let max: number | undefined;
    let sum: number | undefined;
    let avg: number | undefined;
    let median: number | undefined;

    if (type === 'number' && numValues.length > 0) {
      numValues.sort((a, b) => a - b);
      min = numValues[0];
      max = numValues[numValues.length - 1];
      sum = numValues.reduce((acc, curr) => acc + curr, 0);
      avg = sum / numValues.length;

      const mid = Math.floor(numValues.length / 2);
      median = numValues.length % 2 !== 0 ? numValues[mid] : (numValues[mid - 1] + numValues[mid]) / 2;
    }

    // Nice human-friendly label
    const label = key
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim();

    return {
      key,
      label,
      type,
      distinctCount,
      sampleValues,
      min,
      max,
      sum,
      avg: avg !== undefined ? Number(avg.toFixed(2)) : undefined,
      median: median !== undefined ? Number(median.toFixed(2)) : undefined,
      nullCount,
    };
  });
}

/**
 * Parse CSV or TSV raw text into records and ColumnMeta
 */
export function parseCSV(rawText: string, name: string = 'Imported Dataset'): Dataset {
  const result = Papa.parse<Record<string, any>>(rawText.trim(), {
    header: true,
    dynamicTyping: false,
    skipEmptyLines: true,
  });

  if (result.errors.length > 0 && result.data.length === 0) {
    throw new Error(result.errors[0].message || 'Failed to parse CSV');
  }

  const cleanedRecords = result.data.map((row) => {
    const cleanedRow: Record<string, any> = {};
    for (const [k, v] of Object.entries(row)) {
      const trimmedKey = k.trim();
      if (trimmedKey) {
        cleanedRow[trimmedKey] = cleanValue(v);
      }
    }
    return cleanedRow;
  });

  const columns = analyzeColumns(cleanedRecords);

  return {
    id: `dataset-${Date.now()}`,
    name,
    description: `Contains ${cleanedRecords.length} records across ${columns.length} columns`,
    records: cleanedRecords,
    columns,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Parse JSON text (array of objects)
 */
export function parseJSON(rawText: string, name: string = 'Imported JSON Dataset'): Dataset {
  const parsed = JSON.parse(rawText);
  let arrayData: any[] = [];

  if (Array.isArray(parsed)) {
    arrayData = parsed;
  } else if (typeof parsed === 'object' && parsed !== null) {
    // Check if there is an array property inside like { data: [...] } or { items: [...] }
    const possibleArray = Object.values(parsed).find((val) => Array.isArray(val));
    if (possibleArray && Array.isArray(possibleArray)) {
      arrayData = possibleArray;
    } else {
      arrayData = [parsed];
    }
  } else {
    throw new Error('JSON must be an array of objects');
  }

  if (arrayData.length === 0 || typeof arrayData[0] !== 'object') {
    throw new Error('JSON array must contain objects with key-value pairs');
  }

  const cleanedRecords = arrayData.map((row) => {
    const cleanedRow: Record<string, any> = {};
    for (const [k, v] of Object.entries(row)) {
      cleanedRow[k.trim()] = cleanValue(v);
    }
    return cleanedRow;
  });

  const columns = analyzeColumns(cleanedRecords);

  return {
    id: `dataset-${Date.now()}`,
    name,
    description: `Contains ${cleanedRecords.length} records across ${columns.length} columns`,
    records: cleanedRecords,
    columns,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Export records to CSV string
 */
export function exportToCSV(records: Record<string, any>[]): string {
  return Papa.unparse(records);
}

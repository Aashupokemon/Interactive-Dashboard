import React, { useState } from 'react';
import { Dataset } from '../types/dataset';
import { parseCSV, parseJSON } from '../utils/dataParser';
import { SAMPLE_DATASETS } from '../data/sampleDatasets';
import { Check, FileText, Upload, X } from 'lucide-react';

interface DataImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDatasetLoaded: (dataset: Dataset) => void;
  currentDatasetId: string;
}

export const DataImportModal: React.FC<DataImportModalProps> = ({
  isOpen,
  onClose,
  onDatasetLoaded,
  currentDatasetId,
}) => {
  const [activeTab, setActiveTab] = useState<'paste' | 'upload' | 'samples'>('paste');
  const [pastedContent, setPastedContent] = useState('');
  const [datasetName, setDatasetName] = useState('My Custom Dataset');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleParseAndLoad = () => {
    if (!pastedContent.trim()) {
      setErrorMsg('Please paste CSV, TSV, or JSON data first.');
      return;
    }

    setErrorMsg(null);
    setIsProcessing(true);

    try {
      const trimmed = pastedContent.trim();
      let parsed: Dataset;
      if (trimmed.startsWith('[') || (trimmed.startsWith('{') && trimmed.includes('['))) {
        parsed = parseJSON(trimmed, datasetName || 'Custom JSON Data');
      } else {
        parsed = parseCSV(trimmed, datasetName || 'Custom CSV Data');
      }

      if (parsed.records.length === 0) {
        throw new Error('No valid records could be extracted from the provided data.');
      }

      onDatasetLoaded(parsed);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to parse data. Ensure valid CSV headers or JSON array format.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      try {
        const isJson = file.name.endsWith('.json') || text.trim().startsWith('[');
        const parsed = isJson
          ? parseJSON(text, file.name.replace(/\.[^/.]+$/, ''))
          : parseCSV(text, file.name.replace(/\.[^/.]+$/, ''));

        onDatasetLoaded(parsed);
        onClose();
      } catch (err: any) {
        setErrorMsg(`Failed to parse ${file.name}: ${err.message}`);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.onerror = () => {
      setErrorMsg('Error reading selected file');
      setIsProcessing(false);
    };
    reader.readAsText(file);
  };

  const loadPreset = (dataset: Dataset) => {
    onDatasetLoaded(dataset);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Load & Visualize Dataset
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Paste or upload your data to immediately populate the interactive visualizer.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50 text-xs font-medium">
          <button
            onClick={() => setActiveTab('paste')}
            className={`py-2.5 px-4 border-b-2 transition-colors ${
              activeTab === 'paste'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Paste CSV or JSON
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`py-2.5 px-4 border-b-2 transition-colors ${
              activeTab === 'upload'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Upload File (.csv, .json)
          </button>
          <button
            onClick={() => setActiveTab('samples')}
            className={`py-2.5 px-4 border-b-2 transition-colors ${
              activeTab === 'samples'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Curated Sample Datasets
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              {errorMsg}
            </div>
          )}

          {activeTab === 'paste' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Dataset Name
                </label>
                <input
                  type="text"
                  value={datasetName}
                  onChange={(e) => setDatasetName(e.target.value)}
                  placeholder="e.g., Q3 User Analytics"
                  className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-700">
                    Raw Data (CSV or JSON array)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setPastedContent(
                          `Product,Quarter,Sales,Units,Return_Rate\nMacBook Pro,Q1,124000,62,1.2\nDell XPS,Q1,84000,48,2.4\nThinkPad X1,Q1,96000,55,1.8\nMacBook Pro,Q2,142000,71,0.9\nDell XPS,Q2,89000,51,2.1\nThinkPad X1,Q2,108000,62,1.5`
                        )
                      }
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 underline"
                    >
                      Sample CSV
                    </button>
                    <span className="text-slate-300">·</span>
                    <button
                      type="button"
                      onClick={() =>
                        setPastedContent(
                          JSON.stringify(
                            [
                              { city: 'Tokyo', visitors: 420000, avg_stay_days: 4.8, rating: 4.9 },
                              { city: 'Paris', visitors: 380000, avg_stay_days: 5.2, rating: 4.7 },
                              { city: 'New York', visitors: 340000, avg_stay_days: 3.9, rating: 4.6 },
                              { city: 'London', visitors: 310000, avg_stay_days: 4.4, rating: 4.8 },
                              { city: 'Singapore', visitors: 260000, avg_stay_days: 3.2, rating: 4.9 },
                            ],
                            null,
                            2
                          )
                        )
                      }
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 underline"
                    >
                      Sample JSON
                    </button>
                  </div>
                </div>
                <textarea
                  rows={8}
                  value={pastedContent}
                  onChange={(e) => setPastedContent(e.target.value)}
                  placeholder="Paste your CSV content here (first line with headers) or JSON array..."
                  className="w-full p-3 font-mono text-xs rounded-md border border-slate-200 bg-slate-50/50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleParseAndLoad}
                  disabled={isProcessing}
                  className="px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  {isProcessing ? 'Parsing...' : 'Analyze & Render Dashboard'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="space-y-4">
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100/80 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-3 text-slate-400" />
                  <p className="mb-1 text-xs font-medium text-slate-700">
                    Click to browse or drag and drop
                  </p>
                  <p className="text-[11px] text-slate-400">
                    CSV, TSV, or JSON file (up to 20MB)
                  </p>
                </div>
                <input
                  type="file"
                  accept=".csv,.tsv,.json,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {activeTab === 'samples' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 mb-2">
                Select one of our built-in curated datasets to explore multi-dimensional capabilities:
              </p>
              {SAMPLE_DATASETS.map((sample) => {
                const isSelected = sample.id === currentDatasetId;
                return (
                  <div
                    key={sample.id}
                    onClick={() => loadPreset(sample)}
                    className={`flex items-start justify-between p-3.5 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/30'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-slate-600" />
                        <span className="text-xs font-semibold text-slate-900">
                          {sample.name}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {sample.description}
                      </p>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono pt-1">
                        <span>{sample.records.length} records</span>
                        <span>·</span>
                        <span>{sample.columns.length} columns</span>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-700">
                        <Check className="h-4 w-4" />
                        Active
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

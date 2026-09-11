import React from 'react';

export default function BulkImportModal({
  show,
  onClose,
  onCSVUpload,
  rawText,
  setRawText,
  onSubmitText,
  uploading
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4">
        <h3 className="text-lg font-bold text-slate-900">Import Ahli Secara Pukal</h3>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Pilihan 1: Muat Naik Fail CSV
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={onCSVUpload}
              className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
            />
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="shrink mx-3 text-[10px] text-slate-400 font-bold uppercase">ATAU</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Pilihan 2: Copy-Paste dari Excel / Spreadsheet
            </label>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Tampal data di sini (Susunan lajur: Nama | Penjaga | Alamat | Bengkung)"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
              rows="5"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-lg font-medium text-xs hover:bg-slate-200"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onSubmitText}
            disabled={uploading}
            className="flex-1 bg-slate-800 text-white py-2 rounded-lg font-medium text-xs hover:bg-slate-900"
          >
            {uploading ? 'Mengimport...' : 'Proses Import Text'}
          </button>
        </div>
      </div>
    </div>
  );
}
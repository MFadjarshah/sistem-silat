import React from 'react';

export default function ParentPortal({
  handleUploadReceipt,
  selectedStudentId,
  setSelectedStudentId,
  activeStudents,
  setFile,
  uploading,
  uploadStatus
}) {
  return (
    <div className="max-w-xl mx-auto bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-4">
      <h3 className="text-lg font-bold text-slate-900">Portal Muat Naik Resit Yuran</h3>
      <form onSubmit={handleUploadReceipt} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Anak</label>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
          >
            {activeStudents.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} (Penjaga: {s.parent_name})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Fail Resit (Gambar / PDF)</label>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
          />
        </div>

        <button
          type="submit"
          disabled={uploading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg font-semibold text-sm transition-colors shadow-xs"
        >
          {uploading ? 'Hantar...' : 'Hantar Resit'}
        </button>

        {uploadStatus === 'success' && (
          <p className="text-xs text-emerald-600 text-center">Resit berjaya dihantar!</p>
        )}
        {uploadStatus === 'error' && (
          <p className="text-xs text-rose-600 text-center">Gagal memuat naik resit.</p>
        )}
      </form>
    </div>
  );
}
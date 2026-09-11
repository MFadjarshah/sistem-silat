import React from 'react';

export default function EditStudentModal({
  student,
  onClose,
  onSubmit,
  editName,
  setEditName,
  editParentName,
  setEditParentName,
  editAddress,
  setEditAddress,
  editBeltLevel,
  setEditBeltLevel,
  beltOptions,
  isUpdating,
  onSetStatus
}) {
  if (!student) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
        <h3 className="text-lg font-bold text-slate-900">Kemaskini Maklumat Pelajar</h3>
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Pelajar</label>
            <input
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Penjaga</label>
            <input
              type="text"
              required
              value={editParentName}
              onChange={(e) => setEditParentName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Peringkat Bengkung</label>
            <select
              value={editBeltLevel}
              onChange={(e) => setEditBeltLevel(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              {beltOptions.map((belt) => (
                <option key={belt} value={belt}>{belt}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Alamat</label>
            <textarea
              value={editAddress}
              onChange={(e) => setEditAddress(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              rows="2"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t mt-4">
            {student.status === 'Aktif' ? (
              <button
                type="button"
                onClick={() => onSetStatus(student.id, 'Berhenti')}
                className="text-xs bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 px-3 py-2 rounded-lg font-medium"
              >
                Set Berhenti Silat
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onSetStatus(student.id, 'Aktif')}
                className="text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-3 py-2 rounded-lg font-medium"
              >
                Aktifkan Semula
              </button>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="bg-slate-100 text-slate-700 px-3 py-2 rounded-lg font-medium text-xs hover:bg-slate-200"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isUpdating}
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium text-xs hover:bg-emerald-700"
              >
                {isUpdating ? 'Menyimpan...' : 'Kemaskini'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
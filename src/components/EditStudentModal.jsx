import React from 'react';

export default function EditStudentModal({
  student,
  onClose,
  onSubmit,
  editName,
  setEditName,
  editParentName,
  setEditParentName,
  editGender,
  setEditGender,
  editAge,
  setEditAge,
  editPhone,
  setEditPhone,
  editAddress,
  setEditAddress,
  editBeltLevel,
  setEditBeltLevel,
  beltOptions,
  isUpdating,
  onSetStatus
}) {
  if (!student) return null;

  // Format nombor telefon untuk pautan WhatsApp (misal: 0123456789 -> 60123456789)
  const formatWaNumber = (phone) => {
    if (!phone) return '';
    let cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '6' + cleaned;
    }
    return cleaned;
  };

  const waNumber = formatWaNumber(editPhone);

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
        <h3 className="text-lg font-bold text-slate-900">Maklumat & Kemaskini Pelajar</h3>
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

          <div className='grid grid-cols-2 gap-3'>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Jantina</label>
              <select
                required
                value={editGender}
                onChange={(e) => setEditGender(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              >
                <option value="">-- Pilih --</option>
                <option value="Lelaki">Lelaki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Umur</label>
              <input
                type="text"
                required
                value={editAge}
                onChange={(e) => setEditAge(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-slate-700">Nombor Telefon</label>
              {waNumber && (
                <a
                  href={`https://wa.me/${waNumber}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-emerald-600 font-bold hover:underline flex items-center gap-1"
                >
                  <span>💬</span> WhatsApp Penjaga
                </a>
              )}
            </div>
            <input
              type="tel"
              placeholder="Cth: 0123456789"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
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
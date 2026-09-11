import React from 'react';

export default function AddStudentModal({
  show,
  onClose,
  onSubmit,
  newName,
  setNewName,
  newParentName,
  setNewParentName,
  newGender,
  setNewGender,
  newAge,
  setNewAge,
  newPhone,
  setNewPhone,
  newAddress,
  setNewAddress,
  newBeltLevel,
  setNewBeltLevel,
  beltOptions,
  isAdding
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
        <h3 className="text-lg font-bold text-slate-900">Tambah Ahli Baharu</h3>
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Pelajar</label>
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Penjaga</label>
            <input
              type="text"
              required
              value={newParentName}
              onChange={(e) => setNewParentName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          <div className='grid grid-cols-2 gap-3'>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Jantina</label>
              <select
                required
                value={newGender}
                onChange={(e) => setNewGender(e.target.value)}
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
                value={newAge}
                onChange={(e) => setNewAge(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nombor Telefon</label>
            <input
              type="tel"
              placeholder="Cth: 0123456789"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Peringkat Bengkung</label>
            <select
              value={newBeltLevel}
              onChange={(e) => setNewBeltLevel(e.target.value)}
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
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              rows="2"
            />
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
              type="submit"
              disabled={isAdding}
              className="flex-1 bg-emerald-600 text-white py-2 rounded-lg font-medium text-xs hover:bg-emerald-700"
            >
              {isAdding ? 'Menambah...' : 'Simpan Ahli'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
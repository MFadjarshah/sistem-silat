import React, { useState, useEffect } from 'react';

const MONTHS = [
  { short: 'Jan', full: 'Januari' },
  { short: 'Feb', full: 'Februari' },
  { short: 'Mac', full: 'Mac' },
  { short: 'Apr', full: 'April' },
  { short: 'Mei', full: 'Mei' },
  { short: 'Jun', full: 'Jun' },
  { short: 'Jul', full: 'Julai' },
  { short: 'Ogos', full: 'Ogos' },
  { short: 'Sep', full: 'September' },
  { short: 'Okt', full: 'Oktober' },
  { short: 'Nov', full: 'November' },
  { short: 'Dis', full: 'Disember' }
];

export default function ParentPortal({
  handleUploadReceipt,
  selectedStudentId,
  setSelectedStudentId,
  activeStudents = [],
  setFile,
  uploading,
  uploadStatus
}) {
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [payAnnual, setPayAnnual] = useState(false);

  // 💡 DITUKAR: Reset borang secara automatik apabila halaman ini dibuka/diakses
  useEffect(() => {
    setSelectedStudentId('');
    setSelectedMonths([]);
    setPayAnnual(false);
    if (typeof setFile === 'function') setFile(null);
  }, [setSelectedStudentId, setFile]);

  // Cari data pelajar
  const selectedStudent = activeStudents.find((s) => String(s.id) === String(selectedStudentId));

  const toggleMonth = (monthShort) => {
    if (selectedMonths.includes(monthShort)) {
      setSelectedMonths(selectedMonths.filter((item) => item !== monthShort));
    } else {
      setSelectedMonths([...selectedMonths, monthShort]);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudentId) {
      alert('Sila pilih nama anak terlebih dahulu.');
      return;
    }
    if (selectedMonths.length === 0 && !payAnnual) {
      alert('Sila pilih sekurang-kurangnya satu bulan atau Yuran Tahunan.');
      return;
    }

    // Jalankan fungsi muat naik
    await handleUploadReceipt(e, { selectedMonths, payAnnual });

    // Reset borang selepas hantar
    setSelectedStudentId('');
    setSelectedMonths([]);
    setPayAnnual(false);
    if (typeof setFile === 'function') setFile(null);
  };

  return (
    <div className="max-w-xl mx-auto bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-5">
      <h3 className="text-lg font-bold text-slate-900 border-b pb-3">Portal Muat Naik Resit Yuran</h3>
      
      <form onSubmit={onSubmit} className="space-y-5">
        {/* 1. Pilih Anak */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Anak</label>
          <select
            value={selectedStudentId || ''}
            onChange={(e) => {
              setSelectedStudentId(e.target.value);
              setSelectedMonths([]);
            }}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
          >
            <option value="">-- Sila Pilih Anak --</option>
            {activeStudents.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} (Penjaga: {s.parent_name || '-'})
              </option>
            ))}
          </select>
        </div>

        {/* Maklumat Yuran Hanya Muncul Apabila Anak Dipilih */}
        {selectedStudent ? (
          <>
            {/* 2. Status Yuran Tahunan */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center">
              <div>
                <p className="text-[11px] font-semibold text-slate-500">Yuran Tahunan</p>
                <p className="text-xs font-bold text-slate-800">
                  {selectedStudent.status_fee_annual === 'Selesai' && '✓ Sudah Dibayar'}
                  {selectedStudent.status_fee_annual === 'Pending' && '⏳ Pending Admin'}
                  {(selectedStudent.status_fee_annual === 'Tunggakan' || !selectedStudent.status_fee_annual) && 'Belum Dibayar'}
                </p>
              </div>
              {selectedStudent.status_fee_annual !== 'Selesai' && selectedStudent.status_fee_annual !== 'Pending' && (
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                  <input
                    type="checkbox"
                    checked={payAnnual}
                    onChange={(e) => setPayAnnual(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-0"
                  />
                  Bayar Sekali
                </label>
              )}
            </div>

            {/* 3. Grid Status 12 Bulan */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Status Yuran Bulanan (Pilih bulan yang dibayar):
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {MONTHS.map((m) => {
                  const monthRecord = Array.isArray(selectedStudent.monthly_fees)
                    ? selectedStudent.monthly_fees.find(
                        (f) => f.month_name === m.full || f.month_name === m.short
                      )
                    : null;

                  const status = monthRecord?.status || 'Belum';
                  const isSelected = selectedMonths.includes(m.short);

                  let btnStyle = 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100';
                  if (status === 'paid' || status === 'Selesai') {
                    btnStyle = 'bg-emerald-500 text-white cursor-not-allowed border-emerald-600';
                  } else if (status === 'pending' || status === 'Pending') {
                    btnStyle = 'bg-amber-400 text-amber-950 cursor-not-allowed border-amber-500 font-bold';
                  } else if (isSelected) {
                    btnStyle = 'bg-blue-600 text-white border-blue-700 ring-2 ring-blue-300';
                  }

                  const isDisabled = status === 'paid' || status === 'Selesai' || status === 'pending' || status === 'Pending';

                  return (
                    <button
                      key={m.short}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => toggleMonth(m.short)}
                      className={`py-2 px-1 text-xs font-bold rounded-lg border text-center transition-all ${btnStyle}`}
                    >
                      {m.short}
                      <div className="text-[9px] font-normal opacity-90">
                        {(status === 'paid' || status === 'Selesai') && '✓ Selesai'}
                        {(status === 'pending' || status === 'Pending') && '⏳ Pending'}
                        {status !== 'paid' && status !== 'Selesai' && status !== 'pending' && status !== 'Pending' && (isSelected ? '✓ Pilih' : 'Belum')}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Petunjuk Warna */}
              <div className="flex gap-4 text-[10px] text-slate-500 mt-2">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span> Selesai</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-amber-400 rounded-full"></span> Pending Admin</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-slate-200 rounded-full"></span> Belum Bayar</span>
              </div>
            </div>

            {/* 4. Input Muat Naik Fail */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Fail Resit (Gambar / PDF)</label>
              <input
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
              />
            </div>

            {/* 5. Butang Hantar */}
            <button
              type="submit"
              disabled={uploading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg font-semibold text-sm transition-colors shadow-xs"
            >
              {uploading ? 'Hantar...' : 'Hantar Resit'}
            </button>
          </>
        ) : (
          <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl">
            <p className="text-xs text-slate-400">Sila pilih nama anak di atas untuk melihat status yuran dan memuat naik resit.</p>
          </div>
        )}

        {uploadStatus === 'success' && (
          <p className="text-xs text-emerald-600 text-center font-medium">Resit berjaya dihantar!</p>
        )}
        {uploadStatus === 'error' && (
          <p className="text-xs text-rose-600 text-center font-medium">Gagal memuat naik resit.</p>
        )}
      </form>
    </div>
  );
}
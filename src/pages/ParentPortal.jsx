import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

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
  setFile,
  uploading,
  uploadStatus,
  setUploadStatus
}) {
  const [phoneInput, setPhoneInput] = useState('');
  const [searchedStudents, setSearchedStudents] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [searching, setSearching] = useState(false);

  const [selectedMonths, setSelectedMonths] = useState([]);
  const [payAnnual, setPayAnnual] = useState(false);

  useEffect(() => {
    setSelectedStudentId('');
    setSelectedMonths([]);
    setPayAnnual(false);
    if (typeof setFile === 'function') setFile(null);
    if (typeof setUploadStatus === 'function') setUploadStatus(null);
  }, [setSelectedStudentId, setFile, setUploadStatus]);

  const selectedStudent = searchedStudents.find((s) => String(s.id) === String(selectedStudentId));

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!phoneInput.trim()) {
      alert('Sila masukkan nombor telefon penjaga.');
      return;
    }

    setSearching(true);
    setHasSearched(true);
    setSelectedStudentId('');
    setSelectedMonths([]);

    const { data, error } = await supabase.rpc('get_students_by_phone', {
      p_phone: phoneInput.trim()
    });

    if (error) {
      console.error('Error RPC:', error);
      alert('Gagal membuat carian. Sila cuba lagi.');
    } else {
      setSearchedStudents(data || []);
      if (data && data.length === 1) {
        setSelectedStudentId(data[0].id);
      }
    }
    setSearching(false);
  };

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

    await handleUploadReceipt(e, { selectedMonths, payAnnual });

    setSelectedStudentId('');
    setSelectedMonths([]);
    setPayAnnual(false);
    if (typeof setFile === 'function') setFile(null);
  };

  return (
    <div className="max-w-xl mx-auto bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-5">
      <h3 className="text-lg font-bold text-slate-900 border-b pb-3">Portal Muat Naik Resit Yuran</h3>

      {/* 1. Bahagian Carian No. Telefon */}
      <form onSubmit={handleSearch} className="space-y-3">
        <label className="block text-xs font-semibold text-slate-700">
          Masukkan No. Telefon Penjaga (Contoh: 0123456789)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="No. Telefon Penjaga"
            value={phoneInput}
            onChange={(e) => {
              setPhoneInput(e.target.value);
              if (typeof setUploadStatus === 'function') setUploadStatus(null);
            }}
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="submit"
            disabled={searching}
            className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors"
          >
            {searching ? 'Mencari...' : 'Cari'}
          </button>
        </div>
      </form>

      {/* 2. Paparan Hasil Carian Anak */}
      {hasSearched && searchedStudents.length === 0 && !searching && (
        <p className="text-xs text-rose-500 text-center bg-rose-50 p-3 rounded-lg border border-rose-200">
          Tiada rekod anak dijumpai untuk nombor telefon ini. Sila semak semula nombor.
        </p>
      )}

      {searchedStudents.length > 1 && (
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Pilih Anak Anda ({searchedStudents.length} dijumpai):
          </label>
          <select
            value={selectedStudentId || ''}
            onChange={(e) => {
              setSelectedStudentId(e.target.value);
              setSelectedMonths([]);
            }}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
          >
            <option value="">-- Sila Pilih Anak --</option>
            {searchedStudents.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} (Penjaga: {s.parent_name || '-'})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 3. Borang Status & Muat Naik Resit */}
      {selectedStudent ? (
        <form onSubmit={onSubmit} className="space-y-5 pt-2 border-t border-slate-100">
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
            <p className="text-xs font-bold text-emerald-900">
              Anak Dipilih: {selectedStudent.name}
            </p>
          </div>

          {/* Status Yuran Tahunan */}
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
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-md border border-emerald-300">
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

          {/* Grid Status 12 Bulan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Status Yuran Bulanan (Pilih bulan yang dibayar):
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {MONTHS.map((m, idx) => {
                const monthIndex = idx + 1;

                const monthRecord = Array.isArray(selectedStudent.monthly_fees)
                  ? selectedStudent.monthly_fees.find((f) => {
                      if (!f) return false;
                      const mName = String(f.month_name || f.month || '').toLowerCase();
                      const mNum = Number(f.month_number || f.month_no || f.month);
                      return (
                        mName === m.full.toLowerCase() ||
                        mName === m.short.toLowerCase() ||
                        mNum === monthIndex
                      );
                    })
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

            <div className="flex gap-4 text-[10px] text-slate-500 mt-2">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span> Selesai</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-amber-400 rounded-full"></span> Pending Admin</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-slate-200 rounded-full"></span> Belum Bayar</span>
            </div>
          </div>

          {/* Fail Resit & Butang Hantar */}
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
        </form>
      ) : (
        !hasSearched && (
          <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl">
            <p className="text-xs text-slate-400">
              Sila masukkan nombor telefon penjaga di atas untuk carian rekod anak.
            </p>
          </div>
        )
      )}

      {uploadStatus === 'success' && (
        <p className="text-xs text-emerald-600 text-center font-medium">Resit berjaya dihantar!</p>
      )}
      {uploadStatus === 'error' && (
        <p className="text-xs text-rose-600 text-center font-medium">Gagal memuat naik resit.</p>
      )}
    </div>
  );
}
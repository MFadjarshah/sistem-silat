import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function App() {
  const [activeMenu, setActiveMenu] = useState('admin-members');
  const [students, setStudents] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State untuk Portal Ibu Bapa
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  // Form State untuk Tambah Ahli Baharu
  const [newName, setNewName] = useState('');
  const [newParentName, setNewParentName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    await fetchStudents();
    await fetchReceipts();
    setLoading(false);
  }

  async function fetchStudents() {
    const { data, error } = await supabase.from('students').select('*').order('id', { ascending: true });
    if (!error && data) {
      setStudents(data);
      if (data.length > 0 && !selectedStudentId) {
        setSelectedStudentId(data[0].id);
      }
    }
  }

  async function fetchReceipts() {
    const { data, error } = await supabase
      .from('receipts')
      .select('*, students(name, parent_name)')
      .order('id', { ascending: false });
    if (!error && data) {
      setReceipts(data);
    }
  }

  // 1. Fungsi Tambah Ahli Baharu (Admin)
  async function handleAddStudent(e) {
    e.preventDefault();
    if (!newName || !newParentName) {
      alert('Sila isi nama pelajar dan nama penjaga!');
      return;
    }

    setIsAdding(true);
    try {
      const { error } = await supabase.from('students').insert([
        {
          name: newName,
          parent_name: newParentName,
          status_fee: 'Tunggakan',
          attendance: 'Tidak Hadir'
        }
      ]);

      if (error) throw error;

      // Reset form & reload data
      setNewName('');
      setNewParentName('');
      setShowAddModal(false);
      fetchStudents();
      alert('Ahli baharu berjaya didaftarkan!');
    } catch (error) {
      console.error('Ralat Tambah Ahli:', error);
      alert('Gagal menambah ahli baharu.');
    } finally {
      setIsAdding(false);
    }
  }

  // 2. Fungsi Muat Naik Resit (Portal Ibu Bapa)
  async function handleUploadReceipt(e) {
    e.preventDefault();
    if (!file || !selectedStudentId) {
      alert('Sila pilih anak dan fail resit terlebih dahulu!');
      return;
    }

    setUploading(true);
    setUploadStatus('');

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${selectedStudentId}.${fileExt}`;
      const filePath = `receipts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('receipts')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      const { error: dbError } = await supabase.from('receipts').insert([
        {
          student_id: selectedStudentId,
          file_url: publicUrl,
          status: 'Pending'
        }
      ]);

      if (dbError) throw dbError;

      setUploadStatus('success');
      setFile(null);
      fetchReceipts();
    } catch (error) {
      console.error('Ralat Upload:', error);
      setUploadStatus('error');
    } finally {
      setUploading(false);
    }
  }

  // 3. Fungsi Sahkan Pembayaran (Portal Admin)
  async function handleApproveReceipt(receiptId, studentId) {
    try {
      await supabase
        .from('receipts')
        .update({ status: 'Approved' })
        .eq('id', receiptId);

      await supabase
        .from('students')
        .update({ status_fee: 'Lunas' })
        .eq('id', studentId);

      alert('Pembayaran berjaya disahkan! Status yuran pelajar telah dikemas kini kepada LUNAS.');
      fetchData();
    } catch (error) {
      console.error('Ralat Pengesahan:', error);
      alert('Gagal mengemas kini pengesahan.');
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between hidden md:flex shadow-xl">
        <div>
          <div className="p-5 border-b border-slate-800 bg-slate-950/50">
            <h1 className="text-lg font-bold text-emerald-400 tracking-wide flex items-center gap-2">
              <span>🥋</span> E-Silat Admin
            </h1>
            <p className="text-xs text-slate-500 mt-1">Sistem Pengurusan Gelanggang</p>
          </div>

          <nav className="p-4 space-y-1">
            <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Menu Admin
            </div>

            <button
              onClick={() => setActiveMenu('admin-members')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeMenu === 'admin-members' ? 'bg-emerald-600 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span>👥</span> Senarai Ahli Silat
            </button>

            <button
              onClick={() => setActiveMenu('admin-payments')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeMenu === 'admin-payments' ? 'bg-emerald-600 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span>💳</span> Semakan Yuran & Resit
            </button>

            <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider pt-6">
              Portal Awam
            </div>

            <button
              onClick={() => setActiveMenu('parent-portal')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeMenu === 'parent-portal' ? 'bg-emerald-600 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span>👨‍👩‍👧</span> Portal Ibu Bapa
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 text-xs text-slate-500 flex justify-between items-center">
          <span>Status: <strong className="text-emerald-400">Online</strong></span>
          <span className="bg-slate-800 px-2 py-1 rounded">v1.1</span>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm">
          <h2 className="text-lg font-bold text-slate-800">
            {activeMenu === 'admin-members' && 'Pengurusan Ahli Silat'}
            {activeMenu === 'admin-payments' && 'Semakan & Pengesahan Yuran (Resit)'}
            {activeMenu === 'parent-portal' && 'Portal Ibu Bapa & Muat Naik Resit'}
          </h2>
          <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-3 py-1 rounded-full border border-emerald-200">
            Supabase Live
          </span>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          
          {/* MENU 1: SENARAI AHLI */}
          {activeMenu === 'admin-members' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Senarai Pelajar Berdaftar</h3>
                  <p className="text-xs text-slate-500">Data dikemaskini secara langsung dari Supabase</p>
                </div>
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2"
                >
                  <span>+</span> Tambah Ahli Baharu
                </button>
              </div>

              {loading ? (
                <p className="text-slate-500 text-center py-8">Memuatkan data...</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b">
                        <th className="p-4">Nama Pelajar</th>
                        <th className="p-4">Nama Penjaga</th>
                        <th className="p-4">Status Yuran</th>
                        <th className="p-4">Kehadiran</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {students.map((student) => (
                        <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-4 font-semibold text-slate-900">{student.name}</td>
                          <td className="p-4 text-slate-600">{student.parent_name}</td>
                          <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              student.status_fee === 'Lunas' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {student.status_fee}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              student.attendance === 'Hadir' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {student.attendance}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* MODAL: TAMBAH AHLI BAHARU */}
          {showAddModal && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
                <div className="flex justify-between items-center border-b pb-3">
                  <h3 className="text-base font-bold text-slate-900">Tambah Ahli Silat Baharu</h3>
                  <button 
                    onClick={() => setShowAddModal(false)}
                    className="text-slate-400 hover:text-slate-600 font-bold text-lg"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleAddStudent} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Pelajar</label>
                    <input 
                      type="text" 
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Contoh: Luqman Hakim"
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Penjaga / Ibu Bapa</label>
                    <input 
                      type="text" 
                      value={newParentName}
                      onChange={(e) => setNewParentName(e.target.value)}
                      placeholder="Contoh: Encik Rahim"
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button 
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      Batal
                    </button>
                    <button 
                      type="submit"
                      disabled={isAdding}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
                    >
                      {isAdding ? 'Menyimpan...' : 'Simpan Ahli'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* MENU 2: SEMAKAN YURAN (ADMIN) */}
          {activeMenu === 'admin-payments' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-base font-bold text-slate-900 mb-1">Senarai Permohonan Pengesahan Resit</h3>
              <p className="text-xs text-slate-500 mb-6">Sahkan resit pembayaran yang dihantar oleh ibu bapa</p>

              {receipts.length === 0 ? (
                <p className="text-slate-500 text-center py-8">Tiada resit dimuat naik lagi.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b">
                        <th className="p-4">Nama Pelajar</th>
                        <th className="p-4">Penjaga</th>
                        <th className="p-4">Fail Resit</th>
                        <th className="p-4">Status Pengesahan</th>
                        <th className="p-4 text-center">Tindakan Admin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {receipts.map((rcpt) => (
                        <tr key={rcpt.id} className="hover:bg-slate-50">
                          <td className="p-4 font-semibold text-slate-900">{rcpt.students?.name || 'Pelajar Deleted'}</td>
                          <td className="p-4 text-slate-600">{rcpt.students?.parent_name || '-'}</td>
                          <td className="p-4">
                            <a 
                              href={rcpt.file_url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold px-3 py-1.5 rounded-md border border-emerald-200 inline-flex items-center gap-1"
                            >
                              📄 Lihat Resit
                            </a>
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                              rcpt.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {rcpt.status}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            {rcpt.status === 'Pending' ? (
                              <button
                                onClick={() => handleApproveReceipt(rcpt.id, rcpt.student_id)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition-colors shadow-sm"
                              >
                                Sahkan Pembayaran
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400 font-medium">Selesai</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* MENU 3: PORTAL IBU BAPA (UPLOAD) */}
          {activeMenu === 'parent-portal' && (
            <div className="max-w-xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-1">Muat Naik Resit Pembayaran</h3>
              <p className="text-xs text-slate-500 mb-6">Sila pilih nama anak dan muat naik resit perbankan untuk pengesahan jurulatih.</p>

              {uploadStatus === 'success' && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg">
                  ✅ Resit berjaya dihantar! Sila tunggu jurulatih membuat pengesahan.
                </div>
              )}

              {uploadStatus === 'error' && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg">
                  ❌ Ralat semasa muat naik resit. Sila cuba lagi.
                </div>
              )}

              <form onSubmit={handleUploadReceipt} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Nama Anak</label>
                  <select 
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.name} (Penjaga: {student.parent_name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Fail Resit (Gambar / PDF)</label>
                  <input 
                    type="file" 
                    onChange={(e) => setFile(e.target.files[0])}
                    accept="image/*,application/pdf"
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer" 
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={uploading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors shadow-sm disabled:opacity-50"
                >
                  {uploading ? 'Sedang Muat Naik...' : 'Hantar Resit Sekarang'}
                </button>
              </form>
            </div>
          )}

        </main>
      </div>

    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export default function App() {
  const [activeMenu, setActiveMenu] = useState('dashboard');
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

  // State Kehadiran mengikut Tarikh
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [attendanceHistory, setAttendanceHistory] = useState([]);

  // State untuk peranti mengemaskini
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeMenu === 'admin-attendance') {
      fetchAttendanceForDate(selectedDate);
    }
  }, [selectedDate, activeMenu]);

  async function fetchData() {
    setLoading(true);
    await fetchStudents();
    await fetchReceipts();
    await fetchAttendanceForDate(selectedDate);
    await fetchAttendanceHistory();
    setLoading(false);
  }

  // Ambil data pelajar berserta rekod monthly_fees
  async function fetchStudents() {
    const { data, error } = await supabase
      .from('students')
      .select('*, monthly_fees(*)')
      .order('id', { ascending: true });

    if (!error && data) {
      const formattedData = data.map((student) => ({
        ...student,
        monthly_fees: (student.monthly_fees || []).sort((a, b) => a.id - b.id)
      }));

      setStudents(formattedData);
      if (formattedData.length > 0 && !selectedStudentId) {
        setSelectedStudentId(formattedData[0].id);
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

  // Ambil data kehadiran mengikut tarikh
  async function fetchAttendanceForDate(dateStr) {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('date', dateStr);

    if (!error && data) {
      const recordsMap = {};
      data.forEach((item) => {
        recordsMap[item.student_id] = item.status;
      });
      setAttendanceRecords(recordsMap);
    } else {
      setAttendanceRecords({});
    }
  }

  // Ambil ringkasan sejarah kehadiran mengikut tarikh untuk Dashboard Graf
  async function fetchAttendanceHistory() {
    const { data, error } = await supabase
      .from('attendance')
      .select('date, status');

    if (!error && data) {
      const summary = {};
      data.forEach((row) => {
        if (!summary[row.date]) {
          summary[row.date] = { total: 0, hadir: 0, tidakHadir: 0 };
        }
        summary[row.date].total += 1;
        if (row.status === 'Hadir') {
          summary[row.date].hadir += 1;
        } else {
          summary[row.date].tidakHadir += 1;
        }
      });

      const historyList = Object.keys(summary)
        .sort((a, b) => new Date(a) - new Date(b))
        .map((date) => ({
          date,
          Hadir: summary[date].hadir,
          'Tidak Hadir': summary[date].tidakHadir,
          Peratus: summary[date].total
            ? Math.round((summary[date].hadir / summary[date].total) * 100)
            : 0
        }));

      setAttendanceHistory(historyList);
    }
  }

  // Tukar status kehadiran tempatan
  function toggleAttendanceLocal(studentId) {
    setAttendanceRecords((prev) => {
      const current = prev[studentId] || 'Tidak Hadir';
      return {
        ...prev,
        [studentId]: current === 'Hadir' ? 'Tidak Hadir' : 'Hadir'
      };
    });
  }

  // Simpan rekod kehadiran ke Supabase
  async function handleSaveAttendance() {
    setSavingAttendance(true);
    try {
      const payload = students.map((s) => ({
        student_id: s.id,
        date: selectedDate,
        status: attendanceRecords[s.id] || 'Tidak Hadir'
      }));

      const { error } = await supabase
        .from('attendance')
        .upsert(payload, { onConflict: 'student_id,date' });

      if (error) throw error;

      alert(`Kehadiran tarikh ${selectedDate} berjaya disimpan!`);
      fetchAttendanceHistory();
    } catch (err) {
      console.error('Ralat Simpan Kehadiran:', err);
      alert('Gagal menyimpan kehadiran.');
    } finally {
      setSavingAttendance(false);
    }
  }

  // Tukar status yuran tahunan
  async function toggleAnnualFeeStatus(studentId, currentStatus) {
    const newStatus = currentStatus === 'Selesai' ? 'Tunggakan' : 'Selesai';
    setUpdatingId(studentId);

    try {
      const { error } = await supabase
        .from('students')
        .update({ status_fee_annual: newStatus })
        .eq('id', studentId);

      if (error) throw error;

      setStudents(
        students.map((student) =>
          student.id === studentId ? { ...student, status_fee_annual: newStatus } : student
        )
      );
    } catch (error) {
      console.error('Ralat Yuran Tahunan:', error);
      alert('Gagal mengemaskini status yuran.');
    } finally {
      setUpdatingId(null);
    }
  }

  // Tukar status yuran bulan secara terus
  async function toggleMonthFeeDirect(studentId, monthName, currentStatus) {
    const newStatus = currentStatus === 'Selesai' ? 'Tunggakan' : 'Selesai';

    try {
      const student = students.find((s) => s.id === studentId);
      const existingFee = (student?.monthly_fees || []).find((f) => f.month_name === monthName);

      if (existingFee) {
        const { error } = await supabase
          .from('monthly_fees')
          .update({ status: newStatus })
          .eq('id', existingFee.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('monthly_fees').insert([
          {
            student_id: studentId,
            month_name: monthName,
            year: 2026,
            status: newStatus
          }
        ]);

        if (error) throw error;
      }

      fetchStudents();
    } catch (error) {
      console.error('Ralat Yuran Bulan:', error);
      alert('Gagal mengemaskini status yuran.');
    }
  }

  // Tambah Ahli Baharu
  async function handleAddStudent(e) {
    e.preventDefault();
    if (!newName || !newParentName) {
      alert('Sila isi semua maklumat!');
      return;
    }

    setIsAdding(true);
    try {
      const { data: newStudent, error } = await supabase
        .from('students')
        .insert([
          {
            name: newName,
            parent_name: newParentName,
            status_fee_annual: 'Tunggakan',
            attendance: 'Tidak Hadir'
          }
        ])
        .select()
        .single();

      if (error) throw error;

      if (newStudent) {
        const monthsList = [
          'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
          'Juli', 'Ogos', 'September', 'Oktober', 'November', 'Disember'
        ];
        const payload = monthsList.map((m) => ({
          student_id: newStudent.id,
          month_name: m,
          year: 2026,
          status: 'Tunggakan'
        }));
        await supabase.from('monthly_fees').insert(payload);
      }

      setNewName('');
      setNewParentName('');
      setShowAddModal(false);
      fetchStudents();
      alert('Ahli baharu berjaya didaftarkan!');
    } catch (error) {
      console.error('Ralat Tambah Ahli:', error);
      alert('Gagal menambah ahli.');
    } finally {
      setIsAdding(false);
    }
  }

  // Muat Naik Resit (Portal Ibu Bapa)
  async function handleUploadReceipt(e) {
    e.preventDefault();
    if (!file || !selectedStudentId) {
      alert('Sila pilih anak dan fail resit!');
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

  // Sahkan Pembayaran
  async function handleApproveReceipt(receiptId, studentId) {
    try {
      await supabase
        .from('receipts')
        .update({ status: 'Approved' })
        .eq('id', receiptId);

      await supabase
        .from('students')
        .update({ status_fee_annual: 'Selesai' })
        .eq('id', studentId);

      alert('Pembayaran berjaya disahkan!');
      fetchData();
    } catch (error) {
      console.error('Ralat Pengesahan:', error);
      alert('Gagal mengemas kini pengesahan.');
    }
  }

  const monthsListShort = [
    { short: 'Jan', full: 'Januari' },
    { short: 'Feb', full: 'Februari' },
    { short: 'Mac', full: 'Mac' },
    { short: 'Apr', full: 'April' },
    { short: 'Mei', full: 'Mei' },
    { short: 'Jun', full: 'Jun' },
    { short: 'Jul', full: 'Juli' },
    { short: 'Ogo', full: 'Ogos' },
    { short: 'Sep', full: 'September' },
    { short: 'Okt', full: 'Oktober' },
    { short: 'Nov', full: 'November' },
    { short: 'Dis', full: 'Disember' }
  ];

  // DATA UNTUK GRAF YURAN 12 BULAN
  const feeChartData = monthsListShort.map((m) => {
    let paidCount = 0;
    let pendingCount = 0;

    students.forEach((student) => {
      const fee = (student.monthly_fees || []).find((f) => f.month_name === m.full);
      if (fee?.status === 'Selesai') {
        paidCount += 1;
      } else {
        pendingCount += 1;
      }
    });

    return {
      Bulan: m.short,
      'Selesai (Lunas)': paidCount,
      Tunggakan: pendingCount
    };
  });

  const totalStudents = students.length;

  return (
    <div className="flex h-screen bg-slate-100 font-sans overflow-hidden">
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between hidden md:flex shadow-xl shrink-0">
        <div>
          <div className="p-4 border-b border-slate-800 bg-slate-950/50">
            <h1 className="text-lg font-bold text-emerald-400 tracking-wide flex items-center gap-2">
              <span>🥋</span> E-Silat Portal
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">Sistem Gelanggang Silat</p>
          </div>

          <nav className="p-3 space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Akses Awam / Ibu Bapa
            </div>

            <button
              onClick={() => setActiveMenu('dashboard')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeMenu === 'dashboard'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span>📊</span> Dashboard Summary
            </button>

            <button
              onClick={() => setActiveMenu('parent-portal')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeMenu === 'parent-portal'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span>👨‍👩‍👧</span> Portal Ibu Bapa
            </button>

            <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider pt-4">
              Pengurusan Admin
            </div>

            <button
              onClick={() => setActiveMenu('admin-members')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeMenu === 'admin-members'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span>👥</span> Senarai Ahli & Yuran
            </button>

            <button
              onClick={() => setActiveMenu('admin-attendance')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeMenu === 'admin-attendance'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span>📋</span> Tanda Kehadiran Sesi
            </button>

            <button
              onClick={() => setActiveMenu('admin-payments')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeMenu === 'admin-payments'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span>💳</span> Semakan Resit
            </button>
          </nav>
        </div>

        <div className="p-3 border-t border-slate-800 text-xs text-slate-500 flex justify-between items-center">
          <span>Status: <strong className="text-emerald-400">Online</strong></span>
          <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px]">v3.1</span>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center shadow-xs shrink-0 h-14">
          <h2 className="text-base font-bold text-slate-800">
            {activeMenu === 'dashboard' && 'Dashboard Summary Kehadiran & Yuran'}
            {activeMenu === 'admin-members' && 'Pengurusan Ahli & Matriks Yuran 12 Bulan'}
            {activeMenu === 'admin-attendance' && 'Modul Penandaan Kehadiran Latihan'}
            {activeMenu === 'admin-payments' && 'Semakan & Pengesahan Resit Pembayaran'}
            {activeMenu === 'parent-portal' && 'Portal Ibu Bapa & Muat Naik Resit'}
          </h2>
          <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-3 py-1 rounded-full border border-emerald-200">
            Supabase Live
          </span>
        </header>

        {/* CONTAINER UTAMA MENGIKUT MOD DASHBOARD / SELESAI FIT-TO-SCREEN */}
        <main className={`flex-1 p-4 min-h-0 ${activeMenu === 'dashboard' ? 'flex flex-col gap-4 overflow-hidden' : 'overflow-y-auto space-y-4'}`}>

          {/* DASHBOARD FIT-TO-SCREEN (TIADA SCROLLBAR) */}
          {activeMenu === 'dashboard' && (
            <>
              {/* Kad KPI Top Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 shrink-0">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Total Ahli Gelanggang</p>
                    <h4 className="text-2xl font-extrabold text-slate-900 mt-0.5">{totalStudents} Pelajar</h4>
                  </div>
                  <span className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg text-xl">🥋</span>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Sesi Latihan Merekod</p>
                    <h4 className="text-2xl font-extrabold text-emerald-600 mt-0.5">{attendanceHistory.length} Hari</h4>
                  </div>
                  <span className="p-2.5 bg-blue-50 text-blue-600 rounded-lg text-xl">📅</span>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Purata Kehadiran</p>
                    <h4 className="text-2xl font-extrabold text-amber-600 mt-0.5">
                      {attendanceHistory.length > 0
                        ? Math.round(
                            attendanceHistory.reduce((acc, curr) => acc + curr.Peratus, 0) /
                              attendanceHistory.length
                          )
                        : 0}%
                    </h4>
                  </div>
                  <span className="p-2.5 bg-amber-50 text-amber-600 rounded-lg text-xl">📈</span>
                </div>
              </div>

              {/* DUA GRAF BAR TERUS TAMPIL SEBELAH-MENYEBELAH (SIDE-BY-SIDE) SUPAYA FIT 1 SKRIN */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0">
                
                {/* GRAF 1: KEHADIRAN */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col h-full min-h-0">
                  <div className="mb-2 shrink-0">
                    <h3 className="text-sm font-bold text-slate-900">
                      📊 Rekod Kehadiran Sesi Latihan
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Bilangan pelajar Hadir vs Tidak Hadir mengikut tarikh.
                    </p>
                  </div>

                  {attendanceHistory.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
                      Tiada rekod kehadiran. Silakan tanda kehadiran terlebih dahulu.
                    </div>
                  ) : (
                    <div className="flex-1 min-h-0 w-full pt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={attendanceHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                          <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '11px' }} />
                          <Legend wrapperStyle={{ fontSize: '11px' }} />
                          <Bar dataKey="Hadir" fill="#10B981" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="Tidak Hadir" fill="#F43F5E" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* GRAF 2: YURAN BULANAN */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col h-full min-h-0">
                  <div className="mb-2 shrink-0">
                    <h3 className="text-sm font-bold text-slate-900">
                      💳 Kutipan Yuran Bulanan (2026)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Nisbah pembayaran Lunas vs Tunggakan (Jan - Dis).
                    </p>
                  </div>

                  <div className="flex-1 min-h-0 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={feeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="Bulan" tick={{ fontSize: 10 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                        <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '11px' }} />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                        <Bar dataKey="Selesai (Lunas)" fill="#059669" stackId="a" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="Tunggakan" fill="#FDA4AF" stackId="a" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>
            </>
          )}

          {/* PAGE 2: ADMIN - SENARAI AHLI & MATRIKS YURAN */}
          {activeMenu === 'admin-members' && (
            <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5">
              <div className="flex justify-between items-center mb-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Senarai Pelajar & Status Yuran</h3>
                  <p className="text-xs text-slate-500">
                    Klik ikon (✓ / ✕) pada mana-mana bulan untuk kemas kini status yuran.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-lg text-xs font-medium transition-colors shadow-xs flex items-center gap-1.5"
                >
                  <span>+</span> Tambah Ahli Baharu
                </button>
              </div>

              {loading ? (
                <p className="text-slate-500 text-center py-8 text-sm">Memuatkan data...</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[950px]">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b">
                        <th className="p-3">Nama Pelajar</th>
                        <th className="p-3">Penjaga</th>
                        <th className="p-3">Yuran Tahunan</th>
                        <th className="p-3 text-center" colSpan={12}>
                          Status Yuran Bulanan (2026)
                        </th>
                      </tr>
                      <tr className="bg-slate-100/70 text-[11px] font-bold text-slate-600 border-b">
                        <th className="p-2"></th>
                        <th className="p-2"></th>
                        <th className="p-2"></th>
                        {monthsListShort.map((m) => (
                          <th key={m.short} className="p-1 text-center w-8">
                            {m.short}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {students.map((student) => (
                        <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3 font-semibold text-slate-900 whitespace-nowrap">
                            {student.name}
                          </td>
                          <td className="p-3 text-slate-600 whitespace-nowrap">
                            {student.parent_name}
                          </td>

                          <td className="p-3 whitespace-nowrap">
                            <button
                              onClick={() => toggleAnnualFeeStatus(student.id, student.status_fee_annual)}
                              disabled={updatingId === student.id}
                              className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                                student.status_fee_annual === 'Selesai'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                              }`}
                            >
                              {student.status_fee_annual === 'Selesai' ? '✓ Tahunan' : '✕ Tahunan'}
                            </button>
                          </td>

                          {monthsListShort.map((m) => {
                            const feeRecord = (student.monthly_fees || []).find(
                              (f) => f.month_name === m.full
                            );
                            const isPaid = feeRecord?.status === 'Selesai';

                            return (
                              <td key={m.short} className="p-1 text-center">
                                <button
                                  onClick={() =>
                                    toggleMonthFeeDirect(
                                      student.id,
                                      m.full,
                                      feeRecord?.status || 'Tunggakan'
                                    )
                                  }
                                  title={`${m.full}: ${isPaid ? 'Selesai' : 'Tunggakan'}`}
                                  className={`w-7 h-7 rounded-md text-xs font-bold transition-all border flex items-center justify-center mx-auto ${
                                    isPaid
                                      ? 'bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600 shadow-2xs'
                                      : 'bg-rose-100 text-rose-600 border-rose-200 hover:bg-rose-200'
                                  }`}
                                >
                                  {isPaid ? '✓' : '✕'}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* PAGE 3: ADMIN - TANDA KEHADIRAN SESI */}
          {activeMenu === 'admin-attendance' && (
            <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4 mb-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Penandaan Kehadiran Latihan
                  </h3>
                  <p className="text-xs text-slate-500">
                    Pilih tarikh latihan, klik pelajar yang hadir, kemudian tekan "Simpan Kehadiran".
                  </p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  <label className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                    Tarikh Latihan:
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {students.map((student) => {
                  const isAttending = attendanceRecords[student.id] === 'Hadir';

                  return (
                    <div
                      key={student.id}
                      onClick={() => toggleAttendanceLocal(student.id)}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                        isAttending
                          ? 'bg-emerald-50/60 border-emerald-300'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div>
                        <p className="text-sm font-bold text-slate-800">{student.name}</p>
                        <p className="text-xs text-slate-500">Penjaga: {student.parent_name}</p>
                      </div>

                      <button
                        type="button"
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          isAttending
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {isAttending ? '✓ HADIR' : '✕ TIDAK HADIR'}
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 pt-4 border-t flex justify-between items-center">
                <span className="text-xs text-slate-500">
                  * Pelajar tidak ditanda dikira sebagai "Tidak Hadir".
                </span>
                <button
                  onClick={handleSaveAttendance}
                  disabled={savingAttendance}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-5 py-2 rounded-lg text-sm shadow-xs transition-colors disabled:opacity-50"
                >
                  {savingAttendance ? 'Menyimpan...' : '💾 Simpan Kehadiran Sesi'}
                </button>
              </div>
            </div>
          )}

          {/* PAGE 4: ADMIN - SEMAKAN RESIT */}
          {activeMenu === 'admin-payments' && (
            <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5">
              <h3 className="text-base font-bold text-slate-900 mb-1">
                Senarai Permohonan Pengesahan Resit
              </h3>
              <p className="text-xs text-slate-500 mb-5">
                Sahkan resit pembayaran yang dihantar oleh ibu bapa
              </p>

              {receipts.length === 0 ? (
                <p className="text-slate-500 text-center py-8 text-sm">Tiada resit dimuat naik lagi.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b">
                        <th className="p-3.5">Nama Pelajar</th>
                        <th className="p-3.5">Penjaga</th>
                        <th className="p-3.5">Fail Resit</th>
                        <th className="p-3.5">Status Pengesahan</th>
                        <th className="p-3.5 text-center">Tindakan Admin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {receipts.map((rcpt) => (
                        <tr key={rcpt.id} className="hover:bg-slate-50">
                          <td className="p-3.5 font-semibold text-slate-900">
                            {rcpt.students?.name || 'Pelajar Deleted'}
                          </td>
                          <td className="p-3.5 text-slate-600">
                            {rcpt.students?.parent_name || '-'}
                          </td>
                          <td className="p-3.5">
                            <a
                              href={rcpt.file_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold px-3 py-1.5 rounded-md border border-emerald-200 inline-flex items-center gap-1"
                            >
                              📄 Lihat Resit
                            </a>
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                rcpt.status === 'Approved'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {rcpt.status}
                            </span>
                          </td>
                          <td className="p-3.5 text-center">
                            {rcpt.status === 'Pending' ? (
                              <button
                                onClick={() => handleApproveReceipt(rcpt.id, rcpt.student_id)}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition-colors shadow-2xs"
                              >
                                Sahkan (Tahunan)
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

          {/* PAGE 5: PORTAL IBU BAPA (UPLOAD RESIT) */}
          {activeMenu === 'parent-portal' && (
            <div className="max-w-xl mx-auto bg-white rounded-xl shadow-xs border border-slate-200 p-5 mt-4">
              <h3 className="text-lg font-bold text-slate-900 mb-1">Muat Naik Resit Pembayaran</h3>
              <p className="text-xs text-slate-500 mb-5">
                Sila pilih nama anak dan muat naik resit perbankan untuk pengesahan jurulatih.
              </p>

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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pilih Nama Anak
                  </label>
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fail Resit (Gambar / PDF)
                  </label>
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
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors shadow-2xs disabled:opacity-50"
                >
                  {uploading ? 'Sedang Muat Naik...' : 'Hantar Resit Sekarang'}
                </button>
              </form>
            </div>
          )}

          {/* MODAL: TAMBAH AHLI BAHARU */}
          {showAddModal && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-4">
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
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nama Pelajar
                    </label>
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
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nama Penjaga / Ibu Bapa
                    </label>
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
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-2xs disabled:opacity-50"
                    >
                      {isAdding ? 'Menyimpan...' : 'Simpan Ahli'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
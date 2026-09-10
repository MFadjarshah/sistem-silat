import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import Papa from 'papaparse';
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

// Pilihan Peringkat Bengkung Silat
const BELT_OPTIONS = [
  'Putih',
  'Kuning',
  'Hijau',
  'Merah',
  'Coklat',
  'Hitam (Pelatih)',
  'Hitam (Jurulatih)'
];

export default function App() {
  const [activeMenu, setActiveMenu] = useState('admin-members');
  const [students, setStudents] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Status Filter Global (Sorting & Column Filtering Excel-Style)
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [openFilterCol, setOpenFilterCol] = useState(null); // 'name', 'parent_name', 'belt_level', 'status_fee_annual'
  const [columnSearch, setColumnSearch] = useState('');

  // Selected Checkboxes Filter untuk setiap lajur
  const [filters, setFilters] = useState({
    name: [],
    parent_name: [],
    belt_level: [],
    status_fee_annual: []
  });

  // Form State untuk Portal Ibu Bapa
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  // Form State untuk Tambah Ahli Baharu
  const [newName, setNewName] = useState('');
  const [newParentName, setNewParentName] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newBeltLevel, setNewBeltLevel] = useState('Putih');
  const [isAdding, setIsAdding] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // State untuk Edit / Detail / Delete Pelajar
  const [selectedStudentForEdit, setSelectedStudentForEdit] = useState(null);
  const [selectedStudentForView, setSelectedStudentForView] = useState(null); // State untuk Modal View
  const [editName, setEditName] = useState('');
  const [editParentName, setEditParentName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editBeltLevel, setEditBeltLevel] = useState('Putih');
  const [isUpdatingStudent, setIsUpdatingStudent] = useState(false);

  // State Filter Jadual Ahli (Aktif vs Berhenti)
  const [memberFilterStatus, setMemberFilterStatus] = useState('Aktif');

  // State untuk Bulk Import Excel/CSV
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [rawTextImport, setRawTextImport] = useState('');
  const [bulkUploading, setBulkUploading] = useState(false);

  // State Kehadiran mengikut Tarikh
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [attendanceHistory, setAttendanceHistory] = useState([]);

  // State untuk peranti mengemaskini
  const [updatingId, setUpdatingId] = useState(null);

  // Ref untuk mengesan klik di luar popover filter
  const popoverRef = useRef(null);

  useEffect(() => {
    fetchData();

    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setOpenFilterCol(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  async function fetchStudents() {
    const { data, error } = await supabase
      .from('students')
      .select('*, monthly_fees(*)')
      .order('id', { ascending: true });

    if (!error && data) {
      const formattedData = data.map((student) => ({
        ...student,
        status: student.status || 'Aktif',
        belt_level: student.belt_level || 'Putih',
        status_fee_annual: student.status_fee_annual || 'Tunggakan',
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

  function toggleAttendanceLocal(studentId) {
    setAttendanceRecords((prev) => {
      const current = prev[studentId] || 'Tidak Hadir';
      return {
        ...prev,
        [studentId]: current === 'Hadir' ? 'Tidak Hadir' : 'Hadir'
      };
    });
  }

  async function handleSaveAttendance() {
    setSavingAttendance(true);
    try {
      const activeStudentsOnly = students.filter((s) => (s.status || 'Aktif') === 'Aktif');
      const payload = activeStudentsOnly.map((s) => ({
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

  async function generateMonthlyFeesForStudents(studentIds) {
    const monthsList = [
      'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
      'Juli', 'Ogos', 'September', 'Oktober', 'November', 'Disember'
    ];
    const feesPayload = [];
    studentIds.forEach((id) => {
      monthsList.forEach((m) => {
        feesPayload.push({
          student_id: id,
          month_name: m,
          year: 2026,
          status: 'Tunggakan'
        });
      });
    });

    if (feesPayload.length > 0) {
      await supabase.from('monthly_fees').insert(feesPayload);
    }
  }

  async function handleAddStudent(e) {
    e.preventDefault();
    if (!newName || !newParentName) {
      alert('Sila isi nama & nama penjaga!');
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
            address: newAddress,
            belt_level: newBeltLevel,
            status: 'Aktif',
            status_fee_annual: 'Tunggakan',
            attendance: 'Tidak Hadir'
          }
        ])
        .select()
        .single();

      if (error) throw error;

      if (newStudent) {
        await generateMonthlyFeesForStudents([newStudent.id]);
      }

      setNewName('');
      setNewParentName('');
      setNewAddress('');
      setNewBeltLevel('Putih');
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

  function openEditModal(student) {
    setSelectedStudentForEdit(student);
    setEditName(student.name || '');
    setEditParentName(student.parent_name || '');
    setEditAddress(student.address || '');
    setEditBeltLevel(student.belt_level || 'Putih');
  }

  // Fungsi Papar Maklumat Detail (View)
  function openViewModal(student) {
    setSelectedStudentForView(student);
  }

  // Fungsi Padam Pelajar (Delete)
  async function handleDeleteStudent(studentId, studentName) {
    if (!window.confirm(`Adakah anda pasti mahu menghapus rekod ahli "${studentName}" secara kekal?`)) {
      return;
    }

    try {
      // Padam rekod yuran dan kehadiran terlebih dahulu jika wujud
      await supabase.from('monthly_fees').delete().eq('student_id', studentId);
      await supabase.from('attendance').delete().eq('student_id', studentId);
      await supabase.from('receipts').delete().eq('student_id', studentId);

      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', studentId);

      if (error) throw error;

      alert(`Rekod ${studentName} berjaya dipadamkan.`);
      fetchStudents();
    } catch (err) {
      console.error('Ralat Padam Pelajar:', err);
      alert('Gagal menghapus rekod pelajar.');
    }
  }

  async function handleUpdateStudent(e) {
    e.preventDefault();
    if (!selectedStudentForEdit) return;

    setIsUpdatingStudent(true);
    try {
      const { error } = await supabase
        .from('students')
        .update({
          name: editName,
          parent_name: editParentName,
          address: editAddress,
          belt_level: editBeltLevel
        })
        .eq('id', selectedStudentForEdit.id);

      if (error) throw error;

      alert('Maklumat pelajar berjaya dikemaskini!');
      setSelectedStudentForEdit(null);
      fetchStudents();
    } catch (err) {
      console.error('Ralat Kemaskini Pelajar:', err);
      alert('Gagal mengemaskini maklumat pelajar.');
    } finally {
      setIsUpdatingStudent(false);
    }
  }

  async function handleSetStudentStatus(studentId, newStatus) {
    const confirmationText =
      newStatus === 'Berhenti'
        ? 'Adakah anda pasti mahu mengisytiharkan pelajar ini berhenti dari silat?'
        : 'Adakah anda pasti mahu mengaktifkan semula pelajar ini?';

    if (!window.confirm(confirmationText)) return;

    try {
      const { error } = await supabase
        .from('students')
        .update({ status: newStatus })
        .eq('id', studentId);

      if (error) throw error;

      alert(
        newStatus === 'Berhenti'
          ? 'Pelajar berjaya dipindahkan ke Sejarah Ahli Berhenti.'
          : 'Pelajar berjaya diaktifkan semula!'
      );
      setSelectedStudentForEdit(null);
      fetchStudents();
    } catch (err) {
      console.error('Ralat Tukar Status Pelajar:', err);
      alert(`Gagal mengemaskini status pelajar.`);
    }
  }

  async function processBulkInsert(parsedRows) {
    if (!parsedRows || parsedRows.length === 0) {
      alert('Tiada data ditemui!');
      return;
    }

    setBulkUploading(true);
    try {
      const studentDataToInsert = parsedRows
        .filter((row) => row.name || row.Nama || row[0])
        .map((row) => ({
          name: (row.name || row.Nama || row[0] || '').trim(),
          parent_name: (row.parent_name || row.Penjaga || row['Nama Penjaga'] || row[1] || '-').trim(),
          address: (row.address || row.Alamat || row[2] || '').trim(),
          belt_level: (row.belt || row.Bengkung || row[3] || 'Putih').trim(),
          status: 'Aktif',
          status_fee_annual: 'Tunggakan',
          attendance: 'Tidak Hadir'
        }));

      if (studentDataToInsert.length === 0) {
        alert('Format data tidak sah.');
        setBulkUploading(false);
        return;
      }

      const { data: insertedStudents, error } = await supabase
        .from('students')
        .insert(studentDataToInsert)
        .select();

      if (error) throw error;

      if (insertedStudents && insertedStudents.length > 0) {
        const newIds = insertedStudents.map((s) => s.id);
        await generateMonthlyFeesForStudents(newIds);
      }

      alert(`Berjaya menambah ${insertedStudents.length} orang ahli baharu! 🎉`);
      setShowBulkModal(false);
      setRawTextImport('');
      fetchStudents();
    } catch (err) {
      console.error('Ralat Bulk Import:', err);
      alert('Ralat semasa mengimport data.');
    } finally {
      setBulkUploading(false);
    }
  }

  function handleCSVFileUpload(e) {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    Papa.parse(uploadedFile, {
      header: true,
      skipEmptyLines: true,
      complete: function (results) {
        if (results.data && results.data.length > 0) {
          processBulkInsert(results.data);
        } else {
          Papa.parse(uploadedFile, {
            header: false,
            skipEmptyLines: true,
            complete: function (res2) {
              processBulkInsert(res2.data);
            }
          });
        }
      }
    });
  }

  function handleTextImportSubmit() {
    if (!rawTextImport.trim()) {
      alert('Sila tampal (paste) data dari Excel terlebih dahulu!');
      return;
    }

    const parsed = Papa.parse(rawTextImport.trim(), {
      delimiter: '\t',
      header: false,
      skipEmptyLines: true
    });

    processBulkInsert(parsed.data);
  }

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

  function getBeltBadgeStyle(belt) {
    switch (belt) {
      case 'Putih':
        return 'bg-slate-100 text-slate-800 border-slate-300';
      case 'Kuning':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'Hijau':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'Merah':
        return 'bg-rose-100 text-rose-900 border-rose-300';
      case 'Coklat':
        return 'bg-amber-800 text-white border-amber-900';
      case 'Hitam (Pelatih)':
      case 'Hitam (Jurulatih)':
        return 'bg-slate-900 text-amber-400 border-black';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
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

  // LOGIK FILTER & SORT EXCEL
  const activeStudents = students.filter((s) => (s.status || 'Aktif') === 'Aktif');
  const inactiveStudents = students.filter((s) => s.status === 'Berhenti');
  let baseList = memberFilterStatus === 'Aktif' ? activeStudents : inactiveStudents;

  // 1. Tapis mengikut tetapan Checkbox Excel untuk setiap lajur
  const filteredStudents = baseList.filter((student) => {
    return Object.keys(filters).every((colKey) => {
      const selectedVals = filters[colKey];
      if (!selectedVals || selectedVals.length === 0) return true;
      const val = (student[colKey] || '').toString();
      return selectedVals.includes(val);
    });
  });

  // 2. Susun mengikut Sorting Excel
  const displayedStudents = [...filteredStudents].sort((a, b) => {
    if (!sortConfig.key) return 0;
    let valA = (a[sortConfig.key] || '').toString().toLowerCase();
    let valB = (b[sortConfig.key] || '').toString().toLowerCase();

    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
    if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Helper untuk toggle/select checkbox filter Excel
  function handleFilterCheckboxToggle(colKey, value) {
    setFilters((prev) => {
      const currentSelected = prev[colKey] || [];
      if (currentSelected.includes(value)) {
        return { ...prev, [colKey]: currentSelected.filter((v) => v !== value) };
      } else {
        return { ...prev, [colKey]: [...currentSelected, value] };
      }
    });
  }

  function handleSelectAllColumnValues(colKey, allValues) {
    setFilters((prev) => ({
      ...prev,
      [colKey]: (prev[colKey] || []).length === allValues.length ? [] : [...allValues]
    }));
  }

  function handleSortColumn(key, direction) {
    setSortConfig({ key, direction });
    setOpenFilterCol(null);
  }

  function clearColumnFilter(colKey) {
    setFilters((prev) => ({ ...prev, [colKey]: [] }));
    setOpenFilterCol(null);
  }

  // BINA DROPDOWN MENU EXCEL DYNAMIC
  function renderExcelFilterPopover(colKey, colName) {
    // Ambil senarai nilai unik dari data asas
    const rawUniqueVals = Array.from(
      new Set(baseList.map((item) => (item[colKey] || '').toString()).filter(Boolean))
    ).sort();

    const searchFilteredVals = rawUniqueVals.filter((v) =>
      v.toLowerCase().includes(columnSearch.toLowerCase())
    );

    const selectedVals = filters[colKey] || [];
    const isAllSelected = selectedVals.length === 0 || selectedVals.length === rawUniqueVals.length;

    return (
      <div
        ref={popoverRef}
        className="absolute top-full left-0 mt-1 w-60 bg-white border border-slate-300 shadow-xl rounded-lg z-50 text-slate-800 font-normal normal-case text-xs p-2 space-y-2 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Butang Sort */}
        <div className="space-y-0.5 border-b pb-1.5 border-slate-200">
          <button
            onClick={() => handleSortColumn(colKey, 'asc')}
            className="w-full flex items-center gap-2 px-2 py-1 hover:bg-slate-100 rounded text-slate-700"
          >
            <span>Sort A to Z</span>
          </button>
          <button
            onClick={() => handleSortColumn(colKey, 'desc')}
            className="w-full flex items-center gap-2 px-2 py-1 hover:bg-slate-100 rounded text-slate-700"
          >
            <span>Sort Z to A</span>
          </button>
        </div>

        {/* Clear Filter Option */}
        {selectedVals.length > 0 && (
          <div className="border-b pb-1.5 border-slate-200">
            <button
              onClick={() => clearColumnFilter(colKey)}
              className="w-full text-left px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 rounded"
            >
              Clear Filter From "{colName}"
            </button>
          </div>
        )}

        {/* Ruang Carian Dalam Dropdown */}
        <div>
          <input
            type="text"
            placeholder="Search..."
            value={columnSearch}
            onChange={(e) => setColumnSearch(e.target.value)}
            className="w-full px-2 py-1 border border-slate-300 rounded text-xs focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Senarai Checkbox Mod Excel */}
        <div className="max-h-36 overflow-y-auto space-y-1 border border-slate-200 rounded p-1 bg-slate-50/50">
          <label className="flex items-center gap-2 px-1 py-0.5 hover:bg-slate-100 rounded cursor-pointer font-semibold border-b pb-1">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={() => handleSelectAllColumnValues(colKey, rawUniqueVals)}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span>(Select All)</span>
          </label>

          {searchFilteredVals.map((val) => {
            const isChecked = selectedVals.length === 0 || selectedVals.includes(val);
            return (
              <label
                key={val}
                className="flex items-center gap-2 px-1 py-0.5 hover:bg-slate-100 rounded cursor-pointer text-slate-700"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleFilterCheckboxToggle(colKey, val)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="truncate">{val}</span>
              </label>
            );
          })}
        </div>

        <div className="flex justify-end pt-1">
          <button
            onClick={() => setOpenFilterCol(null)}
            className="bg-emerald-600 text-white px-3 py-1 rounded text-[11px] font-semibold hover:bg-emerald-700"
          >
            OK
          </button>
        </div>
      </div>
    );
  }

  // Data Graf Yuran
  const feeChartData = monthsListShort.map((m) => {
    let paidCount = 0;
    let pendingCount = 0;

    activeStudents.forEach((student) => {
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

  const totalStudents = activeStudents.length;

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
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeMenu === 'dashboard'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'hover:bg-slate-800 hover:text-white'
                }`}
            >
              <span>📊</span> Dashboard Summary
            </button>

            <button
              onClick={() => setActiveMenu('parent-portal')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeMenu === 'parent-portal'
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
              onClick={() => {
                setActiveMenu('admin-members');
                setMemberFilterStatus('Aktif');
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeMenu === 'admin-members' && memberFilterStatus === 'Aktif'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'hover:bg-slate-800 hover:text-white'
                }`}
            >
              <span>📋</span> Senarai Ahli Aktif
            </button>

            <button
              onClick={() => {
                setActiveMenu('admin-members');
                setMemberFilterStatus('Berhenti');
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeMenu === 'admin-members' && memberFilterStatus === 'Berhenti'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'hover:bg-slate-800 hover:text-white'
                }`}
            >
              <span>📜</span> Sejarah Ahli (Berhenti)
            </button>

            <button
              onClick={() => setActiveMenu('admin-attendance')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeMenu === 'admin-attendance'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'hover:bg-slate-800 hover:text-white'
                }`}
            >
              <span>📋</span> Tanda Kehadiran Sesi
            </button>

            <button
              onClick={() => setActiveMenu('admin-payments')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeMenu === 'admin-payments'
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
          <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px]">v3.6</span>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center shadow-xs shrink-0 h-14">
          <h2 className="text-base font-bold text-slate-800">
            {activeMenu === 'dashboard' && 'Dashboard Summary Kehadiran & Yuran'}
            {activeMenu === 'admin-members' && (memberFilterStatus === 'Aktif' ? 'Senarai Ahli Aktif' : 'Sejarah Ahli (Berhenti)')}
            {activeMenu === 'admin-attendance' && 'Modul Penandaan Kehadiran Latihan'}
            {activeMenu === 'admin-payments' && 'Semakan & Pengesahan Resit Pembayaran'}
            {activeMenu === 'parent-portal' && 'Portal Ibu Bapa & Muat Naik Resit'}
          </h2>
          <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-3 py-1 rounded-full border border-emerald-200">
            Supabase Live
          </span>
        </header>

        {/* CONTAINER UTAMA */}
        <main className={`flex-1 p-4 min-h-0 ${activeMenu === 'dashboard' ? 'flex flex-col gap-4 overflow-hidden' : 'overflow-y-auto space-y-4'}`}>

          {/* DASHBOARD FIT-TO-SCREEN */}
          {activeMenu === 'dashboard' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 shrink-0">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Total Ahli Aktif Gelanggang</p>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col h-full min-h-0">
                  <div className="mb-2 shrink-0">
                    <h3 className="text-sm font-bold text-slate-900">📊 Rekod Kehadiran Sesi Latihan</h3>
                    <p className="text-[11px] text-slate-500">Bilangan pelajar Hadir vs Tidak Hadir mengikut tarikh.</p>
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

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col h-full min-h-0">
                  <div className="mb-2 shrink-0">
                    <h3 className="text-sm font-bold text-slate-900">💳 Kutipan Yuran Bulanan (2026)</h3>
                    <p className="text-[11px] text-slate-500">Nisbah pembayaran Lunas vs Tunggakan (Jan - Dis).</p>
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

          {/* PAGE: SENARAI AHLI AKTIF & SEJARAH AHLI BERHENTI */}
          {activeMenu === 'admin-members' && (
            <div className="space-y-3">

              {/* ACTION BUTTONS TOP BAR */}
              <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <div className="text-xs text-slate-500">
                  Menunjukkan <strong className="text-slate-800">{displayedStudents.length}</strong> rekod ahli.
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowBulkModal(true)}
                    className="bg-slate-800 hover:bg-slate-900 text-white px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-xs flex items-center gap-1.5"
                  >
                    <span>📊</span> Import Excel / CSV
                  </button>

                  <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-xs flex items-center gap-1.5"
                  >
                    <span>+</span> Tambah Pelajar Baru
                  </button>
                </div>
              </div>

              {/* JADUAL AHLI DENGAN EXCEL FILTER DROPDOWN PADA SETIAP HEADER */}
              <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-visible">
                {loading ? (
                  <div className="p-12 text-center text-slate-500 text-sm">
                    Memuatkan data...
                  </div>
                ) : displayedStudents.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 text-sm">
                    Tiada rekod pelajar ditemui mengikut penapis Excel ini.
                  </div>
                ) : (
                  <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left text-sm text-slate-700">
                      <thead className="bg-slate-100 border-b border-slate-200 text-slate-800 font-bold text-xs uppercase tracking-wider select-none">
                        <tr>
                          <th className="py-3 px-3 w-12 text-center border-r border-slate-200">
                            NO.
                          </th>

                          {/* HEADER: NAMA PELAJAR */}
                          <th className="py-3 px-3 border-r border-slate-200 relative">
                            <div className="flex items-center justify-between gap-2">
                              <span>NAMA PELAJAR</span>
                              <button
                                onClick={() => {
                                  setColumnSearch('');
                                  setOpenFilterCol(openFilterCol === 'name' ? null : 'name');
                                }}
                                className={`p-1 rounded hover:bg-slate-200 border border-slate-300 ${(filters.name || []).length > 0 ? 'bg-emerald-100 text-emerald-800 border-emerald-400' : 'bg-white text-slate-600'
                                  }`}
                              >
                                🔻
                              </button>
                            </div>
                            {openFilterCol === 'name' && renderExcelFilterPopover('name', 'NAMA PELAJAR')}
                          </th>

                          {/* HEADER: NAMA PENJAGA */}
                          <th className="py-3 px-3 border-r border-slate-200 relative">
                            <div className="flex items-center justify-between gap-2">
                              <span>NAMA PENJAGA</span>
                              <button
                                onClick={() => {
                                  setColumnSearch('');
                                  setOpenFilterCol(openFilterCol === 'parent_name' ? null : 'parent_name');
                                }}
                                className={`p-1 rounded hover:bg-slate-200 border border-slate-300 ${(filters.parent_name || []).length > 0 ? 'bg-emerald-100 text-emerald-800 border-emerald-400' : 'bg-white text-slate-600'
                                  }`}
                              >
                                🔻
                              </button>
                            </div>
                            {openFilterCol === 'parent_name' && renderExcelFilterPopover('parent_name', 'NAMA PENJAGA')}
                          </th>

                          {/* HEADER: BENGKUNG */}
                          <th className="py-3 px-3 border-r border-slate-200 relative">
                            <div className="flex items-center justify-between gap-2">
                              <span>BENGKUNG</span>
                              <button
                                onClick={() => {
                                  setColumnSearch('');
                                  setOpenFilterCol(openFilterCol === 'belt_level' ? null : 'belt_level');
                                }}
                                className={`p-1 rounded hover:bg-slate-200 border border-slate-300 ${(filters.belt_level || []).length > 0 ? 'bg-emerald-100 text-emerald-800 border-emerald-400' : 'bg-white text-slate-600'
                                  }`}
                              >
                                🔻
                              </button>
                            </div>
                            {openFilterCol === 'belt_level' && renderExcelFilterPopover('belt_level', 'BENGKUNG')}
                          </th>

                          {/* HEADER: YURAN TAHUNAN */}
                          <th className="py-3 px-3 border-r border-slate-200 relative">
                            <div className="flex items-center justify-between gap-2">
                              <span>YURAN TAHUNAN</span>
                              <button
                                onClick={() => {
                                  setColumnSearch('');
                                  setOpenFilterCol(openFilterCol === 'status_fee_annual' ? null : 'status_fee_annual');
                                }}
                                className={`p-1 rounded hover:bg-slate-200 border border-slate-300 ${(filters.status_fee_annual || []).length > 0 ? 'bg-emerald-100 text-emerald-800 border-emerald-400' : 'bg-white text-slate-600'
                                  }`}
                              >
                                🔻
                              </button>
                            </div>
                            {openFilterCol === 'status_fee_annual' && renderExcelFilterPopover('status_fee_annual', 'YURAN TAHUNAN')}
                          </th>

                          {/* HEADER: YURAN BULANAN */}
                          <th className="py-3 px-3 text-center border-r border-slate-200">
                            YURAN BULANAN 2026
                          </th>

                          <th className="py-3 px-3 text-center">
                            TINDAKAN
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {displayedStudents.map((student, index) => (
                          <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2.5 px-3 font-bold text-slate-400 text-center w-12">
                              {index + 1}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-900">
                              <span>{student.name}</span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">{student.parent_name || '-'}</td>
                            <td className="py-2.5 px-3">
                              <span className={`inline-block px-2.5 py-0.5 text-xs font-bold rounded border ${getBeltBadgeStyle(student.belt_level)}`}>
                                {student.belt_level}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <button
                                onClick={() => toggleAnnualFeeStatus(student.id, student.status_fee_annual)}
                                disabled={updatingId === student.id}
                                className={`px-2.5 py-0.5 rounded text-xs font-semibold border transition-all ${student.status_fee_annual === 'Selesai'
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : 'bg-rose-100 text-rose-800 border-rose-300'
                                  }`}
                              >
                                {student.status_fee_annual}
                              </button>
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="flex items-center justify-center gap-1">
                                {monthsListShort.map((m) => {
                                  const fee = (student.monthly_fees || []).find((f) => f.month_name === m.full);
                                  const isPaid = fee?.status === 'Selesai';
                                  return (
                                    <button
                                      key={m.short}
                                      title={`${m.full}: ${isPaid ? 'Selesai' : 'Tunggakan'}`}
                                      onClick={() => toggleMonthFeeDirect(student.id, m.full, fee?.status)}
                                      className={`w-5 h-5 text-[9px] font-bold rounded flex items-center justify-center transition-all ${isPaid
                                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                        : 'bg-slate-100 text-slate-400 hover:bg-slate-200 border border-slate-300'
                                        }`}
                                    >
                                      {m.short[0]}
                                    </button>
                                  );
                                })}
                              </div>
                            </td>

                            {/* BAHAGIAN TINDAKAN DENGAN BUTANG VIEW & DELETE */}
                            <td className="py-2.5 px-3 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => openViewModal(student)}
                                  className="px-2.5 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
                                >
                                  View
                                </button>

                                <button
                                  onClick={() => handleDeleteStudent(student.id, student.name)}
                                  className="px-2.5 py-1 text-xs font-medium text-rose-600 bg-rose-50 border border-rose-200 rounded-md hover:bg-rose-100 transition-colors"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PAGE 3: ADMIN - TANDA KEHADIRAN */}
          {activeMenu === 'admin-attendance' && (
            <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Penandaan Kehadiran Latihan</h3>
                  <p className="text-xs text-slate-500">Pilih tarikh latihan dan tanda kehadiran pelajar aktif.</p>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700"
                  />
                  <button
                    onClick={handleSaveAttendance}
                    disabled={savingAttendance}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-xs"
                  >
                    {savingAttendance ? 'Menyimpan...' : 'Simpan Kehadiran'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {activeStudents.map((student) => {
                  const isPresent = attendanceRecords[student.id] === 'Hadir';
                  return (
                    <div
                      key={student.id}
                      onClick={() => toggleAttendanceLocal(student.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex justify-between items-center ${isPresent
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                    >
                      <div>
                        <p className="font-semibold text-sm">{student.name}</p>
                        <p className="text-xs text-slate-500">Penjaga: {student.parent_name || '-'}</p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${isPresent ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                          }`}
                      >
                        {isPresent ? 'Hadir' : 'Tidak Hadir'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* PAGE 4: ADMIN - SEMAKAN RESIT */}
          {activeMenu === 'admin-payments' && (
            <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-4">
              <h3 className="text-base font-bold text-slate-900 border-b pb-3">Semakan Resit Pembayaran</h3>
              {receipts.length === 0 ? (
                <p className="text-slate-400 text-xs text-center py-8">Tiada resit dimuat naik lagi.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {receipts.map((r) => (
                    <div key={r.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex gap-4">
                      <a href={r.file_url} target="_blank" rel="noreferrer" className="shrink-0">
                        <img src={r.file_url} alt="Resit" className="w-20 h-24 object-cover rounded border" />
                      </a>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-bold text-sm text-slate-900">{r.students?.name || 'Pelajar'}</h4>
                          <p className="text-xs text-slate-500">Penjaga: {r.students?.parent_name || '-'}</p>
                          <span
                            className={`inline-block mt-2 px-2 py-0.5 text-[10px] font-bold rounded ${r.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}
                          >
                            Status: {r.status}
                          </span>
                        </div>
                        {r.status !== 'Approved' && (
                          <button
                            onClick={() => handleApproveReceipt(r.id, r.student_id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1 rounded-md font-medium transition-colors w-max"
                          >
                            Sahkan Bayaran
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PAGE 5: PORTAL IBU BAPA */}
          {activeMenu === 'parent-portal' && (
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
          )}

        </main>
      </div>

      {/* MODAL VIEW / PAPAR MAKLUMAT AHLI */}
      {selectedStudentForView && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-lg font-bold text-slate-900">Maklumat Ahli</h3>
              <span className={`px-2.5 py-0.5 text-xs font-bold rounded ${selectedStudentForView.status === 'Aktif' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                {selectedStudentForView.status || 'Aktif'}
              </span>
            </div>

            <div className="space-y-3 text-sm text-slate-700">
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase">Nama Pelajar</p>
                <p className="font-bold text-slate-900 text-base">{selectedStudentForView.name}</p>
              </div>

              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase">Nama Penjaga</p>
                <p className="font-medium text-slate-800">{selectedStudentForView.parent_name || '-'}</p>
              </div>

              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase">Peringkat Bengkung</p>
                <span className={`inline-block mt-1 px-2.5 py-0.5 text-xs font-bold rounded border ${getBeltBadgeStyle(selectedStudentForView.belt_level)}`}>
                  {selectedStudentForView.belt_level}
                </span>
              </div>

              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase">Alamat</p>
                <p className="font-medium text-slate-800 bg-slate-50 p-2 rounded border border-slate-200 mt-1">
                  {selectedStudentForView.address || 'Tiada maklumat alamat.'}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase">Status Yuran Tahunan</p>
                <span className={`inline-block mt-1 px-2.5 py-0.5 rounded text-xs font-semibold border ${selectedStudentForView.status_fee_annual === 'Selesai' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-rose-100 text-rose-800 border-rose-300'}`}>
                  {selectedStudentForView.status_fee_annual}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => {
                  const student = selectedStudentForView;
                  setSelectedStudentForView(null);
                  openEditModal(student);
                }}
                className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-lg font-medium text-xs hover:bg-slate-200 transition-colors"
              >
                Kemaskini / Edit
              </button>

              <button
                type="button"
                onClick={() => setSelectedStudentForView(null)}
                className="flex-1 bg-emerald-600 text-white py-2 rounded-lg font-medium text-xs hover:bg-emerald-700 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH AHLI BAHARU */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Tambah Ahli Baharu</h3>
            <form onSubmit={handleAddStudent} className="space-y-3">
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Peringkat Bengkung</label>
                <select
                  value={newBeltLevel}
                  onChange={(e) => setNewBeltLevel(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  {BELT_OPTIONS.map((belt) => (
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
                  onClick={() => setShowAddModal(false)}
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
      )}

      {/* MODAL EDIT & DETAIL AHLI */}
      {selectedStudentForEdit && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Kemaskini Maklumat Pelajar</h3>
            <form onSubmit={handleUpdateStudent} className="space-y-3">
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
                  {BELT_OPTIONS.map((belt) => (
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
                {selectedStudentForEdit.status === 'Aktif' ? (
                  <button
                    type="button"
                    onClick={() => handleSetStudentStatus(selectedStudentForEdit.id, 'Berhenti')}
                    className="text-xs bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 px-3 py-2 rounded-lg font-medium"
                  >
                    Set Berhenti Silat
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSetStudentStatus(selectedStudentForEdit.id, 'Aktif')}
                    className="text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-3 py-2 rounded-lg font-medium"
                  >
                    Aktifkan Semula
                  </button>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedStudentForEdit(null)}
                    className="bg-slate-100 text-slate-700 px-3 py-2 rounded-lg font-medium text-xs hover:bg-slate-200"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingStudent}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium text-xs hover:bg-emerald-700"
                  >
                    {isUpdatingStudent ? 'Menyimpan...' : 'Kemaskini'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL BULK IMPORT */}
      {showBulkModal && (
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
                  onChange={handleCSVFileUpload}
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
                  value={rawTextImport}
                  onChange={(e) => setRawTextImport(e.target.value)}
                  placeholder="Tampal data di sini (Susunan lajur: Nama | Penjaga | Alamat | Bengkung)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  rows="5"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-lg font-medium text-xs hover:bg-slate-200"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleTextImportSubmit}
                disabled={bulkUploading}
                className="flex-1 bg-slate-800 text-white py-2 rounded-lg font-medium text-xs hover:bg-slate-900"
              >
                {bulkUploading ? 'Mengimport...' : 'Proses Import Text'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import Papa from 'papaparse';

// Components
import Sidebar from './components/Sidebar';
import AddStudentModal from './components/AddStudentModal';
import EditStudentModal from './components/EditStudentModal';
import BulkImportModal from './components/BulkImportModal';

// Pages
import DashboardSummary from './pages/DashboardSummary';
import MembersList from './pages/MembersList';
import Attendance from './pages/Attendance';
import Payments from './pages/Payments';
import ParentPortal from './pages/ParentPortal';

const BELT_OPTIONS = [
  'Putih',
  'Kuning',
  'Hijau',
  'Merah',
  'Coklat',
  'Hitam (Pelatih)',
  'Hitam (Jurulatih)'
];

const monthsListShort = [
  { short: 'Jan', full: 'Januari' },
  { short: 'Feb', full: 'Februari' },
  { short: 'Mac', full: 'Mac' },
  { short: 'Apr', full: 'April' },
  { short: 'Mei', full: 'Mei' },
  { short: 'Jun', full: 'Jun' },
  { short: 'Jul', full: 'Julai' },
  { short: 'Ogo', full: 'Ogos' },
  { short: 'Sep', full: 'September' },
  { short: 'Okt', full: 'Oktober' },
  { short: 'Nov', full: 'November' },
  { short: 'Dis', full: 'Disember' }
];

export default function App() {
  const [activeMenu, setActiveMenu] = useState('admin-members');
  const [students, setStudents] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Status Filter Global
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [openFilterCol, setOpenFilterCol] = useState(null);
  const [columnSearch, setColumnSearch] = useState('');
  const [filters, setFilters] = useState({
    name: [],
    parent_name: [],
    belt_level: [],
    status_fee_annual: []
  });

  // Portal Ibu Bapa
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  // Tambah Ahli
  const [newName, setNewName] = useState('');
  const [newParentName, setNewParentName] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newBeltLevel, setNewBeltLevel] = useState('Putih');
  const [isAdding, setIsAdding] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [newGender, setNewGender] = useState('');
  const [newAge, setNewAge] = useState('');

  // Edit Ahli
  const [selectedStudentForEdit, setSelectedStudentForEdit] = useState(null);
  const [editName, setEditName] = useState('');
  const [editParentName, setEditParentName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editBeltLevel, setEditBeltLevel] = useState('Putih');
  const [isUpdatingStudent, setIsUpdatingStudent] = useState(false);
  const [editPhone, setEditPhone] = useState('');
  const [editGender, setEditGender] = useState('');
  const [editAge, setEditAge] = useState('');

  // Filter Status (Aktif / Berhenti)
  const [memberFilterStatus, setMemberFilterStatus] = useState('Aktif');

  // Bulk Import
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [rawTextImport, setRawTextImport] = useState('');
  const [bulkUploading, setBulkUploading] = useState(false);

  // Kehadiran
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [attendanceHistory, setAttendanceHistory] = useState([]);

  // Kemaskini ID
  const [updatingId, setUpdatingId] = useState(null);

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

  async function toggleMonthlyFeeDirect(studentId, targetMonthName, currentStatus) {
    const MONTHS_ORDER = [
      'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
      'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'
    ];

    const targetIndex = MONTHS_ORDER.indexOf(targetMonthName);
    if (targetIndex === -1) return;

    const isNowPaid = currentStatus !== 'Selesai';
    const newStatus = isNowPaid ? 'Selesai' : 'Tunggakan';

    // Tentukan senarai bulan yang akan dikemaskini
    const monthsToUpdate = isNowPaid
      ? MONTHS_ORDER.slice(0, targetIndex + 1)
      : MONTHS_ORDER.slice(targetIndex);

    try {
      // 1. Kemaskini pangkalan data Supabase
      const { error } = await supabase
        .from('monthly_fees')
        .update({ status: newStatus })
        .eq('student_id', studentId)
        .in('month_name', monthsToUpdate);

      if (error) throw error;

      // 2. Kemaskini State Utama (UI Update)
      setStudents((prevStudents) =>
        prevStudents.map((student) => {
          if (student.id !== studentId) return student;

          const updatedFees = (student.monthly_fees || []).map((fee) => {
            if (monthsToUpdate.includes(fee.month_name)) {
              return { ...fee, status: newStatus };
            }
            return fee;
          });

          return { ...student, monthly_fees: updatedFees };
        })
      );

      // 3. Popup Pengesahan Ringkas
      alert(`Status yuran sehingga bulan ${targetMonthName} berjaya ditukar kepada "${newStatus}"!`);

    } catch (err) {
      console.error('Ralat kemaskini yuran bulanan:', err);
      alert(`Gagal mengemaskini yuran: ${err.message || 'Sila cuba lagi'}`);
    }
  }

  async function generateMonthlyFeesForStudents(studentIds) {
    const monthsList = [
      'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
      'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'
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
      // Tukar age ke integer, atau null jika kosong/invalid
      const parsedAge = newAge !== '' && newAge !== null ? parseInt(newAge, 10) : null;

      const { data: newStudent, error } = await supabase
        .from('students')
        .insert([
          {
            name: newName,
            parent_name: newParentName,
            gender: newGender || null,
            age: isNaN(parsedAge) ? null : parsedAge,
            phone: newPhone,
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
      setNewGender('');
      setNewAge('');
      setNewPhone('');
      setNewAddress('');
      setNewBeltLevel('Putih');
      setShowAddModal(false);
      fetchStudents();
      alert('Ahli baharu berjaya didaftarkan!');
    } catch (error) {
      console.error('Ralat Tambah Ahli:', error);
      alert(`Gagal menambah ahli: ${error.message || 'Sila semak konsol'}`);
    } finally {
      setIsAdding(false);
    }
  }

  async function handleUpdateStudent(e) {
    e.preventDefault();
    if (!selectedStudentForEdit) return;

    setIsUpdatingStudent(true);
    try {
      // Tukar editAge ke integer, atau null jika kosong/invalid
      const parsedAge = editAge !== '' && editAge !== null ? parseInt(editAge, 10) : null;

      const { error } = await supabase
        .from('students')
        .update({
          name: editName,
          parent_name: editParentName,
          gender: editGender || null,
          age: isNaN(parsedAge) ? null : parsedAge,
          phone: editPhone,
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
      alert(`Gagal mengemaskini: ${err.message || err.details || 'Sila semak konsol'}`);
    } finally {
      setIsUpdatingStudent(false);
    }
  }

  function openEditModal(student) {
    setSelectedStudentForEdit(student);
    setEditName(student.name || '');
    setEditParentName(student.parent_name || '');
    setEditGender(student.gender || '');
    setEditAge(student.age || '');
    setEditPhone(student.phone || '');
    setEditAddress(student.address || '');
    setEditBeltLevel(student.belt_level || 'Putih');
  }

  async function handleUpdateStudent(e) {
    e.preventDefault();
    if (!selectedStudentForEdit) return;

    setIsUpdatingStudent(true);
    try {
      // Hantar data spesifik sahaja, elakkan menghantar data berantai dari jadual lain
      const { error } = await supabase
        .from('students')
        .update({
          name: editName,
          parent_name: editParentName,
          gender: editGender,
          age: editAge,
          phone: editPhone,
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
      alert(`Gagal mengemaskini: ${err.message || err.details || 'Sila semak konsol'}`);
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

  // Filter & Sort Logic
  const activeStudents = students.filter((s) => (s.status || 'Aktif') === 'Aktif');
  const inactiveStudents = students.filter((s) => s.status === 'Berhenti');
  let baseList = memberFilterStatus === 'Aktif' ? activeStudents : inactiveStudents;

  const filteredStudents = baseList.filter((student) => {
    return Object.keys(filters).every((colKey) => {
      const selectedVals = filters[colKey];
      if (!selectedVals || selectedVals.length === 0) return true;
      const val = (student[colKey] || '').toString();
      return selectedVals.includes(val);
    });
  });

  const displayedStudents = [...filteredStudents].sort((a, b) => {
    if (!sortConfig.key) return 0;
    let valA = (a[sortConfig.key] || '').toString().toLowerCase();
    let valB = (b[sortConfig.key] || '').toString().toLowerCase();

    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
    if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

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

  function renderExcelFilterPopover(colKey, colName) {
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

        <div>
          <input
            type="text"
            placeholder="Search..."
            value={columnSearch}
            onChange={(e) => setColumnSearch(e.target.value)}
            className="w-full px-2 py-1 border border-slate-300 rounded text-xs focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
          />
        </div>

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

  return (
    <div className="flex h-screen bg-slate-100 font-sans overflow-hidden">
      <Sidebar
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        setMemberFilterStatus={setMemberFilterStatus}
        memberFilterStatus={memberFilterStatus}
      />

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

        <main className={`flex-1 p-4 min-h-0 ${activeMenu === 'dashboard' ? 'flex flex-col gap-4 overflow-hidden' : 'overflow-y-auto space-y-4'}`}>
          {activeMenu === 'dashboard' && (
            <DashboardSummary
              totalStudents={activeStudents.length}
              attendanceHistory={attendanceHistory}
              feeChartData={feeChartData}
            />
          )}

          {activeMenu === 'admin-members' && (
            <MembersList
              displayedStudents={displayedStudents}
              loading={loading}
              filters={filters}
              openFilterCol={openFilterCol}
              setOpenFilterCol={setOpenFilterCol}
              setColumnSearch={setColumnSearch}
              renderExcelFilterPopover={renderExcelFilterPopover}
              toggleAnnualFeeStatus={toggleAnnualFeeStatus}
              updatingId={updatingId}
              toggleMonthlyFeeDirect={toggleMonthlyFeeDirect}
              monthsListShort={monthsListShort}
              getBeltBadgeStyle={getBeltBadgeStyle}
              openEditModal={openEditModal}
              setShowBulkModal={setShowBulkModal}
              setShowAddModal={setShowAddModal}
            />
          )}

          {activeMenu === 'admin-attendance' && (
            <Attendance
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              handleSaveAttendance={handleSaveAttendance}
              savingAttendance={savingAttendance}
              activeStudents={activeStudents}
              attendanceRecords={attendanceRecords}
              toggleAttendanceLocal={toggleAttendanceLocal}
            />
          )}

          {activeMenu === 'admin-payments' && (
            <Payments
              receipts={receipts}
              handleApproveReceipt={handleApproveReceipt}
            />
          )}

          {activeMenu === 'parent-portal' && (
            <ParentPortal
              handleUploadReceipt={handleUploadReceipt}
              selectedStudentId={selectedStudentId}
              setSelectedStudentId={setSelectedStudentId}
              activeStudents={activeStudents}
              setFile={setFile}
              uploading={uploading}
              uploadStatus={uploadStatus}
            />
          )}
        </main>
      </div>

      <AddStudentModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddStudent}
        newName={newName}
        setNewName={setNewName}
        newParentName={newParentName}
        setNewParentName={setNewParentName}
        newGender={newGender}
        setNewGender={setNewGender}
        newAge={newAge}
        setNewAge={setNewAge}
        newPhone={newPhone}
        setNewPhone={setNewPhone}
        newAddress={newAddress}
        setNewAddress={setNewAddress}
        newBeltLevel={newBeltLevel}
        setNewBeltLevel={setNewBeltLevel}
        beltOptions={BELT_OPTIONS}
        isAdding={isAdding}
      />

      <EditStudentModal
        student={selectedStudentForEdit}
        onClose={() => setSelectedStudentForEdit(null)}
        onSubmit={handleUpdateStudent}
        editName={editName}
        setEditName={setEditName}
        editParentName={editParentName}
        setEditParentName={setEditParentName}
        editGender={editGender}
        setEditGender={setEditGender}
        editAge={editAge}
        setEditAge={setEditAge}
        editPhone={editPhone}
        setEditPhone={setEditPhone}
        editAddress={editAddress}
        setEditAddress={setEditAddress}
        editBeltLevel={editBeltLevel}
        setEditBeltLevel={setEditBeltLevel}
        beltOptions={BELT_OPTIONS}
        isUpdating={isUpdatingStudent}
        onSetStatus={handleSetStudentStatus}
      />

      <BulkImportModal
        show={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        onCSVUpload={handleCSVFileUpload}
        rawText={rawTextImport}
        setRawText={setRawTextImport}
        onSubmitText={handleTextImportSubmit}
        uploading={bulkUploading}
      />
    </div>
  );
}
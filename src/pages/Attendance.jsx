import React from 'react';

export default function Attendance({
  selectedDate,
  setSelectedDate,
  handleSaveAttendance,
  savingAttendance,
  activeStudents,
  attendanceRecords,
  toggleAttendanceLocal
}) {
  return (
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
              className={`p-3.5 rounded-xl border cursor-pointer transition-all flex justify-between items-center ${
                isPresent
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              <div>
                <p className="font-semibold text-sm">{student.name}</p>
                <p className="text-xs text-slate-500">Penjaga: {student.parent_name || '-'}</p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  isPresent ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {isPresent ? 'Hadir' : 'Tidak Hadir'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
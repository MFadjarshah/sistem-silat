import React from 'react';

export default function MembersList({
  displayedStudents,
  loading,
  filters,
  openFilterCol,
  setOpenFilterCol,
  setColumnSearch,
  renderExcelFilterPopover,
  toggleAnnualFeeStatus,
  updatingId,
  toggleMonthFeeDirect,
  monthsListShort,
  getBeltBadgeStyle,
  openEditModal,
  setShowBulkModal,
  setShowAddModal
}) {
  return (
    <div className="space-y-3">
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

      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-visible">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">Memuatkan data...</div>
        ) : displayedStudents.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            Tiada rekod pelajar ditemui mengikut penapis Excel ini.
          </div>
        ) : (
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-800 font-bold text-xs uppercase tracking-wider select-none">
                <tr>
                  <th className="py-3 px-3 w-12 text-center border-r border-slate-200">NO.</th>

                  <th className="py-3 px-3 border-r border-slate-200 relative">
                    <div className="flex items-center justify-between gap-2">
                      <span>NAMA PELAJAR</span>
                      <button
                        onClick={() => {
                          setColumnSearch('');
                          setOpenFilterCol(openFilterCol === 'name' ? null : 'name');
                        }}
                        className={`p-1 rounded hover:bg-slate-200 border border-slate-300 ${
                          (filters.name || []).length > 0 ? 'bg-emerald-100 text-emerald-800 border-emerald-400' : 'bg-white text-slate-600'
                        }`}
                      >
                        🔻
                      </button>
                    </div>
                    {openFilterCol === 'name' && renderExcelFilterPopover('name', 'NAMA PELAJAR')}
                  </th>

                  <th className="py-3 px-3 border-r border-slate-200 relative">
                    <div className="flex items-center justify-between gap-2">
                      <span>NAMA PENJAGA</span>
                      <button
                        onClick={() => {
                          setColumnSearch('');
                          setOpenFilterCol(openFilterCol === 'parent_name' ? null : 'parent_name');
                        }}
                        className={`p-1 rounded hover:bg-slate-200 border border-slate-300 ${
                          (filters.parent_name || []).length > 0 ? 'bg-emerald-100 text-emerald-800 border-emerald-400' : 'bg-white text-slate-600'
                        }`}
                      >
                        🔻
                      </button>
                    </div>
                    {openFilterCol === 'parent_name' && renderExcelFilterPopover('parent_name', 'NAMA PENJAGA')}
                  </th>

                  <th className="py-3 px-3 border-r border-slate-200 relative">
                    <div className="flex items-center justify-between gap-2">
                      <span>BENGKUNG</span>
                      <button
                        onClick={() => {
                          setColumnSearch('');
                          setOpenFilterCol(openFilterCol === 'belt_level' ? null : 'belt_level');
                        }}
                        className={`p-1 rounded hover:bg-slate-200 border border-slate-300 ${
                          (filters.belt_level || []).length > 0 ? 'bg-emerald-100 text-emerald-800 border-emerald-400' : 'bg-white text-slate-600'
                        }`}
                      >
                        🔻
                      </button>
                    </div>
                    {openFilterCol === 'belt_level' && renderExcelFilterPopover('belt_level', 'BENGKUNG')}
                  </th>

                  <th className="py-3 px-3 border-r border-slate-200 relative">
                    <div className="flex items-center justify-between gap-2">
                      <span>YURAN TAHUNAN</span>
                      <button
                        onClick={() => {
                          setColumnSearch('');
                          setOpenFilterCol(openFilterCol === 'status_fee_annual' ? null : 'status_fee_annual');
                        }}
                        className={`p-1 rounded hover:bg-slate-200 border border-slate-300 ${
                          (filters.status_fee_annual || []).length > 0 ? 'bg-emerald-100 text-emerald-800 border-emerald-400' : 'bg-white text-slate-600'
                        }`}
                      >
                        🔻
                      </button>
                    </div>
                    {openFilterCol === 'status_fee_annual' && renderExcelFilterPopover('status_fee_annual', 'YURAN TAHUNAN')}
                  </th>

                  <th className="py-3 px-3 text-center border-r border-slate-200">YURAN BULANAN 2026</th>
                  <th className="py-3 px-3 text-right">TINDAKAN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedStudents.map((student, index) => (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-slate-400 text-center w-12">{index + 1}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      <button
                        onClick={() => openEditModal(student)}
                        className="hover:text-emerald-600 text-left underline decoration-dotted"
                      >
                        {student.name}
                      </button>
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
                        className={`px-2.5 py-0.5 rounded text-xs font-semibold border transition-all ${
                          student.status_fee_annual === 'Selesai'
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
                              className={`w-5 h-5 text-[9px] font-bold rounded flex items-center justify-center transition-all ${
                                isPaid
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
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => openEditModal(student)}
                        className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-2 py-1 rounded border border-slate-300 transition-colors"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
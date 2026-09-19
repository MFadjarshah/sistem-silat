import React from 'react';

export default function Payments({ receipts = [], handleApproveReceipt, handleDeleteReceipt }) {
  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-4">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Semakan Resit Pembayaran</h3>
          <p className="text-xs text-slate-500">Uruskan pengesahan resit dan pembayaran yuran pelajar</p>
        </div>
        <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-full">
          Jumlah: {receipts.length} Resit
        </span>
      </div>

      {receipts.length === 0 ? (
        <p className="text-slate-400 text-xs text-center py-10 border border-dashed rounded-xl">
          Tiada resit dimuat naik lagi.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Nama Pelajar</th>
                <th className="py-3 px-4">Pembayaran</th>
                <th className="py-3 px-4">Resit</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {receipts.map((r) => {
                const isApproved =
                  r.status?.toLowerCase() === 'approved' ||
                  r.status?.toLowerCase() === 'selesai';

                // Format senarai bulan jika wujud
                const monthsText = Array.isArray(r.selected_months)
                  ? r.selected_months.join(', ')
                  : r.selected_months || '';

                return (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    {/* Nama Pelajar & Penjaga */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">
                        {r.students?.name || r.student_name || 'Pelajar (Tiada Nama)'}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Penjaga: {r.students?.guardian_name || r.students?.parent_name || r.parent_name || '-'}
                      </div>
                    </td>

                    {/* Yuran Dibayar (Tahunan / Bulan) */}
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1 items-center">
                        {/* 1. Papar lencana Yuran Tahunan sekiranya pay_annual = true */}
                        {(r.pay_annual || r.payment_type === 'annual' || r.is_annual) && (
                          <span className="bg-purple-100 text-purple-700 border border-purple-300 text-xs px-2 py-0.5 rounded-md font-semibold">
                            Yuran Tahunan
                          </span>
                        )}

                        {/* 2. Papar bulan-bulan yang dipilih */}
                        {Array.isArray(r.selected_months) && r.selected_months.length > 0 && (
                          <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs px-2 py-0.5 rounded-md font-medium">
                            {r.selected_months.join(', ')}
                          </span>
                        )}

                        {/* 3. Paparan jika tiada bulan atau tahunan dipilih */}
                        {!r.pay_annual && (!r.selected_months || r.selected_months.length === 0) && (
                          <span className="text-slate-400 text-xs border border-dashed border-slate-300 px-2 py-0.5 rounded">
                            -
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Pautan Resit */}
                    <td className="py-3 px-4">
                      {r.file_url ? (
                        <a
                          href={r.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:text-blue-800 font-semibold underline inline-flex items-center gap-1"
                        >
                          📄 Lihat Resit
                        </a>
                      ) : (
                        <span className="text-slate-400 italic">Tiada Fail</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-full ${isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}
                      >
                        {isApproved ? '✓ Selesai' : '⏳ Pending'}
                      </span>
                    </td>

                    {/* Butang Tindakan (Sahkan & Delete) */}
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        {/* Butang Sahkan */}
                        {isApproved ? (
                          <button
                            disabled
                            className="bg-slate-100 text-slate-400 text-[11px] px-2.5 py-1 rounded font-medium cursor-default border border-slate-200"
                          >
                            Lulus
                          </button>
                        ) : (
                          <button
                            onClick={() => handleApproveReceipt && handleApproveReceipt(r.id, r.student_id, r)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] px-2.5 py-1 rounded font-medium transition-colors shadow-xs"
                          >
                            Sahkan
                          </button>
                        )}

                        {/* Butang Padam (Delete) */}
                        <button
                          onClick={() => {
                            if (window.confirm('Adakah anda pasti ingin memadam rekod resit ini?')) {
                              console.log("Memadam resit ID:", r.id); // Tambah console.log ini untuk semakan
                              handleDeleteReceipt && handleDeleteReceipt(r.id);
                            }
                          }}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-[11px] px-2.5 py-1 rounded font-medium transition-colors"
                        >
                          Padam
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
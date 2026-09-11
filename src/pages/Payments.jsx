import React from 'react';

export default function Payments({ receipts, handleApproveReceipt }) {
  return (
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
                    className={`inline-block mt-2 px-2 py-0.5 text-[10px] font-bold rounded ${
                      r.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
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
  );
}
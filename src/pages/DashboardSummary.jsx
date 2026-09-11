import React from 'react';
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

export default function DashboardSummary({ totalStudents, attendanceHistory, feeChartData }) {
  const avgAttendance = attendanceHistory.length > 0
    ? Math.round(
        attendanceHistory.reduce((acc, curr) => acc + curr.Peratus, 0) /
        attendanceHistory.length
      )
    : 0;

  return (
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
            <h4 className="text-2xl font-extrabold text-amber-600 mt-0.5">{avgAttendance}%</h4>
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
  );
}
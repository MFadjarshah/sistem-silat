import React from 'react';

export default function Sidebar({ activeMenu, setActiveMenu, setMemberFilterStatus, memberFilterStatus }) {
  return (
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
              activeMenu === 'dashboard' ? 'bg-emerald-600 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span>📊</span> Dashboard Summary
          </button>

          <button
            onClick={() => setActiveMenu('parent-portal')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeMenu === 'parent-portal' ? 'bg-emerald-600 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'
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
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeMenu === 'admin-members' && memberFilterStatus === 'Aktif'
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
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeMenu === 'admin-members' && memberFilterStatus === 'Berhenti'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span>📜</span> Sejarah Ahli (Berhenti)
          </button>

          <button
            onClick={() => setActiveMenu('admin-attendance')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeMenu === 'admin-attendance' ? 'bg-emerald-600 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span>📋</span> Tanda Kehadiran Sesi
          </button>

          <button
            onClick={() => setActiveMenu('admin-payments')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeMenu === 'admin-payments' ? 'bg-emerald-600 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'
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
  );
}
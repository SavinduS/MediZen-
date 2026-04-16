import React from 'react';
import { Loader2, AlertCircle, LayoutGrid } from 'lucide-react';

export default function AdminTable({
  columns,
  data,
  loading,
  error,
  onRetry,
  emptyMessage = "No records found"
}) {
  if (loading) {
    return (
      <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-4 text-center">
        <Loader2 className="animate-spin text-blue-600" size={40} />
        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Synchronizing Data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-4 text-center">
        <AlertCircle className="text-red-500" size={40} />
        <p className="text-sm font-bold text-red-500">{error}</p>
        <button 
          onClick={onRetry}
          className="px-6 py-2 bg-slate-900 text-white text-xs font-black rounded-xl hover:bg-slate-800 transition-all uppercase tracking-widest"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-4 text-center">
        <LayoutGrid className="text-slate-200" size={48} />
        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-3xl border border-slate-100 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-900 text-white">
            <tr className="text-[10px] font-black uppercase tracking-[0.2em]">
              {columns.map((col, index) => (
                <th 
                  key={index} 
                  className={`px-6 py-5 ${col.align === 'right' ? 'text-right' : ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 bg-white">
            {data.map((row, rowIndex) => (
              <tr key={row._id || rowIndex} className="hover:bg-slate-50 transition-colors group">
                {columns.map((col, colIndex) => (
                  <td 
                    key={colIndex} 
                    className={`px-6 py-5 ${col.align === 'right' ? 'text-right' : ''}`}
                  >
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

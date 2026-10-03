import React from 'react';

export default function DataTable({ columns, data, emptyMessage = 'No records found.', className = '' }) {
  return (
    <div className={`overflow-x-auto rounded-2xl border border-[#262626] bg-[#1A1A1A] ${className}`}>
      <table className="w-full text-left text-sm text-[#D4D4D4] border-collapse">
        <thead>
          <tr className="border-b border-[#262626] bg-[#111111] text-[#A3A3A3]">
            {columns.map((col, idx) => (
              <th
                key={idx}
                className={`py-3.5 px-4 font-bold text-xs uppercase tracking-wider ${col.className || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-12 text-center text-[#666666] text-sm">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => (
              <tr
                key={row.id || rowIdx}
                className="border-b border-[#262626]/60 hover:bg-[#262626]/40 transition-colors duration-150"
              >
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className={`py-4 px-4 ${col.cellClassName || ''}`}>
                    {col.accessor ? col.accessor(row, rowIdx) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

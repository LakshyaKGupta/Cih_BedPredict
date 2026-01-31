/**
 * Loading Skeleton Component
 * 
 * Provides skeleton loading states for better UX
 */

import React from 'react';

export const HospitalCardSkeleton = () => {
  return (
    <div className="bg-white rounded-xl shadow-md border-2 border-gray-200 overflow-hidden animate-pulse">
      {/* Header */}
      <div className="bg-gradient-to-br from-gray-100 to-gray-200 p-6 border-b border-gray-300">
        <div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
      </div>

      {/* Body */}
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          <div className="h-6 bg-gray-200 rounded-full w-20"></div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-100 rounded-xl p-4">
            <div className="h-3 bg-gray-200 rounded w-16 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-12"></div>
          </div>
          <div className="bg-gray-100 rounded-xl p-4">
            <div className="h-3 bg-gray-200 rounded w-16 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-12"></div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-gray-100 px-6 py-4 border-t-2 border-gray-200">
        <div className="h-10 bg-gray-200 rounded-lg"></div>
      </div>
    </div>
  );
};

export const ForecastCardSkeleton = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-5 animate-pulse">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-24"></div>
          </div>
          <div className="h-6 bg-gray-200 rounded-full w-16"></div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="h-3 bg-gray-200 rounded w-24"></div>
            <div className="h-6 bg-gray-200 rounded w-12"></div>
          </div>
          <div className="h-3 bg-gray-200 rounded-full w-full"></div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-200">
          <div className="text-center">
            <div className="h-2 bg-gray-200 rounded w-12 mx-auto mb-1"></div>
            <div className="h-4 bg-gray-200 rounded w-8 mx-auto"></div>
          </div>
          <div className="text-center">
            <div className="h-2 bg-gray-200 rounded w-12 mx-auto mb-1"></div>
            <div className="h-4 bg-gray-200 rounded w-8 mx-auto"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const TableSkeleton = ({ rows = 5, columns = 4 }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {[...Array(columns)].map((_, i) => (
                <th key={i} className="px-6 py-3">
                  <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {[...Array(rows)].map((_, rowIndex) => (
              <tr key={rowIndex}>
                {[...Array(columns)].map((_, colIndex) => (
                  <td key={colIndex} className="px-6 py-4">
                    <div className="h-4 bg-gray-100 rounded w-full animate-pulse"></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const ChartSkeleton = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-48 mb-6"></div>
      <div className="flex items-end justify-between h-64 gap-4">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="flex-1 bg-gray-200 rounded-t" style={{ height: `${Math.random() * 100 + 20}%` }}></div>
        ))}
      </div>
    </div>
  );
};

export default { HospitalCardSkeleton, ForecastCardSkeleton, TableSkeleton, ChartSkeleton };

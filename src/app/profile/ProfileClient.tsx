'use client';

import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ProfileClientProps {
  tests: any[];
  user: any;
}

export function ProfileClient({ tests, user }: ProfileClientProps) {
  const chartData = {
    labels: [...tests].reverse().map((t) => new Date(t.dateAttempted).toLocaleDateString()),
    datasets: [
      {
        label: 'WPM',
        data: [...tests].reverse().map((t) => t.wpm),
        borderColor: 'var(--main-color)',
        backgroundColor: 'rgba(226, 183, 20, 0.1)',
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const totalTests = tests.length;
  const avgWpm = totalTests > 0 ? tests.reduce((acc, t) => acc + t.wpm, 0) / totalTests : 0;
  const avgAcc = totalTests > 0 ? tests.reduce((acc, t) => acc + t.accuracy, 0) / totalTests : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-4 text-center">
        <div className="bg-[var(--sub-alt-color)] border border-[var(--sub-color)] border-opacity-10 p-5 rounded-xl">
          <div className="text-3xl font-extrabold text-[var(--main-color)]">{user.personalBestWpm.toFixed(1)}</div>
          <div className="text-[var(--sub-color)] text-xs font-semibold uppercase tracking-wider mt-2">Best WPM</div>
        </div>
        <div className="bg-[var(--sub-alt-color)] border border-[var(--sub-color)] border-opacity-10 p-5 rounded-xl">
          <div className="text-3xl font-extrabold text-[var(--main-color)]">{user.personalBestAccuracy.toFixed(1)}%</div>
          <div className="text-[var(--sub-color)] text-xs font-semibold uppercase tracking-wider mt-2">Best ACC</div>
        </div>
        <div className="bg-[var(--sub-alt-color)] border border-[var(--sub-color)] border-opacity-10 p-5 rounded-xl">
          <div className="text-3xl font-extrabold text-[var(--main-color)]">{avgWpm.toFixed(1)}</div>
          <div className="text-[var(--sub-color)] text-xs font-semibold uppercase tracking-wider mt-2">Avg WPM</div>
        </div>
        <div className="bg-[var(--sub-alt-color)] border border-[var(--sub-color)] border-opacity-10 p-5 rounded-xl">
          <div className="text-3xl font-extrabold text-[var(--main-color)]">{totalTests}</div>
          <div className="text-[var(--sub-color)] text-xs font-semibold uppercase tracking-wider mt-2">Total Tests</div>
        </div>
      </div>

      {/* Progress Chart */}
      {totalTests > 0 && (
        <div className="bg-[var(--sub-alt-color)] border border-[var(--sub-color)] border-opacity-10 p-6 rounded-xl">
          <h3 className="text-lg font-bold text-[var(--main-color)] mb-4">Improvement Over Time</h3>
          <div className="w-full max-h-[300px]">
            <Line
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  x: { grid: { display: false } },
                  y: { grid: { color: 'rgba(255,255,255,0.05)' } },
                },
              }}
            />
          </div>
        </div>
      )}

      {/* History table */}
      <div className="bg-[var(--sub-alt-color)] border border-[var(--sub-color)] border-opacity-10 p-6 rounded-xl">
        <h3 className="text-lg font-bold text-[var(--main-color)] mb-4">Recent Tests</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-[var(--sub-color)] border-opacity-20 text-[var(--sub-color)] uppercase tracking-wider text-xs font-semibold">
                <th className="py-2 px-3">Date</th>
                <th className="py-2 px-3">WPM</th>
                <th className="py-2 px-3">Accuracy</th>
                <th className="py-2 px-3">Mistakes</th>
                <th className="py-2 px-3">Mode</th>
                <th className="py-2 px-3 text-right">Downloads</th>
              </tr>
            </thead>
            <tbody>
              {totalTests === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-[var(--sub-color)]">No tests taken yet. Start practicing!</td>
                </tr>
              ) : (
                tests.map((test) => (
                  <tr key={test.id} className="border-b border-[var(--sub-color)] border-opacity-10 hover:bg-[var(--bg-color)] hover:bg-opacity-10 transition-colors">
                    <td className="py-2 px-3">{new Date(test.dateAttempted).toLocaleString()}</td>
                    <td className="py-2 px-3 text-[var(--main-color)] font-bold">{test.wpm.toFixed(1)}</td>
                    <td className="py-2 px-3">{test.accuracy.toFixed(1)}%</td>
                    <td className="py-2 px-3 text-[var(--error-color)]">{test.mistakes}</td>
                    <td className="py-2 px-3"><span className="text-xs px-2 py-0.5 rounded bg-[var(--bg-color)]">{test.difficulty}</span></td>
                    <td className="py-2 px-3 text-right flex justify-end gap-2">
                      <a href={`/api/tests/export?id=${test.id}&format=pdf`} className="text-[var(--main-color)] hover:underline text-xs flex items-center gap-1" title="PDF">
                        <i className="fa-solid fa-file-pdf"></i> PDF
                      </a>
                      <a href={`/api/tests/export?id=${test.id}&format=csv`} className="text-[var(--main-color)] hover:underline text-xs flex items-center gap-1" title="CSV">
                        <i className="fa-solid fa-file-csv"></i> CSV
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

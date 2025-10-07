import React from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

// This is mock data for the ancestry distribution
const ancestryData = [{
  name: 'Western Europe',
  value: 45
}, {
  name: 'Eastern Europe',
  value: 23
}, {
  name: 'Northern Europe',
  value: 18
}, {
  name: 'Southern Europe',
  value: 12
}, {
  name: 'Sub-Saharan Africa',
  value: 8
}, {
  name: 'East Asia',
  value: 6
}, {
  name: 'South Asia',
  value: 5
}, {
  name: 'Middle East',
  value: 4
}, {
  name: 'Native American',
  value: 2
}, {
  name: 'Pacific Islander',
  value: 1
}];

export const AncestryDistributionChart = () => {
  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
      <h3 className="text-white font-semibold mb-2">Ancestry Distribution</h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={ancestryData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 10 }} interval={0} angle={-30} textAnchor="end" height={60} />
            <YAxis tick={{ fill: '#9CA3AF', fontSize: 10 }} />
            <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#1F2937', color: '#E5E7EB' }} />
            <Bar dataKey="value" fill="#F97316" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
export default AncestryDistributionChart;
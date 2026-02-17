/**
 * OccupancyChart Component
 * 
 * Displays historical and predicted bed occupancy data
 * Uses Recharts for visualization
 */

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart
} from 'recharts';

const OccupancyChart = ({ historicalData, predictions, totalBeds }) => {
  // Handle undefined data
  if (!historicalData || !predictions) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Bed Occupancy Trend & Predictions
        </h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          No data available
        </div>
      </div>
    );
  }

  // Combine historical and prediction data
  const combinedData = [
    ...historicalData.map(item => ({
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      historical: item.occupied_beds,
      type: 'historical'
    })),
    ...predictions.map(item => ({
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      predicted: item.predicted_occupancy,
      lower: item.lower_bound,
      upper: item.upper_bound,
      type: 'prediction'
    }))
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Bed Occupancy Trend & Predictions
      </h3>
      
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={combinedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            label={{ value: 'Beds Occupied', angle: -90, position: 'insideLeft' }}
            domain={[0, totalBeds]}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#fff', 
              border: '1px solid #ccc',
              borderRadius: '8px',
              padding: '10px'
            }}
          />
          <Legend />
          
          {/* Historical line */}
          <Line
            type="monotone"
            dataKey="historical"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 3 }}
            name="Historical Occupancy"
            connectNulls
          />
          
          {/* Prediction line */}
          <Line
            type="monotone"
            dataKey="predicted"
            stroke="#10b981"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ r: 4 }}
            name="Predicted Occupancy"
            connectNulls
          />
          
          {/* Confidence interval area */}
          <Area
            type="monotone"
            dataKey="upper"
            stroke="none"
            fill="#10b981"
            fillOpacity={0.1}
            name="Upper Bound"
          />
          <Area
            type="monotone"
            dataKey="lower"
            stroke="none"
            fill="#10b981"
            fillOpacity={0.1}
            name="Lower Bound"
          />
        </ComposedChart>
      </ResponsiveContainer>
      
      <div className="mt-4 flex items-center justify-center space-x-6 text-sm">
        <div className="flex items-center">
          <div className="w-4 h-0.5 bg-blue-500 mr-2"></div>
          <span className="text-gray-600">Historical Data</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-0.5 bg-green-500 border-dashed mr-2"></div>
          <span className="text-gray-600">Predictions</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-2 bg-green-500 opacity-20 mr-2"></div>
          <span className="text-gray-600">Confidence Interval</span>
        </div>
      </div>
    </div>
  );
};

export default OccupancyChart;

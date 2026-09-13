import React from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

// Matches the app's waybill palette + a couple of neutral fallbacks for categories that
// don't have a dedicated semantic color (e.g. user roles).
const STATUS_COLORS = {
  CREATED: '#5B6472',
  PICKED_UP: '#E8A33D',
  IN_TRANSIT: '#E8A33D',
  OUT_FOR_DELIVERY: '#E8A33D',
  DELIVERED: '#2E8B57',
  CANCELLED: '#C1483D',
  FAILED_DELIVERY: '#C1483D',
}

const FALLBACK_PALETTE = ['#16202E', '#E8A33D', '#2E8B57', '#C1483D', '#5B6472', '#C9C2AE']

/**
 * A donut chart for any `{ label: count }` breakdown - shipment status, user roles,
 * priority mix, whatever. Colors use the app's semantic status palette where the label
 * matches a known shipment status, and cycle through a neutral fallback palette otherwise
 * (e.g. for user roles, which don't have their own semantic color).
 */
export default function BreakdownPieChart({ data, height = 220 }) {
  const entries = Object.entries(data || {}).filter(([, value]) => value > 0)

  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center text-sm text-slate" style={{ height }}>
        No data yet.
      </div>
    )
  }

  const chartData = entries.map(([name, value]) => ({ name: name.replace(/_/g, ' '), value, key: name }))

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          innerRadius="55%"
          outerRadius="80%"
          paddingAngle={2}
        >
          {chartData.map((entry, index) => (
            <Cell
              key={entry.key}
              fill={STATUS_COLORS[entry.key] || FALLBACK_PALETTE[index % FALLBACK_PALETTE.length]}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ backgroundColor: '#F7F4EC', border: '1px solid #C9C2AE', fontSize: 12 }}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  )
}

'use client';

import { useQuery } from '@tanstack/react-query';
import { consoleApi } from '../../lib/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function DashboardPage() {
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => consoleApi.get('/console/dashboard').then((r) => r.data.data),
    refetchInterval: 60_000,
  });

  const metrics = [
    { label: 'Orders today',       value: stats?.orders_today ?? '—',        sub: `${stats?.orders_change ?? 0}% vs yesterday`,      color: 'bg-amber-50 border-amber-200',  icon: '📦' },
    { label: 'Active riders',      value: stats?.riders_online ?? '—',        sub: `${stats?.riders_total ?? 0} total registered`,    color: 'bg-green-50 border-green-200',  icon: '🛵' },
    { label: 'GMV today (Nu.)',    value: stats?.gmv_today?.toLocaleString('en-IN') ?? '—', sub: 'Gross Merchandise Value', color: 'bg-blue-50 border-blue-200', icon: '💰' },
    { label: 'Avg delivery time',  value: `${stats?.avg_delivery_min ?? '—'} min`,    sub: 'Last 24 hours',                           color: 'bg-purple-50 border-purple-200', icon: '⏱️' },
    { label: 'Active restaurants', value: stats?.restaurants_active ?? '—',   sub: `${stats?.restaurants_open ?? 0} open now`,        color: 'bg-orange-50 border-orange-200', icon: '🏪' },
    { label: 'Pending KYC',        value: stats?.kyc_pending ?? '—',          sub: 'Needs review',                                    color: 'bg-red-50 border-red-200',      icon: '📋' },
  ];

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Zhim platform overview · Thimphu MVP</p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-3 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className={`bg-white border rounded-xl p-5 ${m.color}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-neutral-500">{m.label}</p>
                <p className="text-3xl font-bold text-neutral-900 mt-1">{m.value}</p>
                <p className="text-xs text-neutral-400 mt-1">{m.sub}</p>
              </div>
              <span className="text-2xl">{m.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-neutral-200 rounded-xl p-5">
          <h3 className="font-semibold mb-4">Orders (last 7 days)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={stats?.orders_chart ?? []}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#F5A800" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white border border-neutral-200 rounded-xl p-5">
          <h3 className="font-semibold mb-4">GMV (last 7 days · Nu.)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={stats?.gmv_chart ?? []}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => `Nu. ${v.toLocaleString('en-IN')}`} />
              <Line type="monotone" dataKey="gmv" stroke="#2A9A58" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Live order feed */}
      <div className="bg-white border border-neutral-200 rounded-xl">
        <div className="px-5 py-3 border-b border-neutral-100 flex items-center justify-between">
          <h3 className="font-semibold">Live orders</h3>
          <span className="flex items-center gap-1.5 text-xs text-green-600">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Live
          </span>
        </div>
        <div className="divide-y divide-neutral-100">
          {(stats?.live_orders ?? []).slice(0, 8).map((o: any) => (
            <div key={o.id} className="px-5 py-3 flex items-center justify-between text-sm">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-neutral-400">{o.order_number}</span>
                <span className="font-medium truncate max-w-[160px]">{o.restaurant_name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-neutral-500">Nu. {o.total_nu}</span>
                <StatusDot status={o.status} />
              </div>
            </div>
          ))}
          {(!stats?.live_orders?.length) && (
            <p className="px-5 py-6 text-sm text-neutral-400 text-center">No active orders right now</p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending:        'bg-amber-400',
    confirmed:      'bg-blue-400',
    preparing:      'bg-purple-400',
    ready:          'bg-green-400',
    rider_assigned: 'bg-orange-400',
    picked_up:      'bg-orange-500',
    delivered:      'bg-green-600',
    cancelled:      'bg-red-400',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium capitalize px-2 py-0.5 rounded-full bg-opacity-20`}>
      <span className={`w-1.5 h-1.5 rounded-full ${colors[status] ?? 'bg-neutral-400'}`} />
      {status.replace('_', ' ')}
    </span>
  );
}

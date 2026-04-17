'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Zone, ZoneStatus } from '@zhim/types';
import { consoleApi } from '../../lib/api';
import { ZoneMap } from '../../components/ZoneMap';

const STATUS_LABELS: Record<ZoneStatus, { label: string; color: string }> = {
  active:       { label: 'Active',       color: 'bg-green-100 text-green-800' },
  coming_soon:  { label: 'Coming Soon',  color: 'bg-amber-100 text-amber-800' },
  inactive:     { label: 'Inactive',     color: 'bg-gray-100 text-gray-600' },
};

const SURGE_REASONS = [
  { value: 'peak_hour',        label: 'Peak hour' },
  { value: 'rain',             label: 'Rain' },
  { value: 'snow',             label: 'Snow / Ice' },
  { value: 'high_demand',      label: 'High demand' },
  { value: 'low_rider_supply', label: 'Low rider supply' },
  { value: 'festival',         label: 'Festival' },
];

export default function ZoneManagementPage() {
  const qc = useQueryClient();
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [surgeForm, setSurgeForm] = useState({
    reason: 'peak_hour',
    multiplier: 1.5,
    extra_fee_nu: 20,
    message_en: '',
    message_dz: '',
  });

  const { data: zones = [] } = useQuery({
    queryKey: ['zones'],
    queryFn: () => consoleApi.get('/console/zones').then((r) => r.data.data as Zone[]),
  });

  const { data: surgeRules = [] } = useQuery({
    queryKey: ['surge-rules'],
    queryFn: () => consoleApi.get('/console/surge-rules').then((r) => r.data.data),
  });

  const updateZoneStatus = useMutation({
    mutationFn: ({ zoneId, status }: { zoneId: string; status: ZoneStatus }) =>
      consoleApi.patch(`/console/zones/${zoneId}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['zones'] }),
  });

  const enableSurge = useMutation({
    mutationFn: (data: typeof surgeForm & { zone_id?: string }) =>
      consoleApi.post('/console/surge-rules', { ...data, is_active: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['surge-rules'] });
    },
  });

  const disableSurge = useMutation({
    mutationFn: (ruleId: string) =>
      consoleApi.patch(`/console/surge-rules/${ruleId}`, { is_active: false }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['surge-rules'] }),
  });

  const activeSurges = surgeRules.filter((r: any) => r.is_active);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Zone Management</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Manage delivery zones and surge pricing across Bhutan
          </p>
        </div>
        <div className="flex items-center gap-3">
          {activeSurges.length > 0 && (
            <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-800 text-sm font-medium px-3 py-1.5 rounded-full border border-amber-200">
              ⚡ {activeSurges.length} surge active
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Zone list */}
        <div className="w-80 border-r border-neutral-200 flex flex-col overflow-y-auto bg-white">
          <div className="p-4 border-b border-neutral-100">
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              {zones.length} zones configured
            </p>
          </div>

          {zones.map((zone) => {
            const statusConfig = STATUS_LABELS[zone.status];
            const zoneActiveSurge = surgeRules.find((r: any) => r.zone_id === zone.id && r.is_active);
            const isSelected = selectedZone?.id === zone.id;

            return (
              <button
                key={zone.id}
                onClick={() => setSelectedZone(zone)}
                className={`w-full text-left p-4 border-b border-neutral-100 hover:bg-neutral-50 transition-colors ${
                  isSelected ? 'bg-amber-50 border-l-4 border-l-amber-500' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-neutral-900 truncate">{zone.name}</p>
                    {zone.name_dz && (
                      <p className="text-sm text-neutral-500 font-[Jomolhari]">{zone.name_dz}</p>
                    )}
                    <p className="text-xs text-neutral-400 mt-1">
                      Nu. {zone.base_delivery_fee_nu} delivery · Min Nu. {zone.min_order_nu}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusConfig.color}`}>
                      {statusConfig.label}
                    </span>
                    {zoneActiveSurge && (
                      <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full">
                        ⚡ {zoneActiveSurge.multiplier}×
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Map + detail */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Map */}
          <div className="h-1/2 border-b border-neutral-200">
            <ZoneMap zones={zones} selectedZone={selectedZone} onZoneClick={setSelectedZone} />
          </div>

          {/* Zone detail panel */}
          {selectedZone ? (
            <div className="flex-1 overflow-y-auto p-6 bg-neutral-50">
              <div className="max-w-2xl space-y-6">
                {/* Zone header */}
                <div className="bg-white rounded-xl border border-neutral-200 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-bold">{selectedZone.name}</h2>
                      {selectedZone.name_dz && (
                        <p className="text-neutral-500 font-[Jomolhari]">{selectedZone.name_dz}</p>
                      )}
                    </div>
                    <span className={`text-sm font-medium px-3 py-1 rounded-full ${STATUS_LABELS[selectedZone.status].color}`}>
                      {STATUS_LABELS[selectedZone.status].label}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm mb-5">
                    <div className="bg-neutral-50 rounded-lg p-3">
                      <p className="text-neutral-400">Base delivery fee</p>
                      <p className="font-semibold text-lg">Nu. {selectedZone.base_delivery_fee_nu}</p>
                    </div>
                    <div className="bg-neutral-50 rounded-lg p-3">
                      <p className="text-neutral-400">Minimum order</p>
                      <p className="font-semibold text-lg">Nu. {selectedZone.min_order_nu}</p>
                    </div>
                  </div>

                  {/* Status change */}
                  <div className="flex gap-2">
                    {(['active', 'coming_soon', 'inactive'] as ZoneStatus[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => updateZoneStatus.mutate({ zoneId: selectedZone.id, status: s })}
                        disabled={selectedZone.status === s || updateZoneStatus.isPending}
                        className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg border transition-all
                          ${selectedZone.status === s
                            ? 'bg-neutral-900 text-white border-neutral-900'
                            : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400'
                          }`}
                      >
                        {STATUS_LABELS[s].label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active surges */}
                {activeSurges.filter((r: any) => r.zone_id === selectedZone.id || !r.zone_id).length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                    <h3 className="font-semibold text-amber-900 mb-3">⚡ Active Surge</h3>
                    {activeSurges
                      .filter((r: any) => r.zone_id === selectedZone.id || !r.zone_id)
                      .map((rule: any) => (
                        <div key={rule.id} className="flex items-center justify-between py-2">
                          <div>
                            <p className="font-medium text-amber-800 capitalize">{rule.reason.replace('_', ' ')}</p>
                            <p className="text-sm text-amber-600">{rule.message_en}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-amber-900">{rule.multiplier}× · +Nu. {rule.extra_fee_nu}</span>
                            <button
                              onClick={() => disableSurge.mutate(rule.id)}
                              className="text-sm text-red-600 hover:text-red-800 font-medium"
                            >
                              Disable
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}

                {/* Surge form */}
                <div className="bg-white rounded-xl border border-neutral-200 p-5">
                  <h3 className="font-semibold mb-4">Enable Surge Pricing</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Reason</label>
                      <select
                        value={surgeForm.reason}
                        onChange={(e) => setSurgeForm({ ...surgeForm, reason: e.target.value })}
                        className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm"
                      >
                        {SURGE_REASONS.map((r) => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          Multiplier
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="1.0"
                          max="3.0"
                          value={surgeForm.multiplier}
                          onChange={(e) => setSurgeForm({ ...surgeForm, multiplier: parseFloat(e.target.value) })}
                          className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          Extra fee (Nu.)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={surgeForm.extra_fee_nu}
                          onChange={(e) => setSurgeForm({ ...surgeForm, extra_fee_nu: parseInt(e.target.value) })}
                          className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Customer message (English)
                      </label>
                      <input
                        type="text"
                        value={surgeForm.message_en}
                        onChange={(e) => setSurgeForm({ ...surgeForm, message_en: e.target.value })}
                        placeholder="e.g. Delivery taking longer due to heavy rain"
                        className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1 font-[Jomolhari]">
                        གཞུང་འབྲེལ་སྒྲུང་ (Dzongkha message)
                      </label>
                      <input
                        type="text"
                        value={surgeForm.message_dz}
                        onChange={(e) => setSurgeForm({ ...surgeForm, message_dz: e.target.value })}
                        placeholder="ཆར་ཆུ་གི་རྐྱེན་གྱིས།..."
                        className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm font-[Jomolhari]"
                      />
                    </div>

                    <button
                      onClick={() => enableSurge.mutate({ ...surgeForm, zone_id: selectedZone.id })}
                      disabled={!surgeForm.message_en || enableSurge.isPending}
                      className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors"
                    >
                      ⚡ {enableSurge.isPending ? 'Enabling...' : 'Enable Surge for ' + selectedZone.name}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-neutral-400">
              <div className="text-center">
                <p className="text-4xl mb-3">🗺️</p>
                <p className="font-medium">Select a zone to manage it</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

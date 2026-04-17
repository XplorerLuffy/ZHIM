'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { consoleApi } from '../../lib/api';

type DocType = 'restaurant' | 'rider';
type DocStatus = 'pending' | 'approved' | 'rejected';

const DOC_LABELS: Record<string, string> = {
  trade_license:    'Trade License',
  bit_registration: 'BIT Registration',
  bafra_certificate:'BAFRA Food Safety',
  bank_details:     'Bank Details',
  cid:              'CID Card',
  driving_license:  'Driving License',
  vehicle_rc:       'Vehicle RC',
  photo:            'Photo',
};

export default function KYCPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<DocType>('restaurant');
  const [filterStatus, setFilterStatus] = useState<DocStatus | 'all'>('pending');
  const [selected, setSelected] = useState<any | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ['kyc-docs', tab, filterStatus],
    queryFn: () =>
      consoleApi
        .get('/console/kyc', { params: { type: tab, status: filterStatus === 'all' ? undefined : filterStatus } })
        .then((r) => r.data.data),
    refetchInterval: 30_000,
  });

  const approve = useMutation({
    mutationFn: ({ id, type }: { id: string; type: DocType }) =>
      consoleApi.patch(`/console/kyc/${id}`, { status: 'approved', type }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kyc-docs'] });
      setSelected(null);
    },
  });

  const reject = useMutation({
    mutationFn: ({ id, type, note }: { id: string; type: DocType; note: string }) =>
      consoleApi.patch(`/console/kyc/${id}`, { status: 'rejected', review_note: note, type }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kyc-docs'] });
      setSelected(null);
      setShowRejectModal(false);
      setRejectNote('');
    },
  });

  const pendingCount = docs.filter((d: any) => d.status === 'pending').length;

  return (
    <div className="h-full flex flex-col">
      {/* Page header */}
      <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">KYC Approvals</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Review and approve restaurant and rider documents
          </p>
        </div>
        {pendingCount > 0 && (
          <span className="bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
            {pendingCount} pending
          </span>
        )}
      </div>

      {/* Type tabs */}
      <div className="flex border-b border-neutral-200 bg-white px-6">
        {(['restaurant', 'rider'] as DocType[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setSelected(null); }}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors capitalize ${
              tab === t
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            {t === 'restaurant' ? '🏪 Restaurants' : '🛵 Riders'}
          </button>
        ))}

        {/* Status filter */}
        <div className="ml-auto flex items-center gap-2 py-2">
          {(['pending', 'approved', 'rejected', 'all'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`text-xs px-3 py-1 rounded-full font-medium transition-colors capitalize ${
                filterStatus === s
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Document list */}
        <div className="w-96 border-r border-neutral-200 overflow-y-auto bg-white">
          {isLoading ? (
            <div className="p-8 text-center text-neutral-400">Loading...</div>
          ) : docs.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-3xl mb-2">✅</p>
              <p className="text-neutral-500">No {filterStatus} documents</p>
            </div>
          ) : (
            docs.map((doc: any) => (
              <button
                key={doc.id}
                onClick={() => setSelected(doc)}
                className={`w-full text-left p-4 border-b border-neutral-100 hover:bg-neutral-50 transition-colors ${
                  selected?.id === doc.id ? 'bg-amber-50 border-l-4 border-l-amber-500' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-neutral-900 truncate">
                      {doc.entity_name ?? doc.entity_id?.slice(0, 8)}
                    </p>
                    <p className="text-sm text-neutral-500">
                      {DOC_LABELS[doc.doc_type] ?? doc.doc_type}
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">
                      Submitted {new Date(doc.created_at).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <StatusBadge status={doc.status} />
                </div>
              </button>
            ))
          )}
        </div>

        {/* Document detail */}
        {selected ? (
          <div className="flex-1 overflow-y-auto p-6 bg-neutral-50">
            <div className="max-w-2xl space-y-5">
              {/* Entity info */}
              <div className="bg-white rounded-xl border border-neutral-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold">{selected.entity_name}</h2>
                  <StatusBadge status={selected.status} />
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <InfoRow label="Document type" value={DOC_LABELS[selected.doc_type] ?? selected.doc_type} />
                  <InfoRow label="Document number" value={selected.doc_number ?? '—'} />
                  <InfoRow label="Issued date" value={selected.issued_date ?? '—'} />
                  <InfoRow label="Expiry date" value={selected.expiry_date ?? '—'} />
                  <InfoRow label="Phone" value={selected.phone ?? '—'} />
                  <InfoRow label="Submitted" value={new Date(selected.created_at).toLocaleString('en-IN')} />
                </div>
              </div>

              {/* Document image */}
              <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                <div className="px-5 py-3 border-b border-neutral-100 flex items-center justify-between">
                  <p className="font-semibold text-sm">Document File</p>
                  <a
                    href={selected.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-amber-600 hover:text-amber-800 font-medium"
                  >
                    Open full size ↗
                  </a>
                </div>
                <div className="p-4">
                  {selected.file_url?.match(/\.(jpg|jpeg|png|webp)$/i) ? (
                    <img
                      src={selected.file_url}
                      alt="Document"
                      className="w-full max-h-96 object-contain rounded-lg"
                    />
                  ) : (
                    <div className="h-48 flex items-center justify-center bg-neutral-50 rounded-lg border border-dashed border-neutral-300">
                      <div className="text-center">
                        <p className="text-3xl mb-2">📄</p>
                        <a
                          href={selected.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-amber-600 font-medium"
                        >
                          View PDF document
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Review note (if rejected) */}
              {selected.review_note && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-red-800 mb-1">Rejection note</p>
                  <p className="text-sm text-red-700">{selected.review_note}</p>
                  <p className="text-xs text-red-400 mt-1">
                    Reviewed by {selected.reviewer_id} · {new Date(selected.reviewed_at).toLocaleString('en-IN')}
                  </p>
                </div>
              )}

              {/* Actions */}
              {selected.status === 'pending' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => approve.mutate({ id: selected.id, type: tab })}
                    disabled={approve.isPending}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
                  >
                    {approve.isPending ? 'Approving...' : '✓ Approve'}
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="flex-1 bg-white hover:bg-red-50 border border-red-200 text-red-600 font-semibold py-3 rounded-xl transition-colors"
                  >
                    ✗ Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-neutral-400">
            <div className="text-center">
              <p className="text-4xl mb-3">📋</p>
              <p className="font-medium">Select a document to review</p>
            </div>
          </div>
        )}
      </div>

      {/* Reject modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold mb-1">Reject document</h3>
            <p className="text-sm text-neutral-500 mb-4">
              Provide a reason — this will be visible to the applicant.
            </p>
            <textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              rows={4}
              placeholder="e.g. Document is expired. Please submit a valid BIT registration certificate."
              className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowRejectModal(false); setRejectNote(''); }}
                className="flex-1 border border-neutral-200 text-neutral-600 font-medium py-2.5 rounded-xl hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                onClick={() => reject.mutate({ id: selected.id, type: tab, note: rejectNote })}
                disabled={!rejectNote.trim() || reject.isPending}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors"
              >
                {reject.isPending ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: DocStatus }) {
  const cfg: Record<DocStatus, string> = {
    pending:  'bg-amber-100 text-amber-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize shrink-0 ${cfg[status]}`}>
      {status}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-neutral-400 text-xs">{label}</p>
      <p className="font-medium text-neutral-800 truncate">{value}</p>
    </div>
  );
}

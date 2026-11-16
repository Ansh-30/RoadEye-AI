'use client';

import { useEffect, useState } from 'react';
import { FileText, Search, Clock3 } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import ProtectedPage from '@/components/layout/ProtectedPage';
import api, { AI_BASE_URL } from '@/services/api';

const statusLabels = {
  REPORTED: 'Reported',
  VERIFIED: 'Verified',
  IN_PROGRESS: 'In progress',
  RESOLVED: 'Resolved',
  REJECTED: 'Rejected'
};

function getReportImageUrl(imageUrl) {
  if (typeof imageUrl !== 'string' || !imageUrl.trim()) {
    return null;
  }

  const value = imageUrl.trim();

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  try {
    const resolvedUrl = new URL(value, `${AI_BASE_URL}/`);
    return ['http:', 'https:'].includes(resolvedUrl.protocol) ? resolvedUrl.href : null;
  } catch {
    return null;
  }
}

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unavailableImageIds, setUnavailableImageIds] = useState(() => new Set());

  useEffect(() => {
    const loadReports = async () => {
      try {
        const response = await api.get('/reports');
        setReports(response.data?.reports || []);
      } catch (error) {
        console.error('Unable to load reports list:', error);
        setReports([]);
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, []);

  return (
    <ProtectedPage>
      <AppShell title="My Reports" subtitle="Review every road issue you have reported, including status progress and maintenance updates.">
        <div className="rounded-[28px] border border-border bg-white/80 p-5 shadow-soft">
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef2e6] text-forest">
                <FileText size={22} />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sage">Report history</p>
                <h3 className="mt-1 text-xl font-bold text-forest">Submitted issues</h3>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-border bg-[#f9f7f3] px-3 py-2 text-sm text-secondaryText">
              <Search size={16} />
              {reports.length} total submissions
            </div>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-border bg-[#f9f7f3] p-5 text-sm text-secondaryText">Loading your reports...</div>
          ) : reports.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-[#f9f7f3] p-5 text-sm text-secondaryText">No reports found yet. Head to the detection page to submit your first issue.</div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <div key={report.id} className="rounded-[26px] border border-border bg-[#f9f7f3] p-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-4">
                      {getReportImageUrl(report.imageUrl) && !unavailableImageIds.has(report.id) ? (
                        <img
                          src={getReportImageUrl(report.imageUrl)}
                          alt="Road issue preview"
                          className="h-24 w-24 rounded-2xl object-cover"
                          onError={() => setUnavailableImageIds((current) => new Set(current).add(report.id))}
                        />
                      ) : (
                        <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-[#eef2e6] text-forest">
                          <FileText size={22} />
                        </div>
                      )}

                      <div>
                        <p className="text-lg font-bold text-forest">{report.detectionLabel || 'Pothole issue'}</p>
                        <p className="mt-1 text-sm text-secondaryText">Reported on {new Date(report.createdAt).toLocaleDateString()}</p>
                        <div className="mt-3 flex flex-wrap gap-3 text-xs text-secondaryText">
                          <span className="rounded-full bg-white px-2.5 py-1">Confidence: {report.confidence ? `${Math.round(report.confidence * 100)}%` : 'N/A'}</span>
                          <span className="rounded-full bg-white px-2.5 py-1">Detected: {report.detectionCount || 1}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`status-pill status-${String(report.status).toLowerCase()}`}>
                        {statusLabels[report.status] || report.status}
                      </span>
                      <div className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs text-secondaryText">
                        <Clock3 size={14} />
                        {report.status === 'RESOLVED' ? 'Closed' : 'Monitoring'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedPage>
  );
}

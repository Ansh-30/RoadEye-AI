'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState } from 'react';
import { MapPinned, LocateFixed } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import ProtectedPage from '@/components/layout/ProtectedPage';
import api from '@/services/api';
import 'leaflet/dist/leaflet.css';

const LeafletReportsMap = dynamic(
  () => import('@/components/map/LeafletReportsMap'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[520px] items-center justify-center rounded-[30px] border border-border bg-white/80 text-sm text-secondaryText">
        Loading interactive map...
      </div>
    )
  }
);

export default function MapPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/reports');
      setReports(response.data?.reports || []);
    } catch (requestError) {
      console.error('Unable to load map reports:', requestError);
      setError(requestError.response?.data?.message || 'Unable to load reports. Please try again.');
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const hotspots = reports.slice(0, 5);

  return (
    <ProtectedPage>
      <AppShell title="Road Map" subtitle="View reported road hazards and maintenance hotspots with available location data.">
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[30px] border border-border bg-white/80 p-5 shadow-soft">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef2e6] text-forest">
                <MapPinned size={22} />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sage">GIS view</p>
                <h3 className="mt-1 text-xl font-bold text-forest">City road network</h3>
              </div>
            </div>

            {error ? (
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#f2d1d1] bg-[#fff5f5] px-4 py-3 text-sm text-[#9b3434]" role="alert">
                <span>{error}</span>
                <button type="button" onClick={loadReports} className="font-semibold underline" disabled={loading}>
                  Try again
                </button>
              </div>
            ) : null}

            <LeafletReportsMap reports={reports} loading={loading} error={error} />
          </div>

          <div className="space-y-6">
            <div className="rounded-[28px] border border-border bg-white/80 p-5 shadow-soft">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef2e6] text-forest">
                  <LocateFixed size={22} />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sage">Hazards</p>
                  <h3 className="mt-1 text-xl font-bold text-forest">Priority hotspots</h3>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {loading ? (
                  <p className="rounded-[22px] border border-border bg-[#f9f7f3] p-4 text-sm text-secondaryText">Loading reports...</p>
                ) : error ? (
                  <p className="rounded-[22px] border border-border bg-[#f9f7f3] p-4 text-sm text-secondaryText">Hotspots are unavailable until reports can be loaded.</p>
                ) : hotspots.length === 0 ? (
                  <p className="rounded-[22px] border border-dashed border-border bg-[#f9f7f3] p-4 text-sm text-secondaryText">No reports available yet.</p>
                ) : (
                  hotspots.map((report) => (
                    <div key={report.id} className="rounded-[22px] border border-border bg-[#f9f7f3] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-forest">{report.detectionLabel || 'Road defect detected'}</p>
                        <span className={`status-pill status-${String(report.status || 'REPORTED').toLowerCase()}`}>
                          {report.status || 'REPORTED'}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-secondaryText">
                        {Number.isFinite(report.latitude) && Number.isFinite(report.longitude)
                          ? `${report.latitude}, ${report.longitude}`
                          : 'Location coordinates not available'}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedPage>
  );
}

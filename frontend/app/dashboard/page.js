'use client';

import { useEffect, useState } from 'react';
import { BarChart3, AlertTriangle, Clock3, CheckCircle2, ArrowUpRight, FileText } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import ProtectedPage from '@/components/layout/ProtectedPage';
import api from '@/services/api';

const statusLabels = {
  REPORTED: 'Awaiting verification',
  VERIFIED: 'Verified',
  IN_PROGRESS: 'In progress',
  RESOLVED: 'Resolved',
  REJECTED: 'Rejected'
};

export default function DashboardPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReports = async () => {
      try {
        const response = await api.get('/reports');
        setReports(response.data?.reports || []);
      } catch (error) {
        console.error('Unable to load reports:', error);
        setReports([]);
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, []);

  const metrics = {
    total: reports.length,
    awaiting: reports.filter((item) => item.status === 'REPORTED').length,
    inProgress: reports.filter((item) => item.status === 'IN_PROGRESS').length,
    resolved: reports.filter((item) => item.status === 'RESOLVED').length
  };

  const cards = [
    { label: 'Total reports', value: metrics.total, icon: FileText, tone: 'bg-[#1E3B2F] text-white' },
    { label: 'Awaiting verification', value: metrics.awaiting, icon: AlertTriangle, tone: 'bg-[#f5f0e6] text-[#24342C]' },
    { label: 'In progress', value: metrics.inProgress, icon: Clock3, tone: 'bg-[#eaf0e2] text-[#24342C]' },
    { label: 'Resolved', value: metrics.resolved, icon: CheckCircle2, tone: 'bg-[#efe6d3] text-[#24342C]' }
  ];

  return (
    <ProtectedPage>
      <AppShell title="Dashboard Overview" subtitle="Monitor road conditions and municipal responses across your current workspace.">
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {cards.map(({ label, value, icon: Icon, tone }) => (
              <div key={label} className={`rounded-[28px] border border-border p-5 shadow-soft ${tone}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-80">{label}</p>
                    <p className="mt-3 text-3xl font-black">{value}</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                    <Icon size={22} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[28px] border border-border bg-white/80 p-5 shadow-soft">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sage">Overview</p>
                  <h3 className="mt-1 text-xl font-bold text-forest">Recent road reports</h3>
                </div>
                <div className="flex items-center gap-2 text-sm text-secondaryText">
                  <BarChart3 size={18} />
                  Live feed
                </div>
              </div>

              {loading ? (
                <div className="rounded-2xl border border-border bg-[#f9f6f2] p-5 text-sm text-secondaryText">Loading reports...</div>
              ) : reports.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-[#f9f6f2] p-5 text-sm text-secondaryText">No road reports submitted yet.</div>
              ) : (
                <div className="space-y-3">
                  {reports.slice(0, 5).map((report) => (
                    <div key={report.id} className="flex items-center justify-between gap-3 rounded-[22px] border border-border bg-[#f9f7f3] p-4">
                      <div>
                        <p className="text-sm font-semibold text-forest">{report.detectionLabel || 'Pothole'}</p>
                        <p className="mt-1 text-xs text-secondaryText">{new Date(report.createdAt).toLocaleDateString()}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`status-pill status-${String(report.status).toLowerCase()}`}>
                          {statusLabels[report.status] || report.status}
                        </span>
                        <ArrowUpRight className="text-sage" size={18} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-[28px] border border-border bg-[#1E3B2F] p-5 text-white shadow-soft">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#dfe7d6]">System health</p>
              <h3 className="mt-2 text-xl font-bold">Road conditions overview</h3>

              <div className="mt-6 space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm text-white/80"><span>High-priority issues</span><span>18</span></div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[74%] rounded-full bg-[#C8B48A]" /></div>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm text-white/80"><span>Verification rate</span><span>82%</span></div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[82%] rounded-full bg-[#7F8C6A]" /></div>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm text-white/80"><span>Repair completion</span><span>61%</span></div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[61%] rounded-full bg-[#F5F0E6]" /></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedPage>
  );
}

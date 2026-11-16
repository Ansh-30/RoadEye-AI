'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  History,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Users
} from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import ProtectedPage from '@/components/layout/ProtectedPage';
import api, {
  AI_BASE_URL,
  getApiErrorMessage,
  getDuplicateReviewHistory,
  getPendingDuplicateReviews,
  submitDuplicateReview,
  updateReportStatus
} from '@/services/api';

const editableStatuses = ['VERIFIED', 'REJECTED', 'IN_PROGRESS', 'RESOLVED'];

const statusLabels = {
  REPORTED: 'Pending verification',
  VERIFIED: 'Verified',
  REJECTED: 'Rejected',
  IN_PROGRESS: 'In progress',
  RESOLVED: 'Resolved'
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

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleString();
}

function formatConfidence(value) {
  return Number.isFinite(value) ? `${Math.round(value * 100)}%` : 'N/A';
}

function hasCoordinates(report) {
  return Number.isFinite(report.latitude) &&
    Number.isFinite(report.longitude) &&
    report.latitude >= -90 &&
    report.latitude <= 90 &&
    report.longitude >= -180 &&
    report.longitude <= 180;
}

export default function AdminPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [updatingReportId, setUpdatingReportId] = useState(null);
  const [unavailableImageIds, setUnavailableImageIds] = useState(() => new Set());
  const [duplicatePairs, setDuplicatePairs] = useState([]);
  const [duplicateHistory, setDuplicateHistory] = useState([]);
  const [duplicateLoading, setDuplicateLoading] = useState(true);
  const [duplicateRefreshing, setDuplicateRefreshing] = useState(false);
  const [duplicateLoadError, setDuplicateLoadError] = useState('');
  const [historyLoadError, setHistoryLoadError] = useState('');
  const [duplicateActionError, setDuplicateActionError] = useState('');
  const [duplicateActionSuccess, setDuplicateActionSuccess] = useState('');
  const [reviewingPairKey, setReviewingPairKey] = useState('');

  const loadReports = useCallback(async (isRefresh = false) => {
    setLoadError('');
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await api.get('/reports/admin');
      setReports(Array.isArray(response.data?.reports) ? response.data.reports : []);
    } catch (error) {
      setLoadError(getApiErrorMessage(error, 'Unable to load all reports.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const loadDuplicateReviews = useCallback(async (isRefresh = false) => {
    setDuplicateLoadError('');
    setHistoryLoadError('');
    if (isRefresh) {
      setDuplicateRefreshing(true);
    } else {
      setDuplicateLoading(true);
    }

    const [pendingResult, historyResult] = await Promise.allSettled([
      getPendingDuplicateReviews(),
      getDuplicateReviewHistory()
    ]);

    if (pendingResult.status === 'fulfilled') {
      setDuplicatePairs(
        Array.isArray(pendingResult.value.data?.duplicateReviews)
          ? pendingResult.value.data.duplicateReviews
          : []
      );
    } else {
      setDuplicateLoadError(
        getApiErrorMessage(pendingResult.reason, 'Unable to load possible duplicate reports.')
      );
    }

    if (historyResult.status === 'fulfilled') {
      setDuplicateHistory(
        Array.isArray(historyResult.value.data?.reviews)
          ? historyResult.value.data.reviews
          : []
      );
    } else {
      setHistoryLoadError(
        getApiErrorMessage(historyResult.reason, 'Unable to load duplicate review history.')
      );
    }

    setDuplicateLoading(false);
    setDuplicateRefreshing(false);
  }, []);

  useEffect(() => {
    loadDuplicateReviews();
  }, [loadDuplicateReviews]);

  const handleStatusChange = async (reportId, status) => {
    if (!editableStatuses.includes(status)) {
      return;
    }

    setActionError('');
    setUpdatingReportId(reportId);
    try {
      await updateReportStatus(reportId, status);
      await loadReports(true);
    } catch (error) {
      setActionError(getApiErrorMessage(error, 'Unable to update report status.'));
    } finally {
      setUpdatingReportId(null);
    }
  };

  const handleDuplicateDecision = async (pair, decision) => {
    const decisionLabel = decision === 'DUPLICATE' ? 'mark these reports as duplicates' : 'mark these reports as not duplicates';
    const confirmed = window.confirm(
      `Are you sure you want to ${decisionLabel}? This decision will be saved in review history.`
    );
    if (!confirmed) {
      return;
    }

    const pairKey = [pair.reportA.id, pair.reportB.id].sort().join(':');
    setDuplicateActionError('');
    setDuplicateActionSuccess('');
    setReviewingPairKey(pairKey);

    try {
      await submitDuplicateReview(pair.reportA.id, pair.reportB.id, decision);
      setDuplicateActionSuccess('Review decision saved.');
      await loadDuplicateReviews(true);
    } catch (error) {
      setDuplicateActionError(
        getApiErrorMessage(error, 'Unable to save the duplicate review decision.')
      );
    } finally {
      setReviewingPairKey('');
    }
  };

  const renderComparedReport = (report, sideLabel) => {
    const imageUrl = getReportImageUrl(report.imageUrl);
    const originalImageUrl = getReportImageUrl(report.originalImageUrl);
    const showAnnotatedImage = imageUrl && !unavailableImageIds.has(report.id);
    const showOriginalImage = originalImageUrl &&
      !unavailableImageIds.has(`${report.id}-original`);

    return (
      <div className="min-w-0 rounded-2xl border border-border bg-white p-3 sm:p-4">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-sage">
          {sideLabel}
        </p>
        {showAnnotatedImage ? (
          <img
            src={imageUrl}
            alt={`Annotated image for report ${report.id}`}
            className="h-48 w-full rounded-xl bg-[#e9ede2] object-cover"
            onError={() => setUnavailableImageIds((current) => new Set(current).add(report.id))}
          />
        ) : (
          <div className="flex h-48 items-center justify-center rounded-xl bg-[#e9ede2] text-sm text-secondaryText">
            Annotated image unavailable
          </div>
        )}
        {originalImageUrl ? (
          <div className="mt-3">
            <p className="mb-2 text-xs font-medium text-secondaryText">Original image</p>
            {showOriginalImage ? (
              <img
                src={originalImageUrl}
                alt={`Original image for report ${report.id}`}
                className="h-32 w-full rounded-xl bg-[#e9ede2] object-cover"
                onError={() => setUnavailableImageIds((current) => new Set(current).add(`${report.id}-original`))}
              />
            ) : (
              <div className="flex h-32 items-center justify-center rounded-xl bg-[#e9ede2] text-xs text-secondaryText">
                Original image unavailable
              </div>
            )}
          </div>
        ) : null}
        <dl className="mt-4 space-y-2 text-sm">
          <div>
            <dt className="text-xs text-secondaryText">Report ID</dt>
            <dd className="break-all font-medium text-darkText">{report.id}</dd>
          </div>
          <div className="flex items-start gap-2">
            <MapPin size={15} className="mt-0.5 shrink-0 text-sage" />
            <div>
              <dt className="text-xs text-secondaryText">GPS coordinates</dt>
              <dd className="text-darkText">
                {hasCoordinates(report)
                  ? `${report.latitude.toFixed(6)}, ${report.longitude.toFixed(6)}`
                  : 'Coordinates unavailable'}
              </dd>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <span className={`status-pill status-${String(report.status).toLowerCase()}`}>
              {statusLabels[report.status] || report.status}
            </span>
            <span className="text-xs text-secondaryText">{formatDate(report.createdAt)}</span>
          </div>
        </dl>
      </div>
    );
  };

  const metrics = {
    total: reports.length,
    pending: reports.filter((report) => report.status === 'REPORTED').length,
    inProgress: reports.filter((report) => report.status === 'IN_PROGRESS').length,
    resolved: reports.filter((report) => report.status === 'RESOLVED').length
  };

  const cards = [
    { label: 'Total reports', value: metrics.total, icon: ClipboardCheck },
    { label: 'Pending verification', value: metrics.pending, icon: ShieldCheck },
    { label: 'In-progress repairs', value: metrics.inProgress, icon: AlertTriangle },
    { label: 'Resolved reports', value: metrics.resolved, icon: CheckCircle2 }
  ];

  return (
    <ProtectedPage requireAdmin>
      <AppShell title="Admin Dashboard" subtitle="Operational summary for road safety oversight and municipal response coordination.">
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {cards.map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-[28px] border border-border bg-white/80 p-5 shadow-soft">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-secondaryText">{label}</p>
                    <p className="mt-3 text-3xl font-black text-forest">{value}</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef2e6] text-forest">
                    <Icon size={22} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <section className="rounded-[28px] border border-border bg-white/80 p-5 shadow-soft">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sage">Operations</p>
                <h3 className="mt-1 text-xl font-bold text-forest">All submitted reports</h3>
              </div>
              <button
                type="button"
                onClick={() => loadReports(true)}
                disabled={loading || refreshing}
                className="secondary-btn inline-flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                {refreshing ? 'Refreshing...' : 'Refresh reports'}
              </button>
            </div>

            {loadError ? (
              <div className="rounded-2xl border border-[#f2d1d1] bg-[#fff5f5] p-4 text-sm text-[#9b3434]" role="alert">
                <p>{loadError}</p>
                <button type="button" onClick={() => loadReports()} className="mt-2 font-semibold underline">
                  Try again
                </button>
              </div>
            ) : null}
            {actionError ? (
              <p className="mb-4 rounded-2xl border border-[#f2d1d1] bg-[#fff5f5] p-4 text-sm text-[#9b3434]" role="alert">
                {actionError}
              </p>
            ) : null}

            {loading ? (
              <div className="rounded-2xl border border-border bg-[#f9f7f3] p-5 text-sm text-secondaryText">
                Loading submitted reports...
              </div>
            ) : loadError ? null : reports.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-[#f9f7f3] p-5 text-sm text-secondaryText">
                No reports have been submitted yet.
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map((report) => {
                  const imageUrl = getReportImageUrl(report.imageUrl);
                  const showImage = imageUrl && !unavailableImageIds.has(report.id);
                  const reportLocation = hasCoordinates(report)
                    ? `${report.locationAddress ? `${report.locationAddress} · ` : ''}${report.latitude.toFixed(6)}, ${report.longitude.toFixed(6)}`
                    : report.locationAddress || 'Location not provided';

                  return (
                    <article key={report.id} className="rounded-[24px] border border-border bg-[#f9f7f3] p-4">
                      <div className="flex flex-col gap-4 lg:flex-row">
                        {showImage ? (
                          <img
                            src={imageUrl}
                            alt={`${report.detectionLabel || 'Road issue'} report`}
                            className="h-48 w-full rounded-2xl object-cover lg:h-36 lg:w-48"
                            onError={() => setUnavailableImageIds((current) => new Set(current).add(report.id))}
                          />
                        ) : (
                          <div className="flex h-36 w-full shrink-0 items-center justify-center rounded-2xl bg-[#e9ede2] text-forest lg:w-48" aria-label="Report image unavailable">
                            <FileText size={28} />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="text-lg font-bold capitalize text-forest">
                                {report.detectionLabel || 'Road defect'}
                              </p>
                              <p className="mt-1 text-xs text-secondaryText">Submitted {formatDate(report.createdAt)}</p>
                            </div>
                            <span className={`status-pill status-${String(report.status).toLowerCase()}`}>
                              {statusLabels[report.status] || report.status}
                            </span>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2 text-xs text-secondaryText">
                            <span className="rounded-full bg-white px-3 py-1.5">
                              Confidence: {formatConfidence(report.confidence)}
                            </span>
                            <span className="rounded-full bg-white px-3 py-1.5">
                              Potholes: {Number.isInteger(report.detectionCount) ? report.detectionCount : 0}
                            </span>
                          </div>

                          <div className="mt-3 flex items-start gap-2 text-sm text-darkText">
                            <Users size={16} className="mt-0.5 shrink-0 text-sage" />
                            <p className="break-all">
                              {report.user?.name || 'Unknown citizen'}
                              {report.user?.email ? <span className="text-secondaryText"> · {report.user.email}</span> : null}
                            </p>
                          </div>

                          <div className="mt-2 flex items-start gap-2 text-sm text-darkText">
                            <MapPin size={16} className="mt-0.5 shrink-0 text-sage" />
                            <p className="break-words text-secondaryText">{reportLocation}</p>
                          </div>

                          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                            <label htmlFor={`status-${report.id}`} className="text-sm font-medium text-darkText">
                              Update status
                            </label>
                            <select
                              id={`status-${report.id}`}
                              value=""
                              onChange={(event) => handleStatusChange(report.id, event.target.value)}
                              disabled={updatingReportId === report.id || refreshing}
                              className="input-shell w-full sm:max-w-xs"
                            >
                              <option value="" disabled>
                                {updatingReportId === report.id ? 'Updating...' : 'Choose a status'}
                              </option>
                              {editableStatuses.map((status) => (
                                <option key={status} value={status}>{statusLabels[status]}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-[28px] border border-border bg-white/80 p-5 shadow-soft">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sage">Manual assessment</p>
                <h3 className="mt-1 text-xl font-bold text-forest">Duplicate Review</h3>
                <p className="mt-1 text-sm text-secondaryText">
                  Compare nearby reports and record a decision. Reports are never merged or removed.
                </p>
              </div>
              <button
                type="button"
                onClick={() => loadDuplicateReviews(true)}
                disabled={duplicateLoading || duplicateRefreshing}
                className="secondary-btn inline-flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} className={duplicateRefreshing ? 'animate-spin' : ''} />
                {duplicateRefreshing ? 'Refreshing...' : 'Refresh reviews'}
              </button>
            </div>

            {duplicateActionSuccess ? (
              <p className="mb-4 rounded-2xl border border-[#d6e5cb] bg-[#f2f7ed] p-4 text-sm text-forest" role="status">
                {duplicateActionSuccess}
              </p>
            ) : null}
            {duplicateActionError ? (
              <p className="mb-4 rounded-2xl border border-[#f2d1d1] bg-[#fff5f5] p-4 text-sm text-[#9b3434]" role="alert">
                {duplicateActionError}
              </p>
            ) : null}
            {duplicateLoadError ? (
              <div className="mb-4 rounded-2xl border border-[#f2d1d1] bg-[#fff5f5] p-4 text-sm text-[#9b3434]" role="alert">
                <p>{duplicateLoadError}</p>
                <button type="button" onClick={() => loadDuplicateReviews()} className="mt-2 font-semibold underline">
                  Try again
                </button>
              </div>
            ) : null}

            {duplicateLoading ? (
              <div className="space-y-4" aria-label="Loading duplicate reviews">
                {[0, 1].map((item) => (
                  <div key={item} className="animate-pulse rounded-2xl border border-border bg-[#f9f7f3] p-4">
                    <div className="mb-4 h-5 w-48 rounded bg-[#e9ede2]" />
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="h-64 rounded-xl bg-[#e9ede2]" />
                      <div className="h-64 rounded-xl bg-[#e9ede2]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : duplicateLoadError ? null : duplicatePairs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-[#f9f7f3] p-6 text-sm text-secondaryText">
                No pending possible duplicate pairs need review.
              </div>
            ) : (
              <div className="space-y-5">
                {duplicatePairs.map((pair) => {
                  const pairKey = [pair.reportA.id, pair.reportB.id].sort().join(':');
                  const isReviewing = reviewingPairKey === pairKey;

                  return (
                    <article key={pairKey} className="rounded-[24px] border border-border bg-[#f9f7f3] p-4 sm:p-5">
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h4 className="text-base font-bold text-forest">Possible duplicate pair</h4>
                          <p className="mt-1 text-sm text-secondaryText">
                            Distance: {Number.isFinite(pair.distanceMeters) ? `${pair.distanceMeters.toFixed(2)} m` : 'Unavailable'}
                          </p>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-secondaryText">
                          Manual review required
                        </span>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        {renderComparedReport(pair.reportA, 'Report A')}
                        {renderComparedReport(pair.reportB, 'Report B')}
                      </div>

                      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
                        <button
                          type="button"
                          onClick={() => handleDuplicateDecision(pair, 'DUPLICATE')}
                          disabled={Boolean(reviewingPairKey)}
                          className="primary-btn inline-flex items-center justify-center gap-2"
                        >
                          {isReviewing ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                          {isReviewing ? 'Saving decision...' : 'Mark as Duplicate'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDuplicateDecision(pair, 'NOT_DUPLICATE')}
                          disabled={Boolean(reviewingPairKey)}
                          className="secondary-btn"
                        >
                          Not Duplicate
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-[28px] border border-border bg-white/80 p-5 shadow-soft">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eef2e6] text-forest">
                <History size={19} />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sage">Audit trail</p>
                <h3 className="mt-1 text-xl font-bold text-forest">Review History</h3>
              </div>
            </div>

            {historyLoadError ? (
              <div className="rounded-2xl border border-[#f2d1d1] bg-[#fff5f5] p-4 text-sm text-[#9b3434]" role="alert">
                <p>{historyLoadError}</p>
                <button type="button" onClick={() => loadDuplicateReviews()} className="mt-2 font-semibold underline">
                  Try again
                </button>
              </div>
            ) : duplicateLoading ? (
              <div className="animate-pulse space-y-3" aria-label="Loading review history">
                <div className="h-20 rounded-2xl bg-[#e9ede2]" />
                <div className="h-20 rounded-2xl bg-[#e9ede2]" />
              </div>
            ) : duplicateHistory.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-[#f9f7f3] p-5 text-sm text-secondaryText">
                No duplicate review decisions have been recorded yet.
              </div>
            ) : (
              <div className="space-y-3">
                {duplicateHistory.map((review) => (
                  <article key={review.id} className="rounded-2xl border border-border bg-[#f9f7f3] p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-semibold text-forest">
                          {review.decision === 'DUPLICATE' ? 'Marked as Duplicate' : 'Marked as Not Duplicate'}
                        </p>
                        <p className="mt-1 break-all text-xs text-secondaryText">
                          {review.reportA?.id || review.reportAId} · {review.reportB?.id || review.reportBId}
                        </p>
                      </div>
                      <p className="text-xs text-secondaryText">{formatDate(review.reviewedAt)}</p>
                    </div>
                    <p className="mt-2 text-sm text-darkText">
                      Reviewed by {review.reviewedBy?.name || 'Unknown admin'}
                      {review.reviewedBy?.email ? <span className="text-secondaryText"> · {review.reviewedBy.email}</span> : null}
                    </p>
                    <p className="mt-1 text-xs text-secondaryText">
                      Submitted {formatDate(review.reportA?.createdAt)} and {formatDate(review.reportB?.createdAt)}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </AppShell>
    </ProtectedPage>
  );
}

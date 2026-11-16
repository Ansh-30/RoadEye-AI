'use client';

import { useEffect, useMemo } from 'react';
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap
} from 'react-leaflet';

function MapSizeInvalidator() {
  const map = useMap();

  useEffect(() => {
    const timer = window.setTimeout(() => map.invalidateSize(), 0);
    return () => window.clearTimeout(timer);
  }, [map]);

  return null;
}

function FitReports({ reports }) {
  const map = useMap();
  useEffect(() => {
    if (reports.length === 1) {
      map.setView([reports[0].latitude, reports[0].longitude], 13);
    } else if (reports.length > 1) {
      map.fitBounds(
        reports.map((report) => [report.latitude, report.longitude]),
        { padding: [40, 40], maxZoom: 13 }
      );
    }
  }, [map, reports]);

  return null;
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleDateString();
}

export default function LeafletReportsMap({ reports, loading, error }) {
  const locatedReports = useMemo(
    () =>
      reports.filter(
        (report) =>
          Number.isFinite(report.latitude) &&
          Number.isFinite(report.longitude) &&
          report.latitude >= -90 &&
          report.latitude <= 90 &&
          report.longitude >= -180 &&
          report.longitude <= 180
      ),
    [reports]
  );

  return (
    <div className="relative h-[520px] overflow-hidden rounded-[30px] border border-border">
      <MapContainer
        center={[20, 0]}
        zoom={2}
        scrollWheelZoom
        className="h-full w-full"
        aria-label="Interactive OpenStreetMap showing geolocated road reports"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapSizeInvalidator />
        <FitReports reports={locatedReports} />
        {locatedReports.map((report) => (
          <CircleMarker
            key={report.id}
            center={[report.latitude, report.longitude]}
            radius={8}
            pathOptions={{
              color: '#1E3B2F',
              fillColor: '#C8B48A',
              fillOpacity: 0.9,
              weight: 2
            }}
          >
            <Popup>
              <div>
                <strong>{report.detectionLabel || 'Road defect'}</strong>
                <div>Confidence: {Number.isFinite(report.confidence) ? `${Math.round(report.confidence * 100)}%` : 'N/A'}</div>
                <div>Detection count: {report.detectionCount ?? 'N/A'}</div>
                <div>Status: {report.status || 'Unknown'}</div>
                <div>Submitted: {formatDate(report.createdAt)}</div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
      {loading || error || locatedReports.length === 0 ? (
        <div className="pointer-events-none absolute inset-x-4 bottom-4 z-[1000] rounded-2xl border border-border bg-white/95 px-4 py-3 text-center text-sm text-secondaryText shadow-soft">
          {loading
            ? 'Loading report locations...'
            : error
              ? 'Report locations are unavailable.'
              : 'No reports with valid location coordinates yet. The map will show report markers when coordinates are available.'}
        </div>
      ) : null}
    </div>
  );
}

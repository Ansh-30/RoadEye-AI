'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { UploadCloud, MapPinned, FileImage, CheckCircle2 } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import ProtectedPage from '@/components/layout/ProtectedPage';
import { AI_BASE_URL, detectImage, getApiErrorMessage, getNearbyReports } from '@/services/api';
import 'leaflet/dist/leaflet.css';

const LocationPickerMap = dynamic(
  () => import('@/components/map/LocationPickerMap'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[240px] items-center justify-center rounded-2xl border border-border bg-[#f9f7f3] text-sm text-secondaryText">
        Loading location map...
      </div>
    )
  }
);

function getAnnotatedImageUrl(imageUrl) {
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

export default function DetectPage() {
  const [file, setFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [result, setResult] = useState(null);
  const [annotatedImageUnavailable, setAnnotatedImageUnavailable] = useState(false);
  const [nearbyReports, setNearbyReports] = useState([]);
  const [nearbyCheckError, setNearbyCheckError] = useState('');
  const [checkingNearbyReports, setCheckingNearbyReports] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [addressInput, setAddressInput] = useState('');
  const [geocoding, setGeocoding] = useState(false);
  const [continueWithoutLocation, setContinueWithoutLocation] = useState(false);
  const [geocodingError, setGeocodingError] = useState('');
  const fileInputRef = useRef(null);
  const submittingRef = useRef(false);
  const lastGeocodingRequestRef = useRef(0);
  const geocodingRequestRef = useRef(false);

  useEffect(() => {
    if (!file) {
      setImagePreviewUrl('');
      return undefined;
    }

    const previewUrl = URL.createObjectURL(file);
    setImagePreviewUrl(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [file]);

  const handleFileChange = (event) => {
    const nextFile = event.target.files?.[0] || null;
    setFile(nextFile);
    setResult(null);
    setSuccess('');
    setError('');
    setNearbyReports([]);
    setNearbyCheckError('');
  };

  const clearNearbyReportCheck = () => {
    setNearbyReports([]);
    setNearbyCheckError('');
  };

  const handleStartAnotherReport = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setResult(null);
    setSelectedLocation(null);
    setAddressInput('');
    setContinueWithoutLocation(false);
    setSuccess('');
    setError('');
    setLocationError('');
    setGeocodingError('');
    clearNearbyReportCheck();
  };

  const handleUseCurrentLocation = () => {
    clearNearbyReportCheck();
    setLocationError('');
    setSelectedLocation(null);
    setContinueWithoutLocation(false);

    if (!navigator.geolocation) {
      setLocationError('Location is not supported by this browser. You can enter an address instead.');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setSelectedLocation({
          latitude: coords.latitude,
          longitude: coords.longitude,
          address: '',
          source: 'GPS'
        });
        setLocating(false);
      },
      (geolocationError) => {
        const messages = {
          1: 'Location permission was denied. Allow location access in browser settings or enter an address instead.',
          2: 'Your location is currently unavailable. Try again or enter an address instead.',
          3: 'Finding your location timed out. Try again or enter an address instead.'
        };
        setLocationError(messages[geolocationError.code] || 'Unable to get your location. You can enter an address instead.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleFindAddress = async () => {
    if (geocodingRequestRef.current) {
      return;
    }

    const address = addressInput.trim();
    setGeocodingError('');

    if (!address) {
      setGeocodingError('Enter an address to find its location.');
      return;
    }

    geocodingRequestRef.current = true;
    setGeocoding(true);
    const waitForPolicyInterval = Math.max(
      0,
      1000 - (Date.now() - lastGeocodingRequestRef.current)
    );
    if (waitForPolicyInterval > 0) {
      await new Promise((resolve) => window.setTimeout(resolve, waitForPolicyInterval));
    }

    lastGeocodingRequestRef.current = Date.now();
    try {
      const query = new URLSearchParams({
        q: address,
        format: 'jsonv2',
        limit: '1'
      });
      const response = await fetch(`https://nominatim.openstreetmap.org/search?${query.toString()}`, {
        headers: { Accept: 'application/json' }
      });

      if (!response.ok) {
        throw new Error(response.status === 429
          ? 'Address search is temporarily rate-limited. Please wait and try again.'
          : 'Address search is unavailable. Please try again.');
      }

      const matches = await response.json();
      const match = matches[0];
      const latitude = Number(match?.lat);
      const longitude = Number(match?.lon);

      if (
        !match ||
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
      ) {
        setGeocodingError('No matching address was found. Check the address and try again.');
        return;
      }

      setSelectedLocation({
        latitude,
        longitude,
        address: match.display_name || address,
        source: 'Address'
      });
      clearNearbyReportCheck();
      setLocationError('');
      setContinueWithoutLocation(false);
    } catch (requestError) {
      setGeocodingError(requestError.message || 'Unable to find that address. Please try again.');
    } finally {
      setGeocoding(false);
      geocodingRequestRef.current = false;
    }
  };

  const handleMapLocationChange = ({ latitude, longitude }) => {
    clearNearbyReportCheck();
    setSelectedLocation((current) => ({
      latitude,
      longitude,
      address: '',
      source: current?.source === 'GPS' ? 'Map adjustment' : 'Map selection'
    }));
  };

  const submitDetection = async () => {
    try {
      setLoading(true);
      const response = await detectImage(file, selectedLocation);

      const detectionData = response.data?.data || {};
      setResult(detectionData);
      setAnnotatedImageUnavailable(false);
      setNearbyReports([]);
      setNearbyCheckError('');
      setSuccess('Pothole detection completed successfully.');
    } catch (submitError) {
      const message = submitError.response?.data?.message || 'Detection failed. Please try another image.';
      setError(message);
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (submittingRef.current) {
      return;
    }

    if (!file) {
      setError('Please select a road image to detect.');
      return;
    }

    if (!selectedLocation && !continueWithoutLocation) {
      setError('Select a location or confirm that you want to continue without one.');
      return;
    }

    submittingRef.current = true;
    setNearbyReports([]);
    setNearbyCheckError('');

    if (selectedLocation) {
      setCheckingNearbyReports(true);
      try {
        const response = await getNearbyReports(
          selectedLocation.latitude,
          selectedLocation.longitude
        );
        if (response.data?.success !== true || !Array.isArray(response.data?.nearbyReports)) {
          throw new Error('Nearby report check returned an unexpected response.');
        }
        const matches = response.data.nearbyReports;

        if (matches.length > 0) {
          setNearbyReports(matches);
          setCheckingNearbyReports(false);
          submittingRef.current = false;
          return;
        }
      } catch (nearbyError) {
        setNearbyCheckError(
          getApiErrorMessage(
            nearbyError,
            'Nearby reports could not be checked. You can continue, but possible duplicates were not verified.'
          )
        );
        setCheckingNearbyReports(false);
        submittingRef.current = false;
        return;
      }

      setCheckingNearbyReports(false);
    }

    await submitDetection();
  };

  const handleContinueAnyway = async () => {
    if (submittingRef.current || !file) {
      return;
    }

    submittingRef.current = true;
    setError('');
    setNearbyReports([]);
    setNearbyCheckError('');
    await submitDetection();
  };

  return (
    <ProtectedPage>
      <AppShell title="AI Pothole Detection" subtitle="Upload a road image to identify pothole risks and save the detection report.">
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <form onSubmit={handleSubmit} className="rounded-[28px] border border-border bg-white/80 p-5 shadow-soft">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef2e6] text-forest">
                <UploadCloud size={22} />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sage">Step 1 · Upload image</p>
                <h3 className="mt-1 text-xl font-bold text-forest">Upload road image</h3>
              </div>
            </div>

            <label className="flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-[28px] border-2 border-dashed border-[#d8d4ce] bg-[#f9f7f3] p-6 text-center transition hover:border-forest">
              {imagePreviewUrl ? (
                <img src={imagePreviewUrl} alt="Selected road image preview" className="mb-4 h-40 w-full rounded-2xl object-cover" />
              ) : (
                <FileImage size={42} className="text-sage" />
              )}
              <p className="mt-2 text-lg font-semibold text-forest">{file ? file.name : 'Choose a road image'}</p>
              <p className="mt-2 text-sm text-secondaryText">{file ? 'Click to choose a different image' : 'PNG, JPG or WEBP up to 10MB'}</p>
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleFileChange} />
            </label>

            <div className="mt-6 space-y-4 rounded-[24px] border border-border bg-[#f9f7f3] p-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sage">Step 2 · Select location</p>
                <h3 className="mt-1 text-lg font-bold text-forest">Where was this image taken?</h3>
              </div>

              <button
                type="button"
                onClick={handleUseCurrentLocation}
                className="secondary-btn w-full"
                disabled={loading || locating}
              >
                {locating ? 'Finding current location...' : 'Use Current Location'}
              </button>
              {locationError ? <p className="text-sm text-[#9b3434]" role="alert">{locationError}</p> : null}

              <div className="space-y-3">
                <label htmlFor="report-address" className="block text-sm font-medium text-darkText">
                  Or enter a street address, locality, city and state
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    id="report-address"
                    type="text"
                    value={addressInput}
                    onChange={(event) => {
                      setAddressInput(event.target.value);
                      clearNearbyReportCheck();
                      setSelectedLocation(null);
                      setContinueWithoutLocation(false);
                    }}
                    className="input-shell"
                    placeholder="Street, locality, city, state"
                    autoComplete="street-address"
                    disabled={loading || geocoding}
                  />
                  <button
                    type="button"
                    onClick={handleFindAddress}
                    className="secondary-btn shrink-0"
                    disabled={loading || geocoding}
                  >
                    {geocoding ? 'Finding...' : 'Find Location'}
                  </button>
                </div>
                <p className="text-xs text-secondaryText">
                  Address lookup uses OpenStreetMap Nominatim only when you select Find Location.
                </p>
                {geocodingError ? <p className="text-sm text-[#9b3434]" role="alert">{geocodingError}</p> : null}
              </div>

              {selectedLocation ? (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-border bg-white p-3 text-sm text-darkText">
                    <p className="font-semibold text-forest">{selectedLocation.address || `${selectedLocation.source} location`}</p>
                    <p className="mt-1 text-secondaryText">
                      Latitude {selectedLocation.latitude.toFixed(6)}, Longitude {selectedLocation.longitude.toFixed(6)}
                    </p>
                    <p className="mt-1 text-xs text-secondaryText">
                      Click the map to adjust the pin, or choose another location method.
                    </p>
                  </div>
                  <LocationPickerMap location={selectedLocation} onSelect={handleMapLocationChange} />
                  <button
                    type="button"
                    className="text-sm font-semibold text-forest underline"
                    onClick={() => {
                      clearNearbyReportCheck();
                      setSelectedLocation(null);
                    }}
                    disabled={loading}
                  >
                    Remove selected location
                  </button>
                </div>
              ) : (
                <label className="flex items-start gap-2 text-sm text-secondaryText">
                  <input
                    type="checkbox"
                    checked={continueWithoutLocation}
                    onChange={(event) => {
                      clearNearbyReportCheck();
                      setContinueWithoutLocation(event.target.checked);
                    }}
                    disabled={loading}
                    className="mt-1 accent-[#1E3B2F]"
                  />
                  Continue without a location
                </label>
              )}
            </div>

            <div className="mt-5 rounded-[24px] border border-border bg-white/70 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sage">Step 3 · Review & submit</p>
              {imagePreviewUrl ? (
                <img
                  src={imagePreviewUrl}
                  alt="Road image to submit"
                  className="mt-3 h-28 w-full rounded-2xl object-cover"
                />
              ) : null}
              <p className="mt-2 text-sm text-darkText">
                <span className="font-semibold">Image:</span> {file?.name || 'No image selected'}
              </p>
              <p className="mt-1 text-sm text-darkText">
                <span className="font-semibold">Location:</span>{' '}
                {selectedLocation
                  ? `${selectedLocation.address || selectedLocation.source} (${selectedLocation.latitude.toFixed(6)}, ${selectedLocation.longitude.toFixed(6)})`
                  : continueWithoutLocation
                    ? 'Continue without location'
                    : 'Select a location or choose to continue without one'}
              </p>
              <p className="mt-3 text-xs text-secondaryText">
                The detection and report are created only after you select Submit Report.
              </p>
            </div>

            {error ? <p className="mt-4 rounded-2xl border border-[#f2d1d1] bg-[#fff5f5] px-3 py-2 text-sm text-[#b33b3b]">{error}</p> : null}
            {success ? <p className="mt-4 rounded-2xl border border-[#d9edd9] bg-[#f4fbf4] px-3 py-2 text-sm text-[#2a663a]">{success}</p> : null}

            {checkingNearbyReports ? (
              <p className="mt-4 rounded-2xl border border-border bg-[#f9f7f3] px-3 py-2 text-sm text-secondaryText" role="status">
                Checking for nearby reports...
              </p>
            ) : null}

            {nearbyCheckError ? (
              <div className="mt-4 rounded-2xl border border-[#eadbb8] bg-[#fffaf0] p-4 text-sm text-darkText" role="alert">
                <p className="font-semibold text-forest">Could not check nearby reports</p>
                <p className="mt-1 text-secondaryText">{nearbyCheckError}</p>
                <button
                  type="button"
                  onClick={handleContinueAnyway}
                  disabled={loading}
                  className="primary-btn mt-3 w-full disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Continue Anyway
                </button>
              </div>
            ) : null}

            {nearbyReports.length > 0 ? (
              <section className="mt-4 rounded-[24px] border border-[#eadbb8] bg-[#fffaf0] p-4" aria-labelledby="possible-duplicates-title">
                <h3 id="possible-duplicates-title" className="text-lg font-bold text-forest">
                  Possible Duplicate Reports Found
                </h3>
                <p className="mt-1 text-sm text-secondaryText">
                  These reports are nearby and may describe the same road issue. Review them before deciding; no report is automatically rejected or merged.
                </p>
                <div className="mt-4 space-y-3">
                  {nearbyReports.map((report) => {
                    const reportImageUrl = getAnnotatedImageUrl(report.imageUrl);
                    const createdAt = new Date(report.createdAt);
                    const reportDate = Number.isNaN(createdAt.getTime())
                      ? 'Date unavailable'
                      : createdAt.toLocaleString();

                    return (
                      <article key={report.id} className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-3 sm:flex-row">
                        {reportImageUrl ? (
                          <img
                            src={reportImageUrl}
                            alt={`Possible nearby report ${report.id}`}
                            className="h-36 w-full rounded-xl object-cover sm:h-24 sm:w-32"
                          />
                        ) : (
                          <div className="flex h-24 w-full items-center justify-center rounded-xl bg-[#eef2e6] text-sm text-secondaryText sm:w-32">
                            Image unavailable
                          </div>
                        )}
                        <div className="min-w-0 flex-1 text-sm">
                          <p className="break-all font-semibold text-forest">Report ID: {report.id}</p>
                          <p className="mt-1 text-secondaryText">
                            Distance: {Number.isFinite(report.distanceMeters) ? `${report.distanceMeters.toFixed(1)} m` : 'Unavailable'}
                          </p>
                          <p className="text-secondaryText">Status: {report.status}</p>
                          <p className="text-secondaryText">Submitted: {reportDate}</p>
                          {reportImageUrl ? (
                            <a
                              href={reportImageUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-2 inline-flex font-semibold text-forest underline"
                            >
                              Review Existing Report
                            </a>
                          ) : null}
                        </div>
                      </article>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={handleContinueAnyway}
                  disabled={loading}
                  className="primary-btn mt-4 w-full disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Continue Anyway
                </button>
              </section>
            ) : null}

            <button type="submit" disabled={loading || checkingNearbyReports || Boolean(result) || nearbyReports.length > 0 || Boolean(nearbyCheckError)} className="primary-btn mt-6 w-full disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? 'Detecting and submitting report...' : checkingNearbyReports ? 'Checking nearby reports...' : result ? 'Report Submitted' : 'Submit Report'}
            </button>
            {result ? (
              <div className="mt-3 flex flex-col gap-3">
                <Link href="/reports" className="secondary-btn w-full">
                  View My Reports
                </Link>
                <button type="button" onClick={handleStartAnotherReport} className="text-sm font-semibold text-forest underline">
                  Start another report
                </button>
              </div>
            ) : null}
          </form>

          <div className="rounded-[28px] border border-border bg-white/80 p-5 shadow-soft">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef2e6] text-forest">
                <MapPinned size={22} />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sage">Results</p>
                <h3 className="mt-1 text-xl font-bold text-forest">Detection summary</h3>
              </div>
            </div>

            {!result ? (
              <div className="rounded-[24px] border border-dashed border-border bg-[#f9f7f3] p-5 text-sm text-secondaryText">
                Upload an image to generate AI inspection results.
              </div>
            ) : (
              <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-[22px] bg-[#f5f0e6] p-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-sage">Total</p>
                    <p className="mt-2 text-3xl font-black text-forest">{result.totalPotholes ?? 0}</p>
                  </div>
                  <div className="rounded-[22px] bg-[#eef2e6] p-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-sage">Status</p>
                    <p className="mt-2 text-lg font-bold text-forest">{result.reportStatus || 'REPORTED'}</p>
                  </div>
                  <div className="rounded-[22px] bg-[#f2ead5] p-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-sage">Reported</p>
                    <p className="mt-2 text-lg font-bold text-forest">{result.reportId ? 'Saved' : 'Pending'}</p>
                  </div>
                </div>

                <div className="overflow-hidden rounded-[26px] border border-border bg-[#f9f7f3] p-2">
                  {getAnnotatedImageUrl(result.annotatedImage) && !annotatedImageUnavailable ? (
                    <img
                      src={getAnnotatedImageUrl(result.annotatedImage)}
                      alt="Annotated pothole detection"
                      className="h-[280px] w-full rounded-[18px] object-cover"
                      onError={() => setAnnotatedImageUnavailable(true)}
                    />
                  ) : (
                    <p className="rounded-[18px] bg-[#f9f7f3] p-4 text-sm text-secondaryText">
                      Annotated image is unavailable.
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-semibold uppercase tracking-[0.15em] text-sage">Detected hazards</p>
                  {Array.isArray(result.detections) && result.detections.length > 0 ? (
                    result.detections.map((item, index) => (
                      <div key={`${item.label}-${index}`} className="flex items-center justify-between gap-4 rounded-[20px] border border-border bg-[#f9f7f3] p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1E3B2F] text-white">
                            <CheckCircle2 size={18} />
                          </div>
                          <div>
                            <p className="font-semibold text-forest">{item.label || 'Pothole'}</p>
                            <p className="text-xs text-secondaryText">Detection #{index + 1}</p>
                          </div>
                        </div>
                        <span className="rounded-full bg-[#eef2e6] px-2.5 py-1 text-xs font-bold text-forest">
                          {Math.round((item.confidence || 0) * 100)}%
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[18px] border border-border bg-[#f9f7f3] p-4 text-sm text-secondaryText">No individual detections were returned for this image.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </AppShell>
    </ProtectedPage>
  );
}

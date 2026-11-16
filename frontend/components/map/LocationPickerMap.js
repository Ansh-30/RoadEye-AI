'use client';

import { useEffect } from 'react';
import { CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';

function MapEvents({ onSelect }) {
  useMapEvents({
    click(event) {
      onSelect({
        latitude: event.latlng.lat,
        longitude: event.latlng.lng
      });
    }
  });

  return null;
}

function RecenterMap({ location }) {
  const map = useMap();

  useEffect(() => {
    map.setView([location.latitude, location.longitude], Math.max(map.getZoom(), 15));
  }, [location.latitude, location.longitude, map]);

  return null;
}

export default function LocationPickerMap({ location, onSelect }) {
  return (
    <div className="h-[240px] overflow-hidden rounded-2xl border border-border">
      <MapContainer
        center={[location.latitude, location.longitude]}
        zoom={15}
        scrollWheelZoom
        className="h-full w-full"
        aria-label="Location preview map; click to adjust the selected location"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapEvents onSelect={onSelect} />
        <RecenterMap location={location} />
        <CircleMarker
          center={[location.latitude, location.longitude]}
          radius={9}
          pathOptions={{
            color: '#1E3B2F',
            fillColor: '#C8B48A',
            fillOpacity: 0.9,
            weight: 3
          }}
        />
      </MapContainer>
    </div>
  );
}

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix marker icons (React + Leaflet bundler issue)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const MapController = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(position, 15);
  }, [position, map]);
  return null;
};

const LocationPicker = ({ onLocationChange }) => {
  const [position, setPosition] = useState([28.6139, 77.2090]); // default Delhi
  const markerRef = useRef(null);

  const findMyLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const newPos = [latitude, longitude];
        setPosition(newPos);
        onLocationChange({ lat: latitude, lng: longitude });
      },
      () => {
        alert('Could not get your location. Please enable location services.');
      }
    );
  };

  useEffect(() => {
    findMyLocation();
  }, []);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const newPos = marker.getLatLng();
          setPosition([newPos.lat, newPos.lng]);
          onLocationChange(newPos);
        }
      },
    }),
    [onLocationChange]
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="block text-sm font-medium text-gray-700">
          Pinpoint Your Location (Drag the marker)
        </label>
        <button
          type="button"
          onClick={findMyLocation}
          className="text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          Find My Location
        </button>
      </div>

      <div className="h-64 rounded-lg overflow-hidden border">
        <MapContainer
          center={position}
          zoom={13}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
        >
          <MapController position={position} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker
            draggable={true}
            eventHandlers={eventHandlers}
            position={position}
            ref={markerRef}
          >
            <Popup>Drag me to your exact location!</Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  );
};

export default LocationPicker;

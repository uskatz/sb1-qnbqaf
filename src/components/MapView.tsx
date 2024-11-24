import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { icon } from 'leaflet';
import { formatDate, getDaysSince } from '@/lib/utils';
import { Container } from '@/types';

const ICON = icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface MapViewProps {
  containers: Container[];
}

const MapView: React.FC<MapViewProps> = ({ containers }) => {
  const center = containers.length > 0
    ? [containers[0].location.latitude, containers[0].location.longitude]
    : [0, 0];

  return (
    <div className="h-[calc(100vh-8rem)] w-full rounded-xl overflow-hidden shadow-xl">
      <MapContainer
        center={center as [number, number]}
        zoom={13}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {containers.map(container => (
          <Marker
            key={container.id}
            position={[container.location.latitude, container.location.longitude]}
            icon={ICON}
          >
            <Popup>
              <div className="p-2">
                <h3 className="text-lg font-bold text-blue-600">#{container.number}</h3>
                {container.location.address && (
                  <p className="text-sm text-gray-600 mt-1">{container.location.address}</p>
                )}
                <p className="text-sm text-gray-600">Added: {formatDate(container.timestamp)}</p>
                <p className="text-sm font-medium text-blue-500">
                  {getDaysSince(container.timestamp)} days on site
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapView;
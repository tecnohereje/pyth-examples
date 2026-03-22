import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { Location } from '../../hooks/useGeolocation';

// Solución al problema de carga de imágenes predeterminadas de Leaflet en React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Icono personalizado para el jugador
const playerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Componente para centrar el mapa dinámicamente
const MapUpdater = ({ location }: { location: Location }) => {
  const map = useMap();
  useEffect(() => {
    if (location) {
      map.flyTo([location.latitude, location.longitude], map.getZoom());
    }
  }, [location, map]);
  return null;
};

interface MapViewProps {
  playerLocation: Location | null;
  missionLocations?: Array<{ id: string; name: string; lat: number; lng: number }>;
}

export const MapView = ({ playerLocation, missionLocations = [] }: MapViewProps) => {
  const defaultCenter: [number, number] = [-34.6037, -58.3816]; // Default: Buenos Aires
  
  const center = playerLocation 
    ? [playerLocation.latitude, playerLocation.longitude] as [number, number] 
    : defaultCenter;

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative', zIndex: 1 }}>
      <MapContainer 
        center={center} 
        zoom={15} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {playerLocation && (
          <>
            <MapUpdater location={playerLocation} />
            <Marker position={[playerLocation.latitude, playerLocation.longitude]} icon={playerIcon}>
              <Popup>Tu ubicación actual</Popup>
            </Marker>
          </>
        )}

        {missionLocations.map((loc) => (
          <Marker key={loc.id} position={[loc.lat, loc.lng]}>
            <Popup>{loc.name}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

// Calcula la distancia en metros entre dos coordenadas geográficas usando la fórmula de Haversine
export const getDistanceInMeters = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3; // Radio de la Tierra en metros
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
};

// Verifica si un jugador está dentro del radio permitido para hacer check-in
export const isWithinRadius = (
  playerLat: number,
  playerLon: number,
  targetLat: number,
  targetLon: number,
  allowedRadiusMeters: number
): boolean => {
  const distance = getDistanceInMeters(playerLat, playerLon, targetLat, targetLon);
  return distance <= allowedRadiusMeters;
};

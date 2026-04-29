import { Platform } from 'react-native';

const OPEN_STREET_MAP_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const CARTO_LIGHT_TILE_URL = 'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png';

// Match the driver app: Android devices can flash or rate-limit direct OSM tiles.
// Carto's light raster tiles are more stable for in-app Android map loading.
export const MAP_TILE_URL_TEMPLATE =
  Platform.OS === 'android' ? CARTO_LIGHT_TILE_URL : OPEN_STREET_MAP_TILE_URL;

export const MAP_LOADING_ENABLED = Platform.OS === 'android';

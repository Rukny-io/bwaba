import { readFileSync } from 'fs';
import { join } from 'path';
import type { IraqGovernorateCode } from '../data/iraq-governorates';

type LonLat = [number, number];

interface GeoFeature {
  properties?: { shapeISO?: string };
  geometry?: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
}

let governoratePolygons: {
  code: IraqGovernorateCode;
  geometry: GeoFeature['geometry'];
}[] | null = null;

function loadGovernoratePolygons() {
  if (governoratePolygons) return governoratePolygons;

  const filePath = join(__dirname, '..', 'data', 'iraq-governorates.geojson');
  const raw = readFileSync(filePath, 'utf8');
  const collection = JSON.parse(raw) as { features: GeoFeature[] };

  governoratePolygons = collection.features
    .filter((f) => f.properties?.shapeISO && f.geometry)
    .map((f) => ({
      code: f.properties!.shapeISO as IraqGovernorateCode,
      geometry: f.geometry,
    }));

  return governoratePolygons;
}

function pointInRing(point: LonLat, ring: number[][]): boolean {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersects =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi + Number.EPSILON) + xi;
    if (intersects) inside = !inside;
  }

  return inside;
}

function pointInPolygonCoords(point: LonLat, coordinates: number[][][]): boolean {
  if (!coordinates[0]?.length) return false;
  if (!pointInRing(point, coordinates[0])) return false;
  for (let i = 1; i < coordinates.length; i++) {
    if (pointInRing(point, coordinates[i])) return false;
  }
  return true;
}

function pointInGeometry(point: LonLat, geometry: GeoFeature['geometry']): boolean {
  if (!geometry) return false;

  if (geometry.type === 'Polygon') {
    return pointInPolygonCoords(point, geometry.coordinates as number[][][]);
  }

  for (const polygon of geometry.coordinates as number[][][][]) {
    if (pointInPolygonCoords(point, polygon)) return true;
  }

  return false;
}

/** Resolve Iraq governorate from WGS84 coordinates (lon, lat). */
export function resolveIraqGovernorateByCoordinates(
  lon: number,
  lat: number,
): IraqGovernorateCode | null {
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;

  const point: LonLat = [lon, lat];
  const polygons = loadGovernoratePolygons();

  for (const entry of polygons) {
    if (pointInGeometry(point, entry.geometry)) {
      return entry.code;
    }
  }

  return null;
}

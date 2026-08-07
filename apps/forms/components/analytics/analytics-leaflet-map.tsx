'use client';

import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { LatLngBoundsExpression, PathOptions } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { scaleLinear } from 'd3-scale';
import type { AnalyticsGeoBreakdown, AnalyticsGeoRegion } from '@/lib/forms-api';
import { IRAQ_GOVERNORATE_NAMES } from '@/lib/iraq-governorate-geo';
import { formatNumber } from '@/lib/dashboard-format';

const COLOR_MIN = '#dbeafe';
const COLOR_MAX = '#b5d43b';
const COLOR_BORDER = '#94a3b8';

const WORLD_GEO_URL =
  'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson';
const IRAQ_GEO_URL = '/geo/iraq-governorates.geojson';

interface Props {
  data: AnalyticsGeoBreakdown;
  metric: 'views' | 'submissions';
  level: 'governorates' | 'countries';
  height?: number;
}

function MapUpdater({
  center,
  zoom,
  bounds,
}: {
  center: [number, number];
  zoom: number;
  bounds?: LatLngBoundsExpression | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [16, 16] });
      return;
    }
    map.setView(center, zoom);
  }, [bounds, center, zoom, map]);

  return null;
}

function getCountryIso2(properties: Record<string, unknown>): string | null {
  const iso2 =
    properties['ISO3166-1-Alpha-2'] ??
    properties.ISO_A2 ??
    properties.iso_a2;
  if (typeof iso2 === 'string' && iso2.length === 2 && iso2 !== '-99') {
    return iso2.toUpperCase();
  }
  return null;
}

export default function AnalyticsLeafletMap({
  data,
  metric,
  level,
  height = 320,
}: Props) {
  const [worldGeo, setWorldGeo] = useState<GeoJSON.FeatureCollection | null>(null);
  const [iraqGeo, setIraqGeo] = useState<GeoJSON.FeatureCollection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadGeo() {
      setLoading(true);
      try {
        if (level === 'governorates') {
          if (!iraqGeo) {
            const res = await fetch(IRAQ_GEO_URL);
            const json = (await res.json()) as GeoJSON.FeatureCollection;
            if (!cancelled) setIraqGeo(json);
          }
        } else if (!worldGeo) {
          const res = await fetch(WORLD_GEO_URL);
          const json = (await res.json()) as GeoJSON.FeatureCollection;
          if (!cancelled) setWorldGeo(json);
        }
      } catch (err) {
        console.error('Failed to load geo map data', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadGeo();
    return () => {
      cancelled = true;
    };
  }, [level, iraqGeo, worldGeo]);

  const maxValue = metric === 'views' ? data.maxViews : data.maxSubmissions;

  const colorScale = useMemo(
    () =>
      scaleLinear<string>()
        .domain([0, Math.max(maxValue, 1)])
        .range([COLOR_MIN, COLOR_MAX])
        .clamp(true),
    [maxValue],
  );

  const valueMap = useMemo(() => {
    const map = new Map<string, AnalyticsGeoRegion>();
    const rows = level === 'governorates' ? data.governorates : data.countries;
    for (const row of rows) {
      map.set(row.code.toUpperCase(), row);
    }
    return map;
  }, [data, level]);

  const geoJsonData = level === 'governorates' ? iraqGeo : worldGeo;

  const iraqBounds = useMemo((): LatLngBoundsExpression | null => {
    if (level !== 'governorates' || !iraqGeo?.features.length) return null;
    let minLat = 90;
    let minLon = 180;
    let maxLat = -90;
    let maxLon = -180;

    for (const feature of iraqGeo.features) {
      const coords = extractCoordinates(feature.geometry);
      for (const [lon, lat] of coords) {
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
        minLon = Math.min(minLon, lon);
        maxLon = Math.max(maxLon, lon);
      }
    }

    return [
      [minLat, minLon],
      [maxLat, maxLon],
    ];
  }, [level, iraqGeo]);

  if (loading || !geoJsonData) {
    return (
      <div
        className="flex items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)]/30"
        style={{ height }}
      >
        <span className="text-sm text-[var(--muted-foreground)]">جاري تحميل الخريطة...</span>
      </div>
    );
  }

  const center: [number, number] = level === 'governorates' ? [33.2, 44] : [20, 0];
  const zoom = level === 'governorates' ? 6 : 2;

  const resolveRegion = (feature: GeoJSON.Feature): AnalyticsGeoRegion | undefined => {
    const props = (feature.properties ?? {}) as Record<string, unknown>;

    if (level === 'governorates') {
      const code = String(props.shapeISO ?? props.code ?? '').toUpperCase();
      return valueMap.get(code);
    }

    const iso2 = getCountryIso2(props);
    if (iso2) return valueMap.get(iso2);

    return undefined;
  };

  const styleFeature = (feature?: GeoJSON.Feature): PathOptions => {
    if (!feature) {
      return {
        fillColor: '#e2e8f0',
        weight: 1,
        opacity: 1,
        color: COLOR_BORDER,
        fillOpacity: 0.35,
      };
    }

    const region = resolveRegion(feature);
    const value = region ? (metric === 'views' ? region.views : region.submissions) : 0;
    const hasValue = value > 0;

    return {
      fillColor: hasValue ? colorScale(value) : '#e2e8f0',
      weight: hasValue ? 1.5 : 1,
      opacity: 1,
      color: hasValue ? '#ffffff' : COLOR_BORDER,
      fillOpacity: hasValue ? 0.85 : 0.35,
    };
  };

  const onEachFeature = (feature: GeoJSON.Feature, layer: L.Layer) => {
    const region = resolveRegion(feature);
    const props = (feature.properties ?? {}) as Record<string, unknown>;
    const path = layer as L.Path;

    let name: string;
    if (region) {
      name = region.nameAr || region.name;
    } else if (level === 'governorates') {
      const code = String(props.shapeISO ?? '');
      name = IRAQ_GOVERNORATE_NAMES[code]?.nameAr ?? String(props.shapeName ?? code);
    } else {
      name = String(props.name ?? props.ADMIN ?? '');
    }

    const value = region ? (metric === 'views' ? region.views : region.submissions) : 0;
    const hasValue = value > 0;
    const defaultStyle = styleFeature(feature);

    path.bindTooltip(
      `<div class="text-center font-sans" dir="rtl"><strong class="block mb-1">${name}</strong><span dir="ltr" class="inline-block text-[#b5d43b] font-bold">${formatNumber(value)}</span> <span class="text-xs text-gray-500">${metric === 'views' ? 'مشاهدة' : 'استجابة'}</span></div>`,
      {
        sticky: false,
        direction: 'top',
        opacity: 0.95,
        className:
          'bg-white/95 backdrop-blur-sm border-0 shadow-xl rounded-xl px-3 py-2',
      },
    );

    path.on({
      mouseover: (e: L.LeafletMouseEvent) => {
        const l = e.target as L.Path;
        l.setStyle({
          weight: 2.5,
          color: '#2563eb',
          fillOpacity: hasValue ? 0.95 : 0.5,
        });
        l.bringToFront();
        l.openTooltip();
      },
      mouseout: (e: L.LeafletMouseEvent) => {
        const l = e.target as L.Path;
        l.setStyle(defaultStyle);
        l.closeTooltip();
      },
      click: (e: L.LeafletMouseEvent) => {
        const target = e.originalEvent.target;
        if (target instanceof HTMLElement) {
          target.blur();
        }
        L.DomEvent.stopPropagation(e);
      },
    });
  };

  return (
    <div
      className="analytics-geo-map relative isolate w-full overflow-hidden rounded-2xl border border-[var(--border)]"
      style={{ height }}
    >
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        className="z-0 h-full w-full"
        style={{ background: '#f1f5f9' }}
      >
        <MapUpdater center={center} zoom={zoom} bounds={iraqBounds} />
        {level === 'countries' ? (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            className="opacity-60 grayscale"
          />
        ) : null}
        <GeoJSON
          key={`${level}-${metric}-${maxValue}`}
          data={geoJsonData}
          style={styleFeature}
          onEachFeature={onEachFeature}
        />
      </MapContainer>
    </div>
  );
}

function extractCoordinates(geometry: GeoJSON.Geometry | undefined): [number, number][] {
  if (!geometry) return [];

  if (geometry.type === 'Polygon') {
    return geometry.coordinates.flat() as [number, number][];
  }
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.flat(2) as [number, number][];
  }

  return [];
}

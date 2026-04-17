'use client';

import { useEffect, useRef } from 'react';
import type { Zone } from '@zhim/types';

interface ZoneMapProps {
  zones: Zone[];
  selectedZone: Zone | null;
  onZoneClick: (zone: Zone) => void;
}

// Leaflet loaded client-side only (no SSR)
export function ZoneMap({ zones, selectedZone, onZoneClick }: ZoneMapProps) {
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;
    if (mapRef.current) return;

    import('leaflet').then((L) => {
      const map = L.map(containerRef.current!, {
        center: [27.469, 89.641],  // Thimphu
        zoom: 13,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      mapRef.current = map;

      zones.forEach((zone) => {
        if (!zone.boundary) return;
        const color = zone.status === 'active' ? '#F5A800' : zone.status === 'coming_soon' ? '#9E9285' : '#E4DDD4';
        const polygon = L.geoJSON(zone.boundary as any, {
          style: { color, fillColor: color, fillOpacity: 0.15, weight: 2 },
        }).addTo(map);
        polygon.on('click', () => onZoneClick(zone));
        polygon.bindTooltip(zone.name, { permanent: false });
      });
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [zones]);

  return <div ref={containerRef} className="w-full h-full" />;
}

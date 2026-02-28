'use client';

import { useEffect, useRef } from 'react';
import { useLocale } from 'next-intl';
import { MapPin } from 'lucide-react';

interface PropertyMapProps {
  latitude: number;
  longitude: number;
  title: string;
  address?: string;
}

export default function PropertyMap({ latitude, longitude, title, address }: PropertyMapProps) {
  const locale = useLocale();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);

  useEffect(() => {
    // Dynamically import Leaflet to avoid SSR issues
    const initMap = async () => {
      if (!mapRef.current || mapInstanceRef.current) return;

      const L = (await import('leaflet')).default;

      // Fix default marker icons
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      const map = L.map(mapRef.current, {
        center: [latitude, longitude],
        zoom: 15,
        zoomControl: true,
        scrollWheelZoom: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Custom marker
      const customIcon = L.divIcon({
        html: `
          <div style="
            background: #0c8fe7;
            border: 3px solid white;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            width: 36px;
            height: 36px;
            box-shadow: 0 4px 12px rgba(12,143,231,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="
              transform: rotate(45deg);
              color: white;
              font-size: 16px;
              display: flex;
              align-items: center;
              justify-content: center;
            ">🏠</div>
          </div>
        `,
        className: '',
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36],
      });

      const marker = L.marker([latitude, longitude], { icon: customIcon }).addTo(map);

      marker.bindPopup(`
        <div style="
          font-family: ${locale === 'ar' ? 'Cairo, sans-serif' : 'Inter, sans-serif'};
          direction: ${locale === 'ar' ? 'rtl' : 'ltr'};
          min-width: 180px;
          padding: 4px;
        ">
          <strong style="color: #0158a0; font-size: 14px;">${title}</strong>
          ${address ? `<p style="color: #64748b; font-size: 12px; margin-top: 4px;">${address}</p>` : ''}
          <p style="color: #94a3b8; font-size: 11px; margin-top: 4px;">
            ${latitude.toFixed(6)}, ${longitude.toFixed(6)}
          </p>
        </div>
      `).openPopup();

      mapInstanceRef.current = map;
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mapInstanceRef.current as any).remove();
        mapInstanceRef.current = null;
      }
    };
  }, [latitude, longitude, title, address, locale]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
      {/* Map Container */}
      <div ref={mapRef} className="h-80 w-full z-0" />

      {/* Coordinates Badge */}
      <div className="absolute bottom-3 start-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-1.5 text-xs text-dark-600 shadow-sm z-10">
        <MapPin className="w-3.5 h-3.5 text-primary-500" />
        <span dir="ltr">{latitude.toFixed(4)}, {longitude.toFixed(4)}</span>
      </div>
    </div>
  );
}

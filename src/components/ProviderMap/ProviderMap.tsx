import * as React from 'react';
import { cn } from '../../utils/cn';

// =============================================================================
// Types
// =============================================================================

export interface MapCoordinates {
  latitude: number;
  longitude: number;
}

export interface ProviderMapProps {
  coordinates: MapCoordinates;
  providerName: string;
  address: string;
  /** Mapbox access token - required for interactive maps */
  mapboxToken?: string;
  /** Initial zoom level (default: 15) */
  zoom?: number;
  /** Show satellite view toggle */
  showSatelliteToggle?: boolean;
  /** Show fullscreen button */
  showFullscreen?: boolean;
  /** Show zoom controls */
  showZoomControls?: boolean;
  /** Map height (default: aspect-video) */
  height?: string;
  /** Directions URL */
  directionsUrl?: string;
  className?: string;
}

// =============================================================================
// Provider Map Component
// =============================================================================

/**
 * Interactive map showing provider location.
 * Uses Mapbox GL JS for interactive maps, falls back to static image if no token provided.
 */
export function ProviderMap({
  coordinates,
  providerName,
  address,
  mapboxToken,
  zoom = 15,
  showSatelliteToggle = true,
  showFullscreen = true,
  showZoomControls = true,
  height,
  directionsUrl,
  className,
}: ProviderMapProps) {
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<unknown>(null);
  const [mapLoaded, setMapLoaded] = React.useState(false);
  const [mapStyle, setMapStyle] = React.useState<'streets' | 'satellite'>('streets');
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Load Mapbox GL JS dynamically
  React.useEffect(() => {
    if (!mapboxToken) {
      return;
    }

    const loadMapbox = async () => {
      try {
        // Load CSS (always needed regardless of JS loading method)
        if (typeof window !== 'undefined' && !document.querySelector('link[href*="mapbox-gl"]')) {
          const link = document.createElement('link');
          link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css';
          link.rel = 'stylesheet';
          document.head.appendChild(link);
        }

        // Strategy 1: Try dynamic import (works when mapbox-gl is an npm dependency)
        let mapboxgl: MapboxGLTypes | undefined;
        try {
          const mod = await import('mapbox-gl');
          const defaultExport = (mod.default || mod) as unknown as MapboxGLTypes;
          if (defaultExport && typeof defaultExport.Map === 'function') {
            mapboxgl = defaultExport;
          }
        } catch {
          // npm module not available — fall through to CDN
        }

        // Strategy 2: Check if already loaded on window (e.g. from previous CDN load)
        if (!mapboxgl) {
          const win = window as unknown as { mapboxgl?: MapboxGLTypes };
          if (win.mapboxgl) {
            mapboxgl = win.mapboxgl;
          }
        }

        // Strategy 3: Load from CDN as last resort
        if (!mapboxgl) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.js';
            script.onload = () => resolve();
            script.onerror = reject;
            document.head.appendChild(script);
          });
          await new Promise((resolve) => setTimeout(resolve, 100));
          mapboxgl = (window as unknown as { mapboxgl: MapboxGLTypes }).mapboxgl;
        }

        if (!mapboxgl) {
          throw new Error('Mapbox GL JS failed to load');
        }

        mapboxgl.accessToken = mapboxToken;

        if (mapContainerRef.current && !mapRef.current) {
          const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: mapStyle === 'streets'
              ? 'mapbox://styles/mapbox/streets-v12'
              : 'mapbox://styles/mapbox/satellite-streets-v12',
            center: [coordinates.longitude, coordinates.latitude],
            zoom,
          });

          // Add marker
          new mapboxgl.Marker({ color: '#0ea5e9' })
            .setLngLat([coordinates.longitude, coordinates.latitude])
            .setPopup(
              new mapboxgl.Popup({ offset: 25 }).setHTML(
                `<strong>${providerName}</strong><br/>${address}`
              )
            )
            .addTo(map);

          // Add navigation controls
          if (showZoomControls) {
            map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
          }

          // Add fullscreen control
          if (showFullscreen) {
            map.addControl(new mapboxgl.FullscreenControl(), 'bottom-right');
          }

          // Add geolocation control
          map.addControl(
            new mapboxgl.GeolocateControl({
              positionOptions: { enableHighAccuracy: true },
              trackUserLocation: false,
              showUserHeading: false,
            }),
            'bottom-right'
          );

          map.on('load', () => {
            setMapLoaded(true);
          });

          mapRef.current = map;
        }
      } catch (err) {
        console.error('Failed to load map:', err);
        setError('Failed to load map');
      }
    };

    loadMapbox();

    return () => {
      if (mapRef.current) {
        (mapRef.current as { remove: () => void }).remove();
        mapRef.current = null;
      }
    };
  }, [mapboxToken, coordinates, zoom, providerName, address, showZoomControls, showFullscreen]);

  // Update map style when toggled
  React.useEffect(() => {
    if (mapRef.current && mapLoaded) {
      const map = mapRef.current as { setStyle: (style: string) => void };
      map.setStyle(
        mapStyle === 'streets'
          ? 'mapbox://styles/mapbox/streets-v12'
          : 'mapbox://styles/mapbox/satellite-streets-v12'
      );
    }
  }, [mapStyle, mapLoaded]);

  // Handle fullscreen changes
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Fallback to static map if no token
  if (!mapboxToken) {
    return (
      <div
        className={cn(
          'relative overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800',
          height || 'aspect-video',
          className
        )}
      >
        <StaticMapFallback
          coordinates={coordinates}
          providerName={providerName}
          address={address}
          directionsUrl={directionsUrl}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          'relative flex items-center justify-center overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800',
          height || 'aspect-video',
          className
        )}
      >
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p>Map unavailable</p>
          {directionsUrl && (
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              Get Directions →
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg',
        height || 'aspect-video',
        className
      )}
    >
      {/* Map Container */}
      <div ref={mapContainerRef} className="absolute inset-0" />

      {/* Satellite Toggle */}
      {showSatelliteToggle && mapLoaded && (
        <button
          type="button"
          onClick={() => setMapStyle((s) => (s === 'streets' ? 'satellite' : 'streets'))}
          className="absolute top-2 right-2 z-10 rounded bg-white px-2 py-1 text-xs font-medium text-gray-700 shadow hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          {mapStyle === 'streets' ? 'Satellite view' : 'Map view'}
        </button>
      )}

      {/* Directions Link */}
      {directionsUrl && mapLoaded && (
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-2 left-2 z-10 rounded bg-primary-600 px-3 py-1.5 text-xs font-medium text-white shadow hover:bg-primary-700"
        >
          GET DIRECTIONS
        </a>
      )}

      {/* Loading State */}
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Static Map Fallback
// =============================================================================

interface StaticMapFallbackProps {
  coordinates: MapCoordinates;
  providerName: string;
  address: string;
  directionsUrl?: string;
}

function StaticMapFallback({
  coordinates,
  providerName,
  address,
  directionsUrl,
}: StaticMapFallbackProps) {
  // Use OpenStreetMap static tiles as fallback
  const staticMapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${coordinates.longitude - 0.01}%2C${coordinates.latitude - 0.01}%2C${coordinates.longitude + 0.01}%2C${coordinates.latitude + 0.01}&layer=mapnik&marker=${coordinates.latitude}%2C${coordinates.longitude}`;

  return (
    <div className="relative h-full w-full">
      <iframe
        title={`Map showing ${providerName} location`}
        src={staticMapUrl}
        className="h-full w-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      {directionsUrl && (
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-2 left-2 z-10 rounded bg-primary-600 px-3 py-1.5 text-xs font-medium text-white shadow hover:bg-primary-700"
        >
          GET DIRECTIONS
        </a>
      )}
    </div>
  );
}

// =============================================================================
// Mapbox GL Types (minimal for type safety)
// =============================================================================

interface MapboxGLTypes {
  accessToken: string;
  Map: new (options: {
    container: HTMLElement;
    style: string;
    center: [number, number];
    zoom: number;
  }) => MapboxMap;
  Marker: new (options?: { color?: string }) => MapboxMarker;
  Popup: new (options?: { offset?: number }) => MapboxPopup;
  NavigationControl: new () => unknown;
  FullscreenControl: new () => unknown;
  GeolocateControl: new (options?: {
    positionOptions?: { enableHighAccuracy?: boolean };
    trackUserLocation?: boolean;
    showUserHeading?: boolean;
  }) => unknown;
}

interface MapboxMap {
  addControl: (control: unknown, position?: string) => void;
  on: (event: string, callback: () => void) => void;
  setStyle: (style: string) => void;
  remove: () => void;
}

interface MapboxMarker {
  setLngLat: (lngLat: [number, number]) => MapboxMarker;
  setPopup: (popup: MapboxPopup) => MapboxMarker;
  addTo: (map: MapboxMap) => MapboxMarker;
}

interface MapboxPopup {
  setHTML: (html: string) => MapboxPopup;
}

export default ProviderMap;

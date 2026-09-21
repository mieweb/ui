# ProviderMap maintenance

Consumer configuration and token guidance belong in `ProviderMap.stories.tsx`. Mapbox GL is an optional peer; importing the component must not require it at module evaluation time.

## Loading and lifecycle

With no token, the component renders an OpenStreetMap iframe. With a token, its effect first tries a dynamic npm import, then `window.mapboxgl`, then the pinned CDN script. Mapbox CSS is injected once when absent. Review the CDN version and the minimal local interfaces together when upgrading Mapbox.

The effect owns one map instance. A cancellation flag prevents late module/script loads from creating a map after cleanup. Cleanup removes the map; asynchronous provider errors also remove it and clear the ref. The error and interactive roots have different React keys: otherwise React can reuse a Mapbox-mutated DOM container and retain a stale canvas inside the error message. Keep loading/error state reset when configuration changes.

Shared injected stylesheet/script elements remain available to other instances. They are not a per-instance resource to remove during ordinary unmount. Do not expose browser globals at module scope. The inline map-style toggle updates the existing map rather than reconstructing it.

## Data and security contract

Provider names and addresses are untrusted text. Build popup content with DOM text nodes and `setDOMContent`; never interpolate them into `setHTML`. Callers supply validated coordinates and an appropriate directions URL. Tokens must be public and origin-restricted; never put secret credentials in props or stories. Mapbox and OpenStreetMap make third-party requests, and geolocation requires browser permission.

## Verification

`ProviderMap.test.tsx` mocks the optional module and verifies no-token fallback, loading, controls, style switching, text-safe popups, error cleanup and unmount. `tests/visual/provider-discovery.spec.ts` covers desktop/mobile and dark/failure states; external map tiles are deterministic fixtures, so those screenshots validate the surrounding UI rather than Mapbox rendering. Check the Interactive story manually with an origin-restricted public token when changing provider integration. Keep directions visible in the error fallback and retain the accessible iframe title/loading status.

import { useRef, useMemo, useEffect } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';

interface SearchMapViewProps {
  originName?: string | null;
  destinationName?: string | null;
}

// Known coordinates for major Côte d'Ivoire cities
const CI_CITY_COORDS: Record<string, [number, number]> = {
  abidjan: [5.3599, -4.0083],
  bouaké: [7.6938, -5.0303],
  bouake: [7.6938, -5.0303],
  yamoussoukro: [6.8276, -5.2767],
  'san-pédro': [4.7485, -6.6363],
  'san-pedro': [4.7485, -6.6363],
  korhogo: [9.458, -5.6296],
  daloa: [6.8774, -6.4502],
  man: [7.4125, -7.5538],
  gagnoa: [6.1319, -5.9506],
  abengourou: [6.7297, -3.4964],
  bondoukou: [8.0402, -2.8],
  'grand-bassam': [5.2118, -3.7388],
  divo: [5.8372, -5.3572],
};

function resolveCoords(cityName?: string | null): [number, number] | null {
  if (!cityName) return null;
  const key = cityName.toLowerCase().trim();
  for (const [name, coords] of Object.entries(CI_CITY_COORDS)) {
    if (key.includes(name)) return coords;
  }
  // Default to Abidjan if unrecognized
  return [5.3599, -4.0083];
}

export function SearchMapView({ originName, destinationName }: SearchMapViewProps) {
  const webViewRef = useRef<WebView>(null);

  const originCoords = useMemo(() => resolveCoords(originName), [originName]);
  const destCoords = useMemo(() => resolveCoords(destinationName), [destinationName]);

  const mapHtml = useMemo(() => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
    }
    .leaflet-control-container .leaflet-routing-container-hide { display: none; }
    .leaflet-control-zoom { display: none !important; }
    /* Phase 31 review residue (F-TM-16 class) — the attribution flag CSS
       suppression was REMOVED: OSM's tile policy requires visible
       "© OpenStreetMap contributors" on every public surface. */
    .leaflet-container { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .marker-pin {
      width: 32px;
      height: 32px;
      border-radius: 50% 50% 50% 0;
      position: absolute;
      transform: rotate(-45deg);
      left: 50%;
      top: 50%;
      margin: -20px 0 0 -20px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(238, 35, 124, 0.35);
    }
    .marker-origin {
      background: #ee237c;
      border: 2px solid #ffffff;
    }
    .marker-dest {
      background: #0f172a;
      border: 2px solid #ffffff;
    }
    .marker-inner {
      width: 10px;
      height: 10px;
      background: #ffffff;
      border-radius: 50%;
      transform: rotate(45deg);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', {
      zoomControl: false
      // Phase 31 review residue — attributionControl stays ENABLED (default):
      // this is the highest-traffic traveler surface and raw OSM tiles carry
      // an unambiguous visible-attribution requirement.
    }).setView([7.54, -5.55], 7);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      subdomains: 'abc',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    var originMarker = null;
    var destMarker = null;
    var routePolyline = null;

    function updateRoute(orig, dest, origName, destName) {
      if (originMarker) map.removeLayer(originMarker);
      if (destMarker) map.removeLayer(destMarker);
      if (routePolyline) map.removeLayer(routePolyline);

      if (orig) {
        var origIcon = L.divIcon({
          className: 'custom-pin',
          html: '<div class="marker-pin marker-origin"><div class="marker-inner"></div></div>',
          iconSize: [32, 32],
          iconAnchor: [16, 32]
        });
        originMarker = L.marker(orig, { icon: origIcon }).addTo(map);
      }

      if (dest) {
        var destIcon = L.divIcon({
          className: 'custom-pin',
          html: '<div class="marker-pin marker-dest"><div class="marker-inner"></div></div>',
          iconSize: [32, 32],
          iconAnchor: [16, 32]
        });
        destMarker = L.marker(dest, { icon: destIcon }).addTo(map);
      }

      if (orig && dest) {
        var latlngs = [orig, dest];
        routePolyline = L.polyline(latlngs, {
          color: '#ee237c',
          weight: 4,
          opacity: 0.85,
          dashArray: '8, 8',
          lineCap: 'round'
        }).addTo(map);

        var bounds = L.latLngBounds([orig, dest]);
        map.fitBounds(bounds, { padding: [80, 80] });
      } else if (orig) {
        map.setView(orig, 10);
      }
    }

    window.updateRouteData = function(orig, dest, origName, destName) {
      updateRoute(orig, dest, origName, destName);
    };
  </script>
</body>
</html>
    `;
  }, []);

  // Update map when coordinates change
  useEffect(() => {
    if (webViewRef.current) {
      const origJs = originCoords ? `[${originCoords[0]}, ${originCoords[1]}]` : 'null';
      const destJs = destCoords ? `[${destCoords[0]}, ${destCoords[1]}]` : 'null';
      const js = `if (window.updateRouteData) { window.updateRouteData(${origJs}, ${destJs}, ${JSON.stringify(
        originName || ''
      )}, ${JSON.stringify(destinationName || '')}); } true;`;
      webViewRef.current.injectJavaScript(js);
    }
  }, [originCoords, destCoords, originName, destinationName]);

  return (
    <View className="absolute inset-0">
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: mapHtml }}
        className="flex-1 bg-slate-50"
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        onLoadEnd={() => {
          if (originCoords || destCoords) {
            const origJs = originCoords ? `[${originCoords[0]}, ${originCoords[1]}]` : 'null';
            const destJs = destCoords ? `[${destCoords[0]}, ${destCoords[1]}]` : 'null';
            const js = `if (window.updateRouteData) { window.updateRouteData(${origJs}, ${destJs}, ${JSON.stringify(
              originName || ''
            )}, ${JSON.stringify(destinationName || '')}); } true;`;
            webViewRef.current?.injectJavaScript(js);
          }
        }}
      />
    </View>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Radar, Trash2, X } from "lucide-react";
import L from "leaflet";
import { EXCURSIONS } from "../data/excursions";
import { PLACES, type Place, type PlaceCategory } from "../data/trip";
import { haversineKm, formatDistanceKm } from "../../lib/geo/haversine";
import { useMapPins } from "../hooks/useMapPins";
import type { SavedMapPin } from "../types";
import { useNavigation } from "../contexts/NavigationContext";
import { mapPlaceSearch } from "../services/mapSearch";
import { PlaceActions } from "./PlaceActions";

const ANTIGUA = { lat: 14.5586, lng: -90.7344, name: "Antigua" };
const MAP_CENTER: L.LatLngExpression = [14.62, -90.85];

const CATEGORY_COLORS: Record<PlaceCategory, string> = {
  airport: "#8c857c",
  city: "#5a7d8a",
  hike: "#9c4f3d",
  spa: "#8a7a8e",
  lake: "#5a7d8a",
  activity: "#b8956b",
  restaurant: "#9c4f3d",
  hotel: "#6b8f71",
};

const SAVED_PIN_COLOR = "#6b5080";

function makeIcon(color: string) {
  return L.divIcon({
    className: "leaflet-pin-icon",
    html: `<div style="width:12px;height:12px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 3px rgba(26,24,22,0.25)"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
}

const icons = Object.fromEntries(
  (Object.keys(CATEGORY_COLORS) as PlaceCategory[]).map((c) => [
    c,
    makeIcon(CATEGORY_COLORS[c]),
  ]),
) as Record<PlaceCategory, L.DivIcon>;

const savedIcon = makeIcon(SAVED_PIN_COLOR);

type LeafletContainer = HTMLDivElement & { _leaflet_id?: number };

function clearLeafletContainer(el: LeafletContainer, map: L.Map | null) {
  if (map) {
    map.remove();
  }
  delete el._leaflet_id;
  el.replaceChildren();
}

function addMapTiles(map: L.Map) {
  const osm = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  });

  const carto = L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 20,
    },
  );

  let errors = 0;
  carto.on("tileerror", () => {
    errors += 1;
    if (errors >= 3 && !map.hasLayer(osm)) {
      map.removeLayer(carto);
      osm.addTo(map);
    }
  });

  carto.addTo(map);
}

type Selected =
  | { kind: "place"; place: Place }
  | { kind: "pin"; pin: SavedMapPin };

function findKnownPlace(query: string) {
  const q = query.toLowerCase().trim();
  if (!q) return null;

  const place = PLACES.find(
    (p) => p.name.toLowerCase().includes(q) || q.includes(p.name.toLowerCase()),
  );
  if (place) {
    return {
      name: place.name,
      lat: place.lat,
      lng: place.lng,
      notes: place.notes,
      address: place.address,
    };
  }

  const exc = EXCURSIONS.find(
    (e) =>
      e.lat != null &&
      e.lng != null &&
      (e.name.toLowerCase().includes(q) ||
        e.region.toLowerCase().includes(q) ||
        q.split(/\s+/).every((w) => `${e.name} ${e.region}`.toLowerCase().includes(w))),
  );
  if (exc?.lat != null && exc.lng != null) {
    return {
      name: exc.name,
      lat: exc.lat,
      lng: exc.lng,
      notes: exc.tagline,
    };
  }

  return null;
}

export function TripMap() {
  const { pins, loaded, addPin, removePin } = useMapPins();
  const { askPedro } = useNavigation();

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  const [mapStatus, setMapStatus] = useState<"loading" | "ready" | "error">("loading");
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapKey, setMapKey] = useState(0);
  const [selected, setSelected] = useState<Selected | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const pedroPrompt = (name: string) =>
    `Tell me about ${name} and whether it's worth adding to my Guatemala trip.`;

  const categories = Object.keys(CATEGORY_COLORS) as PlaceCategory[];

  const allPoints = useMemo(
    () => [
      ...PLACES.map((p) => ({ lat: p.lat, lng: p.lng })),
      ...pins.map((p) => ({ lat: p.lat, lng: p.lng })),
    ],
    [pins],
  );

  useEffect(() => {
    const el = containerRef.current as LeafletContainer | null;
    if (!el) return;

    let cancelled = false;
    let map: L.Map | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let attempts = 0;

    setMapStatus("loading");
    setMapError(null);
    mapRef.current = null;
    markersRef.current = null;

    const finishReady = () => {
      if (cancelled || !map) return;
      map.invalidateSize();
      setMapStatus("ready");
    };

    const init = () => {
      if (cancelled) return;
      attempts += 1;

      if (el.clientWidth < 2 || el.clientHeight < 2) {
        if (attempts < 30) {
          requestAnimationFrame(init);
        } else {
          setMapStatus("error");
          setMapError("Map area has no size — try refreshing.");
        }
        return;
      }

      try {
        clearLeafletContainer(el, mapRef.current);
        mapRef.current = null;
        markersRef.current = null;

        map = L.map(el, {
          center: MAP_CENTER,
          zoom: 9,
          zoomControl: false,
          scrollWheelZoom: false,
          doubleClickZoom: false,
          boxZoom: false,
          keyboard: false,
          touchZoom: false,
        });

        addMapTiles(map);
        markersRef.current = L.layerGroup().addTo(map);
        mapRef.current = map;

        resizeObserver = new ResizeObserver(() => {
          map?.invalidateSize();
        });
        resizeObserver.observe(el);

        requestAnimationFrame(() => requestAnimationFrame(finishReady));
      } catch (err) {
        if (!cancelled) {
          setMapStatus("error");
          setMapError(err instanceof Error ? err.message : "Map failed to load");
        }
      }
    };

    requestAnimationFrame(init);

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      clearLeafletContainer(el, mapRef.current);
      mapRef.current = null;
      markersRef.current = null;
      map = null;
    };
  }, [mapKey]);

  useEffect(() => {
    const map = mapRef.current;
    const group = markersRef.current;
    if (!map || !group || mapStatus !== "ready") return;

    group.clearLayers();

    for (const place of PLACES) {
      const marker = L.marker([place.lat, place.lng], { icon: icons[place.category] });
      marker.on("click", () => setSelected({ kind: "place", place }));
      marker.addTo(group);
    }

    for (const pin of pins) {
      const marker = L.marker([pin.lat, pin.lng], { icon: savedIcon });
      marker.on("click", () => setSelected({ kind: "pin", pin }));
      marker.addTo(group);
    }

    if (allPoints.length > 0) {
      const bounds = L.latLngBounds(allPoints.map((p) => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 11 });
    }
  }, [pins, allPoints, mapStatus]);

  const handleAddPlace = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q || searchLoading) return;

    setSearchError(null);
    setSearchLoading(true);

    try {
      const known = findKnownPlace(q);
      if (known) {
        addPin({
          name: known.name,
          lat: known.lat,
          lng: known.lng,
          notes: known.notes,
          address: known.address,
        });
        setSearchQuery("");
        return;
      }

      const result = await mapPlaceSearch(q);

      addPin({
        name: result.name,
        lat: result.lat,
        lng: result.lng,
        notes: result.notes,
        address: result.address,
        sourceUrl: result.sourceUrl,
      });
      setSearchQuery("");
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "Couldn't add place");
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <div className="map-section">
      <div className="map-search-panel">
        <form className="map-search-form" onSubmit={handleAddPlace}>
          <Radar size={17} strokeWidth={1.5} className="map-search-icon" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Add a place (Cerro Tzankujil, Rincón Tipico…)"
            aria-label="Search place to add to map"
          />
          <button
            type="submit"
            className="btn-scan map-search-btn"
            disabled={searchLoading || !searchQuery.trim()}
          >
            {searchLoading ? <Loader2 size={16} className="spin" /> : "Add"}
          </button>
        </form>
        <p className="map-powered-by">
          Places geocoded with <strong>OpenStreetMap Nominatim</strong>
        </p>
        {searchError && <p className="map-search-error">{searchError}</p>}
      </div>

      <div className="map-wrap">
        {mapStatus === "loading" && <p className="map-loading">Loading map…</p>}
        {mapStatus === "error" && (
          <div className="map-loading map-loading--error">
            <p>{mapError ?? "Map unavailable"}</p>
            <button
              type="button"
              className="map-retry-btn"
              onClick={() => setMapKey((k) => k + 1)}
            >
              Retry map
            </button>
          </div>
        )}
        <div
          key={mapKey}
          ref={containerRef}
          className="leaflet-map-host"
          aria-label="Trip map"
        />
      </div>

      <div className="map-legend">
        {categories.map((c) => (
          <span key={c} className="legend-item">
            <span className="legend-dot" style={{ background: CATEGORY_COLORS[c] }} />
            {c}
          </span>
        ))}
        <span className="legend-item">
          <span className="legend-dot" style={{ background: SAVED_PIN_COLOR }} />
          saved
        </span>
      </div>

      {selected && (
        <div className="map-place-card">
          <button
            type="button"
            className="map-place-card-close"
            onClick={() => setSelected(null)}
            aria-label="Close"
          >
            <X size={16} />
          </button>
          <PlaceDetail
            selected={selected}
            onAskPedro={askPedro}
            pedroPrompt={pedroPrompt}
            onRemovePin={(id) => {
              removePin(id);
              setSelected(null);
            }}
          />
        </div>
      )}

      {loaded && pins.length > 0 && (
        <ul className="map-saved-list">
          {pins.map((pin) => {
            const km = haversineKm(ANTIGUA, pin);
            return (
              <li key={pin.id} className="map-saved-item">
                <button
                  type="button"
                  className="map-saved-item-btn"
                  onClick={() => setSelected({ kind: "pin", pin })}
                >
                  <strong>{pin.name}</strong>
                  <span className="map-saved-dist">{formatDistanceKm(km)} from Antigua</span>
                </button>
                <button
                  type="button"
                  className="map-saved-remove"
                  onClick={() => removePin(pin.id)}
                  aria-label={`Remove ${pin.name}`}
                >
                  <Trash2 size={14} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function PlaceDetail({
  selected,
  onAskPedro,
  pedroPrompt,
  onRemovePin,
}: {
  selected: Selected;
  onAskPedro: (msg: string) => void;
  pedroPrompt: (name: string) => string;
  onRemovePin: (id: string) => void;
}) {
  const place =
    selected.kind === "place"
      ? selected.place
      : {
          name: selected.pin.name,
          lat: selected.pin.lat,
          lng: selected.pin.lng,
          address: selected.pin.address,
          day: undefined,
          notes: selected.pin.notes,
        };

  const km = haversineKm(ANTIGUA, place);

  return (
    <>
      <h3 className="map-place-card-title">{place.name}</h3>
      {"day" in place && place.day != null && (
        <p className="map-place-card-meta">Day {place.day}</p>
      )}
      {place.notes && <p className="map-place-card-notes">{place.notes}</p>}
      <p className="map-distance">
        ≈ {formatDistanceKm(km)} from {ANTIGUA.name} (straight line)
      </p>
      <PlaceActions
        place={{ name: place.name, lat: place.lat, lng: place.lng, address: place.address }}
        compact
        onAskPedro={() => onAskPedro(pedroPrompt(place.name))}
      />
      {selected.kind === "pin" && (
        <button type="button" className="map-remove-btn" onClick={() => onRemovePin(selected.pin.id)}>
          Remove pin
        </button>
      )}
    </>
  );
}

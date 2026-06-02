import { useEffect, useMemo, useState } from "react";
import { Loader2, Radar, Trash2 } from "lucide-react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { EXCURSIONS } from "../data/excursions";
import { PLACES, type PlaceCategory } from "../data/trip";
import { haversineKm, formatDistanceKm } from "../../lib/geo/haversine";
import { useMapPins } from "../hooks/useMapPins";
import { useChatContext } from "../hooks/useChatContext";
import { useAiEnabled } from "../hooks/useAiEnabled";
import { useNavigation } from "../contexts/NavigationContext";
import { mapPlaceSearch } from "../services/mapSearch";
import { PlaceActions } from "./PlaceActions";

const ANTIGUA = { lat: 14.5586, lng: -90.7344, name: "Antigua" };

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
    className: "",
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

function FitBounds({ points }: { points: { lat: number; lng: number }[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 11 });
  }, [map, points]);
  return null;
}

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

function DistanceLine({
  from,
  place,
}: {
  from: { lat: number; lng: number; name: string };
  place: { name: string; lat: number; lng: number };
}) {
  const km = haversineKm(from, place);
  return (
    <p className="map-distance">
      ≈ {formatDistanceKm(km)} from {from.name} (straight line)
    </p>
  );
}

export function TripMap() {
  const { pins, loaded, addPin, removePin } = useMapPins();
  const { budget } = useChatContext();
  const { exa, enabled: aiEnabled } = useAiEnabled();
  const { askPedro } = useNavigation();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const allPoints = useMemo(
    () => [
      ...PLACES.map((p) => ({ lat: p.lat, lng: p.lng })),
      ...pins.map((p) => ({ lat: p.lat, lng: p.lng })),
    ],
    [pins],
  );

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

      if (!aiEnabled) {
        setSearchError("Pedro needs API keys for live map search. Try a name from the trip list.");
        return;
      }
      if (!budget.canUse) {
        setSearchError("Pedro's taking a breather. Clear site data to reset.");
        return;
      }

      const result = await mapPlaceSearch(q);
      if (result.costUsd != null || result.usage) {
        budget.recordUsage(
          result.usage ?? { input_tokens: 0, output_tokens: 0 },
          result.costUsd,
        );
      }

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

  const pedroPrompt = (name: string) =>
    `Tell me about ${name} and whether it's worth adding to my Guatemala trip.`;

  const categories = Object.keys(CATEGORY_COLORS) as PlaceCategory[];

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
        {exa && (
          <p className="map-powered-by">
            New places via <strong>Exa</strong> + OpenStreetMap geocoding
          </p>
        )}
        {searchError && <p className="map-search-error">{searchError}</p>}
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

      <div className="map-wrap">
        <MapContainer
          center={[14.62, -90.85]}
          zoom={9}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          <FitBounds points={allPoints} />
          {PLACES.map((place) => (
            <Marker
              key={place.id}
              position={[place.lat, place.lng]}
              icon={icons[place.category]}
            >
              <Popup>
                <MapPopupContent
                  place={place}
                  notes={place.notes}
                  onAskPedro={() => askPedro(pedroPrompt(place.name))}
                />
              </Popup>
            </Marker>
          ))}
          {pins.map((pin) => (
            <Marker key={pin.id} position={[pin.lat, pin.lng]} icon={savedIcon}>
              <Popup>
                <MapPopupContent
                  place={pin}
                  notes={pin.notes}
                  onAskPedro={() => askPedro(pedroPrompt(pin.name))}
                  onRemove={() => removePin(pin.id)}
                />
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {loaded && pins.length > 0 && (
        <ul className="map-saved-list">
          {pins.map((pin) => {
            const km = haversineKm(ANTIGUA, pin);
            return (
              <li key={pin.id} className="map-saved-item">
                <div>
                  <strong>{pin.name}</strong>
                  <span className="map-saved-dist">
                    {formatDistanceKm(km)} from Antigua
                  </span>
                </div>
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

function MapPopupContent({
  place,
  notes,
  onAskPedro,
  onRemove,
}: {
  place: { name: string; lat: number; lng: number; address?: string; day?: number };
  notes?: string;
  onAskPedro: () => void;
  onRemove?: () => void;
}) {
  return (
    <>
      <strong>{place.name}</strong>
      {"day" in place && place.day != null && (
        <>
          <br />
          Day {place.day}
        </>
      )}
      {notes && (
        <>
          <br />
          <span style={{ color: "#8c857c" }}>{notes}</span>
        </>
      )}
      <DistanceLine from={ANTIGUA} place={place} />
      <PlaceActions
        place={{ name: place.name, lat: place.lat, lng: place.lng, address: place.address }}
        compact
        onAskPedro={onAskPedro}
      />
      {onRemove && (
        <button type="button" className="map-remove-btn" onClick={onRemove}>
          Remove pin
        </button>
      )}
    </>
  );
}

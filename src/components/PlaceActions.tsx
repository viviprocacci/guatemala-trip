import { Car, Cloud, MapPin, MessageCircle, Navigation } from "lucide-react";
import type { GeoPlace } from "../utils/links";
import {
  appleMapsUrl,
  googleMapsDirectionsUrl,
  inDriveUrl,
  openExternal,
  openRideLink,
  uberUrl,
  weatherUrl,
} from "../utils/links";

interface PlaceActionsProps {
  place: GeoPlace;
  compact?: boolean;
  onAskPedro?: () => void;
}

export function PlaceActions({ place, compact, onAskPedro }: PlaceActionsProps) {
  const mapActions = [
    { label: "Weather", icon: Cloud, url: weatherUrl(place), external: true },
    { label: "Maps", icon: MapPin, url: appleMapsUrl(place), external: true },
    { label: "Directions", icon: Navigation, url: googleMapsDirectionsUrl(place), external: true },
  ];

  return (
    <div className={`place-actions ${compact ? "place-actions--compact" : ""}`}>
      {mapActions.map(({ label, icon: Icon, url }) => (
        <button
          key={label}
          type="button"
          className="action-link"
          onClick={() => openExternal(url)}
        >
          <Icon size={14} strokeWidth={1.5} />
          {label}
        </button>
      ))}
      <button
        type="button"
        className="action-link action-link--ride"
        onClick={() => openRideLink(uberUrl(place))}
      >
        <Car size={14} strokeWidth={1.5} />
        Uber
      </button>
      <button
        type="button"
        className="action-link action-link--ride"
        onClick={() => openRideLink(inDriveUrl(place))}
      >
        <Car size={14} strokeWidth={1.5} />
        InDrive
      </button>
      {onAskPedro && (
        <button type="button" className="action-link action-link--pedro" onClick={onAskPedro}>
          <MessageCircle size={14} strokeWidth={1.5} />
          Ask Pedro
        </button>
      )}
    </div>
  );
}

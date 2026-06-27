"use client";

import * as React from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from "react-leaflet";
import type { AnalyzedHome } from "@/lib/types";
import { RECOMMENDATION_STYLE } from "./ui";
import { usd, usdShort } from "@/lib/format";

interface Props {
  homes: AnalyzedHome[];
  onSelect: (id: string) => void;
}

const CHARLESTON_CENTER: [number, number] = [32.86, -79.95];

export function MapView({ homes, onSelect }: Props) {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-slate-200">
      <MapContainer center={CHARLESTON_CENTER} zoom={10} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {homes.map((h) => {
          const style = RECOMMENDATION_STYLE[h.score.recommendation];
          return (
            <CircleMarker
              key={h.listing.id}
              center={[h.listing.lat, h.listing.lng]}
              radius={7 + (h.score.overall - 50) / 8}
              pathOptions={{ color: "#ffffff", weight: 1.5, fillColor: style.hex, fillOpacity: 0.9 }}
              eventHandlers={{ click: () => onSelect(h.listing.id) }}
            >
              <Tooltip direction="top" offset={[0, -6]} opacity={1}>
                <span className="font-semibold">{h.listing.neighborhood}</span> · {usdShort(h.listing.price)} · score {h.score.overall}
              </Tooltip>
              <Popup>
                <div className="min-w-44 space-y-1">
                  <div className="font-semibold text-slate-800">{h.listing.address}</div>
                  <div className="text-xs text-slate-500">
                    {h.listing.neighborhood}, {h.listing.city}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold">{usd(h.listing.price)}</span>
                    <span className="text-slate-400">·</span>
                    <span>{usd(h.mortgage.totalMonthly)}/mo</span>
                  </div>
                  <div className="text-xs text-slate-600">
                    {h.listing.bedrooms}BR/{h.listing.bathrooms}BA · {h.listing.sqft.toLocaleString()} sqft · {h.listing.yearBuilt}
                  </div>
                  <div className="text-xs">
                    CHS {h.listing.commute.airportCHS}m · flood {h.listing.floodZone} · score {h.score.overall} ({h.score.recommendation})
                  </div>
                  <button
                    onClick={() => onSelect(h.listing.id)}
                    className="mt-1 w-full rounded bg-harbor-600 px-2 py-1 text-xs font-medium text-white hover:bg-harbor-700"
                  >
                    Full analysis
                  </button>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
      <div className="pointer-events-none absolute bottom-3 left-3 z-[400] rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-xs shadow">
        <div className="mb-1 font-semibold text-slate-600">Recommendation</div>
        <div className="flex flex-col gap-1">
          {(Object.keys(RECOMMENDATION_STYLE) as (keyof typeof RECOMMENDATION_STYLE)[]).map((rec) => (
            <div key={rec} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: RECOMMENDATION_STYLE[rec].hex }} />
              <span className="text-slate-600">{rec}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

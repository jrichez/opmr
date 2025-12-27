
"use client";

import { MapContainer, TileLayer, GeoJSON, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface LeafletMapInnerProps {
  geojson: any | null;
}

// centre approximatif de la France
const DEFAULT_CENTER: [number, number] = [46.7, 2.5];

export default function LeafletMapInner({ geojson }: LeafletMapInnerProps) {
  // Style choropleth turquoise en fonction du score_global (0→1)
  const styleFeature = (feature: any) => {
    const score = feature?.properties?.score_global ?? 0;
    const s = Math.max(0, Math.min(1, Number(score) || 0));

    // On part sur une teinte turquoise (hsl) et on joue sur la luminosité
    // Très faible => turquoise foncé ; Bon => turquoise clair
    const lightness = 35 + s * 40; // 35% (foncé) → 75% (clair)
    const fill = `hsl(174, 60%, ${lightness}%)`;

    return {
      color: "#0f766e",    // contour
      weight: 0.5,
      fillColor: fill,
      fillOpacity: 0.8,
    };
  };

  const onEachFeature = (feature: any, layer: any) => {
    const nom = feature?.properties?.nom ?? "Commune";
    const score = feature?.properties?.score_global;
    const scoreTxt =
      typeof score === "number" ? score.toFixed(2) : "N/A";

    layer.bindTooltip(`${nom} – Score : ${scoreTxt}`, {
      direction: "top",
      sticky: true,
      opacity: 0.9,
      className: "text-[11px]",
    });
  };

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={6}
      style={{ height: "100%", width: "100%" }}
      className="leaflet-container-custom"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="© OpenStreetMap contributors"
      />

      {geojson && geojson.features && geojson.features.length > 0 && (
        <GeoJSON
          key={geojson.features.length} // force un refresh quand le jeu change
          data={geojson}
          style={styleFeature}
          onEachFeature={onEachFeature}
        />
      )}
    </MapContainer>
  );
}

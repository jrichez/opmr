"use client";

import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import L from "leaflet";

interface LeafletMapInnerProps {
  geojson: any | null;
}

const DEFAULT_CENTER: [number, number] = [46.7, 2.5];

/** 🎨 Couleurs dégradées turquoise → jaune (score 0 → 20) */
function getColor(score: number | undefined) {
  if (score == null) return "#cccccc";
  if (score < 4)  return "#004D4F";
  if (score < 8)  return "#006B70";
  if (score < 12) return "#009F9E";
  if (score < 16) return "#7AC6B8";
  if (score < 18) return "#B7DA8B";
  if (score < 19) return "#E6D36A";
  return "#F4C842";
}

/* ────────────────────────────────────────────────
   🎚️  Légende GRADUÉE (dégradé vertical)
   ──────────────────────────────────────────────── */
function Legend() {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    // 🔥 Nettoyage au cas où l'ancienne légende serait encore dans le DOM
    document.querySelectorAll(".leaflet-legend").forEach(el => el.remove());

    const legend = L.control({ position: "bottomright" });

    legend.onAdd = () => {
      const div = L.DomUtil.create("div", "score-gradient-legend");

      div.innerHTML = `
  <div class="legend-title">Score</div>
  <div class="score-gradient-scale">
    <div class="legend-bar"></div>
    <div class="legend-labels">
      <span>20</span>
      <span>16</span>
      <span>12</span>
      <span>8</span>
      <span>4</span>
      <span>0</span>
    </div>
  </div>
`;

      return div;
    };

    legend.addTo(map);
    return () => legend.remove();
  }, [map]);

  return null;
}

export default function LeafletMapInner({ geojson }: LeafletMapInnerProps) {
  const styleFeature = (feature: any) => {
    const score = feature?.properties?.score_global ?? 0;
    return {
      color: "#ffffff",
      weight: 0.4,
      fillColor: getColor(score),
      fillOpacity: 0.55,
    };
  };

  const onEachFeature = (feature: any, layer: any) => {
    const nom = feature?.properties?.nom ?? "Commune";
    const score = feature?.properties?.score_global;
    layer.bindTooltip(`${nom} – Score : ${score}/20`, {
      direction: "top",
      sticky: true,
      opacity: 0.9,
      className: "text-[11px]",
    });
  };

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={7}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="© OpenStreetMap contributors"
      />

      {geojson?.features?.length > 0 && (
        <GeoJSON
          key={JSON.stringify(geojson.features.map(f => f.properties.score_global))}
          data={geojson}
          style={styleFeature}
          onEachFeature={onEachFeature}
        />
      )}

      <Legend />
    </MapContainer>
  );
}

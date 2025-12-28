"use client";

import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import L from "leaflet";

interface LeafletMapInnerProps {
  geojson: any | null;
}

const DEFAULT_CENTER: [number, number] = [46.7, 2.5];

/* 🎨 Palette 5 niveaux */
function getColor(score: number | undefined) {
  if (score == null) return "#cccccc";
  if (score < 4)  return "#004D4F";
  if (score < 8)  return "#006B70";
  if (score < 12) return "#009F9E";
  if (score < 16) return "#D4A350";
  return "#F1C15B";
}

/* 🏷️ Légende stabilisée (plus d'erreur appendChild) */
function Legend() {
  const map = useMap();

  useEffect(() => {
    if (!map || !map.getContainer()) return; // ⛔ sécurité absolue

    const legend = L.control({ position: "bottomright" });

    legend.onAdd = () => {
      const container = L.DomUtil.create("div", "leaflet-legend");
      const items = [
        { label: "Très faible", color: "#004D4F" },
        { label: "Faible",      color: "#006B70" },
        { label: "Moyen",       color: "#009F9E" },
        { label: "Bon",         color: "#D4A350" },
        { label: "Très bon",    color: "#F1C15B" },
      ];

      container.innerHTML = "<strong>Score / 20</strong><br>";
      items.forEach((i) => {
        container.innerHTML += `
          <div style="display:flex;align-items:center;margin:2px 0;">
            <span style="width:14px;height:14px;border-radius:3px;background:${i.color};margin-right:6px;"></span>
            ${i.label}
          </div>`;
      });

      return container;
    };

    legend.addTo(map);

    // Nettoyage quand le composant disparaît
    return () => {
      try {
        legend.remove();
      } catch (_) {}
    };
  }, [map]);

  return null;
}

export default function LeafletMapInner({ geojson }: LeafletMapInnerProps) {
  const styleFeature = (feature: any) => {
    const score = feature?.properties?.score_global ?? 0;

    return {
      color: "#ffffff",
      weight: 0.6,
      fillColor: getColor(score),
      fillOpacity: 0.78,
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
          key={geojson.features.length}
          data={geojson}
          style={styleFeature}
          onEachFeature={onEachFeature}
        />
      )}

      <Legend />
    </MapContainer>
  );
}

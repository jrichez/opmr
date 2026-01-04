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
  if (score < 4) return "#004D4F";
  if (score < 8) return "#006B70";
  if (score < 12) return "#009F9E";
  if (score < 16) return "#7AC6B8";
  if (score < 18) return "#B7DA8B";
  if (score < 19) return "#E6D36A";
  return "#F4C842";
}

/* ────────────────────────────────────────────────
   🎚️  Légende GRADUÉE
   ──────────────────────────────────────────────── */
function Legend() {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    document
      .querySelectorAll(".score-gradient-legend")
      .forEach((el) => el.remove());

    const legend = L.control({ position: "bottomright" });

    legend.onAdd = () => {
      const div = L.DomUtil.create("div", "score-gradient-legend");

      div.innerHTML = `
        <div class="legend-title">Score / 20</div>
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
      color: "#444444",
      weight: 0.4,
      fillColor: getColor(score),
      fillOpacity: 0.55,
    };
  };

  const onEachFeature = (feature: any, layer: any) => {
    const props = feature?.properties ?? {};

    const nom = props.nom ?? "Commune";
    const scoreGlobal = props.score_global ?? 0;

    const ensoleillement = props.ensoleillement_moyen_h
      ? Math.round(props.ensoleillement_moyen_h)
      : null;

    const scoreSante =
      props.score_sante != null
        ? Math.round(props.score_sante * 20)
        : null;

    const scoreAsso =
      props.asso_scaled != null
        ? Math.round(props.asso_scaled * 20)
        : null;

    const scoreMag =
      props.mag_scaled != null
        ? Math.round(props.mag_scaled * 20)
        : null;

    // Tooltip (hover)
    layer.bindTooltip(`${nom} – Score : ${scoreGlobal}/20`, {
      direction: "top",
      sticky: true,
      opacity: 0.9,
      className: "text-[11px]",
    });

    // Popup (click)
    layer.bindPopup(
      `
      <div style="min-width:220px;font-family:system-ui;">
        <h3 style="margin:0 0 8px 0;font-size:15px;font-weight:700;">
          ${nom}
        </h3>

        <div style="font-size:13px;line-height:1.5;">
          ${
            ensoleillement != null
              ? `<div>☀️ Ensoleillement : <strong>${ensoleillement} h/an</strong></div>`
              : ""
          }
          ${
            scoreSante != null
              ? `<div>🏥 Santé : <strong>${scoreSante}/20</strong></div>`
              : ""
          }
          ${
            scoreAsso != null
              ? `<div>🤝 Vie associative : <strong>${scoreAsso}/20</strong></div>`
              : ""
          }
          ${
            scoreMag != null
              ? `<div>🛒 Commerces : <strong>${scoreMag}/20</strong></div>`
              : ""
          }
        </div>

        <div style="margin-top:10px;text-align:center;">
          <button
            style="
              background:#009F9E;
              color:white;
              border:none;
              border-radius:999px;
              padding:6px 14px;
              font-size:12px;
              font-weight:600;
              cursor:pointer;
            "
          >
            Fiche complète
          </button>
        </div>
      </div>
      `,
      { closeButton: true }
    );
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
          key={JSON.stringify(
            geojson.features.map((f: any) => f.properties.score_global)
          )}
          data={geojson}
          style={styleFeature}
          onEachFeature={onEachFeature}
        />
      )}

      <Legend />
    </MapContainer>
  );
}

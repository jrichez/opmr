"use client";

import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";

interface Filters {
  littoral: boolean | null;
  montagne: boolean | null;
  densite: string | null;
}

const API_BASE = "http://localhost:8000";

export default function LeafletMapInner({ filters }: { filters: Filters | null }) {
  const [geojson, setGeojson] = useState<any | null>(null);

  // 🔎 Construit l'URL avec les filtres
  const buildQuery = (f: Filters | null) => {
    if (!f) return "";
    const p = new URLSearchParams();
    if (f.littoral !== null) p.append("littoral", f.littoral ? "1" : "0");
    if (f.montagne !== null) p.append("montagne", f.montagne ? "1" : "0");
    if (f.densite) p.append("densite", f.densite);
    return "?" + p.toString();
  };

  // 🚀 Fetch API après confirmation des filtres
  useEffect(() => {
    if (!filters) {
      setGeojson(null);
      return;
    }

    fetch(`${API_BASE}/communes/geojson${buildQuery(filters)}`)
      .then(r => r.json())
      .then(data => setGeojson(data))
      .catch(() => setGeojson(null));

  }, [filters]);

  return (
    <MapContainer
      center={[46.7, 2.5]}
      zoom={6}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="© OpenStreetMap contributors"
      />

      {geojson && (
        <GeoJSON
          key={Date.now()}
          data={geojson}
          style={{ color: "#1d4ed8", weight: 1 }}
        />
      )}
    </MapContainer>
  );
}

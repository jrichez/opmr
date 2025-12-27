"use client";

import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";

type Filters = {
  mer: boolean;
  montagne: boolean;
  densite: string | null;
  rayonKm: number | null;
  prixM2Max: number | null;
  sunPref: number | null; // heures/an
};

const API_BASE = "http://localhost:8000";

export default function LeafletMapInner({
  filters,
}: {
  filters: Filters | null;
}) {
  const [geojson, setGeojson] = useState<any | null>(null);

  const buildQuery = (f: Filters) => {
    const params = new URLSearchParams();

    if (f.mer) params.append("mer", "1");
    if (f.montagne) params.append("montagne", "1");
    if (f.densite) params.append("densite", f.densite);
    if (f.rayonKm !== null && !Number.isNaN(f.rayonKm)) {
      params.append("rayon_km", String(f.rayonKm));
    }
    if (f.prixM2Max !== null && !Number.isNaN(f.prixM2Max)) {
      params.append("prix_max", String(f.prixM2Max));
    }
    if (f.sunPref !== null && !Number.isNaN(f.sunPref)) {
      params.append("sun_pref", String(f.sunPref));
    }

    const qs = params.toString();
    return qs ? `?${qs}` : "";
  };

  useEffect(() => {
    if (!filters) {
      setGeojson(null);
      return;
    }

    const url = `${API_BASE}/communes/geojson${buildQuery(filters)}`;
    console.log("🌍 Fetch URL:", url);

    fetch(url)
      .then((res) => res.json())
      .then((data) => setGeojson(data))
      .catch((err) => {
        console.error("Erreur de fetch GeoJSON:", err);
        setGeojson(null);
      });
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
          style={() => ({
            color: "#0f766e", // turquoise
            weight: 1,
            fillOpacity: 0.6,
          })}
        />
      )}
    </MapContainer>
  );
}

"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";

// ⚠️ Import dynamique : Leaflet n'est chargé que côté client
const MapContainer = dynamic(
  async () => (await import("react-leaflet")).MapContainer,
  { ssr: false }
);
const TileLayer = dynamic(
  async () => (await import("react-leaflet")).TileLayer,
  { ssr: false }
);
const GeoJSON = dynamic(
  async () => (await import("react-leaflet")).GeoJSON,
  { ssr: false }
);

interface CommuneProps {
  geojsonUrl?: string;
}

export default function Map({
  geojsonUrl = "http://localhost:8000/communes/geojson",
}: CommuneProps) {
  const [data, setData] = useState<any | null>(null);

  useEffect(() => {
    fetch(geojsonUrl)
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((err) => console.error("❌ Erreur API:", err));
  }, [geojsonUrl]);

  return (
    <div className="w-full h-[90vh] p-2">
      <div className="w-full h-full rounded-xl overflow-hidden shadow-lg border border-gray-300">
        <MapContainer
          center={[46.6, 2.2]}
          zoom={6}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap"
            url="https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png"
          />

          {data && (
            <GeoJSON
              data={data}
              style={() => ({
                color: "#0ea5e9",
                weight: 0.5,
                fillColor: "#38bdf8",
                fillOpacity: 0.35,
              })}
            />
          )}
        </MapContainer>
      </div>
    </div>
  );
}

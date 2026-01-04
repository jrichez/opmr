"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const LeafletMapInner = dynamic(() => import("./LeafletMapInner"), {
  ssr: false,
});

export type EmplacementMode = "mer" | "montagne" | "lieu" | null;
export type Importance = 1 | 2 | 3;

export interface AppliedFilters {
  emplacement: EmplacementMode;
  rayonKm: number;
  densite: string | null;

  surfaceSouhaitee: number | null;
  budgetMax: number | null;

  wSante: Importance;
  wAsso: Importance;
  wMag: Importance;

  // Slider d’ensoleillement (0 = peu, 1 = beaucoup)
  sunPreference: number;

  // Lieu précis (optionnel)
  placeLat: number | null;
  placeLon: number | null;
}

interface LeafletMapProps {
  filters: AppliedFilters | null;
  onFeatureCountChange?: (count: number) => void;
}

export default function LeafletMap({
  filters,
  onFeatureCountChange,
}: LeafletMapProps) {
  const [geojson, setGeojson] = useState<any | null>(null);
  const [topThree, setTopThree] = useState<any[] | null>(null); // 🆕 ajout

  useEffect(() => {
    // Pas de filtres → carte vide
    if (!filters) {
      setGeojson(null);
      onFeatureCountChange?.(0);
      setTopThree(null);
      return;
    }

    const params = new URLSearchParams();

    // ─────────────────────────────────────────────
    // 🌍 Emplacement : mer / montagne / lieu précis
    // ─────────────────────────────────────────────
    if (filters.emplacement === "mer") {
      params.set("littoral", "1");
      params.set("rayon_km", String(filters.rayonKm));
    } else if (filters.emplacement === "montagne") {
      params.set("montagne", "1");
      params.set("rayon_km", String(filters.rayonKm));
    } else if (
      filters.emplacement === "lieu" &&
      filters.placeLat != null &&
      filters.placeLon != null
    ) {
      params.set("lat", String(filters.placeLat));
      params.set("lon", String(filters.placeLon));
      params.set("rayon_km", String(filters.rayonKm));
    }

    // ─────────────────────────────────────────────
    // 🏘️ Densité
    // ─────────────────────────────────────────────
    if (filters.densite) {
      const key = filters.densite
        .toLowerCase()
        .replace(" ", "_")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      params.set("densite", key);
    }

    // ─────────────────────────────────────────────
    // 💶 Immobilier
    // ─────────────────────────────────────────────
    if (filters.surfaceSouhaitee && filters.budgetMax) {
      const prixM2Max = filters.budgetMax / filters.surfaceSouhaitee;
      params.set("prix_max", String(Math.round(prixM2Max)));
    }

    // ─────────────────────────────────────────────
    // 📊 Pondérations
    // ─────────────────────────────────────────────
    params.set("w_sante", String(filters.wSante));
    params.set("w_asso", String(filters.wAsso));
    params.set("w_mag", String(filters.wMag));
    params.set("w_sun", "3");
    params.set("sun_preference", String(filters.sunPreference ?? 0.5));

    // ─────────────────────────────────────────────
    // 🔗 Appel API
    // ─────────────────────────────────────────────
    const baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
    const url = `${baseUrl}/communes/geojson?${params.toString()}`;

    (async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) {
          console.error("Erreur API /communes/geojson", await res.text());
          setGeojson(null);
          setTopThree(null);
          onFeatureCountChange?.(0);
          return;
        }

        const data = await res.json();
        setGeojson(data);
        onFeatureCountChange?.(data.features?.length ?? 0);

        // 🏆 TOP 3 — tri + extraction des 3 meilleures
        if (data?.features && data.features.length > 0) {
          const sorted = [...data.features].sort(
            (a, b) =>
              (b.properties.score_global ?? 0) -
              (a.properties.score_global ?? 0)
          );
          setTopThree(sorted.slice(0, 3));
        } else {
          setTopThree(null);
        }

      } catch (err) {
        console.error("Erreur réseau /communes/geojson", err);
        setGeojson(null);
        setTopThree(null);
        onFeatureCountChange?.(0);
      }
    })();
  }, [filters, onFeatureCountChange]);

  return (
    <div className="relative w-full h-full">
      <LeafletMapInner
      geojson={geojson}
      placeLat={filters?.placeLat}
      placeLon={filters?.placeLon}
    />


{/* ─────────────────────────────────────────────
    Encart Top 3 communes
    ───────────────────────────────────────────── */}


      {topThree && topThree.length > 0 && (
      <div
        style={{
          position: "absolute",
          top: "55px",                // ✔ Position sous le compteur
          right: "80px",               // ✔ Aligné à gauche du bouton zoom
          background: "white",
          padding: "10px 14px",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          fontSize: "0.85rem",
          zIndex: 500,
          minWidth: "220px",
        }}
      >
        <strong>🏆 Top 3 des communes</strong>
        <ol style={{ marginTop: "6px", paddingLeft: "18px" }}>
          {topThree.map((c, i) => (
            <li key={i} style={{ marginBottom: "4px" }}>
              {i + 1}️⃣ {c.properties.nom} ({c.properties.code_departement}) —{" "}
              {c.properties.score_global.toFixed(1)}/20
            </li>
          ))}
        </ol>

      </div>
    )}

    </div>
  );
}

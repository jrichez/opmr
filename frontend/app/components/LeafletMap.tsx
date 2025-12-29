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

  useEffect(() => {
    // Pas de filtres → carte vide (seulement le fond)
    if (!filters) {
      setGeojson(null);
      onFeatureCountChange?.(0);
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
    // backend attend : village / bourg / ville / grande_ville
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
    // 💶 Immobilier → déduction du prix max / m² si les 2 champs sont remplis
    // ─────────────────────────────────────────────
    if (filters.surfaceSouhaitee && filters.budgetMax) {
      const prixM2Max = filters.budgetMax / filters.surfaceSouhaitee;
      params.set("prix_max", String(Math.round(prixM2Max)));
    }

    // ─────────────────────────────────────────────
    // 📊 Pondérations score
    // ─────────────────────────────────────────────
    params.set("w_sante", String(filters.wSante));
    params.set("w_asso", String(filters.wAsso));
    params.set("w_mag", String(filters.wMag));

    // Soleil : poids fixe côté backend (3) mais on envoie la préférence
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
          onFeatureCountChange?.(0);
          return;
        }
        const data = await res.json();
        setGeojson(data);
        onFeatureCountChange?.(data.features?.length ?? 0);
      } catch (err) {
        console.error("Erreur réseau /communes/geojson", err);
        setGeojson(null);
        onFeatureCountChange?.(0);
      }
    })();
  }, [filters, onFeatureCountChange]);

  return <LeafletMapInner geojson={geojson} />;
}

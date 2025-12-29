"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const LeafletMapInner = dynamic(() => import("./LeafletMapInner"), {
  ssr: false,
});

export type EmplacementMode = "mer" | "montagne" | "lieu" | null;

export interface AppliedFilters {
  emplacement: EmplacementMode;
  rayonKm: number;
  densite: string | null;

  surfaceSouhaitee: number | null;
  budgetMax: number | null;

  wSante: 1 | 2 | 3;
  wAsso: 1 | 2 | 3;
  wMag: 1 | 2 | 3;

  // 🌞 Slider (0 → faible / 0.5 → moyen / 1 → beaucoup)
  sunPreference: number;

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
    if (!filters) {
      setGeojson(null);
      onFeatureCountChange?.(0);
      return;
    }

    const params = new URLSearchParams();

    /** 🌊 Emplacement */
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

    /** 🏘️ Densité */
    if (filters.densite) {
      const key = filters.densite
        .toLowerCase()
        .replace(" ", "_")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      params.set("densite", key);
    }

    /** 💶 Immobilier */
    if (filters.surfaceSouhaitee && filters.budgetMax) {
      const prixM2Max = filters.budgetMax / filters.surfaceSouhaitee;
      params.set("prix_max", String(Math.round(prixM2Max)));
    }

    /** 🎯 Pondérations */
    params.set("w_sante", String(filters.wSante));
    params.set("w_asso", String(filters.wAsso));
    params.set("w_mag", String(filters.wMag));
    params.set("w_sun", "3"); // poids fixe

    /** 🌞 🔥 Ajout CRUCIAL : préférence d'ensoleillement */
    params.set("sun_preference", String(filters.sunPreference ?? 0.5));

    /** 🌐 API */
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

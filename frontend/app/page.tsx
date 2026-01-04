"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import LeafletMap, { AppliedFilters, EmplacementMode } from "./components/LeafletMap";

const MAP_DEFAULT_RAYON_KM = 20;

type Importance = 1 | 2 | 3;

interface PlaceSuggestion {
  label: string;       // ex: "Lille"
  postcode: string | null; // ex: "59000"
  lat: number;
  lon: number;
}

const DynamicLeafletMap = dynamic(() => import("./components/LeafletMap"), {
  ssr: false,
});

export default function HomePage() {
  const [showFilters, setShowFilters] = useState(true);

  // Filtres en cours d’édition
  const [emplacement, setEmplacement] = useState<EmplacementMode>(null);
  const [rayonKm, setRayonKm] = useState<number>(MAP_DEFAULT_RAYON_KM);
  const [densite, setDensite] = useState<string | null>(null);

  const [surfaceSouhaitee, setSurfaceSouhaitee] = useState<string>("");
  const [budgetMax, setBudgetMax] = useState<string>("");

  // Slider soleil : 0 = peu de soleil, 1 = beaucoup (pour l’instant on ne l’envoie qu’en état)
  const [sunPreference, setSunPreference] = useState<number>(1);

  // Pondérations (x1/x2/x3)
  const [wSante, setWSante] = useState<Importance>(2);
  const [wAsso, setWAsso] = useState<Importance>(1);
  const [wMag, setWMag] = useState<Importance>(1);

  // Lieu précis (via API adresse.data.gouv.fr)
  const [placeQuery, setPlaceQuery] = useState("");
  const [placeSuggestions, setPlaceSuggestions] = useState<PlaceSuggestion[]>([]);
  const [placeLat, setPlaceLat] = useState<number | null>(null);
  const [placeLon, setPlaceLon] = useState<number | null>(null);
  const [isSearchingPlace, setIsSearchingPlace] = useState(false);

  // Filtres vraiment appliqués à la carte
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters | null>(
    null
  );

  // Compteur de communes
  const [featureCount, setFeatureCount] = useState<number>(0);

  // =========================================================
  // 🔍 Autocomplétion "Lieu précis" (API adresse.data.gouv.fr)
  // =========================================================
  useEffect(() => {
    if (!placeQuery || emplacement !== "lieu") {
      setPlaceSuggestions([]);
      return;
    }

    const controller = new AbortController();

    async function fetchSuggestions() {
      try {
        setIsSearchingPlace(true);

        // ✅ Filtre communes uniquement
        const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(
          placeQuery
        )}&type=municipality&limit=5`;

        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) {
          setPlaceSuggestions([]);
          return;
        }

        const data = await res.json();

        // ✅ On stocke city + postcode (pas besoin INSEE)
        const suggestions: PlaceSuggestion[] =
          data.features?.map((f: any) => ({
            label: (f.properties?.city as string) ?? (f.properties?.label as string) ?? "",
            postcode: (f.properties?.postcode as string) ?? null,
            lon: f.geometry.coordinates[0] as number,
            lat: f.geometry.coordinates[1] as number,
          })) ?? [];

        setPlaceSuggestions(suggestions);
      } catch (e) {
        if ((e as any).name !== "AbortError") {
          console.error("Erreur API adresse.data.gouv.fr", e);
        }
      } finally {
        setIsSearchingPlace(false);
      }
    }

    const timer = setTimeout(fetchSuggestions, 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [placeQuery, emplacement]);

  const selectPlaceSuggestion = (s: PlaceSuggestion) => {
    // ✅ Remplit le champ avec "Ville (CP)" + ferme immédiatement la liste
    const display = s.postcode ? `${s.label} (${s.postcode})` : s.label;
    setPlaceQuery(display);
    setPlaceSuggestions([]);
    setPlaceLat(s.lat);
    setPlaceLon(s.lon);
  };

  // =========================================================
  // ✅ Application des filtres
  // =========================================================

  const applyFilters = useCallback(() => {
    // Surface / budget : si l’un des deux manque → aucun filtre immobilier
    const surfNum = surfaceSouhaitee ? Number(surfaceSouhaitee) : null;
    const budgetNum = budgetMax ? Number(budgetMax) : null;

    const filters: AppliedFilters = {
      emplacement,
      rayonKm,
      densite,
      surfaceSouhaitee: surfNum && surfNum > 0 ? surfNum : null,
      budgetMax: budgetNum && budgetNum > 0 ? budgetNum : null,
      wSante,
      wAsso,
      wMag,
      sunPreference,
      placeLat,
      placeLon,
    };

    setAppliedFilters(filters);
  }, [
    emplacement,
    rayonKm,
    densite,
    surfaceSouhaitee,
    budgetMax,
    wSante,
    wAsso,
    wMag,
    sunPreference,
    placeLat,
    placeLon,
  ]);

  // Reset localisation quand on change d’emplacement
  const handleEmplacementChange = (mode: EmplacementMode) => {
    setEmplacement(mode);
    if (mode !== "lieu") {
      setPlaceQuery("");
      setPlaceSuggestions([]);
      setPlaceLat(null);
      setPlaceLon(null);
    }
  };

  const importanceButtonClass = (
    current: Importance,
    value: Importance
  ): string =>
    [
      "px-3 py-1 rounded-full border text-xs font-medium transition-colors",
      current === value
        ? "bg-[#009F9E] text-white border-[#009F9E]"
        : "bg-white text-slate-700 border-slate-300 hover:bg-[rgba(0,159,158,0.1)]",
    ].join(" ");

  const densiteButtonClass = (value: string): string =>
    [
      "flex-1 text-center py-2 rounded-md border text-sm font-medium",
      densite === value
        ? "bg-[#009F9E] text-white border-[#009F9E]"
        : "bg-white text-slate-700 border-slate-300 hover:bg-[rgba(0,159,158,0.1)]",
    ].join(" ");

  const emplacementButtonClass = (value: EmplacementMode): string =>
    [
      "flex-1 text-center py-2 rounded-md border text-sm font-semibold",
      emplacement === value
        ? "bg-[#009F9E] text-white border-[#009F9E]"
        : "bg-white text-slate-700 border-slate-300 hover:bg-[rgba(0,159,158,0.1)]",
    ].join(" ");

  // ---------------------------------------------------------
  // Rendu
  // ---------------------------------------------------------

  return (
    <div className="flex flex-col h-screen">
      {/* Header simple */}
      <header className="h-14 flex items-center justify-between px-4 bg-white shadow-md z-20">
        <div className="flex items-center gap-2 text-emerald-700 font-semibold">
          <span className="text-lg">🏡</span>
          <span>Où passer ma retraite ?</span>
        </div>
        <div className="text-xs text-slate-500 italic">
          Prototype – carte interactive
        </div>
      </header>

      {/* Carte + overlays */}
      <main className="relative flex-1">
        {/* Bouton montrer / masquer les filtres */}
        <button
          className="filters-toggle bg-white shadow-md rounded-full px-3 py-1 text-xs border border-slate-200 hover:bg-slate-50"
          onClick={() => setShowFilters((prev) => !prev)}
        >
          {showFilters ? "Masquer les filtres" : "Afficher les filtres"}
        </button>

        {/* Compteur de communes (en haut à droite, sous le zoom) */}
        <div className="feature-counter bg-white shadow-md rounded-md px-3 py-1 text-xs text-slate-700 border border-slate-200">
          {appliedFilters
            ? `Nombre de communes filtrées : ${featureCount}`
            : "Aucun filtre appliqué"}
        </div>

        {/* Panel de filtres */}
        {showFilters && (
          <div className="filters-panel">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200 px-4 py-4 space-y-4">
              {/* Emplacement */}
              <section>
                <h2 className="font-semibold text-slate-900 mb-2 text-center">
                  Emplacement
                </h2>
                <div className="flex gap-2 mb-2">
                  <button
                    className={emplacementButtonClass("mer")}
                    onClick={() =>
                      handleEmplacementChange(emplacement === "mer" ? null : "mer")
                    }
                  >
                    Mer
                  </button>
                  <button
                    className={emplacementButtonClass("montagne")}
                    onClick={() =>
                      handleEmplacementChange(
                        emplacement === "montagne" ? null : "montagne"
                      )
                    }
                  >
                    Montagne
                  </button>
                </div>

                {/* Lieu précis */}
                <div className="mb-3 relative">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Lieu précis (ville, adresse…)
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Rechercher un lieu"
                    value={placeQuery}
                    onChange={(e) => {
                      setPlaceQuery(e.target.value);
                      handleEmplacementChange("lieu");
                    }}
                    // ✅ ferme la liste quand on sort du champ (après un bref délai)
                    onBlur={() => {
                      window.setTimeout(() => setPlaceSuggestions([]), 120);
                    }}
                  />

                  {isSearchingPlace && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
                      …
                    </div>
                  )}

                  {placeSuggestions.length > 0 && (
                    <div className="autocomplete-list">
                      {placeSuggestions.map((s) => (
                        <div
                          key={`${s.lat}-${s.lon}-${s.label}-${s.postcode ?? ""}`}
                          className="autocomplete-item"
                          // ✅ onMouseDown évite le “double clic” (le blur arrive après)
                          onMouseDown={() => selectPlaceSuggestion(s)}
                        >
                          {s.label}
                          {s.postcode ? ` (${s.postcode})` : ""}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Rayon km */}
                <div className="mt-2">
                  <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                    <span>Rayon (km)</span>
                    <span>{rayonKm} km</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={100}
                    value={rayonKm}
                    onChange={(e) => setRayonKm(Number(e.target.value))}
                    className="w-full accent-[#F2CA47]"
                  />
                </div>
              </section>

              {/* Densité */}
              <section>
                <h2 className="font-semibold text-slate-900 mb-2 text-center">
                  Densité
                </h2>
                <div className="grid grid-cols-2 gap-2">
                  {["Village", "Bourg", "Ville", "Grande Ville"].map((label) => (
                    <button
                      key={label}
                      className={densiteButtonClass(label)}
                      onClick={() => setDensite((prev) => (prev === label ? null : label))}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </section>

              {/* --- IMMOBILIER --- */}
              <h2 className="font-semibold text-slate-900 mb-2 text-center">
                Immobilier
              </h2>

              <div className="flex flex-row gap-4 justify-center items-center">
                {/* Surface souhaitée */}
                <div className="flex flex-col items-center">
                  <label className="text-sm font-medium mb-1 text-center">
                    Surface souhaitée (m²)
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="w-36 rounded-lg px-3 py-2 text-sm text-center bg-white border border-slate-200 focus:border-teal-500 focus:ring-teal-500 focus:ring-1 outline-none"
                    placeholder="ex: 100"
                    value={surfaceSouhaitee}
                    onChange={(e) => setSurfaceSouhaitee(e.target.value)}
                  />
                </div>

                {/* Budget max */}
                <div className="flex flex-col items-center">
                  <label className="text-sm font-medium mb-1 text-center">
                    Budget max (€)
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="w-36 rounded-lg px-3 py-2 text-sm text-center bg-white border border-slate-200 focus:border-teal-500 focus:ring-teal-500 focus:ring-1 outline-none"
                    placeholder="ex: 200 000"
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(e.target.value)}
                  />
                </div>
              </div>

              {/* Ensoleillement */}
              <section>
                <h2 className="font-semibold text-slate-900 mb-2 text-center">
                  Ensoleillement
                </h2>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Min</span>
                  <span>Max</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={sunPreference * 100}
                  onChange={(e) => setSunPreference(Number(e.target.value) / 100)}
                  className="w-full mt-1 accent-[#F2CA47]"
                />
              </section>

              {/* Pondérations Santé / Asso / Magasins */}
              <section className="space-y-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900 mb-1 text-center">
                    Présence de médecins / hôpitaux
                  </h2>
                  <div className="flex gap-2">
                    <button
                      className={importanceButtonClass(wSante, 1)}
                      onClick={() => setWSante(1)}
                    >
                      Peu important
                    </button>
                    <button
                      className={importanceButtonClass(wSante, 2)}
                      onClick={() => setWSante(2)}
                    >
                      Important
                    </button>
                    <button
                      className={importanceButtonClass(wSante, 3)}
                      onClick={() => setWSante(3)}
                    >
                      Très important
                    </button>
                  </div>
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-slate-900 mb-1 text-center">
                    Vie associative
                  </h2>
                  <div className="flex gap-2">
                    <button
                      className={importanceButtonClass(wAsso, 1)}
                      onClick={() => setWAsso(1)}
                    >
                      Peu important
                    </button>
                    <button
                      className={importanceButtonClass(wAsso, 2)}
                      onClick={() => setWAsso(2)}
                    >
                      Important
                    </button>
                    <button
                      className={importanceButtonClass(wAsso, 3)}
                      onClick={() => setWAsso(3)}
                    >
                      Très important
                    </button>
                  </div>
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-slate-900 mb-1 text-center">
                    Nombre de Magasins
                  </h2>
                  <div className="flex gap-2">
                    <button
                      className={importanceButtonClass(wMag, 1)}
                      onClick={() => setWMag(1)}
                    >
                      Peu important
                    </button>
                    <button
                      className={importanceButtonClass(wMag, 2)}
                      onClick={() => setWMag(2)}
                    >
                      Important
                    </button>
                    <button
                      className={importanceButtonClass(wMag, 3)}
                      onClick={() => setWMag(3)}
                    >
                      Très important
                    </button>
                  </div>
                </div>
              </section>

              {/* Bouton appliquer */}
              <button
                onClick={applyFilters}
                className="w-full mt-2 bg-[#009F9E] hover:bg-[#007f7d] text-white font-semibold py-2.5 rounded-xl shadow-md transition-colors"
              >
                Mettre à jour la carte
              </button>
            </div>
          </div>
        )}

        {/* Carte Leaflet */}
        <DynamicLeafletMap filters={appliedFilters} onFeatureCountChange={setFeatureCount} />
      </main>
    </div>
  );
}

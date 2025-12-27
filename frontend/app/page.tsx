"use client";

import { useState, useCallback } from "react";
import LeafletMap from "./components/LeafletMap";

type FiltersPayload = {
  mer: boolean;
  montagne: boolean;
  densite: string | null;
  rayonKm: number | null;
  prixM2Max: number | null;
  sunPref: number | null;
};

const SUN_MIN = 1710; // valeurs approchées d'après ta base
const SUN_MAX = 2914;

const DENSITY_LABELS = ["Village", "Bourg", "Ville", "Grande Ville"];

export default function HomePage() {
  const [panelOpen, setPanelOpen] = useState<boolean>(true);

  // Emplacement
  const [locationMer, setLocationMer] = useState(false);
  const [locationMontagne, setLocationMontagne] = useState(false);
  const [rayonKm, setRayonKm] = useState<number>(20);

  // Densité
  const [densite, setDensite] = useState<string | null>(null);

  // Immobilier
  const [surface, setSurface] = useState<string>("");
  const [budget, setBudget] = useState<string>("");

  // Ensoleillement (heures/an)
  const [sunPref, setSunPref] = useState<number>((SUN_MIN + SUN_MAX) / 2);

  // Filtres réellement envoyés à la carte / API
  const [confirmedFilters, setConfirmedFilters] = useState<FiltersPayload | null>(
    null
  );

  const applyFilters = useCallback(() => {
    let prixM2Max: number | null = null;

    const s = parseFloat(surface.replace(",", "."));
    const b = parseFloat(budget.replace(",", "."));

    // On applique le filtre prix SEULEMENT si surface ET budget sont valides
    if (!Number.isNaN(s) && s > 0 && !Number.isNaN(b) && b > 0) {
      prixM2Max = b / s;
    }

    const payload: FiltersPayload = {
      mer: locationMer,
      montagne: locationMontagne,
      densite,
      rayonKm: rayonKm || null,
      prixM2Max,
      sunPref,
    };

    console.log("🎯 Filtres appliqués :", payload);
    setConfirmedFilters(payload);
  }, [locationMer, locationMontagne, densite, rayonKm, surface, budget, sunPref]);

  const toggleDensite = (value: string) => {
    setDensite((prev) => (prev === value ? null : value));
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="h-14 px-6 flex items-center justify-between border-b bg-white">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-teal-500" />
          <span className="font-semibold text-lg text-slate-800">
            Où passer ma retraite ?
          </span>
        </div>
        <nav className="flex gap-4 text-sm text-slate-500">
          <span className="cursor-pointer hover:text-slate-800">Carte</span>
          <span className="cursor-pointer hover:text-slate-800">Méthodologie</span>
          <span className="cursor-pointer hover:text-slate-800">À propos</span>
        </nav>
      </header>

      {/* Carte + overlay filtres */}
      <div className="relative flex-1">
        <LeafletMap filters={confirmedFilters} />

        {/* Bouton toggle panel */}
        <button
          onClick={() => setPanelOpen((p) => !p)}
          className="absolute top-4 left-4 z-[1000] bg-white/90 border rounded-full px-3 py-1 text-xs shadow-sm hover:bg-white"
        >
          {panelOpen ? "Masquer les filtres" : "Afficher les filtres"}
        </button>

        {/* Panel filtres */}
        {panelOpen && (
          <div className="absolute top-12 left-4 z-[900] w-80 max-w-full bg-white/95 backdrop-blur-sm shadow-lg rounded-xl border p-4 flex flex-col gap-4">
            {/* Emplacement */}
            <section>
              <h2 className="font-semibold text-sm mb-2 text-slate-800">
                Emplacement
              </h2>
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setLocationMer((v) => !v)}
                  className={`flex-1 px-2 py-1 rounded-md text-xs font-medium ${
                    locationMer
                      ? "bg-teal-600 text-white"
                      : "bg-teal-50 text-teal-800 border border-teal-200"
                  }`}
                >
                  Mer
                </button>
                <button
                  onClick={() => setLocationMontagne((v) => !v)}
                  className={`flex-1 px-2 py-1 rounded-md text-xs font-medium ${
                    locationMontagne
                      ? "bg-emerald-600 text-white"
                      : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  }`}
                >
                  Montagne
                </button>
              </div>

              {/* Slider rayon */}
              <label className="flex flex-col gap-1 text-xs text-slate-700">
                Rayon (km)
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={rayonKm}
                    onChange={(e) =>
                      setRayonKm(parseInt(e.target.value, 10) || 0)
                    }
                    className="flex-1"
                  />
                  <span className="w-10 text-right text-[11px]">
                    {rayonKm} km
                  </span>
                </div>
              </label>
            </section>

            {/* Densité */}
            <section>
              <h2 className="font-semibold text-sm mb-2 text-slate-800">
                Densité
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {DENSITY_LABELS.map((label) => (
                  <button
                    key={label}
                    onClick={() => toggleDensite(label)}
                    className={`px-2 py-1 rounded-md text-xs ${
                      densite === label
                        ? "bg-slate-800 text-white"
                        : "bg-slate-50 text-slate-800 border border-slate-200"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </section>

            {/* Immobilier */}
            <section>
              <h2 className="font-semibold text-sm mb-2 text-slate-800">
                Immobilier
              </h2>
              <div className="flex flex-col gap-2 text-xs">
                <label className="flex flex-col gap-1">
                  Surface souhaitée (m²)
                  <input
                    type="number"
                    min={0}
                    value={surface}
                    onChange={(e) => setSurface(e.target.value)}
                    className="border rounded-md px-2 py-1 text-xs"
                    placeholder="ex : 80"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  Budget max (€)
                  <input
                    type="number"
                    min={0}
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="border rounded-md px-2 py-1 text-xs"
                    placeholder="ex : 250000"
                  />
                </label>
              </div>
            </section>

            {/* Ensoleillement */}
            <section>
              <h2 className="font-semibold text-sm mb-2 text-slate-800">
                Ensoleillement souhaité
              </h2>
              <div className="flex flex-col gap-1 text-xs">
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>{Math.round(SUN_MIN)} h/an</span>
                  <span>{Math.round(SUN_MAX)} h/an</span>
                </div>
                <input
                  type="range"
                  min={SUN_MIN}
                  max={SUN_MAX}
                  value={sunPref}
                  onChange={(e) =>
                    setSunPref(parseInt(e.target.value, 10) || SUN_MIN)
                  }
                />
                <div className="text-right text-[11px] text-slate-600">
                  ~ {Math.round(sunPref)} h/an
                </div>
              </div>
            </section>

            <button
              onClick={applyFilters}
              className="mt-2 w-full bg-teal-600 text-white text-sm font-semibold py-2 rounded-lg hover:bg-teal-700 transition"
            >
              Appliquer les filtres
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

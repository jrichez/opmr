"use client";

import { useState, useCallback } from "react";
import LeafletMap from "./components/LeafletMap";

interface Filters {
  littoral: boolean | null;
  montagne: boolean | null;
  densite: string | null;
}

export default function HomePage() {
  const [filters, setFilters] = useState<Filters>({
    littoral: null,
    montagne: null,
    densite: null,
  });

  // filtres réellement envoyés à l’API
  const [confirmedFilters, setConfirmedFilters] = useState<Filters | null>(null);

  const applyFilters = useCallback(() => {
    console.log("🎯 Filtres appliqués :", filters);
    setConfirmedFilters({ ...filters });
  }, [filters]);

  const toggleBool = (key: "littoral" | "montagne") => {
    setFilters((prev) => ({
      ...prev,
      [key]: prev[key] === true ? null : !prev[key],
    }));
  };

  const selectDensite = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      densite: prev.densite === value ? null : value,
    }));
  };

  const DENSITY_LABELS = ["Village", "Bourg", "Ville", "Grande Ville"];

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-72 bg-gray-50 border-r p-4 flex flex-col gap-4">
        <h2 className="font-bold text-lg mb-2">Filtres</h2>

        <button
          onClick={() => toggleBool("littoral")}
          className={`p-2 rounded ${
            filters.littoral ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-700"
          }`}
        >
          Littoral
        </button>

        <button
          onClick={() => toggleBool("montagne")}
          className={`p-2 rounded ${
            filters.montagne ? "bg-green-600 text-white" : "bg-green-100 text-green-700"
          }`}
        >
          Montagne
        </button>

        <div className="mt-2 font-semibold text-sm">Densité</div>
        {DENSITY_LABELS.map((label) => (
          <button
            key={label}
            onClick={() => selectDensite(label)}
            className={`p-2 rounded text-sm mb-1 ${
              filters.densite === label
                ? "bg-yellow-600 text-white"
                : "bg-yellow-100 text-yellow-700"
            }`}
          >
            {label}
          </button>
        ))}

        <button
          onClick={applyFilters}
          className="mt-4 p-3 bg-blue-600 text-white font-semibold rounded"
        >
          Afficher les communes filtrées
        </button>

        {/* 🔵 Badges des filtres appliqués (dans la sidebar) */}
        {confirmedFilters && (
          <div className="mt-4 flex flex-wrap gap-2">
            {confirmedFilters.littoral !== null && (
              <span className="px-2 py-1 bg-blue-200 text-blue-800 rounded text-xs">
                Littoral
              </span>
            )}
            {confirmedFilters.montagne !== null && (
              <span className="px-2 py-1 bg-green-200 text-green-800 rounded text-xs">
                Montagne
              </span>
            )}
            {confirmedFilters.densite && (
              <span className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded text-xs">
                {confirmedFilters.densite}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Carte */}
      <div className="flex-1">
        <LeafletMap filters={confirmedFilters} />
      </div>
    </div>
  );
}

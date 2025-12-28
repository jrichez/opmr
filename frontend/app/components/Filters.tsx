"use client";

import { useState } from "react";

interface FiltersProps {
  onApply: (filters: string) => void;
}

export default function Filters({ onApply }: FiltersProps) {
  const [littoral, setLittoral] = useState("");
  const [montagne, setMontagne] = useState("");
  const [densite, setDensite] = useState("");

  function applyFilters() {
    const params = new URLSearchParams();

    if (littoral) params.set("littoral", littoral);
    if (montagne) params.set("montagne", montagne);
    if (densite) params.set("densite", densite);

    onApply(params.toString());
  }

  return (
    <div className="filters-panel bg-white rounded-xl shadow-xl p-4 w-80 space-y-4">
      <button
        className="filters-toggle bg-teal-600 text-white px-3 py-1 rounded-full text-xs shadow"
        onClick={applyFilters}
      >
        Masquer les filtres
      </button>

      <h2 className="text-center text-lg font-bold">Emplacement</h2>

      <select value={littoral} onChange={(e) => setLittoral(e.target.value)} className="w-full border p-2 rounded">
        <option value="">Mer (désactivé)</option>
        <option value="1">Proche mer</option>
      </select>

      <select value={montagne} onChange={(e) => setMontagne(e.target.value)} className="w-full border p-2 rounded">
        <option value="">Montagne (désactivé)</option>
        <option value="1">Proche montagne</option>
      </select>

      <h2 className="text-center text-lg font-bold">Densité</h2>
      <select value={densite} onChange={(e) => setDensite(e.target.value)} className="w-full border p-2 rounded">
        <option value="">Toutes</option>
        <option value="village">Village</option>
        <option value="bourg">Bourg</option>
        <option value="ville">Ville</option>
        <option value="grande_ville">Grande Ville</option>
      </select>

      <button
        className="w-full bg-teal-600 text-white p-2 rounded-md font-semibold"
        onClick={applyFilters}
      >
        Appliquer les filtres
      </button>
    </div>
  );
}

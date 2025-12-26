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

    if (littoral !== "") params.set("littoral", littoral);
    if (montagne !== "") params.set("montagne", montagne);
    if (densite !== "") params.set("densite", densite);

    onApply(params.toString()); // jamais undefined
  }

  return (
    <div className="p-4 w-64 space-y-3 bg-white shadow-lg z-10">
      <h2 className="font-bold text-lg">Filtres</h2>

      <select className="w-full border p-2" value={littoral} onChange={(e) => setLittoral(e.target.value)}>
        <option value="">Mer (off)</option>
        <option value="1">Littoral</option>
      </select>

      <select className="w-full border p-2" value={montagne} onChange={(e) => setMontagne(e.target.value)}>
        <option value="">Proche Montagne</option>
        <option value="1">Montagne</option>
      </select>

      <select className="w-full border p-2" value={densite} onChange={(e) => setDensite(e.target.value)}>
        <option value="">Toutes densités</option>
        <option value="Bourg">Bourg</option>
        <option value="Village">Village</option>
        <option value="Ville">Ville</option>
        <option value="Grande Ville">Grande Ville</option>
      </select>

      <button
        className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        onClick={applyFilters}
      >
        Appliquer
      </button>
    </div>
  );
}

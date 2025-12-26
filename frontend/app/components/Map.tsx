"use client";

import dynamic from "next/dynamic";

const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false, // ⬅️ très important pour éviter "window is not defined"
});

interface Filters {
  littoral?: number;
  montagne?: number;
  densite?: string;
}

interface MapProps {
  filters: Filters;
}

export default function Map({ filters }: MapProps) {
  return <LeafletMap filters={filters} />;
}

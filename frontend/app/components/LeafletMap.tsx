"use client";

import dynamic from "next/dynamic";

// Chargement dynamique pour éviter "window is not defined" côté serveur
const LeafletMap = dynamic(() => import("./LeafletMapInner"), {
  ssr: false,
});

export default LeafletMap;

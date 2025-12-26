"use client";
import dynamic from "next/dynamic";

// Chargement dynamique du composant Leaflet côté client uniquement
const LeafletMap = dynamic(() => import("./LeafletMapInner"), {
  ssr: false, // ❗ évite l'erreur "window is not defined"
});

export default LeafletMap;

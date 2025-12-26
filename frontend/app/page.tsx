import Map from "./components/Map";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-semibold mb-4 text-blue-600">
        🗺️ Où passer ma retraite ?
      </h1>
      <Map />
    </main>
  );
}

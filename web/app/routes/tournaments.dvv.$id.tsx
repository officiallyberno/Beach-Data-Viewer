// app/routes/tournaments/$id.tsx (Remix Beispiel)

import { useLoaderData, useParams } from "@remix-run/react";
import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useState } from "react";
import { Tournament } from "~/routes/types";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const id = params.id;

  const res = await fetch(`http://localhost:8000/tournaments/${id}`);
  const tournament: Tournament = await res.json();

  if (!tournament) {
    throw new Response("Not Found", { status: 404 });
  }
  return json({ tournament });
}

const tabs = [
  { key: "details", label: "Details" },
  { key: "meldeliste", label: "Meldeliste" },
  { key: "zulassung", label: "Zulassung" },
  { key: "setzliste", label: "Setzliste" },
  { key: "spiele", label: "Spiele" },
  { key: "platzierungen", label: "Platzierungen" },
];
export default function TournamentDetail() {
  const { tournament } = useLoaderData<{ tournament: Tournament }>();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("details");
  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">{tournament.ort}</h1>

      {/* Tabs-Navigation */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 rounded-lg transition
              ${
                activeTab === t.key
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Inhalt je nach Tab */}
      <div className="mt-4">
        {activeTab === "details" && (
          <section>
            <h2 className="text-xl font-semibold mb-2">Details</h2>

            <p>
              Datum: {tournament.start_datum} – {tournament.end_datum}
            </p>
            <p>Kategorie: {tournament.kategorie}</p>
            <p>Veranstalter: {tournament.veranstalter}</p>
            <p>Geschlecht: {tournament.geschlecht}</p>
            <p>ID: {tournament.id}</p>
          </section>
        )}

        {activeTab === "meldeliste" && (
          <section>
            <h2 className="text-xl font-semibold mb-2">Meldeliste</h2>
            <p>Hier kommt die Liste der Teams …</p>
          </section>
        )}

        {activeTab === "zulassung" && (
          <section>
            <h2 className="text-xl font-semibold mb-2">Zulassung</h2>
            <p>Zulassungskriterien …</p>
          </section>
        )}

        {activeTab === "setzliste" && (
          <section>
            <h2 className="text-xl font-semibold mb-2">Setzliste</h2>
            <p>Die gesetzten Teams …</p>
          </section>
        )}

        {activeTab === "spiele" && (
          <section>
            <h2 className="text-xl font-semibold mb-2">Spiele</h2>
            <p>Spielplan, Ergebnisse …</p>
          </section>
        )}

        {activeTab === "platzierungen" && (
          <section>
            <h2 className="text-xl font-semibold mb-2">Platzierungen</h2>
            <p>Endergebnisse …</p>
          </section>
        )}
      </div>
    </div>
  );
}

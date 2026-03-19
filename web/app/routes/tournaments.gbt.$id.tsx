import { json, LoaderFunctionArgs } from "@remix-run/node";
import { TournamentVVB } from "./types";
import { useState } from "react";
import { useLoaderData } from "@remix-run/react";
import { div } from "framer-motion/client";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const id = params.id;

  const res = await fetch(`http://localhost:8000/landesverband/${id}`);
  const tournament: TournamentVVB = await res.json();

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
  const { tournament } = useLoaderData<{ tournament: TournamentVVB }>();
  const [activeTab, setActiveTab] = useState("details");

  return (
    <div className="max-w-5xl mx-auto p-6">
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
      {/* DetailSeiten */}
      <div className="mt-4">
        {activeTab === "details" && (
          <section>
            <h2 className="text-xl font-semibold mb-2">Details</h2>

            <p>
              Datum: {tournament.datum_von} – {tournament.datum_bis}
            </p>
            <p>Kategorie: {tournament.kategorie}</p>
            <p>Veranstalter: {tournament.ausrichter}</p>
            <p>Geschlecht: {tournament.gender}</p>
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

// app/routes/tournaments/$id.tsx (Remix Beispiel)

import { Link, useLoaderData, useParams } from "@remix-run/react";
import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useState } from "react";
import { ArrowBigLeft } from "lucide-react";
import { formatDate } from "~/utils/date";
import TeamList from "~/components/teamList";
import { Team, TournamentVVB } from "./types";

export async function loader({ params }: LoaderFunctionArgs) {
  const id = params.id;

  const res = await fetch(`http://localhost:8000/vvb/${id}`);
  const tournament: TournamentVVB = await res.json();

  const res2 = await fetch(`http://localhost:8000/vvb/${id}/teams`);
  const teams: Team = await res2.json();

  if (!teams) {
    throw new Response("Not Found", { status: 404 });
  }
  return json({ teams, tournament });
}

const tabs = [
  { key: "details", label: "Details" },
  { key: "meldeliste", label: "Meldeliste" },
  { key: "zulassung", label: "Zulassung" },
  { key: "setzliste", label: "Setzliste" },
  { key: "spiele", label: "Spiele" },
  { key: "platzierungen", label: "Platzierungen" },
];

type LoaderData = {
  teams: Team[];
  tournament: TournamentVVB;
};
export default function TournamentDetail() {
  const { teams, tournament } = useLoaderData<LoaderData>();
  const [activeTab, setActiveTab] = useState("details");
  const details = [
    { label: "Kategorie", value: tournament.kategorie },
    { label: "Ort", value: tournament.ort },
    { label: "Veranstalter", value: tournament.ausrichter },
    { label: "Geschlecht", value: tournament.gender },
    { label: "Altersklasse", value: tournament.altersklasse },
    {
      label: "Anzahl Teams Hauptfeld",
      value: tournament.anzahl_teams_hauptfeld,
    },
    {
      label: "Gemeldete Mannschaften",
      value: tournament.gemeldete_mannschaften,
    },
    {
      label: "Anzahl Teams Qualifikation",
      value: tournament.anzahl_teams_qualifikation,
    },
    {
      label: "Anzahl Spielfelder Hauptfeld",
      value: tournament.anzahl_spielfelder_hauptfeld,
    },
    { label: "Turniermodus", value: tournament.turniermodus },
    {
      label: "Zulassungstermin",
      value: formatDate(tournament.zulassungstermin),
    },
    { label: "Meldeschluss", value: formatDate(tournament.meldeschluss) },
    { label: "Starttermin", value: formatDate(tournament.starttermin) },
    { label: "Start Hauptfeld", value: formatDate(tournament.start_hauptfeld) },
    {
      label: "Technical Meeting",
      value: formatDate(tournament.termin_technical_meeting),
    },
    { label: "Startgeld", value: tournament.startgeld },
    { label: "Kaution", value: tournament.kaution },
    { label: "Preisgeld", value: tournament.preisgeld },
    { label: "Turnierhierarchie", value: tournament.turnierhierarchie },
    { label: "Zulassungsreihenfolge", value: tournament.zulassungsreihenfolge },
    { label: "Verpflegungshinweise", value: tournament.verpflegungshinweise },
    {
      label: "Öffentliche Informationen",
      value: tournament.oeffentliche_informationen,
    },
    { label: "Anmerkungen", value: tournament.anmerkungen },
    { label: "Kontakt", value: tournament.kontakt },
    { label: "Links", value: tournament.links },
  ];

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">{tournament.name}</h1>

      {/* Tabs-Navigation */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Link
          to="/tournaments/vvb"
          className="px-4 py-2 rounded-lg transition bg-gray-100 text-gray-700 hover:bg-gray-200"
        >
          <ArrowBigLeft />
        </Link>
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
          <section className="bg-gray-800/60 border border-gray-700 rounded-2xl p-6 shadow-md mb-16">
            <h2 className="text-2xl font-semibold text-gray-100 mb-6 border-b border-gray-700 pb-2">
              Turnierdetails
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4 text-gray-200">
              {details
                .filter((d) => d.value && d.value !== "null" && d.value !== "")
                .map((d) => (
                  <div
                    key={d.label}
                    className="flex justify-between border-b border-gray-700/40 pb-1"
                  >
                    <span className="text-gray-400">{d.label}:</span>
                    <span className="font-medium text-gray-100 text-right">
                      {d.value}
                    </span>
                  </div>
                ))}
            </div>

            <div className="mt-6 flex justify-between items-center">
              <a
                href={tournament.anmeldung_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors duration-150"
              >
                Zur Turnierseite
              </a>
              <span className="text-gray-500 text-sm">ID: {tournament.id}</span>
            </div>
          </section>
        )}

        {activeTab === "meldeliste" && (
          <TeamList
            teams={teams}
            title="Angemeldete Teams"
            activeTab={activeTab}
            displayKey="anmeldedatum"
          />
        )}

        {activeTab === "zulassung" && (
          <TeamList
            teams={teams}
            title="Zulassung"
            activeTab={activeTab}
            displayKey="punkte_zulassung"
          />
        )}

        {activeTab === "setzliste" && (
          <TeamList
            teams={teams}
            title="Setzliste"
            activeTab={activeTab}
            displayKey="punkte_setzung"
          />
        )}

        {activeTab === "spiele" && (
          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-2">Spiele</h2>
            <p>Spielplan, Ergebnisse …[tobeContinued]</p>
          </section>
        )}

        {activeTab === "platzierungen" && (
          <TeamList
            teams={teams}
            title="Platzierungen"
            activeTab={activeTab}
            displayKey="punkte_pro_spieler"
          />
        )}
      </div>
    </div>
  );
}

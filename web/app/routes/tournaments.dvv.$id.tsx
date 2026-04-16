// app/routes/tournaments/$id.tsx (Remix Beispiel)

import { Link, useLoaderData, useParams } from "@remix-run/react";
import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useState } from "react";
import { TournamentVVB } from "~/routes/types";
import { ArrowBigLeft } from "lucide-react";
import { formatDate } from "~/utils/date";

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
  // { key: "meldeliste", label: "Meldeliste" },
  // { key: "zulassung", label: "Zulassung" },
  // { key: "setzliste", label: "Setzliste" },
  // { key: "spiele", label: "Spiele" },
  // { key: "platzierungen", label: "Platzierungen" },
];
export default function TournamentDetail() {
  const { tournament } = useLoaderData<{ tournament: TournamentVVB }>();
  const [activeTab, setActiveTab] = useState("details");
  return (
    <div className="max-w-5xl mx-auto p-6">
      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            to="/tournaments/dvv"
            className="text-white hover:bg-gray-700 rounded-md p-1"
          >
            <ArrowBigLeft />
          </Link>

          <h1 className="text-2xl sm:text-3xl font-bold">{tournament.ort}</h1>

          <Link
            to={`https://beach.volleyball-verband.de/public/tur-show.php?id=${tournament.external_id}`}
            target="_blank"
            className="underline text-sm sm:text-base"
          >
            {tournament.external_id} ➚
          </Link>
        </div>

        <div className="text-gray-400 sm:ml-10">
          {tournament.datum_von === tournament.datum_bis
            ? formatDate(tournament.datum_von)
            : `${formatDate(tournament.datum_von)} - ${formatDate(
                tournament.datum_bis,
              )}`}
        </div>
      </div>

      {/* Tabs-Navigation */}
      <div className="flex flex-wrap gap-2 my-6">
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
            <p>Kategorie: {tournament.kategorie}</p>
            <p>Verband: {tournament.ausrichter}</p>
            <p>Geschlecht: {tournament.gender}</p>
            <Link
              target="_blank"
              to={`https://beach.volleyball-verband.de/public/tur-show.php?id=${tournament.external_id}`}
            >
              Turnierdetails
            </Link>
          </section>
        )}
        {/* 
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
        )} */}
      </div>
    </div>
  );
}

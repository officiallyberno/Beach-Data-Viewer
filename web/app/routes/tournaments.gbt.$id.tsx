import { json, LoaderFunctionArgs } from "@remix-run/node";
import { Team, TournamentVVB } from "./types";
import { useState } from "react";
import { useLoaderData } from "@remix-run/react";
import { div } from "framer-motion/client";
import TeamList from "~/components/teamList";
import { formatDate } from "~/utils/date";
import { tur_name } from "~/utils/tur_details";
import { ExternalLink } from "lucide-react";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const id = params.id;

  const res = await fetch(`http://localhost:8000/dvv/${id}`);
  const tournament: TournamentVVB = await res.json();
  const res1 = await fetch(`http://localhost:8000/dvv/${id}/teams`);
  const teams: TournamentVVB = await res1.json();

  if (!tournament) {
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

export default function TournamentDetail() {
  const { teams, tournament } = useLoaderData<{
    teams: Team[];
    tournament: TournamentVVB;
  }>();
  const [activeTab, setActiveTab] = useState("details");

  //Sortierung für Zulassung
  const teams_hf = teams.filter((team) => team.status == "Hauptfeld");
  const teams_q = teams.filter((team) => team.status == "Qualifikation");
  const teams_an = teams.filter((team) => team.status == "Absage/Nachrücker");

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
            <p>
              {formatDate(tournament.datum_von)} –{" "}
              {formatDate(tournament.datum_bis)}
            </p>
            <p>{tur_name(tournament.kategorie)}</p>
            <p>{tur_name(tournament.ort)}</p>
            <p className="mb-3">{tournament.gender}</p>
            <a
              href={`https://beach.volleyball-verband.de/public/tur-show.php?id=${tournament.external_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm"
            >
              weitere Infos: <ExternalLink size={13} />
            </a>
          </section>
        )}

        {activeTab === "meldeliste" && (
          <section>
            <TeamList
              teams={teams}
              title="Angemeldete Teams"
              activeTab={activeTab}
              displayKey="anmeldedatum"
              origin="dvv"
            />
          </section>
        )}

        {activeTab === "zulassung" && (
          <section>
            <TeamList
              teams={teams_hf}
              title="Hauptfeld"
              activeTab={activeTab}
              displayKey="punkte_zulassung"
              origin="dvv"
            />
            <TeamList
              teams={teams_q}
              title="Qualifikation"
              activeTab={activeTab}
              displayKey="punkte_zulassung"
              origin="dvv"
            />
            <TeamList
              teams={teams_an}
              title="Absage/Nachrücker"
              activeTab={activeTab}
              displayKey="punkte_zulassung"
              origin="dvv"
            />
          </section>
        )}

        {activeTab === "setzliste" && (
          <section>
            <TeamList
              teams={teams_hf}
              title="Setzliste"
              activeTab={activeTab}
              displayKey="punkte_setzung"
              origin="dvv"
            />
          </section>
        )}

        {activeTab === "spiele" && (
          <section>
            <h2 className="text-2xl font-bold mb-4 text-center">
              Achtelfinale Winner
            </h2>
            <h2 className="text-2xl font-bold mb-4 text-center">
              Achtelfinale Loser
            </h2>
            <h2 className="text-2xl font-bold mb-4 text-center">
              Viertelfinale Winner
            </h2>
            <h2 className="text-2xl font-bold mb-4 text-center">
              Viertelfinale Loser
            </h2>
            <h2 className="text-2xl font-bold mb-4 text-center">Halbfinale</h2>
            <h2 className="text-2xl font-bold mb-4 text-center">Finale</h2>
          </section>
        )}

        {activeTab === "platzierungen" && (
          <section>
            <TeamList
              teams={teams}
              title="Platzierungen"
              activeTab={activeTab}
              displayKey="punkte_pro_spieler"
              origin="dvv"
            />
          </section>
        )}
      </div>
    </div>
  );
}

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

const tabsOverview = [
  { key: "details", label: "Details" },
  { key: "meldeliste", label: "Meldeliste" },
  { key: "zulassung", label: "Zulassung" },
];
const tabsHf = [
  { key: "setzlisteHF", label: "Setzliste", published: true },
  { key: "spieleHF", label: "Spiele", published: true },
  { key: "platzierungenHF", label: "Platzierungen", published: true },
];
const tabsQ = [
  { key: "setzlisteQ", label: "Setzliste", published: true },
  { key: "spieleQ", label: "Spiele", published: true },
  { key: "platzierungenQ", label: "Platzierungen", published: true },
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
  const teams_setzung = teams.filter(
    (team) => team.setzung_reihenfolge != null,
  );

  // ToDo: Published verwenden, um Setzliste etc. erst zum gegebenen Zeitpunkt anzuzeigen
  // const now = new Date();
  // const ende = new Date(tournament.datum_von);

  // const isTourFinal = now >= ende;

  // const published = {
  //   spiele: isTourFinal,
  //   platzierungen: isTourFinal,
  // };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex flex-wrap gap-x-8 gap-y-4">
        {/* Allgemeine Informationen */}
        <div className="flex-1 min-w-[220px]">
          <p className="text-sm font-bold text-white mb-1">
            Allgemeine Informationen
          </p>

          <div className="flex flex-wrap gap-2">
            {tabsOverview.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-3 py-1.5 text-sm transition-colors ${
                  activeTab === t.key
                    ? "text-white font-medium border-b-2 border-white"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Qualifikation */}
        <div className="flex-1 min-w-[220px]">
          <p className="text-sm font-bold text-white mb-1">Qualifikation</p>

          <div className="flex flex-wrap gap-2">
            {tabsQ.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-3 py-1.5 text-sm transition-colors ${
                  activeTab === t.key
                    ? "text-white font-medium border-b-2 border-white"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Hauptfeld */}
        <div className="flex-1 min-w-[220px]">
          <p className="text-sm font-bold text-white mb-1">Hauptfeld</p>

          <div className="flex flex-wrap gap-2">
            {tabsHf.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-3 py-1.5 text-sm transition-colors ${
                  activeTab === t.key
                    ? "text-white font-medium border-b-2 border-white"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
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

        {activeTab === "setzlisteQ" && (
          <section>
            <TeamList
              teams={teams_setzung}
              title="Setzliste"
              activeTab={activeTab}
              displayKey="punkte_setzung"
              origin="dvv"
            />
          </section>
        )}

        {activeTab === "spieleQ" && (
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

        {activeTab === "platzierungenQ" && (
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
        {activeTab === "setzlisteHF" && (
          <section>
            <TeamList
              teams={teams_setzung}
              title="Setzliste"
              activeTab={activeTab}
              displayKey="punkte_setzung"
              origin="dvv"
            />
          </section>
        )}

        {activeTab === "spieleHF" && (
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

        {activeTab === "platzierungenHF" && (
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

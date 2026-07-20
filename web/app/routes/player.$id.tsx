import { json, LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import {
  ArrowBigLeft,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import { useMemo, useState } from "react";
import { formatDate } from "~/utils/date";
import { tur_name, tur_partner } from "~/utils/tur_details";

// ---------------------------------------------------------------------------
// Typen
// ---------------------------------------------------------------------------

export type PlayerRankingsHistory = {
  id: number;
  player_id: number;
  year: string;
  date: string;
  points: string;
  association: string;
  rank: number;
};

export type PlayerResultsHistory = {
  id: number;
  player_id: number;
  turnier_id: string;
  date: string;
  partner: string; // war fälschlicherweise number
  tournament_name: string;
  location: string; // war fälschlicherweise number
  rank: string;
  points: string;
  association: string;
};

export type PlayerInfos = {
  id: number;
  external_id: number;
  first_name: string;
  last_name: string;
  club: string | null;
  license_number: string | null;
  gender: string;
};

// ---------------------------------------------------------------------------
// Loader  — zwei parallele Calls statt drei sequenzieller
// ---------------------------------------------------------------------------

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id;
  const base = process.env.API_URL ?? "http://localhost:8000";

  const [profileRes, resultsRes] = await Promise.all([
    fetch(`${base}/players/${id}/profile`),
    fetch(`${base}/players/${id}/results`),
  ]);

  if (!profileRes.ok)
    throw new Response(await profileRes.text(), { status: profileRes.status });
  if (!resultsRes.ok)
    throw new Response(await resultsRes.text(), { status: resultsRes.status });

  const profile: PlayerInfos & { rankings: PlayerRankingsHistory[] } =
    await profileRes.json();
  const results: PlayerResultsHistory[] = await resultsRes.json();

  return json({ profile, results });
};

// ---------------------------------------------------------------------------
// Hilfsfunktion
// ---------------------------------------------------------------------------

function parsePoints(p: string): number {
  const n = parseFloat(p?.replace(",", ".") ?? "0");
  return isNaN(n) ? 0 : n;
}

// ---------------------------------------------------------------------------
// Komponente
// ---------------------------------------------------------------------------

export default function PlayerSite() {
  const { profile, results } = useLoaderData<typeof loader>();
  const { rankings, ...infos } = profile;

  const years = useMemo(() => {
    const fromRankings = rankings.map((r) => Number(r.year));
    const fromResults = results.map((r) => new Date(r.date).getFullYear());
    return [...new Set([...fromRankings, ...fromResults])].sort(
      (a, b) => b - a,
    );
  }, [rankings, results]);

  const [selectedYear, setSelectedYear] = useState<number>(
    years[0] ?? new Date().getFullYear(),
  );
  const [showLegend, setShowLegend] = useState(false);

  const rankingsForYear = useMemo(
    () =>
      rankings
        .filter((r) => Number(r.year) === selectedYear)
        .sort((a, b) => a.rank - b.rank),
    [rankings, selectedYear],
  );

  const resultsForYear = useMemo(
    () =>
      results
        .filter((r) => new Date(r.date).getFullYear() === selectedYear)
        .sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        ),
    [results, selectedYear],
  );

  const totalPoints = useMemo(
    () => resultsForYear.reduce((sum, r) => sum + parsePoints(r.points), 0),
    [resultsForYear],
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 mb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 flex-wrap mb-1">
            <Link
              to="/ranking_dvv"
              className="text-gray-400 hover:text-white hover:bg-gray-700 rounded-md p-1 transition"
              aria-label="Zurück zur Rangliste"
            >
              <ArrowBigLeft size={20} />
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold">
              {infos.first_name} {infos.last_name}
            </h1>
            <a
              href={`https://beach.volleyball-verband.de/public/spieler.php?id=${infos.external_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm"
            >
              DVV-Profil <ExternalLink size={13} />
            </a>
          </div>
          <div className="flex items-center gap-3 ml-9 text-gray-400 text-sm">
            {infos.club && <span>{infos.club}</span>}
            {infos.gender && (
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  infos.gender === "Männer" || infos.gender === "männlich"
                    ? "bg-blue-500/20 text-blue-300"
                    : "bg-pink-500/20 text-pink-300"
                }`}
              >
                {infos.gender}
              </span>
            )}
          </div>
        </div>

        {/* Saison-Auswahl */}
        <div className="flex items-center gap-2 ml-9 sm:ml-0">
          <label
            htmlFor="year-select"
            className="font-semibold text-sm text-gray-400"
          >
            Saison
          </label>
          <select
            id="year-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="border border-gray-700 rounded-lg bg-gray-800 px-3 py-1.5 text-sm"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Rangliste */}
      <section className="mb-10">
        <h2 className="font-bold text-xl mb-3">Rangliste</h2>
        {rankingsForYear.length > 0 ? (
          <table className="w-full text-sm border-separate border-spacing-0">
            <thead>
              <tr className="text-gray-400 text-left">
                <th className="p-2 border-y border-l rounded-tl-lg">Datum</th>
                <th className="p-2 border-y">Wertung</th>
                <th className="p-2 border-y">Punkte</th>
                <th className="p-2 border-y border-r rounded-tr-lg">Platz</th>
              </tr>
            </thead>
            <tbody>
              {rankingsForYear.map((r) => (
                <tr key={r.id} className="hover:bg-gray-700/50 transition">
                  <td className="p-2 text-gray-300">{formatDate(r.date)}</td>
                  <td className="p-2 text-gray-300">{r.association}</td>
                  <td className="p-2 font-semibold">{r.points}</td>
                  <td className="p-2 font-semibold text-blue-400">{r.rank}.</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500 italic text-sm">
            Keine Ranglisteneinträge für {selectedYear}.
          </p>
        )}
      </section>

      {/* Ergebnisse */}
      <section className="mb-12">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-bold text-xl">Ergebnisse</h2>
          {resultsForYear.length > 0 && (
            <span className="text-sm text-gray-400">
              {resultsForYear.length} Turniere ·{" "}
              {totalPoints.toLocaleString("de-DE")} Pkte. gesamt
            </span>
          )}
        </div>

        {resultsForYear.length > 0 ? (
          <>
            {/* Desktop */}
            <table className="hidden sm:table w-full text-sm border-separate border-spacing-0">
              <thead>
                <tr className="text-gray-400 text-left">
                  <th className="p-2 border-y border-l rounded-tl-lg">Datum</th>
                  <th className="p-2 border-y">Turnier</th>
                  <th className="p-2 border-y">Ort</th>
                  <th className="p-2 border-y">Partner</th>
                  <th className="p-2 border-y text-center">Platz</th>
                  <th className="p-2 border-y border-r rounded-tr-lg text-right">
                    Punkte
                  </th>
                </tr>
              </thead>
              <tbody>
                {resultsForYear.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() =>
                      window.open(
                        `https://beach.volleyball-verband.de/public/tur-er.php?id=${r.turnier_id}`,
                        "_blank",
                      )
                    }
                    className="cursor-pointer hover:bg-gray-700/50 transition"
                  >
                    <td className="p-2 text-gray-400">{formatDate(r.date)}</td>
                    <td className="p-2 font-medium">
                      {tur_name(r.tournament_name)}
                    </td>
                    <td className="p-2 text-gray-300">{r.location}</td>
                    <td className="p-2 text-gray-300">
                      {tur_partner(r.partner, infos.last_name)}
                    </td>
                    <td className="p-2 text-center font-semibold">{r.rank}</td>
                    <td className="p-2 text-right">
                      <span className="font-semibold">{r.points}</span>
                      <span className="ml-1 text-xs text-gray-400">
                        {r.association}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile Cards */}
            <div className="sm:hidden space-y-2">
              {resultsForYear.map((r) => (
                <div
                  key={r.id}
                  onClick={() =>
                    window.open(
                      `https://beach.volleyball-verband.de/public/tur-er.php?id=${r.turnier_id}`,
                      "_blank",
                    )
                  }
                  className="p-3 rounded-xl bg-gray-800 cursor-pointer active:bg-gray-700 transition"
                >
                  <div className="flex justify-between items-start">
                    <span className="font-semibold">
                      {tur_name(r.tournament_name)}
                    </span>
                    <span className="text-sm font-bold text-blue-400">
                      Platz {r.rank}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400 mt-0.5">
                    {formatDate(r.date)} · {r.location}
                  </div>
                  <div className="flex justify-between mt-2 text-sm">
                    <span className="text-gray-300">
                      {tur_partner(r.partner, infos.last_name)}
                    </span>
                    <span>
                      <span className="font-semibold">{r.points}</span>{" "}
                      <span className="text-gray-400 text-xs">
                        {r.association}
                      </span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-gray-500 italic text-sm">
            Keine Ergebnisse für {selectedYear}.
          </p>
        )}
      </section>

      {/* Legende */}
      <section>
        <button
          onClick={() => setShowLegend((v) => !v)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition rounded mb-2"
        >
          <span>Legende</span>
          {showLegend ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showLegend && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm text-gray-300 p-4 bg-gray-800/60 rounded-xl">
            <div>
              <div className="font-semibold text-white mb-1">International</div>
              <div>Olympische Spiele</div>
              <div>WM · EM</div>
            </div>
            <div>
              <div className="font-semibold text-white mb-1">
                Beach Pro Tour
              </div>
              <div>Elite-16</div>
              <div>Challenge · Future</div>
            </div>
            <div>
              <div className="font-semibold text-white mb-1">National</div>
              <div>DM · GBT</div>
            </div>
            <div>
              <div className="font-semibold text-white mb-1">Regional</div>
              <div>Premium · A+ · A</div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

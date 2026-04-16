import { json, LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { div } from "framer-motion/client";
import { ArrowBigLeft, ChevronDown, ChevronUp } from "lucide-react";
import { useMemo, useState } from "react";
import { formatDate } from "~/utils/date";
import { tur_name, tur_partner } from "~/utils/tur_details";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id;

  const res = await fetch(`http://localhost:8000/players/${id}/rankings`);
  const res1 = await fetch(`http://localhost:8000/players/${id}`);
  const res2 = await fetch(`http://localhost:8000/players/${id}/results`);

  if (!res.ok) {
    const txt = await res.text();
    throw new Response(txt, { status: res.status });
  }
  if (!res1.ok) {
    const txt = await res1.text();
    throw new Response(txt, { status: res1.status });
  }
  if (!res2.ok) {
    const txt = await res2.text();
    throw new Response(txt, { status: res2.status });
  }

  const ranks: PlayerRankingsHistory[] = await res.json();
  const infos: PlayerInfos = await res1.json();
  const results: PlayerResultsHistory[] = await res2.json();

  return json({ ranks, infos, results });
};

export type PlayerRankingsHistory = {
  player_id: number;
  year: string;
  date: string;
  points: string;
  association: string;
  id: number;
  rank: number;
};
export type PlayerResultsHistory = {
  date: string;
  id: number;
  tournament_name: string;
  rank: string;
  association: string;
  turnier_id: number;
  player_id: number;
  partner: number;
  location: number;
  points: number;
};
export type PlayerInfos = {
  external_id: number;
  first_name: string;
  club: string;
  id: string;
  last_name: string;
  licence_number: number;
};

export default function PlayerSite() {
  const { ranks, infos, results } = useLoaderData<typeof loader>();
  let counter = 0;
  const rankingsByYear = useMemo(() => {
    return ranks.reduce<Record<string, PlayerRankingsHistory[]>>(
      (acc, rank) => {
        if (!acc[rank.year]) {
          acc[rank.year] = [];
        }
        acc[rank.year].push(rank);
        return acc;
      },
      {},
    );
  }, [ranks]);

  const getYearFromDate = (date: string) => new Date(date).getFullYear();
  const years = Object.keys(rankingsByYear)
    .map(Number)
    .sort((a, b) => b - a);
  const [selectedYear, setSelectedYear] = useState<number>(years[0]);

  const resultsByYear = useMemo(() => {
    return results.reduce<Record<number, PlayerResultsHistory[]>>(
      (acc, result) => {
        const year = getYearFromDate(result.date);

        acc[year] ??= [];
        acc[year].push(result);
        return acc;
      },
      {},
    );
  }, [results]);
  const resultsForYear = resultsByYear[selectedYear] ?? [];
  const hasResults = resultsForYear.length > 0;

  const [showLegend, setShowLegend] = useState(false);

  return (
    <div className="p-6 mb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        {/* Spielerinfos */}
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <Link
              to="/ranking_dvv"
              className="text-white hover:bg-gray-700 rounded-md p-1"
            >
              <ArrowBigLeft />
            </Link>

            <h1 className="text-2xl sm:text-3xl font-bold">
              {infos.first_name} {infos.last_name}
            </h1>

            <Link
              to={`https://beach.volleyball-verband.de/public/spieler.php?id=${infos.external_id}`}
              target="_blank"
              className="underline text-sm sm:text-base"
            >
              {infos.external_id} ➚
            </Link>
          </div>

          <div className="text-gray-400 sm:ml-10">{infos.club}</div>
        </div>

        {/* Saison */}
        <div className="flex items-center gap-2">
          <span className="font-bold">Saison:</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="border rounded-lg bg-black px-2 py-1"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mb-10">
        <h2 className="font-extrabold text-xl mb-2">Rangliste</h2>

        <table className="w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className="p-2 text-left border-y border-l rounded-tl-lg rounded-bl-lg">
                Datum
              </th>
              <th className="p-2 text-left border-y">Wertung</th>
              <th className="p-2 text-left border-y">Punkte</th>
              <th className="p-2 text-left border-y border-r rounded-tr-lg rounded-br-lg">
                Platz
              </th>
            </tr>
          </thead>

          <tbody>
            {rankingsByYear[selectedYear]?.map((r) => (
              <tr key={r.id} className="hover:bg-gray-700/50">
                <td className="p-2">{formatDate(r.date)}</td>
                <td className="p-2">{r.association}</td>
                <td className="p-2">{r.points}</td>
                <td className="p-2">{r.rank}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Ergebnisse */}
      <div className="mb-12">
        <h2 className="font-extrabold text-xl mb-2">Ergebnisse</h2>

        {hasResults ? (
          <>
            {/* 💻 Desktop Tabelle */}
            <table className="hidden sm:table w-full border-separate border-spacing-0 text-sm">
              <thead>
                <tr>
                  <th className="p-2 border-y border-l rounded-tl-lg rounded-bl-lg">
                    Datum
                  </th>
                  <th className="p-2 border-y">Turnier</th>
                  <th className="p-2 border-y">Ort</th>
                  <th className="p-2 border-y">Partner</th>
                  <th className="p-2 border-y">Platz</th>
                  <th className="p-2 border-y border-r rounded-tr-lg rounded-br-lg">
                    Punkte
                  </th>
                </tr>
              </thead>

              <tbody>
                {resultsByYear[selectedYear]?.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() =>
                      window.open(
                        `https://beach.volleyball-verband.de/public/tur-er.php?id=${r.turnier_id}`,
                        "_blank",
                      )
                    }
                    className="cursor-pointer hover:bg-gray-700/50"
                  >
                    <td className="p-2">{formatDate(r.date)}</td>
                    <td className="p-2">{tur_name(r.tournament_name)}</td>
                    <td className="p-2">{r.location}</td>
                    <td className="p-2">
                      {tur_partner(r.partner.toString(), infos.last_name)}
                    </td>
                    <td className="p-2">{r.rank}</td>
                    <td className="p-2 flex justify-between">
                      <span>{r.points}</span>
                      <span>{r.association}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* 📱 Mobile Cards */}
            <div className="sm:hidden space-y-3">
              {resultsByYear[selectedYear]?.map((r) => (
                <div
                  key={r.id}
                  onClick={() =>
                    window.open(
                      `https://beach.volleyball-verband.de/public/tur-er.php?id=${r.turnier_id}`,
                      "_blank",
                    )
                  }
                  className="p-3 rounded-lg bg-gray-800 cursor-pointer"
                >
                  <div className="flex justify-between">
                    <span className="font-semibold">
                      {tur_name(r.tournament_name)}
                    </span>
                    <span className="text-sm">Platz: {r.rank}</span>
                  </div>

                  <div className="text-sm text-gray-400">
                    {formatDate(r.date)} • {r.location}
                  </div>

                  <div className="text-sm mt-1"></div>

                  <div className="flex justify-between mt-2 text-sm">
                    <span>
                      {tur_partner(r.partner.toString(), infos.last_name)}
                    </span>
                    <span>
                      {r.points} {r.association} Pkt.
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-2 text-sm text-gray-400">
              Insgesamt: {resultsByYear[selectedYear]?.length}
            </div>
          </>
        ) : (
          <div>Keine Turniere gefunden.</div>
        )}
      </div>
      <section>
        <button
          onClick={() => setShowLegend(!showLegend)}
          className="rounded mb-2"
        >
          {showLegend ? (
            <div className="flex flex-row ">
              <h2 className="mr-2">Legende</h2>
              <ChevronDown />
            </div>
          ) : (
            <div className="flex flex-row">
              <h2 className="mr-2">Legende</h2>
              <ChevronUp />
            </div>
          )}
        </button>

        {showLegend && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-semibold">Internationale Turniere</div>
              <div>Olympische Spiele</div>
              <div>WM</div>
              <div>EM</div>
            </div>

            <div>
              <div className="font-semibold">Beach Pro Tour</div>
              <div>Elite-16</div>
              <div>Challenge</div>
              <div>Future</div>
            </div>

            <div>
              <div className="font-semibold">Nationale Turniere</div>
              <div>DM</div>
              <div>GBT</div>
            </div>

            <div>
              <div className="font-semibold">Regionale Turniere</div>
              <div>Premium</div>
              <div>A+</div>
              <div>A</div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

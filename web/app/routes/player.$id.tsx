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
    <div className="max-w-4xl p-6 mb-12">
      <div className="flex flex-row justify-between mb-8">
        {/* Spielerinfos */}
        <div>
          <div className="flex flex-row place-items-baseline">
            <Link
              to="/ranking_dvv"
              className="text-white hover:bg-gray-700 mr-4 rounded-md p-1"
            >
              <ArrowBigLeft />
            </Link>
            <h1 className="text-3xl font-bold mb-2">
              {infos.first_name} {infos.last_name}
            </h1>
            <Link
              to={`https://beach.volleyball-verband.de/public/spieler.php?id=${infos.external_id}`}
              target="_blank"
              className="ml-6 underline"
            >
              {infos.external_id}➚
            </Link>
          </div>
          <span className="ml-12"> {infos.club}</span>
        </div>
        <div className="flex flex-row">
          <div className="p-1 mr-2 font-bold text-xl">Saison:</div>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="border rounded-lg bg-black content-start h-1/2"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-row-3 mb-8">
        {/* Rankings */}
        <div className="font-extrabold text-xl">Rangliste</div>
        <section className="border-t">
          <thead>
            <tr className="border-t">
              <th className="p-2 text-left">Datum</th>
              <th className="p-2 text-left">Wertung</th>
              <th className="p-2 text-left">Punkte</th>
              <th className="p-2 text-left">Platz</th>
            </tr>
          </thead>
          <tbody>
            {rankingsByYear[selectedYear]?.map((r) => (
              <tr
                key={r.id}
                className="border-b border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td className="p-2">{formatDate(r.date)}</td>
                <td className="p-2">{r.association}</td>
                <td className="p-2">{r.points}</td>
                <td className="p-2">{r.rank}</td>
              </tr>
            ))}
          </tbody>
        </section>
      </div>

      {/* Ergebnisse */}
      <div className="mb-12">
        <div className="font-extrabold text-xl">Ergebnisse</div>
        <section className="border-t">
          {hasResults ? (
            <div>
              <thead>
                <tr className="">
                  <th className="p-2">Datum</th>
                  <th className="p-2">Turnier</th>
                  <th className="p-2">Ort</th>
                  <th className="p-2">Partner</th>
                  <th className="p-2">Platz</th>
                  <th className="p-2">Punkte</th>
                </tr>
              </thead>

              <tbody>
                {resultsByYear[selectedYear]?.map((r) => {
                  counter++;
                  return (
                    <tr key={r.id} className="border-b border-gray-300">
                      <td className="p-2">{formatDate(r.date)}</td>
                      <td className="p-2 max-w-xs">
                        {tur_name(r.tournament_name)}
                      </td>
                      <td className="p-2">{r.location}</td>
                      <td className="p-2">
                        {tur_partner(r.partner.toString(), infos.last_name)}
                      </td>
                      <td className="p-2">{r.rank}</td>
                      <td className="p-2">{r.points}</td>
                      <td className="">{r.association}</td>
                    </tr>
                  );
                })}
              </tbody>
              <div>Insgesamt: {counter}</div>
            </div>
          ) : (
            <div className="">
              Es wurden anscheinend (noch) keine Turniere in diesem Jahr
              gespielt.
            </div>
          )}
        </section>
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
          <>
            <div className="flex flex-grid gap-2 justify-between">
              <div className="flex flex-col">
                <div className="font-semibold">Internationale Wettbewerbe</div>
                <div>Oympische Spiele</div>
                <div>Weltmeisterschaft</div>
                <div>Europameisterschaft</div>
              </div>
              <div className="flex flex-col">
                <div className="font-semibold">Beach Pro Tour</div>
                <div>Elite-16</div>
                <div>Challenge</div>
                <div>Future</div>
              </div>
              <div className="flex flex-col">
                <div className="font-semibold">Nationale Turniere</div>
                <div>Deutsche Meisterschaften</div>
                <div>German Beach Tour</div>
                <div>Rock the Beach</div>
                <div>Deutsche Hochschulmeisterschaften</div>
              </div>
              <div className="flex flex-col">
                <div className="font-semibold">Regionale Turniere</div>
                <div>Premium</div>
                <div>A+</div>
                <div>A</div>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

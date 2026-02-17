import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { div } from "framer-motion/client";
import { useMemo, useState } from "react";
import { formatDate } from "~/utils/date";

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

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-8 mb-12 text-gray-900 dark:text-gray-100">
      {/* Spielerinfos */}
      <h1 className="text-2xl font-bold mb-4">
        {infos.first_name} {infos.last_name}
      </h1>
      <div className="flex flex-row m-2 justify-center">
        <section className="rounded-2xl border m-2 p-6 w-1/3">
          <div className="grid grid-row-3 gap-4 text-lg">
            <div>
              <span className="font-semibold">Lizenz:</span> {infos.external_id}
            </div>
            <div>
              <span className="font-semibold">Verein:</span> {infos.club}
            </div>
          </div>
        </section>

        {/* Rankings */}
        <section className="border rounded-2xl m-2 p-6 w-1/2">
          <div className="font-extrabold text-xl">Ranglistenplätze</div>
          <thead>
            <tr className="">
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
      <div className="flex flex-col justify-center">
        <div className="flex flex-row">
          <div className="p-2 font-bold text-xl">Saison:</div>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="p-2 border rounded-lg bg-black"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Ergebnisse */}
      <section className="border rounded-2xl p-6">
        <div className="font-extrabold text-xl">Ergebnisse</div>
        {hasResults ? (
          <div>
            <thead>
              <tr className="">
                <th className="p-2">Datum</th>
                <th className="p-2">Turnier</th>
                <th className="p-2">Team</th>
                <th className="p-2">Platz</th>
                <th className="p-2">Punkte</th>
              </tr>
            </thead>
            <tbody>
              {resultsByYear[selectedYear]?.map((r) => (
                <tr key={r.id} className="border-b border-gray-300">
                  <td className="p-2">{formatDate(r.date)}</td>
                  <td className="p-2 max-w-xs">{r.tournament_name}</td>
                  <td className="p-2">{r.partner}</td>
                  <td className="p-2">{r.rank}</td>
                  <td className="p-2">{r.points}</td>
                  <td className="">{r.association}</td>
                </tr>
              ))}
            </tbody>
          </div>
        ) : (
          <div className="">
            Es wurden anscheinend (noch) keine Turniere in diesem Jahr gespielt.
          </div>
        )}
      </section>
    </div>
  );
}

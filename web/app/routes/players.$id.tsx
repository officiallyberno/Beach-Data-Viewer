import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

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

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-8 mb-12 text-gray-900 dark:text-gray-100">
      {/* Spielerinfos */}
      <section className="rounded-2xl bg-gray-100 dark:bg-gray-800  p-6">
        <h1 className="text-2xl font-bold mb-4">Spieler-Informationen</h1>
        <div className="grid grid-row-3 gap-4 text-lg">
          <div>
            <span className="font-semibold">Vorname:</span> {infos.first_name}
          </div>
          <div>
            <span className="font-semibold">Nachname:</span> {infos.last_name}
          </div>
          <div>
            <span className="font-semibold">Lizenz-Nr.:</span>{" "}
            {infos.external_id}
          </div>
          <div>
            <span className="font-semibold">Club:</span> {infos.club}
          </div>
        </div>
      </section>

      {/* Rankings */}
      <section className="rounded-2xl bg-gray-100 dark:bg-gray-800 shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Ranking-Historie</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-200 dark:bg-gray-700 text-left">
                <th className="p-2">#</th>
                <th className="p-2">Year</th>
                <th className="p-2">Points</th>
                <th className="p-2">Category</th>
                <th className="p-2">Rank</th>
              </tr>
            </thead>
            <tbody>
              {ranks.map((r: PlayerRankingsHistory) => (
                <tr
                  key={r.id}
                  className="border-b border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="p-2">{r.id}</td>
                  <td className="p-2">{r.year}</td>
                  <td className="p-2">{r.points}</td>
                  <td className="p-2">{r.association}</td>
                  <td className="p-2">{r.rank}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Ergebnisse */}
      <section className="rounded-2xl bg-gray-100 dark:bg-gray-800 shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Turnier-Ergebnisse</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-200 dark:bg-gray-700 text-left">
                <th className="p-2">Turnier</th>
                <th className="p-2">Rank</th>
                <th className="p-2">Partner</th>
                <th className="p-2">Association</th>
                <th className="p-2">Rank</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r: PlayerResultsHistory) => (
                <tr
                  key={r.id}
                  className="border-b border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="p-2">{r.tournament_name}</td>
                  <td className="p-2">{r.rank}</td>
                  <td className="p-2">{r.partner}</td>
                  <td className="p-2">{r.association}</td>
                  <td className="p-2">{r.rank}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

import { LoaderFunctionArgs } from "@remix-run/node";
import { Form, Link, useLoaderData, useNavigate } from "@remix-run/react";
import { RankingClean } from "./types";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const genders = url.searchParams.getAll("gender"); // Array! ["F","M"]

  const q = url.searchParams.get("q")?.toLowerCase() ?? "";
  const association = "DVV";
  const year = "2025";

  const res = await fetch(`http://localhost:8000/rank/${association}/${year}`);
  const players: RankingClean[] = await res.json();
  const sortedPlayeres = players
    .sort((a, b) => a.rank - b.rank)
    .map((item, index) => ({
      ...item,
      id: index,
    }));

  console.log("API response =", players);

  return { players };
}

export default function CleanRanking() {
  const { players } = useLoaderData<{ players: RankingClean[] }>();
  const navigate = useNavigate();
  return (
    <div className="max-w-3xl mx-auto mb-10 p-6">
      <h1 className="text-3xl font-bold mb-4">Rangliste 2025</h1>

      <Form method="get" className="flex items-center gap-4 mb-6">
        <input
          type="text"
          name="q"
          placeholder="Suchen nach Ort, Veranstalter oder Datum..."
          defaultValue={"A"}
          className="border p-2 rounded flex-1"
        />
        <label className="sr-only" htmlFor="gender-select">
          Geschlecht
        </label>
        <select
          id="gender-select"
          name="gender"
          value={"gender"} // ← nicht defaultValue, sondern controlled
          className="bg-gray-800 border border-gray-700 px-3 py-2 rounded"
        >
          <option value="Männer">Männer</option>
          <option value="Frauen">Frauen</option>
        </select>
        <button
          type="submit"
          className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white"
        >
          Suchen
        </button>
      </Form>

      <table className="w-full border-collapse border">
        <thead>
          <tr className="text-left">
            <th className="p-2">#</th>
            <th>Name</th>
            <th>Verein</th>
            <th>Punkte</th>
          </tr>
        </thead>
        <tbody>
          {players.map((r) => (
            <tr
              key={r.id}
              className="hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
              onClick={() => navigate(`/players/${r.player.external_id}`)}
            >
              <td className="p-2">{r.rank}</td>
              <td className="p-2">
                {r.player.first_name} {r.player.last_name}
              </td>
              <td className="p-2">{r.player.club}</td>
              <td className="p-2">{r.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

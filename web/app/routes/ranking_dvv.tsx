import { LoaderFunctionArgs } from "@remix-run/node";
import {
  Form,
  json,
  Link,
  Links,
  useLoaderData,
  useNavigate,
  useSearchParams,
} from "@remix-run/react";
import { RankingClean } from "./types";
import { link } from "node:fs";
import { useEffect, useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const gender = url.searchParams.get("gender") ?? "Männer";
  const q = url.searchParams.get("q")?.toLowerCase() ?? "";
  const association = "DVV";
  const year = "2025";

  const res = await fetch(
    `http://localhost:8000/rank/${association}/${year}?gender=${encodeURIComponent(
      gender
    )}&q=${encodeURIComponent(q)}`
  );

  if (!res.ok) {
    const txt = await res.text();
    throw new Response(txt, { status: res.status });
  }

  const players: RankingClean[] = await res.json();
  const sortedPlayeres = players
    .sort((a, b) => a.rank - b.rank)
    .map((item, index) => ({
      ...item,
      id: index,
    }));

  console.log("API response =", players);

  return json({ players: sortedPlayeres, gender, q });
}

export default function CleanRanking() {
  const { players } = useLoaderData<{ players: RankingClean[] }>();
  const navigate = useNavigate();

  const { gender: genderFromLoader, q: qFromLoader } =
    useLoaderData<typeof loader>();
  const [params] = useSearchParams();

  // Controlled States für Formfelder
  const [gender, setGender] = useState(genderFromLoader);
  const [query, setQuery] = useState(qFromLoader ?? "");

  // Falls URL sich ändert (z.B. durch Navigation), passen wir State an
  useEffect(() => {
    setGender(genderFromLoader);
    setQuery(qFromLoader ?? "");
  }, [genderFromLoader, qFromLoader]);

  return (
    <div className="max-w-3xl mx-auto mb-10 p-6">
      <h1 className="text-3xl font-bold mb-4">Rangliste 2025</h1>

      <Form method="get" className="flex items-center gap-4 mb-6">
        <input
          type="text"
          name="q"
          placeholder="Suchen nach Name, Verein oder Punkte..."
          defaultValue={params.get("q") ?? ""}
          className="border p-2 rounded flex-1"
        />
        <label className="sr-only" htmlFor="gender-select">
          Geschlecht
        </label>
        <select
          id="gender-select"
          name="gender"
          value={gender}
          onChange={(e) => setGender(e.currentTarget.value)}
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

      <section className="mb-8">
        <ul className="overflow-hidden">
          {players.map((r) => (
            <li
              key={r.id}
              className="flex justify-between items-center pr-5 hover:bg-gray-700/70 transition-all duration-150 hover:cursor-pointer"
              onClick={() => navigate(`/players/${r.player.external_id}`)}
            >
              <div>
                <div className="flex items-center space-x-4">
                  <span className="text-gray-400 font-semibold w-6 text-right">
                    {r.rank}.
                  </span>

                  <span className="font-semibold text-gray-100">
                    {r.player.first_name} {r.player.last_name}
                  </span>
                  <p className="text-sm text-gray-400 ml-9">{r.player.club}</p>
                </div>
              </div>

              <div className="text-sm text-gray-300">
                <span>{r.points}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

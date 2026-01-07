import { LoaderFunctionArgs } from "@remix-run/node";
import {
  Form,
  json,
  Link,
  useLoaderData,
  useNavigate,
  useSearchParams,
  useSubmit,
} from "@remix-run/react";
import { useEffect, useState } from "react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const gender = url.searchParams.get("gender") ?? "Männer";
  const q = url.searchParams.get("q") ?? "";

  const res = await fetch(
    `http://localhost:8000/rankings?gender=${encodeURIComponent(
      gender
    )}&q=${encodeURIComponent(q)}`
  );

  if (!res.ok) {
    const txt = await res.text();
    throw new Response(txt, { status: res.status });
  }

  const data: Ranking[] = await res.json();
  const sortedData = data
    .sort((a, b) => a.platz - b.platz)
    .map((item, index) => ({
      ...item,
      id: index,
    }));

  return json({ ranks: sortedData, gender, q });
};

export type Ranking = {
  id: number;
  platz: number;
  spieler: string;
  verein: string;
  punkte: number;
  geschlecht: string;
  saison: number;
};

export default function RankingPage() {
  const navigate = useNavigate(); // <— hier den Hook aufrufen

  const {
    ranks,
    gender: genderFromLoader,
    q: qFromLoader,
  } = useLoaderData<typeof loader>();
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
          placeholder="Suchen nach Ort, Veranstalter oder Datum..."
          defaultValue={params.get("q") ?? ""}
          className="border p-2 rounded flex-1"
        />
        <label className="sr-only" htmlFor="gender-select">
          Geschlecht
        </label>
        <select
          id="gender-select"
          name="gender"
          value={gender} // ← nicht defaultValue, sondern controlled
          onChange={(e) => setGender(e.target.value)}
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
          {ranks.map((r: Ranking) => (
            <tr
              key={r.id}
              className="hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
              onClick={() => navigate(`/players/${r.id}`)}
            >
              <td className="p-2">{r.platz}</td>
              <td className="p-2">
                <Link to={`/players/${r.id}`}>{r.spieler}</Link>
              </td>
              <td className="p-2">{r.verein}</td>
              <td className="p-2">{r.punkte}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

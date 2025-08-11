// web/app/routes/_index.tsx
import type { LoaderFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Link, useLoaderData, useSearchParams } from "@remix-run/react";
import React, { useState } from "react";

type Tournament = {
  id: number;
  start_datum: string;
  end_datum: string;
  ort: string;
  geschlecht: string;
  kategorie: string;
  veranstalter: string;
};

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.toLowerCase() ?? "";
  const query = url.searchParams.toString();

  const res = await fetch(`http://localhost:8000/tournaments?${query}`);
  const data: Tournament[] = await res.json(); // ← jetzt ist es ein Array

  let tournaments = data;
  // nur zukünftige Turniere

  // Suchfunktion
  if (q) {
    tournaments = tournaments.filter(
      (t) =>
        t.ort.toLowerCase().includes(q) ||
        t.veranstalter.toLowerCase().includes(q) ||
        t.start_datum.includes(q) ||
        (t.end_datum && t.end_datum.includes(q))
    );
  }

  return { tournaments };
}

// Komponente
export default function IndexPage() {
  const { tournaments } = useLoaderData<typeof loader>();
  const [params] = useSearchParams();

  const today = new Date();
  const futureTournaments = tournaments.filter(
    (t) => new Date(t.start_datum) >= today
  );
  const pastTournaments = tournaments.filter(
    (t) => new Date(t.start_datum) < today
  );
  const [showPast, setShowPast] = useState(false);

  // Index, an dem die Vergangenheit anfängt
  const pastIndex = tournaments.findIndex(
    (t) => new Date(t.start_datum) > today
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Turniere</h1>

      <Form method="get" className="flex flex-wrap gap-4 mb-6">
        <input
          type="text"
          name="q"
          placeholder="Suchen nach Ort, Veranstalter oder Datum..."
          defaultValue={params.get("q") ?? ""}
          className="border p-2 rounded flex-1"
        />
        {/* Kategorie */}
        <select
          name="cat"
          defaultValue={params.get("cat") ?? ""}
          className="border p-2 rounded"
        >
          <option value="">Alle Kategorien</option>
          <option value="A">A</option>
          <option value="A+">A+</option>
          <option value="B">B</option>
          <option value="C">C</option>
          <option value="Premium">Premium</option>
          <option value="ohne DVV-Punkte">ohne DVV‑Punkte</option>
        </select>

        {/* Verband */}
        <select
          name="org"
          defaultValue={params.get("org") ?? ""}
          className="border p-2 rounded"
        >
          <option value="">Alle Verbände</option>
          <option value="VVB">VVB</option>
          <option value="BVV">BVV</option>
          <option value="BBVV">BBVV</option>
          <option value="HVBV">HVBV</option>
          <option value="WVV">WVV</option>
          <option value="NVV">NVV</option>
          <option value="VLW">VLW</option>
          <option value="VVB">VVB</option>
          <option value="SSVB">SSVB</option>
          <option value="VVSA">VVSA</option>
          <option value="VMV">VMV</option>
          <option value="NWVV">NWVV</option>
          <option value="SHVV">SHVV</option>
          <option value="TVV">TVV</option>
          <option value="SBVV">SBVV</option>
        </select>

        {/* Geschlecht */}
        <select
          name="gender"
          defaultValue={params.get("gender") ?? ""}
          className="border p-2 rounded"
        >
          <option value="">Alle Geschlechter</option>
          <option value="Männer">Männer</option>
          <option value="Frauen">Frauen</option>
        </select>
        <button className="border px-4 py-2 rounded bg-blue-600 text-white">
          Filtern
        </button>
      </Form>
      <button
        onClick={() => setShowPast(!showPast)}
        className="mt-4 px-4 py-2 rounded"
      >
        {showPast
          ? "Vergangene Turniere ausblenden"
          : "Vergangene Turniere anzeigen"}
      </button>
      {showPast && (
        <>
          <h2 className="text-xl font-bold mt-6 mb-2">Vergangene Turniere</h2>
          <ul className="space-y-2 opacity-60">
            {pastTournaments.map((t) => (
              <Link to={`/tournaments/${t.id}`} className="block">
                <li className={`border p-4 rounded`}>
                  <strong>{t.ort}</strong> – {t.start_datum} ({t.geschlecht})
                  <br />
                  {t.kategorie} • {t.veranstalter}
                </li>
              </Link>
            ))}
          </ul>
        </>
      )}

      <h2 className="text-xl font-bold mb-2">Aktuelle Turniere</h2>
      <ul className="space-y-2">
        {futureTournaments.map((t) => (
          <Link to={`/tournaments/${t.id}`} className="block">
            <li className={`border p-4 rounded`}>
              <strong>{t.ort}</strong> – {t.start_datum} ({t.geschlecht})
              <br />
              {t.kategorie} • {t.veranstalter}
            </li>
          </Link>
        ))}
      </ul>
    </div>
  );
}

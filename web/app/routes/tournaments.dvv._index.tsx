// web/app/routes/_index.tsx
import type { LoaderFunction, LoaderFunctionArgs } from "@remix-run/node";
import { Form, Link, useLoaderData, useSearchParams } from "@remix-run/react";
import { div } from "framer-motion/client";
import { ChevronDown, ChevronUp } from "lucide-react";
import React, { useEffect, useState } from "react";
import SingleGenderToggle from "~/components/toggleGender";
import TurNavigation from "~/components/turnavigation";
import { formatDate } from "~/utils/date";

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
export default function TurPage() {
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
  const [showFuture, setShowFuture] = useState(true);

  return (
    <div>
      <TurNavigation />
      <div className="w-full mx-auto mb-16 p-6">
        <h1 className="text-3xl font-bold mb-4">Turniere</h1>

        <Form method="get" className="flex flex-wrap gap-4 mb-6">
          <div className="flex flex-col items-center gap-1">
            <span className="text-gray-700 font-medium text-center justify-center">
              Suche
            </span>
            <input
              type="text"
              name="q"
              placeholder=""
              defaultValue={params.get("q") ?? ""}
              className="rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-8 text-gray-700"
            />
          </div>
          {/* Kategorie */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-gray-700 font-medium text-center justify-center">
              Kategorie
            </span>
            <select
              name="cat"
              defaultValue={params.get("cat") ?? ""}
              className="rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-8 text-gray-700"
            >
              <option value="">Alle Kategorien</option>
              <option value="A">A</option>
              <option value="A+">A+</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="Premium">Premium</option>
              <option value="ohne DVV-Punkte">ohne DVV‑Punkte</option>
            </select>
          </div>
          {/* Verband */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-gray-700 font-medium text-center justify-center">
              Verbände
            </span>
            <select
              name="org"
              defaultValue={params.get("org") ?? ""}
              className="rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-8 text-gray-700"
            >
              <option value="">Alle Verbände</option>
              <option value="VVB">VVB</option>
              <option value="BVV">BVV</option>
              <option value="BBVV">BBVV</option>
              <option value="HVBV">HVBV</option>
              <option value="WVV">WVV</option>
              <option value="NVV">NVV</option>
              <option value="VLW">VLW</option>
              <option value="SSVB">SSVB</option>
              <option value="VVSA">VVSA</option>
              <option value="VMV">VMV</option>
              <option value="NWVV">NWVV</option>
              <option value="SHVV">SHVV</option>
              <option value="TVV">TVV</option>
              <option value="SBVV">SBVV</option>
            </select>
          </div>

          <div className="flex flex-col items-center gap-1">
            <span className="text-gray-700 font-medium text-center justify-center">
              Geschlecht
            </span>
            <select name="gender" id="eins">
              <option value="">Alle</option>
              <option value="männlich">männlich</option>
              <option value="weiblich">weiblich</option>
            </select>
          </div>

          <div className="flex flex-col items-end">
            <div></div>
            <button className="border px-4 py-2 rounded bg-blue-600 mt-auto text-white">
              Filtern
            </button>
          </div>
        </Form>
        <button
          onClick={() => setShowPast(!showPast)}
          className="mt-4 px-4 py-2 rounded-lg"
        >
          {showPast ? (
            <div className="flex flex-row bg-gray-800 rounded-lg p-2">
              <ChevronDown />
              <h2 className="text-xl font-bold ml-2">Vergangene Turniere</h2>
            </div>
          ) : (
            <div className="flex flex-row p-2">
              <ChevronUp />
              <h2 className="text-xl font-bold ml-2">Vergangene Turniere</h2>
            </div>
          )}
        </button>

        {/* Vergangene Turniere */}
        {showPast && (
          <>
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {pastTournaments.map((t) => (
                <li
                  key={t.id}
                  className="bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-md hover:shadow-lg transition duration-200 border border-gray-700 overflow-hidden"
                >
                  <Link
                    to={`/tournaments/dvv/${t.id}`}
                    className="block h-full p-5 hover:bg-gray-700/60 transition-colors duration-150"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-blue-400">
                        {t.kategorie}
                      </span>
                      <span className="text-sm font-semibold">
                        {formatDate(t.start_datum)}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          t.geschlecht === "Männer"
                            ? "bg-blue-500/20 text-blue-300"
                            : t.geschlecht === "Frauen"
                            ? "bg-pink-500/20 text-pink-300"
                            : "bg-gray-600/40 text-gray-300"
                        }`}
                      >
                        {t.geschlecht}
                      </span>
                    </div>
                    <h2 className="text-lg font-semibold text-gray-100 mb-1">
                      {t.veranstalter}
                    </h2>
                    <p className="text-sm text-gray-400 mb-2">{t.ort}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}

        <button
          onClick={() => setShowFuture(!showFuture)}
          className="mt-4 px-4 py-2 rounded"
        >
          {showFuture ? (
            <div className="flex flex-row bg-gray-800 rounded-lg p-2">
              <ChevronDown />
              <h2 className="text-xl font-bold ml-2">Aktuelle Turniere</h2>
            </div>
          ) : (
            <div className="flex flex-row p-2">
              <ChevronUp />
              <h2 className="text-xl font-bold ml-2">Aktuelle Turniere</h2>
            </div>
          )}
        </button>

        {/* Aktuelle Turniere */}
        {showFuture && (
          <>
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {futureTournaments.map((t) => (
                <li
                  key={t.id}
                  className="bg-gray-800/80 backdrop-blur-sm rounded-2xl transition duration-200 border border-gray-700 overflow-hidden"
                >
                  <Link
                    to={`/tournaments/dvv/${t.id}`}
                    className="block h-full p-5 hover:bg-gray-700/60 transition-colors duration-150"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-blue-400">
                        {t.kategorie}
                      </span>
                      <span className="text-sm font-semibold">
                        {formatDate(t.start_datum)}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          t.geschlecht === "Männer"
                            ? "bg-blue-500/20 text-blue-300"
                            : t.geschlecht === "Frauen"
                            ? "bg-pink-500/20 text-pink-300"
                            : "bg-gray-600/40 text-gray-300"
                        }`}
                      >
                        {t.geschlecht}
                      </span>
                    </div>
                    <h2 className="text-lg font-semibold text-gray-100 mb-1">
                      {t.veranstalter}
                    </h2>
                    <p className="text-sm text-gray-400 mb-2">{t.ort}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

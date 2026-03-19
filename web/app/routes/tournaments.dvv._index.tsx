// web/app/routes/_index.tsx
import type { LoaderFunction, LoaderFunctionArgs } from "@remix-run/node";
import { Form, Link, useLoaderData, useSearchParams } from "@remix-run/react";
import { div } from "framer-motion/client";
import { ChevronDown, ChevronUp } from "lucide-react";
import React, { useEffect, useState } from "react";
import TurNavigation from "~/components/turnavigation";
import { formatDate } from "~/utils/date";
import { TournamentVVB } from "./types";
import TournamentGrid from "~/components/turgrid";

export async function loader({ request }: LoaderFunctionArgs) {
  const res = await fetch(`http://localhost:8000/landesverband`);
  const data: TournamentVVB[] = await res.json();

  let tournaments = data;

  return { tournaments };
}

// Komponente
export default function TurPage() {
  const { tournaments } = useLoaderData<typeof loader>();
  const [params] = useSearchParams();

  const today = new Date();
  console.log(tournaments);
  const futureTournaments = tournaments.filter(
    (t) => new Date(t.datum_von) >= today,
  );
  const pastTournaments = tournaments.filter(
    (t) => new Date(t.datum_von) < today,
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
            <select
              name="gender"
              id="eins"
              className="rounded-lg bg-white p-2 text-gray-700"
            >
              <option value="">Alle</option>
              <option value="männlich">männlich</option>
              <option value="weiblich">weiblich</option>
            </select>
          </div>

          <div className="flex flex-col items-end">
            <div></div>
            <button className=" p-2 rounded-lg bg-blue-600 mt-auto text-white">
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
          <TournamentGrid tournaments={pastTournaments} basePath="vvb" />
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
          <TournamentGrid tournaments={futureTournaments} basePath="vvb" />
        )}
      </div>
    </div>
  );
}

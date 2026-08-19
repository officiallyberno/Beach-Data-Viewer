import { LoaderFunctionArgs } from "@remix-run/node";
import { ChevronDown, ChevronUp, Link } from "lucide-react";
import TurNavigation from "~/components/turnavigation";
import { TournamentVVB } from "./types";
import { useLoaderData } from "@remix-run/react";
import { formatDate } from "~/utils/date";
import { tur_name } from "~/utils/tur_details";
import TournamentGrid from "~/components/turgrid";
import TournamentTable from "~/components/turtable";
import { useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const res = await fetch(`http://localhost:8000/dvv`);
  const data: TournamentVVB[] = await res.json();

  let tournaments = data;

  return { tournaments };
}

export default function TurPageGbt() {
  const { tournaments } = useLoaderData<typeof loader>();
  console.log(tournaments);
  const [activeView, setActiveView] = useState(true);
  const [showPast, setShowPast] = useState(false);
  const [showFuture, setShowFuture] = useState(true);
  const today = new Date();

  const futureTournaments = tournaments.filter(
    (t) => new Date(t.datum_von) >= today,
  );
  const pastTournaments = tournaments.filter(
    (t) => new Date(t.datum_von) < today,
  );

  return (
    <div className="">
      <TurNavigation />
      <div className="w-full mx-auto mb-16 p-6">
        <div className="flex flex-row items-baseline justify-between">
          <h1 className="text-3xl font-bold mb-4">Turniere</h1>

          <button
            onClick={() => setActiveView(!activeView)}
            className="mt-4 px-4 py-2 rounded-lg"
          >
            {activeView ? (
              <div className="flex flex-row bg-gray-800 rounded-lg p-1">
                <h2 className="font-bold bg-slate-500 p-1 rounded-md"> Grid</h2>
                <h2 className="font-bold ml-2 p-1">Table</h2>
              </div>
            ) : (
              <div className="flex flex-row bg-gray-800 rounded-lg p-1">
                <h2 className="font-bold p-1"> Grid</h2>
                <h2 className="font-bold ml-2 bg-slate-500 p-1 rounded-md">
                  Table
                </h2>
              </div>
            )}
          </button>
        </div>

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
        {showPast && activeView && (
          <TournamentGrid tournaments={pastTournaments} basePath="gbt" />
        )}
        {showPast && !activeView && (
          <TournamentTable tournaments={pastTournaments} basePath="gbt" />
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
        {showFuture && activeView && (
          <TournamentGrid tournaments={futureTournaments} basePath="gbt" />
        )}
        {showFuture && !activeView && (
          <TournamentTable tournaments={futureTournaments} basePath="gbt" />
        )}
      </div>
    </div>
  );
}

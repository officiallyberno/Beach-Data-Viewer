import { LoaderFunctionArgs } from "@remix-run/node";
import { Form, Link, useLoaderData, useSearchParams } from "@remix-run/react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import SingleGenderToggle from "~/components/toggleGender";
import TournamentGrid from "~/components/turgrid";
import TurNavigation from "~/components/turnavigation";
import { formatDate } from "~/utils/date";
import { TournamentVVB } from "./types";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const genders = url.searchParams.getAll("gender");

  const q = url.searchParams.get("q")?.toLowerCase() ?? "";
  const query = url.searchParams.toString();

  const res = await fetch(`http://localhost:8000/vvb`);
  const data: TournamentVVB[] = await res.json();

  let tournaments = data;

  return { tournaments };
}

export default function TurPageVVB() {
  const { tournaments } = useLoaderData<typeof loader>();
  const [params] = useSearchParams();
  const today = new Date();
  const futureTournaments = tournaments.filter(
    (t) => new Date(t.starttermin) >= today
  );
  const pastTournaments = tournaments.filter(
    (t) => new Date(t.starttermin) <= today
  );

  const [showPast, setShowPast] = useState(false);
  const [showFuture, setShowFuture] = useState(true);

  const [selectedGender, setSelectedGender] = useState<"F" | "M" | "">(
    params.get("gender") === "F" || params.get("gender") === "M"
      ? (params.get("gender") as "F" | "M")
      : ""
  );
  return (
    <div>
      <TurNavigation />
      <div className="w-full mx-auto mb-16 p-6">
        <Form method="get" className="flex flex-wrap gap-4 mb-6">
          <div className="grid content-end">
            <div className="text-slate-950">.</div>
            <h1 className="text-2xl font-bold mb-2">Filter:</h1>
          </div>
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
          <div className="flex flex-col items-center gap-1"></div>

          <div className="flex flex-col items-center gap-1">
            <span className="text-gray-700 font-medium text-center justify-center">
              Geschlecht
            </span>
            <SingleGenderToggle
              value={selectedGender}
              onChange={setSelectedGender}
            />
          </div>

          {/* Hidden input, nur wenn ein Geschlecht ausgewählt ist */}
          {selectedGender && (
            <input type="hidden" name="gender" value={selectedGender} />
          )}
          <div className="flex flex-col items-end">
            <div></div>
            <button className="border px-4 py-2 rounded bg-blue-600 mt-auto text-white">
              Filtern
            </button>
          </div>
        </Form>

        <button
          onClick={() => setShowPast(!showPast)}
          className="px-4 py-2 rounded"
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
        {showPast && (
          <TournamentGrid tournaments={pastTournaments} basePath="vvb" />
        )}
        <button
          onClick={() => setShowFuture(!showFuture)}
          className="px-4 py-2 rounded"
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
        {showFuture && (
          <TournamentGrid tournaments={futureTournaments} basePath="vvb" />
        )}
      </div>
    </div>
  );
}

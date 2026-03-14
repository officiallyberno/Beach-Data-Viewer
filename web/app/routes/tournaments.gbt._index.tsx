import { LoaderFunctionArgs } from "@remix-run/node";
import { Link } from "lucide-react";
import TurNavigation from "~/components/turnavigation";
import { TournamentVVB } from "./types";
import { useLoaderData } from "@remix-run/react";
import { formatDate } from "~/utils/date";
import { tur_name } from "~/utils/tur_details";

export async function loader({ request }: LoaderFunctionArgs) {
  const res = await fetch(`http://localhost:8000/dvv`);
  const data: TournamentVVB[] = await res.json();

  let tournaments = data;

  return { tournaments };
}

export default function TurPageGbt() {
  const { tournaments } = useLoaderData<typeof loader>();
  console.log(tournaments);

  return (
    <div className="">
      <TurNavigation />
      <div className="w-full mx-auto mb-16 p-6">
        <h1 className="text-3xl font-bold mb-4">Turniere</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {tournaments.map((t) => (
            <div className="bg-gray-800/80 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-blue-400">
                  {tur_name(t.kategorie)}
                </span>
                <span className="text-sm font-semibold">
                  {formatDate(t.datum_von)}
                </span>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    t.gender === "Männer"
                      ? "bg-blue-500/20 text-blue-300"
                      : t.gender === "Frauen"
                      ? "bg-pink-500/20 text-pink-300"
                      : "bg-gray-600/40 text-gray-300"
                  }`}
                >
                  {t.gender}
                </span>
              </div>
              <div className="flex flex-row justify-between content-end">
                <h2 className="text-lg font-semibold text-gray-100">{t.ort}</h2>

                <p className="text-sm text-gray-400">
                  {t.gemeldete_mannschaften}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

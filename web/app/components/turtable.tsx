import { Link } from "lucide-react";
import { TournamentVVB } from "~/routes/types";
import { formatDate } from "~/utils/date";
import { tur_name } from "~/utils/tur_details";

interface TournamentGridProps {
  tournaments: TournamentVVB[];
  basePath?: string;
}

export default function TournamentTable({
  tournaments,
  basePath = "tournaments",
}: TournamentGridProps) {
  return (
    <div className="flex flex-col gap-2">
      {tournaments.map((t) => (
        <a href={`/tournaments/${basePath}/${t.id}`} className="block h-full">
          <div key={t.id} className="border-b">
            <div className="flex justify-between items-center w-full">
              <div className="flex flex-row items-center justify-start">
                <span className="text-sm font-semibold mx-4">
                  {formatDate(t.datum_von)}
                </span>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full mr-2 ${
                    t.gender === "männlich" || t.gender === "Männer"
                      ? "bg-green-500/20 text-green-300"
                      : t.gender === "weiblich" || t.gender === "Frauen"
                      ? "bg-red-500/20 text-red-300"
                      : "bg-gray-600/40 text-gray-300"
                  }`}
                >
                  {t.gender === "männlich" || t.gender === "Männer"
                    ? "M"
                    : t.gender === "weiblich" || t.gender === "Frauen"
                    ? "W"
                    : "-"}
                </span>
                <span className="text-sm font-semibold text-blue-400 mr-2">
                  {tur_name(t.kategorie)}
                </span>
                <h2 className="text-lg font-semibold text-gray-100 mb-1">
                  {t.ort}
                </h2>
                {/* <p className="text-sm text-gray-400 mb-2">{t.name}</p> */}
              </div>
              <p className="mr-4">
                {/* <strong className="text-gray-200">Teams:</strong>{" "} */}
                {t.gemeldete_mannschaften ?? 0}
                {/* {t.anzahl_teams_hauptfeld ?? "?"} */}
              </p>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}

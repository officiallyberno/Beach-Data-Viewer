import { Link } from "@remix-run/react";
import { TournamentVVB } from "~/routes/types";
import { formatDate } from "~/utils/date";
import { tur_name } from "~/utils/tur_details";

interface TournamentGridProps {
  tournaments: TournamentVVB[];
  basePath?: string; // z. B. "vvb" oder "dvv"
}

export default function TournamentGrid({
  tournaments,
  basePath = "tournaments",
}: TournamentGridProps) {
  return (
    <ul
      className="
        grid 
        grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
        gap-4
      "
    >
      {tournaments.map((t) => (
        <li
          key={t.id}
          className="
            bg-gray-800/80
            rounded-2xl
            transition
            duration-200
            overflow-hidden
          "
        >
          <Link
            to={`/tournaments/${basePath}/${t.id}`}
            className="block h-full p-5 hover:bg-gray-700/60 transition-colors duration-150"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-blue-400">
                {tur_name(t.kategorie)}
              </span>
              <span className="text-sm font-semibold">
                {formatDate(t.datum_von)}
              </span>
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${
                  t.gender === "männlich" || t.gender === "Männer"
                    ? "bg-green-500/20 text-greens-300"
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
            </div>

            <h2 className="text-lg font-semibold text-gray-100 mb-1">
              {t.ort}
            </h2>

            {t.ausrichter != "Volleyball-Verband Berlin" && (
              <p className="text-sm text-gray-400 mb-2">{t.ausrichter}</p>
            )}

            <div className="text-sm text-gray-300 space-y-1">
              {t.meldeschluss != null && (
                <p>
                  <strong className="text-gray-200">Meldeschluss:</strong>{" "}
                  {formatDate(t.meldeschluss) ?? "k. A."}
                </p>
              )}
              {t.gemeldete_mannschaften != null &&
                t.anzahl_teams_hauptfeld != null && (
                  <p>
                    <strong className="text-gray-200">Teams:</strong>{" "}
                    {t.gemeldete_mannschaften}/{t.anzahl_teams_hauptfeld}
                  </p>
                )}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

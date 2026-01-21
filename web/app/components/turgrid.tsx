import { Link } from "@remix-run/react";
import { TournamentVVB } from "~/routes/types";
import { formatDate } from "~/utils/date";

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
        gap-2
      "
    >
      {tournaments.map((t) => (
        <li
          key={t.id}
          className="
            bg-gray-800/80
            backdrop-blur-sm
            rounded-2xl
            shadow-md
            hover:shadow-lg
            transition
            duration-200
            border border-gray-700
            overflow-hidden
          "
        >
          <Link
            to={`/tournaments/${basePath}/${t.id}`}
            className="block h-full p-5 hover:bg-gray-700/60 transition-colors duration-150"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-blue-400">
                {t.kategorie}
              </span>
              <span className="text-sm font-semibold">
                {formatDate(t.starttermin)}
              </span>
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${
                  t.gender === "männlich"
                    ? "bg-blue-500/20 text-blue-300"
                    : t.gender === "weiblich"
                    ? "bg-pink-500/20 text-pink-300"
                    : "bg-gray-600/40 text-gray-300"
                }`}
              >
                {t.gender}
              </span>
            </div>

            <h2 className="text-lg font-semibold text-gray-100 mb-1">
              {t.name}
            </h2>
            <p className="text-sm text-gray-400 mb-2">{t.ort}</p>

            <div className="text-sm text-gray-300 space-y-1">
              <p>
                <strong className="text-gray-200">Meldeschluss:</strong>{" "}
                {formatDate(t.meldeschluss) ?? "k. A."}
              </p>
              <p>
                <strong className="text-gray-200">Teams:</strong>{" "}
                {t.gemeldete_mannschaften ?? 0}/
                {t.anzahl_teams_hauptfeld ?? "?"}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

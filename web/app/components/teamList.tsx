import { Link } from "lucide-react";
import { Team } from "~/routes/types";
import { formatDate, formatDateTime } from "~/utils/date";
import { formatDvvPoints } from "~/utils/formatDvvPoints";

interface TeamListProps {
  teams: Team[];
  title?: string;
  activeTab: string;
  displayKey?: keyof Team;
  showIndex?: boolean;
}

export default function TeamList({
  teams,
  title = "Teams",
  activeTab,
  displayKey,
  showIndex = true,
}: TeamListProps) {
  const sortTeams = (tab: string) => {
    const sorted = [...teams];

    switch (tab) {
      case "meldeliste":
        return sorted
          .filter((a) => a.status != "Absage")
          .sort(
            (a, b) =>
              new Date(a.anmeldedatum).getTime() -
              new Date(b.anmeldedatum).getTime(),
          );

      case "zulassung":
        return sorted
          .filter((a) => a.status != "Absage")
          .sort((a: Team, b: Team) => {
            return a.zulassung_reihenfolge - b.zulassung_reihenfolge;
          });

      case "setzliste":
        return sorted
          .filter((a) => a.status != "Absage")
          .sort((a: Team, b: Team) => {
            return a.setzung_reihenfolge - b.setzung_reihenfolge;
          });

      case "platzierungen":
        showIndex = false;
        return sorted
          .filter((a) => a.status != "Absage")
          .sort((a, b) => a.platzierung - b.platzierung);

      default:
        return sorted;
    }
  };

  const sortedTeams = sortTeams(activeTab);

  return (
    <section className="mb-8">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>

      <ul className="">
        {sortedTeams.map((team, i) => (
          <li key={team.id} className="border-b border-gray-700 p-2">
            <a
              href={`https://www.beachvolleybb.de/popup/beach/beachTeamDetails.xhtml?beachTeamId=${team.external_mannschafts_id}&hideHistoryBackButton=true`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex justify-between items-center p-2 hover:bg-gray-800 rounded-lg"
            >
              <div>
                <div className="flex items-center space-x-3">
                  {showIndex ? (
                    <span className="text-gray-400 font-semibold w-6 text-right">
                      {i + 1}.
                    </span>
                  ) : (
                    <span className="text-gray-400 font-semibold w-6 text-right">
                      {team.platzierung}
                    </span>
                  )}
                  <span className="font-semibold text-gray-100">
                    {team.mannschaftsname}
                  </span>
                </div>
                <p className="text-sm text-gray-400 ml-9">{team.verein}</p>
              </div>
              <div className="text-xl font-semibold text-gray-100">
                {displayKey === "anmeldedatum" && (
                  <span>{formatDateTime(team.anmeldedatum)}</span>
                )}
                {displayKey === "punkte_zulassung" &&
                  team.punkte_zulassung !== null && (
                    <span>{formatDvvPoints(team.punkte_zulassung)}</span>
                  )}

                {displayKey === "punkte_setzung" &&
                  team.punkte_setzung !== null && (
                    <span>{formatDvvPoints(team.punkte_setzung)}</span>
                  )}
                {displayKey === "punkte_setzung" &&
                  team.punkte_setzung === null && <span>{team.status}</span>}
                {displayKey === "platzierung" && (
                  <span>{team.platzierung ?? "-"}</span>
                )}
              </div>
            </a>
          </li>
        ))}
      </ul>

      {sortedTeams.length === 0 && (
        <p className="text-gray-400 italic text-sm mt-3">
          Keine Teams vorhanden.
        </p>
      )}
    </section>
  );
}

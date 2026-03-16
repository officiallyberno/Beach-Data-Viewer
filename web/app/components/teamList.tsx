import { Team } from "~/routes/types";
import { formatDate } from "~/utils/date";
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
        return sorted.sort(
          (a, b) =>
            new Date(a.anmeldedatum).getTime() -
            new Date(b.anmeldedatum).getTime(),
        );

      case "zulassung":
        return sorted.sort((a: Team, b: Team) => {
          return b.dvv_punkte_zulassung - a.dvv_punkte_zulassung;
        });
      case "zulassung_lv":
        return sorted.sort((a: Team, b: Team) => {
          return b.lv_punkte_zulassung - a.lv_punkte_zulassung;
        });

      case "setzliste":
        return sorted.sort((a: Team, b: Team) => {
          return a.setzung_reihenfolge - b.setzung_reihenfolge;
        });

      case "platzierungen":
        return sorted.sort((a, b) => a.platzierung - b.platzierung);

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
          <li
            key={team.id}
            className="flex justify-between items-center p-4 border-b border-gray-700"
          >
            <div>
              <div className="flex items-center space-x-3">
                {showIndex && (
                  <span className="text-gray-400 font-semibold w-6 text-right">
                    {i + 1}.
                  </span>
                )}
                <span className="font-semibold text-gray-100">
                  {team.mannschaftsname}
                </span>
              </div>
              <p className="text-sm text-gray-400 ml-9">{team.verein}</p>
            </div>

            <div className="text-sm text-gray-300">
              {displayKey === "anmeldedatum" && (
                <span>{formatDate(team.anmeldedatum)}</span>
              )}
              {displayKey === "dvv_punkte_zulassung" &&
                team.punkte_zulassung !== null && (
                  <span>{team.dvv_punkte_zulassung}</span>
                )}
              {displayKey === "lv_punkte_zulassung" &&
                team.punkte_zulassung !== null && (
                  <span>{team.lv_punkte_zulassung}</span>
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

export function tur_name(tournament_name: string) {
  if (tournament_name == "German Beach Tour") return "GBT";
  if (tournament_name == "Beach Pro Tour Elite 16") return "Elite 16";
  if (tournament_name == "Beach Pro Tour Challenge") return "Challenge";
  if (tournament_name == "Beach Pro Tour Future") return "Future";
  if (tournament_name == "Deutsche Beach-Volleyball Meisterschaften")
    return "DM";
  if (tournament_name == "Deutsche Hochschulmeisterschaften") return "DHM";
  if (tournament_name == "Kategorie Premium") return "Premium";
  if (tournament_name == "Kategorie A+") return "A+";
  if (tournament_name == "Kategorie A") return "A";
  if (tournament_name == "Kategorie 1+") return "Kat. 1+";
  if (tournament_name == "Kategorie 1") return "Kat. 1";
  if (tournament_name == "Kategorie 2") return "Kat. 2";
  if (tournament_name == "Deutsche Beach-Volleyball Meisterschaften U20")
    return "DM U20";
  else return tournament_name;
}
export function tur_partner(tur_team: string, tur_player: string) {
  return (
    tur_team.split(" - ").find((name) => name.trim() !== tur_player.trim()) ??
    ""
  );
}

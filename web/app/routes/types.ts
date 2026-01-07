export type TournamentVVB = {
  id: number;
  name: string;
  kategorie: string;
  starttermin: string;
  zulassungstermin: string;
  ort: string;
  gender?: string;
  anmeldung_url?: string;
  meldeschluss: string;
  ausrichter?: string;
  altersklasse?: string;

  gemeldete_mannschaften?: number;
  anzahl_teams_hauptfeld?: number;
  anzahl_teams_qualifikation: number;
  zulassungsreihenfolge?: string;
  preisgeld?: number;
  startgeld?: number;
  kaution?: number;

  oeffentliche_informationen?: string;
  kontakt?: string;
  turnierhierarchie?: string;
  turniermodus?: string;
  start_hauptfeld: string;
  termin_technical_meeting: string;
  anzahl_spielfelder_hauptfeld: number;
  verpflegungshinweise?: string;
  links?: string;
  anmerkungen?: string;

  anmeldungen?: any[];
  zulassungen?: any[];
  setzliste?: any[];
  spiele?: any[];
  platzierungen?: any[];
};

export type Tournament = {
  id: number;
  start_datum: string;
  end_datum: string;
  ort: string;
  geschlecht: string;
  kategorie: string;
  veranstalter: string;
};

export type Tournament2 = {
  id: number;
  name: string;
  ort: string;
  kategorie: string;
  gender: string;
  starttermin: string;
  meldeschluss: string;
  gemeldete_mannschaften?: number;
  anzahl_teams_hauptfeld?: number;
};

export type Team = {
  id: number;
  mannschaftsname: string;
  verein: string;
  status: string;
  punkte_setzung: string;
  anmeldedatum: string;
  platzierung: number;
  punkte: string;
  doppelmeldung: boolean | string;
  punkte_pro_spieler: string;
  tournament_id: number;
  is_placeholder: boolean;
  zulassung_reihenfolge: number;
  mannschafts_id: number;
  punkte_zulassung: string;
  setzung_reihenfolge: number;
};

export type RankingClean = {
  id: number;
  player_id: number;
  year: string;
  date: string;
  rank: string;
  points: string;
  association: string;
  player: Player;
};

export type Player = {
  id: number;
  external_id: number;
  first_name: string;
  last_name: string;
  club: string | null;
  license_number: string | null;
};

export function formatDvvPoints(input: string): string {
  if (!input) return "";

  // Wenn der String bereits einen Zeilenumbruch enthält → nichts tun
  if (input.includes("\n")) return input;

  // Wir suchen Muster wie "Zahl + Buchstaben + Zahl" → das trennt zwei Bereiche
  const regex = /(\d+)([A-Za-zÄÖÜäöüß])/;

  // Ersetze "219L" → "219\nL"
  const formatted = input.replace(regex, "$1\n$2");

  return formatted.trim();
}

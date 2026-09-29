// The first batch is transcribed from the supplied BLOON Groep 6, blok 1 sheet.
// Keep IDs stable when adding batches so existing local progress remains valid.
export const batches = [
  {
    id: "groep6-blok1",
    title: "Groep 6 · Blok 1",
    words: [
      { id: "hand", text: "de hand", difficulty: 1 },
      { id: "herfst", text: "de herfst", difficulty: 2 },
      { id: "schrob", text: "ik schrob", difficulty: 3 },
      { id: "spinnenweb", text: "het spinnenweb", difficulty: 3 },
      { id: "linkerkant", text: "de linkerkant", difficulty: 2 },
      { id: "speelgoed", text: "het speelgoed", difficulty: 2 },
      { id: "schub", text: "de schub", difficulty: 3 },
      { id: "grauw", text: "grauw", difficulty: 4 },
      { id: "harkt", text: "hij harkt", difficulty: 3 },
      { id: "schuim", text: "het schuim", difficulty: 3 },
      { id: "dweil", text: "de dweil", difficulty: 3 },
      { id: "kleur", text: "de kleur", difficulty: 2 },
      { id: "onweer", text: "onweer", difficulty: 2 },
      { id: "boort", text: "hij boort", difficulty: 3 },
      { id: "zeurt", text: "hij zeurt", difficulty: 3 },
      { id: "speurt", text: "hij speurt", difficulty: 4 },
      { id: "leert", text: "zij leert", difficulty: 2 },
      { id: "kuchen", text: "zij kuchen", difficulty: 4 },
      { id: "rechtdoor", text: "rechtdoor", difficulty: 3 },
      { id: "dichtbij", text: "dichtbij", difficulty: 3 },
      { id: "opdracht", text: "de opdracht", difficulty: 3 },
      { id: "goochelaar", text: "de goochelaar", difficulty: 5 },
      { id: "scherf", text: "de scherf", difficulty: 3 },
      { id: "techniek", text: "techniek", difficulty: 4 },
      { id: "lichaam", text: "lichaam", difficulty: 4 },
      { id: "kachel", text: "kachel", difficulty: 2 },
      { id: "omdraaien", text: "omdraaien", difficulty: 4 },
      { id: "knoeien", text: "knoeien", difficulty: 4 },
      { id: "mooie", text: "mooie", difficulty: 2 },
      { id: "roeiboot", text: "de roeiboot", difficulty: 3 },
      { id: "kraaiennest", text: "het kraaiennest", difficulty: 5 },
    ],
  },
];

export const words = batches.flatMap((batch) => batch.words);

// Active list transcribed from the supplied BLOON Groep 6, blok 2 PDF.
// Replacing this list retires the previous words; their saved progress stays intact.
// Keep IDs stable so existing local progress remains valid.
export const batches = [
  {
    id: "groep6-blok2",
    title: "Groep 6 · Blok 2",
    words: [
      { id: "zondags", text: "’s zondags", difficulty: 3 },
      { id: "winters", text: "’s winters", difficulty: 3 },
      { id: "ochtends", text: "’s ochtends", difficulty: 4 },
      { id: "avonds", text: "’s avonds", difficulty: 3 },
      { id: "gigantisch", text: "gigantisch", difficulty: 4 },
      { id: "magisch", text: "magisch", difficulty: 3 },
      { id: "kritisch", text: "kritisch", difficulty: 4 },
      { id: "biologisch", text: "biologisch", difficulty: 5 },
      { id: "logisch", text: "logisch", difficulty: 3 },
      { id: "paraplus", text: "de paraplu’s", difficulty: 3 },
      { id: "kilos", text: "de kilo’s", difficulty: 3 },
      { id: "menus", text: "de menu’s", difficulty: 3 },
      { id: "concert", text: "het concert", difficulty: 3 },
      { id: "collectie", text: "de collectie", difficulty: 4 },
      { id: "carnaval", text: "het carnaval", difficulty: 3 },
      { id: "circustent", text: "de circustent", difficulty: 4 },
      { id: "ruw", text: "ruw", difficulty: 2 },
      { id: "schaduw", text: "schaduw", difficulty: 3 },
      { id: "zwaluw", text: "zwaluw", difficulty: 3 },
      { id: "waarschuw", text: "waarschuw", difficulty: 4 },
      { id: "paleisje", text: "het paleisje", difficulty: 3 },
      { id: "treiteren", text: "treiteren", difficulty: 4 },
      { id: "weinig", text: "weinig", difficulty: 3 },
      { id: "schoonheid", text: "de schoonheid", difficulty: 4 },
      { id: "moeilijkheid", text: "de moeilijkheid", difficulty: 4 },
      { id: "verkoudheid", text: "de verkoudheid", difficulty: 4 },
      { id: "activiteit", text: "de activiteit", difficulty: 5 },
      { id: "brutaliteit", text: "de brutaliteit", difficulty: 5 },
      { id: "puberteit", text: "de puberteit", difficulty: 4 },
      { id: "majesteit", text: "de majesteit", difficulty: 5 },
      { id: "specialiteit", text: "de specialiteit", difficulty: 5 },
      { id: "fonds", text: "fonds", difficulty: 4 },
      { id: "pronkstuk", text: "pronkstuk", difficulty: 3 },
      { id: "breedste", text: "breedste", difficulty: 4 },
    ],
  },
];

export const words = batches.flatMap((batch) => batch.words);

import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { batches, words } from "../src/words.js";
import { SESSION_SIZE, chooseWord, createSession, dueCount, emptyProgress, isCorrect, readProgress, recordAnswer, STORAGE_KEY } from "../src/practice.js";

test("first question starts near the middle of the difficulty range", () => {
  const selection = chooseWord(words, emptyProgress(), createSession());
  assert.equal(selection.word.difficulty, 3);
});

test("answers ignore casing and extra spaces, but retain spelling distinctions", () => {
  assert.equal(isCorrect("  DE   COLLECTIE ", "de collectie"), true);
  assert.equal(isCorrect("de kolektie", "de collectie"), false);
});

test("straight and curly apostrophes are equivalent, but an apostrophe is required", () => {
  assert.equal(isCorrect("'s zondags", "’s zondags"), true);
  assert.equal(isCorrect("‘s ochtends", "’s ochtends"), true);
  assert.equal(isCorrect(" DE  PARAPLU'S ", "de paraplu’s"), true);
  assert.equal(isCorrect("de menu’s", "de menu's"), true);
  assert.equal(isCorrect("s zondags", "’s zondags"), false);
  assert.equal(isCorrect("de paraplus", "de paraplu’s"), false);
  assert.equal(isCorrect("de kiloos", "de kilo’s"), false);
});

test("a missed word returns after other questions and stays due tomorrow", () => {
  const progress = emptyProgress();
  const session = createSession();
  const word = words.find((item) => item.id === "zondags");
  session.current = { word, retry: false };
  recordAnswer(progress, session, word, false, 1000);
  assert.equal(session.retries[0].after, 3);
  assert.notEqual(chooseWord(words, progress, session, 1000).word.id, word.id);
  session.answered = 3;
  session.seen.push("winters", "avonds");
  assert.equal(chooseWord(words, progress, session, 1000).word.id, word.id);
  session.current = { word, retry: true };
  recordAnswer(progress, session, word, true, 1000);
  assert.equal(progress.stats[word.id].dueAt, 1000 + 86400000);
});

test("session finishes after ten first attempts and any scheduled retries", () => {
  const progress = emptyProgress();
  const session = createSession();
  for (let i = 0; i < SESSION_SIZE; i++) {
    const selection = chooseWord(words, progress, session, 1000);
    assert.ok(selection);
    session.current = selection;
    recordAnswer(progress, session, selection.word, true, 1000);
  }
  assert.equal(chooseWord(words, progress, session, 1000), null);
});

test("every word has a unique ID and a bundled audio file", () => {
  assert.equal(words.length, 34);
  assert.equal(new Set(words.map((word) => word.id)).size, words.length);
  const manifest = JSON.parse(readFileSync(new URL("../audio/generation.json", import.meta.url), "utf8"));
  assert.deepEqual(manifest.words, Object.fromEntries(words.map((word) => [word.id, word.text])));
  for (const word of words) {
    const file = new URL(`../audio/${word.id}.mp3`, import.meta.url);
    assert.equal(existsSync(file), true, `${word.id} has no audio`);
    assert.ok(statSync(file).size > 1000, `${word.id} has empty audio`);
  }
});

test("the words on the second PDF page are included verbatim", () => {
  for (const [id, text] of [
    ["brutaliteit", "de brutaliteit"],
    ["puberteit", "de puberteit"],
    ["majesteit", "de majesteit"],
    ["specialiteit", "de specialiteit"],
    ["fonds", "fonds"],
    ["pronkstuk", "pronkstuk"],
    ["breedste", "breedste"],
  ]) {
    assert.equal(words.find((word) => word.id === id)?.text, text);
  }
});

test("saved Block 1 progress is retained without reactivating its words", () => {
  assert.deepEqual(batches.map((batch) => batch.id), ["groep6-blok2"]);
  const oldStat = { attempts: 2, correct: 1, streak: 0, misses: 1, dueAt: 0, lastAt: 0 };
  const storage = { getItem: (key) => key === STORAGE_KEY ? JSON.stringify({ level: 4, stats: { schrob: oldStat } }) : null };
  const progress = readProgress(storage);
  assert.deepEqual(progress.stats.schrob, oldStat);
  assert.equal(dueCount(words, progress, 1000), 0);
  assert.equal(words.filter((word) => progress.stats[word.id]).length, 0);
  const session = createSession();
  for (let i = 0; i < SESSION_SIZE; i++) {
    const selection = chooseWord(words, progress, session, 1000);
    assert.ok(selection);
    assert.notEqual(selection.word.id, "schrob");
    session.current = selection;
    recordAnswer(progress, session, selection.word, true, 1000);
  }
  assert.equal(chooseWord(words, progress, session, 1000), null);
});

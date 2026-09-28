import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, statSync } from "node:fs";
import { words } from "../src/words.js";
import { SESSION_SIZE, chooseWord, createSession, emptyProgress, isCorrect, recordAnswer } from "../src/practice.js";

test("first question starts near the middle of the difficulty range", () => {
  const selection = chooseWord(words, emptyProgress(), createSession());
  assert.equal(selection.word.difficulty, 3);
});

test("answers ignore casing and extra spaces, but retain spelling distinctions", () => {
  assert.equal(isCorrect("  DE   SCHUB ", "de schub"), true);
  assert.equal(isCorrect("de schup", "de schub"), false);
});

test("a missed word returns after other questions and stays due tomorrow", () => {
  const progress = emptyProgress();
  const session = createSession();
  const word = words.find((item) => item.id === "schrob");
  session.current = { word, retry: false };
  recordAnswer(progress, session, word, false, 1000);
  assert.equal(session.retries[0].after, 3);
  assert.notEqual(chooseWord(words, progress, session, 1000).word.id, word.id);
  session.answered = 3;
  session.seen.push("spinnenweb", "schub");
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
  assert.equal(words.length, 27);
  assert.equal(new Set(words.map((word) => word.id)).size, words.length);
  for (const word of words) {
    const file = new URL(`../audio/${word.id}.mp3`, import.meta.url);
    assert.equal(existsSync(file), true, `${word.id} has no audio`);
    assert.ok(statSync(file).size > 1000, `${word.id} has empty audio`);
  }
});

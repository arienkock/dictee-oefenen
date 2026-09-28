import { batches, words } from "./words.js";
import { SESSION_SIZE, chooseWord, createSession, dueCount, isCorrect, readProgress, recordAnswer, saveProgress } from "./practice.js";

const app = document.querySelector("#app");
const progress = readProgress(window.localStorage);
let session = null;
let audio = null;

const icons = {
  sound: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a10 10 0 0 1 0 14"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12h16m-6-6 6 6-6 6"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>',
};

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

function speak(word) {
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  audio = new Audio(new URL(`../audio/${word.id}.mp3`, import.meta.url));
  audio.onerror = () => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(word.text);
      utterance.lang = "nl-NL";
      utterance.rate = 0.85;
      const dutchVoice = window.speechSynthesis.getVoices().find((voice) => voice.lang.toLowerCase().startsWith("nl"));
      if (dutchVoice) utterance.voice = dutchVoice;
      window.speechSynthesis.speak(utterance);
    } else {
      const note = document.querySelector("#audio-note");
      if (note) note.textContent = "Geluid is hier niet beschikbaar. Probeer een andere browser.";
    }
  };
  audio.play().catch(() => {
    const note = document.querySelector("#audio-note");
    if (note) note.textContent = "Tik op ‘Luister nog eens’ om het woord te horen.";
  });
}

function renderHome() {
  session = null;
  const practiced = words.filter((word) => progress.stats[word.id]).length;
  const due = dueCount(words, progress);
  app.innerHTML = `
    <section class="hero">
      <div class="hero-copy">
        <div class="eyebrow"><span class="eyebrow-dot"></span> JOUW OEFENPLEK VOOR SPELLING</div>
        <h1>Goed spellen<br /><em>begint met luisteren.</em></h1>
        <p>Luister naar een woord, schrijf op wat je hoort en ontdek meteen hoe het ging. Lastige woorden komen vanzelf terug.</p>
        <button class="button button-primary" id="start-button">${practiced ? "Verder oefenen" : "Begin met oefenen"} ${icons.arrow}</button>
        <div class="hero-small">10 woorden per ronde <span aria-hidden="true">·</span> op jouw tempo</div>
      </div>
      <div class="hero-art" aria-hidden="true">
        <div class="art-orbit orbit-one"></div><div class="art-orbit orbit-two"></div>
        <div class="art-card"><span class="art-lines"><i></i><i></i><i></i></span><strong>luister<br /><span>schrijf</span><br />leer<span class="art-period">.</span></strong><span class="art-spark">✳</span></div>
        <span class="art-pencil">✎</span>
      </div>
    </section>
    <section class="dashboard" aria-label="Jouw voortgang">
      <div class="dashboard-heading"><div><div class="section-kicker">JOUW VOORTGANG</div><h2>Kleine stappen tellen op.</h2></div><span class="dashboard-caption">Bewaard op dit apparaat</span></div>
      <div class="stat-grid">
        <div class="stat-card mint"><span class="stat-icon" aria-hidden="true">◉</span><strong>${practiced}<span> / ${words.length}</span></strong><span>woorden geoefend</span></div>
        <div class="stat-card peach"><span class="stat-icon" aria-hidden="true">↺</span><strong>${due}</strong><span>${due === 1 ? "woord" : "woorden"} klaar om te herhalen</span></div>
        <div class="stat-card lavender"><span class="stat-icon" aria-hidden="true">✦</span><strong>${batches.length}</strong><span>woordenlijst beschikbaar</span></div>
      </div>
    </section>
    <section class="list-panel">
      <div class="list-icon" aria-hidden="true">Aa</div>
      <div><div class="section-kicker">DE EERSTE LIJST</div><h2>Groep 6 · Blok 1</h2><p>${words.length} woorden en zinnen uit de BLOON-lijst.</p></div>
      <details class="word-list"><summary>Bekijk de woorden <span aria-hidden="true">⌄</span></summary><div class="word-grid">${words.map((word) => `<span>${escapeHtml(word.text)}</span>`).join("")}</div></details>
    </section>
    <div class="method-note"><span aria-hidden="true">✳</span><p>Je begint bij woorden van gemiddelde moeilijkheid. Wat lastig is, oefen je later opnieuw — ook op een volgende dag.</p></div>
  `;
  document.querySelector("#start-button").addEventListener("click", startSession);
}

function startSession() {
  session = createSession();
  nextQuestion();
}

function nextQuestion() {
  if (!session) return;
  const selection = chooseWord(words, progress, session);
  if (!selection) return renderSummary();
  session.current = selection;
  session.phase = "question";
  renderQuestion();
  speak(selection.word);
}

function progressDots() {
  return Array.from({ length: SESSION_SIZE }, (_, i) => `<span class="progress-dot ${i < session.newCount ? "filled" : ""}"></span>`).join("");
}

function renderQuestion() {
  const { word, retry } = session.current;
  app.innerHTML = `
    <section class="practice-screen">
      <div class="practice-top"><button class="text-button" id="home-button">← Terug naar begin</button><span class="round-label">GROEP 6 · BLOK 1</span></div>
      <div class="practice-layout">
        <aside class="progress-card"><div class="section-kicker">DEZE RONDE</div><strong>${Math.min(session.newCount + (retry ? 0 : 1), SESSION_SIZE)} <span>/ ${SESSION_SIZE}</span></strong><div class="progress-dots" aria-hidden="true">${progressDots()}</div><p>${retry ? "Een lastig woord komt terug. Je kunt het!" : "Neem rustig de tijd. Je kunt zo vaak luisteren als je wilt."}</p><div class="progress-decoration" aria-hidden="true">✳</div></aside>
        <div class="question-card"><div class="question-step">${retry ? "NOG EEN KEER" : `WOORD ${Math.min(session.newCount + 1, SESSION_SIZE)} VAN ${SESSION_SIZE}`}</div><h1>Wat hoor je?</h1><p>Luister goed en typ de hele zin of het hele woord.</p>
          <button class="listen-button" id="listen-button" type="button"><span class="listen-icon">${icons.sound}</span><span><strong>Luister naar het woord</strong><small>Je mag zo vaak luisteren als je wilt</small></span><span class="sound-waves" aria-hidden="true">)))</span></button>
          <div id="audio-note" class="audio-note" role="status"></div>
          <form id="answer-form" novalidate><label for="answer">Jouw antwoord</label><input id="answer" name="answer" type="text" autocomplete="off" autocapitalize="none" spellcheck="false" inputmode="text" placeholder="Typ hier wat je hoort..." required /><div id="input-error" class="input-error" role="alert"></div><button class="button button-primary answer-button" type="submit">Controleer antwoord ${icons.arrow}</button></form>
        </div>
      </div>
    </section>`;
  document.querySelector("#home-button").addEventListener("click", renderHome);
  document.querySelector("#listen-button").addEventListener("click", () => speak(word));
  document.querySelector("#answer-form").addEventListener("submit", submitAnswer);
  document.querySelector("#answer").focus();
}

function submitAnswer(event) {
  event.preventDefault();
  const input = document.querySelector("#answer");
  if (!input.value.trim()) {
    document.querySelector("#input-error").textContent = "Typ eerst wat je hoort.";
    input.focus();
    return;
  }
  const { word } = session.current;
  const correct = isCorrect(input.value, word.text);
  recordAnswer(progress, session, word, correct);
  saveProgress(window.localStorage, progress);
  session.phase = "feedback";
  renderFeedback(correct, input.value.trim());
}

function renderFeedback(correct, typed) {
  const { word } = session.current;
  app.innerHTML = `
    <section class="feedback-screen">
      <div class="feedback-card ${correct ? "right" : "wrong"}"><div class="feedback-symbol" aria-hidden="true">${correct ? icons.check : "↺"}</div><div class="section-kicker">${correct ? "GOED GEDAAN" : "BIJNA!"}</div><h1>${correct ? "Helemaal goed!" : "Dit woord oefenen we nog eens."}</h1><p>${correct ? "Knap gehoord en geschreven. Op naar het volgende woord." : "Kijk naar de juiste spelling. Je krijgt het later in deze ronde opnieuw te horen."}</p>
        <div class="answer-comparison">${correct ? "<span>Het juiste antwoord</span>" : `<span>Jij schreef</span><strong class="typed-answer">${escapeHtml(typed)}</strong><span>Zo schrijf je het</span>`}<strong class="correct-answer">${escapeHtml(word.text)}</strong></div>
        ${correct ? `<button class="button button-primary" id="next-button">Volgende woord ${icons.arrow}</button>` : `<form id="correction-form" novalidate><label for="correction">Schrijf het juiste antwoord nog één keer</label><input id="correction" type="text" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="Typ het juiste antwoord..." /><div id="correction-error" class="input-error" role="alert"></div><button class="button button-primary" type="submit">Ga verder ${icons.arrow}</button></form>`}
        <button class="replay-link" id="replay-button" type="button">${icons.sound} Luister nog eens</button>
      </div>
    </section>`;
  document.querySelector("#replay-button").addEventListener("click", () => speak(word));
  if (correct) document.querySelector("#next-button").addEventListener("click", nextQuestion);
  else {
    const form = document.querySelector("#correction-form");
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const input = document.querySelector("#correction");
      if (isCorrect(input.value, word.text)) nextQuestion();
      else {
        document.querySelector("#correction-error").textContent = "Kijk nog eens goed naar het juiste antwoord hierboven.";
        input.focus();
      }
    });
    document.querySelector("#correction").focus();
  }
}

function renderSummary() {
  const first = session.firstTryCorrect;
  const tricky = Object.keys(session.retryAttempts).length;
  app.innerHTML = `
    <section class="summary-screen"><div class="summary-art" aria-hidden="true">✳</div><div class="section-kicker">RONDE AFGEROND</div><h1>Mooi geoefend!</h1><p>Je hebt ${SESSION_SIZE} woorden geoefend. Woorden die nog lastig zijn, blijven op je wachten voor een volgende ronde.</p><div class="summary-stats"><div><strong>${first} / ${SESSION_SIZE}</strong><span>direct goed</span></div><div><strong>${tricky}</strong><span>${tricky === 1 ? "woord herhaald" : "woorden herhaald"}</span></div></div><div class="summary-actions"><button class="button button-primary" id="again-button">Nog een ronde ${icons.arrow}</button><button class="button button-secondary" id="finish-button">Terug naar begin</button></div></section>`;
  document.querySelector("#again-button").addEventListener("click", startSession);
  document.querySelector("#finish-button").addEventListener("click", renderHome);
}

renderHome();

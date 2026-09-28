# Dicteeclub

Een statische Nederlandstalige webapp voor het oefenen van dicteewoorden. De eerste lijst is **BLOON Groep 6, blok 1** (27 woorden en zinnen uit de aangeleverde foto).

**Live app:** <https://arienkock.github.io/dictee-oefenen/>

## Lokaal starten

```sh
npm run serve
```

Open <http://localhost:4173>. Er is geen buildstap of account nodig. `npm test` controleert de oefenlogica.

## Hoe het oefenen werkt

- Een ronde bevat 10 eerste pogingen. De eerste ronde begint bij moeilijkheid 3 van 5.
- De app dicteert de hele tekst, inclusief lidwoord of onderwerp. Het antwoord verschijnt pas na controle.
- Een fout antwoord krijgt direct de juiste spelling. De leerling schrijft die over en hoort het woord na twee andere vragen opnieuw. Er zijn maximaal twee extra pogingen per woord in een ronde.
- Goede antwoorden krijgen een volgende oefendatum na 1, 3, 7, 14 of 30 dagen, afhankelijk van de reeks goede antwoorden. Na een fout is het woord weer direct aan de beurt in een volgende ronde.
- De selectie geeft voorrang aan woorden die aan herhaling toe zijn. Nieuwe woorden liggen zo dicht mogelijk bij het huidige niveau, dat langzaam meebeweegt met eerste pogingen.
- Voortgang staat alleen in `localStorage` van de browser op dit apparaat. Wisselen van apparaat of browser neemt de voortgang niet mee.

De combinatie van **ophalen uit het geheugen met directe correctie** en **gespreid oefenen** is gebaseerd op [onderzoek naar spelling bij kinderen](https://pubmed.ncbi.nlm.nih.gov/37605436/) en een [brede review van leertechnieken](https://www.psychologicalscience.org/publications/journals/pspi/learning-techniques.html). De specifieke intervallen en niveauverandering zijn ontwerpkeuzes, geen afzonderlijk bewezen optimale waarden.

## Woorden toevoegen

Voeg een nieuwe lijst toe aan `src/words.js`. Geef elk woord een blijvend unieke `id`, de precies te dicteren `text`, en `difficulty` van 1 tot 5. Maak daarna audio met de [Piper-stem `nl_NL-mls-medium`](https://huggingface.co/rhasspy/piper-voices/blob/main/nl/nl_NL/mls/medium/MODEL_CARD): installeer `piper-tts` en `ffmpeg`, download het model met `python -m piper.download_voices --data-dir /tmp/dictee-voice nl_NL-mls-medium` en voer `python scripts/generate-audio.py /tmp/dictee-voice/nl_NL-mls-medium.onnx` uit. De MP3-bestanden in `audio/` horen bij de statische site. Als een bestand ontbreekt, probeert de app de Nederlandse stem van de browser.

De opnames zijn gemaakt met Piper en de Nederlandse MLS-spraakdataset ([CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)); stem/model: `rhasspy/piper-voices`, `nl_NL-mls-medium`, spreker 7432. Deze bronvermelding hoort bij verspreiding van de opnames.

## GitHub Pages

De workflow in `.github/workflows/pages.yml` test en publiceert automatisch op elke push naar `main`. Voor een kopie van deze repository: kies bij **Settings → Pages → Build and deployment** de bron **GitHub Actions**. Alle paden zijn relatief, zodat de app ook onder een repository-pad werkt.

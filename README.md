# Party Pantry 🎉

La dispensa condivisa della festa: chi porta cosa, cosa sta finendo, quanto avete speso e come pareggiare i conti. Tutto in tempo reale.

**Stack:** React 19 · Vite 6 · Tailwind CSS 4 · Firebase (Auth + Firestore) · Recharts.

## Funzionalità

| Sezione | Cosa offre |
| --- | --- |
| **Panoramica** | Avvisi (richieste, scorte basse, scadenze), indicatori chiave, mix cibo/bevande, spesa per categoria e per persona, ultimi movimenti |
| **Dispensa** | Ricerca, filtri rapidi (cibo, bevande, sta finendo, in scadenza, portati da me), filtri per categoria/persona, ordinamento, vista griglia o elenco |
| **Lista della spesa** | Si compila da sola con i prodotti finiti o sotto soglia; spunta, «Comprato» per rifornire, copia della lista da incollare in chat |
| **Partecipanti** | Membri con account e ospiti senza account, gruppi e compiti, cosa ha portato ognuno |
| **Richieste** | I partecipanti chiedono prelievi/rifornimenti, gli organizzatori approvano (con controllo delle scorte); approvazione dei nuovi membri |
| **Movimenti** | Cronologia per giorno; registrazione di movimenti con più prodotti che aggiorna le quantità |
| **Contributi e spese** | Spesa per persona, quota a testa, «chi dà quanto a chi» per pareggiare i conti, esportazione CSV per Excel |
| **Registro attività** | Chi ha fatto cosa (solo organizzatori) |
| **Impostazioni** | Nome della festa, codice e link di invito (rigenerabile), permessi dei membri, categorie/gruppi/compiti, uscita o eliminazione della festa |

Inoltre: link di invito diretti (`#/invito/CODICE`), tema chiaro/scuro, URL condivisibili per ogni sezione, layout mobile con barra in basso.

### Ruoli

- **Creatore** della festa: tutto, compresa la promozione a organizzatore.
- **Organizzatore**: gestisce prodotti, partecipanti, richieste e approva i nuovi membri.
- **Partecipante**: aggiunge prodotti propri o in comune, modifica quelli che porta, invia richieste di movimento.
- **In attesa**: chi è entrato con il codice e aspetta l'approvazione. Può solo vedere la schermata di attesa.

Le regole sono applicate anche lato server in `firestore.rules`.

## Sviluppo

```bash
npm install
npm run dev
```

La configurazione Firebase viene letta da `firebase-applet-config.json` (locale, non versionato) oppure dalle variabili `VITE_FIREBASE_*` (vedi `.env.example`).

### Con gli emulatori (nessun dato reale)

Serve Java. In tre terminali:

```bash
npm run emulators
npm run seed:emulator
npm run dev:emulator
```

Accedi con `giulia@demo.it` / `festa123` (organizzatrice). Altri account: `marco@demo.it`, `sara@demo.it`, `luca@demo.it` (in attesa).

### Test delle regole Firestore

```bash
npm run test:rules
```

## Deploy

Ogni push su `main` pubblica su GitHub Pages (`.github/workflows/deploy.yml`). Crea i secret `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_FIRESTORE_DATABASE_ID` in **Settings → Secrets and variables → Actions**, e abilita Pages sul ramo `gh-pages`.

> **Ricorda di pubblicare le nuove regole:** `npx firebase deploy --only firestore:rules --project <id-progetto>`. Senza questo passaggio la falla sui ruoli resta aperta in produzione.

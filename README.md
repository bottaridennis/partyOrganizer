# Party Pantry Manager - Deploy Guide

Questa guida spiega come configurare il deploy automatico su GitHub Pages o Firebase Hosting.

## 1. Configurazione GitHub Secrets

Per far funzionare il deploy automatico tramite GitHub Actions, devi aggiungere i seguenti Secrets nel tuo repository GitHub (**Settings > Secrets and variables > Actions > New repository secret**):

| Secret Name | Descrizione |
|-------------|-------------|
| `VITE_FIREBASE_API_KEY` | La tua Firebase API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID |
| `VITE_FIREBASE_APP_ID` | Firebase App ID |
| `VITE_FIREBASE_FIRESTORE_DATABASE_ID` | ID del database Firestore (solitamente `(default)`) |

## 2. Deploy su GitHub Pages

Il workflow è già configurato nel file `.github/workflows/deploy.yml`. 
Ogni volta che farai un `push` sul ramo `main`, GitHub Actions:
1. Installerà le dipendenze.
2. Eseguirà il build dell'app iniettando i Secrets.
3. Pubblicherà il contenuto della cartella `dist` sul ramo `gh-pages`.

**Nota:** Assicurati di abilitare GitHub Pages nelle impostazioni del repository, selezionando il ramo `gh-pages` come sorgente.

### Importante: Percorso Base (Base Path)
Se il tuo sito sarà ospitato su un percorso come `https://utente.github.io/nome-repo/`, devi aggiornare il file `vite.config.ts` aggiungendo la proprietà `base`:

```typescript
export default defineConfig({
  base: '/nome-repo/',
  // ... altre config
})
```

## 3. Sviluppo Locale

Per lo sviluppo locale, l'app continuerà a usare il file `firebase-applet-config.json`. Se preferisci usare le variabili d'ambiente, crea un file `.env.local` basandoti su `.env.example`.

## 4. Firebase Hosting (Opzionale)

Se preferisci usare Firebase Hosting invece di GitHub Pages:
1. Installa firebase-tools: `npm install -g firebase-tools`
2. Inizializza il progetto: `firebase init hosting`
3. Usa il workflow di deploy ufficiale di Firebase fornito dal comando `firebase init`.

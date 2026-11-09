# Analogista Virtuale
## Documentazione tecnica, funzionale e operativa completa

**Repository:** `Analogista/1.0-Analogista-Virtuale`  
**Branch di riferimento:** `main`  
**Commit verificato:** `d79ed48` — `fix: read full TAP profile aloud`  
**Tag di riferimento precedente:** `build-28`  
**Tecnologia principale:** React 19 + TypeScript + Vite  
**Lingua interfaccia e guida vocale:** italiano  
**Copyright applicativo dichiarato dal codice:** © 2026 Max Pisani – PACommunication

> Questo documento descrive lo stato effettivamente presente nel repository al commit indicato. È destinato a sviluppatori, agenti IA, manutentori, collaudatori e allo Studio IA che deve sincronizzare o replicare l’applicazione.

---

## 1. Scopo dell’applicazione

Analogista Virtuale è una web app/PWA interattiva che guida l’utente attraverso una serie di test basati sulle Discipline Analogiche. L’utente compila i propri dati, si posiziona davanti alla webcam e risponde alle domande mediante oscillazioni corporee in avanti o all’indietro.

La convenzione principale di rilevazione è:

- **oscillazione in avanti = SÌ / gradimento**;
- **oscillazione all’indietro = NO / rifiuto**;
- **assenza di movimento sufficiente = NEUTRO o NON_RILEVATO**, a seconda del test e della logica applicata;
- **risposta non interpretabile o parità dove è richiesta una risposta univoca = NON_RILEVATO**.

L’app combina:

1. dati anagrafici e problema dichiarato dall’utente;
2. calibrazione webcam;
3. rilevazione del movimento tramite MediaPipe Pose Landmarker;
4. guida vocale e, dove previsto, riconoscimento della risposta tramite movimento;
5. test singoli e percorso completo;
6. salvataggio locale della sessione;
7. report finale, PDF, analisi deterministica e analisi AI opzionale;
8. salvataggio remoto delle sessioni tramite Firebase Firestore.

### Avvertenza metodologica

Le tipologie e le interpretazioni riportate dall’app appartengono al modello applicativo delle Discipline Analogiche e non costituiscono, da sole, diagnosi medica, psicologica o psichiatrica. L’app non deve essere presentata come dispositivo clinico validato senza una specifica validazione scientifica, tecnica e regolatoria.

---

## 2. Stato reale del repository

Al momento della stesura, il repository GitHub `main` punta a:

```text
d79ed48 fix: read full TAP profile aloud
```

Cronologia funzionale recente:

```text
d79ed48  Lettura vocale completa del profilo T.A.P.
fcdab33  Profili interpretativi dettagliati del T.A.P.
dc4661f  Simboli T.A.P. neri pieni, sagoma disattivata nel solo T.A.P.
e718976  Separazione test singoli e unificazione del ciclo 10–11–12
faf53e0  Correzione di avvio del Test 9 con fallback remoto precedente
6ff602e  Hardening calibrazione mobile e filtro serviceId
```

Tag di sicurezza disponibili:

```text
pre-tap-profiles-dc4661f
pre-unified-single-tests-6ff602e
pre-final-hardening-build-23
```

Il tag `pre-tap-profiles-dc4661f` rappresenta lo stato precedente all’integrazione dei profili vocali T.A.P. Il rollback deve essere eseguito solo da un operatore che conosca Git e dopo aver salvato eventuali modifiche locali.

---

## 3. Architettura generale

### 3.1 Frontend

Il frontend è composto da:

- React 19;
- TypeScript;
- React Router DOM 6;
- Tailwind CSS 4 tramite plugin Vite;
- Vite 6;
- PWA tramite `vite-plugin-pwa`;
- Lucide React per icone;
- `react-hot-toast` per notifiche;
- jsPDF per esportazione PDF;
- `@mediapipe/tasks-vision` per Pose Landmarker;
- `@google/genai` per l’analisi AI opzionale.

### 3.2 Stato globale

Lo stato utente è gestito da `src/contexts/UserContext.tsx`.

Provider principali montati in `src/App.tsx`:

```text
AuthProvider
└── ApiKeyProvider
    └── UserProvider
        └── HeaderProvider
            └── AuthGate
                └── AppContent
```

### 3.3 Persistenza locale

`UserContext` salva l’intero oggetto `userData` in:

```text
localStorage['userData']
```

Viene inoltre utilizzato:

```text
localStorage['GOOGLE_API_KEY']
localStorage['wizardStep']
```

`wizardStep` serve a riprendere il Percorso Completo dopo un’interruzione.

### 3.4 Backend

`server.ts` avvia Express sulla porta 3000 e gestisce:

- `GET /api/health`;
- `POST /api/auth/sync`, protetto da token Firebase, per sincronizzare l’utente con PostgreSQL tramite Drizzle.

In sviluppo Express monta il middleware Vite. In produzione serve la cartella `dist` e il fallback SPA `index.html`.

---

## 4. Avvio dell’app e autenticazione

### 4.1 Entry point

```text
src/index.tsx
```

carica l’app React nel nodo `#root` definito in `index.html`.

### 4.2 AuthContext

`src/contexts/AuthContext.tsx` usa Firebase Auth e Google Sign-In.

Espone:

- `user`;
- `loading`;
- `isAdmin`;
- `error`;
- `loginWithGoogle()`;
- `logout()`;
- `clearError()`.

L’utente amministratore è identificato attualmente dal codice tramite l’indirizzo:

```text
analogistabrindisi@gmail.com
```

### 4.3 AuthGate attuale

`src/components/AuthGate.tsx` attualmente restituisce direttamente i figli:

```tsx
return <>{children}</>;
```

Quindi il gate non blocca autonomamente l’accesso. Firebase Auth viene comunque usato nelle sezioni che richiedono sessioni remote e storico.

### 4.4 API key AI/TTS

`ApiKeyContext` adotta un modello “Bring Your Own Key”:

1. cerca `GOOGLE_API_KEY` in localStorage;
2. cerca una chiave eventualmente fornita da Google AI Studio tramite `window.aistudio.selectedApiKey`;
3. non carica automaticamente le variabili d’ambiente nel browser pubblico;
4. non contiene una chiave hardcoded valorizzata.

La chiave può essere utilizzata per:

- Google Gemini nell’analisi finale;
- Google Cloud Text-to-Speech;
- eventuali servizi vocali integrati.

Le chiavi browser devono essere limitate per dominio, API e quota nella console Google Cloud.

---

## 5. Navigazione dell’app

Le rotte principali definite in `src/App.tsx` sono:

| Rotta | Schermata | Funzione |
|---|---|---|
| `/` | `Dashboard` | Home, menu, percorso e test singoli |
| `/risultati` | `Risultati` | Report, analisi, PDF e salvataggio sessione |
| `/chat` | `LiveChat` / `VideoCorso` | Area conversazionale/video corso |
| `/history` | `History` | Storico sessioni Firestore |
| `/contatti` | `Contatti` | Contatti e consulenza |

I test sono gestiti principalmente come schermate interne alla `Dashboard`, usando `activeTest`, non come rotte separate.

### 5.1 Menu principale

Il menu `tests` di `Dashboard.tsx` contiene:

#### Sezione informativa

1. `Chi sono` — `ChiSono.tsx`;
2. `Introduzione alla App` — `Introduzione.tsx`;
3. `Come Posizionarsi per i Test` — `LaTecnica.tsx`.

#### Dati iniziali

- `ChiSei.tsx` — nome, età, genere e problema da risolvere.

#### Preparazione

- `CalibrazioneScreen.tsx`.

#### T.A.P.

- `TestTAP.tsx`.

Il T.A.P. è presente nel menu dei test, ma non è incluso nella sequenza interna di `PercorsoCompleto.tsx`. È quindi un test separato rispetto al percorso guidato.

#### Test singoli

- Test Induttore;
- Test Nome;
- Punti Distonici;
- Sigilli e Vincoli;
- Indagine singola 10–11–12.

I vecchi componenti separati `CalcolaTimeLine.tsx`, `QualeGiorno.tsx` e `TestimoneChiave.tsx` restano nel repository per compatibilità, ma il menu corrente usa `IndagineSingola.tsx` come ciclo unico 10–11–12.

---

## 6. I due percorsi funzionali

## 6.1 Percorso Completo

Il Percorso Completo è implementato in:

```text
src/screens/PercorsoCompleto.tsx
```

È un wizard guidato e sequenziale.

Ordine effettivo del wizard:

1. calibrazione;
2. Test Induttore;
3. Test Nome;
4. Punti Distonici;
5. Sigilli e Vincoli;
6. Grande Indagine finale: età, giorno, testimone e reazione al torto.

Il T.A.P. non viene richiamato dentro questo wizard nella versione corrente del file.

Il wizard:

- salva il numero dello step in `localStorage['wizardStep']`;
- può proporre di riprendere lo step precedente;
- usa `onNext` per passare allo step successivo;
- consente di uscire e salvare lo stato;
- rimuove `wizardStep` al completamento.

### 6.1.1 Condizioni iniziali

Il percorso controlla che siano presenti almeno:

- `userData.nome`;
- `userData.eta`.

Se mancano, riporta l’utente alla home per compilare i dati.

### 6.1.2 Grande Indagine del wizard

La fase finale del wizard è più articolata del test singolo 10–11–12:

1. ricerca binaria dell’età dell’evento;
2. conferma esplicita dell’età trovata;
3. calcolo della Time Line;
4. ricerca della stagione;
5. ricerca del mese;
6. ricerca binaria del giorno;
7. ricerca del genere del testimone;
8. ricerca della figura specifica;
9. eventuale distinzione paterna/materna per parenti ambigui;
10. domanda sulla giustificazione del torto;
11. salvataggio di `giustificatoTorto`;
12. messaggio finale.

Il wizard usa anche `userData.sigilloFinale` e `userData.puntoDistonicoFinale` nella frase introduttiva dell’indagine.

---

## 6.2 Test Singoli

I test singoli sono indipendenti dal wizard. Non devono richiedere il completamento degli altri test, salvo eventuali condizioni interne esplicite del singolo componente.

### Test 8 e Test 9

La separazione è gestita tramite la prop:

```tsx
isWizard
```

- `isWizard={true}`: comportamento del Percorso Completo;
- `isWizard={false}` o assente: comportamento autonomo del test singolo.

Nel Test 9, il prerequisito di `puntoDistonicoFinale` è applicato solo quando `isWizard` è true.

---

## 7. Modello dati `UserData`

Il modello principale è definito in `src/types.ts`.

Campi principali:

```ts
interface UserData {
  nome: string;
  eta: string;
  genere: 'MASCHIO' | 'FEMMINA' | '';
  problema: string;

  testTAP?: {
    results: Record<'asta' | 'cerchio' | 'triangolo', Reaction>;
    diagnosis: TapDiagnosis;
  };

  testInduttore: {
    manoDestra: 'Avanti' | 'Indietro' | '';
    manoSinistra: 'Avanti' | 'Indietro' | '';
  };

  induttoreResult: 'Destro' | 'Sinistro' | '';

  testNome: {
    nomeVero: Reaction;
    nomeFalso: Reaction;
  };

  puntiDistonici: {
    famiglia: Reaction;
    sentimentali: Reaction;
    sessuali: Reaction;
    autorealizzazione: Reaction;
  };

  puntoDistonicoFinale: string;

  sigilli: {
    colpa: Reaction;
    abbandono: Reaction;
    disistima: Reaction;
    giudizio: Reaction;
  };

  sigilloFinale: string;
  timeLine: TimeLineData;
  testimoneChiave: string;
  giornoEvento: string;
  giustificatoTorto: Reaction;
  completedTests?: Record<string, boolean>;
  aiSummary?: string;
  hasContactedMax?: boolean;
  liveChatHistory?: { user: string; model: string }[];
}
```

`Reaction` comprende normalmente:

```text
SI | NO | NEUTRO | NON_RILEVATO | ''
```

### Indicatori `completedTests`

Sono usati per il progresso e per lo stato del percorso:

- `chiSei`;
- `calibrazione`;
- `tap`;
- `induttore`;
- `nome`;
- `puntiDistonici`;
- `sigilli`;
- `timeLine`;
- `testimone`;
- `qualeGiorno`;
- `indagineSingola`.

---

## 8. Webcam e rilevazione del movimento

## 8.1 `CameraView.tsx`

Componente principale per:

- richiesta permesso webcam;
- visualizzazione video;
- avvio MediaPipe;
- calibrazione;
- visualizzazione landmark;
- barra di profondità;
- feedback SÌ/NO;
- silhouette opzionale;
- invio degli eventi ai test.

### Accesso camera

Prima prova:

```ts
navigator.mediaDevices.getUserMedia({
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    facingMode: 'user'
  }
})
```

In caso di errore, esegue fallback:

```ts
navigator.mediaDevices.getUserMedia({ video: true })
```

La pagina deve essere servita in HTTPS, salvo `localhost`, perché i browser mobili normalmente bloccano `getUserMedia` in contesti non sicuri.

### Silhouette

La prop è:

```tsx
showSilhouette?: boolean
```

Valore predefinito:

```tsx
showSilhouette = true
```

Quindi tutti gli altri test mantengono la sagoma.

Il T.A.P. usa esplicitamente:

```tsx
showSilhouette={false}
```

Questo elimina la sagoma esclusivamente dal T.A.P. senza alterare la webcam degli altri test.

### Landmark disegnati

La CameraView disegna su canvas:

- naso;
- spalla sinistra;
- spalla destra;
- linea tra centro spalle e naso;
- punti colorati sui landmark principali.

Il canvas viene specchiato come il video.

---

## 8.2 `MotionDetectionService.ts`

Il servizio usa:

```text
@mediapipe/tasks-vision
PoseLandmarker
FilesetResolver
```

Modello remoto:

```text
pose_landmarker_lite/float16/1/pose_landmarker_lite.task
```

WASM remoto:

```text
https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm
```

### Delegate GPU/CPU

Inizializzazione primaria:

```text
GPU
```

Se GPU fallisce:

```text
CPU
```

Il fallback è implementato in `initialize()` tramite `try/catch`.

### Identificatore del servizio

Ogni istanza genera un ID:

```ts
Math.random().toString(36).substring(2, 9)
```

Gli eventi includono:

```ts
{ serviceId, direction, intensity }
```

I componenti filtrano gli eventi in base al proprio `serviceId`, evitando interferenze tra istanze multiple.

### Stima della profondità

Il servizio usa:

- naso `landmarks[0]`;
- spalla sinistra `landmarks[11]`;
- spalla destra `landmarks[12]`.

Calcola:

1. centro delle spalle;
2. larghezza delle spalle;
3. distanza naso-centro spalle;
4. valore di profondità composto:

```text
depth = shoulderWidth * 0.7 + noseToSpineDistance * 0.3
```

Se la visibilità di naso o spalle è inferiore a 0.5, il campione viene scartato.

### Smoothing

Parametro attuale:

```text
smoothingFactor = 0.8
```

La profondità filtrata è calcolata come:

```text
smoothed = previous * 0.8 + raw * 0.2
```

### Sensibilità

La sensibilità UI è normalizzata tra 0 e 100 e convertita in soglia:

```text
threshold = 0.05 - (sensitivity / 100) * 0.045
```

La soglia minima teorica con sensibilità 100 è 0.005; con sensibilità 0 è 0.05.

### Isteresi

Parametro:

```text
hysteresisFactor = 0.4
```

La soglia di ritorno al centro è:

```text
returnThreshold = threshold * 0.4
```

Questo impedisce che piccole oscillazioni attorno alla soglia generino continuamente eventi duplicati.

### Debounce

Il servizio usa:

```text
audioDebounce = 600 ms
```

Un nuovo evento viene emesso solo se:

- la direzione è diversa dalla precedente;
- è trascorso il debounce;
- la profondità supera la soglia.

### Eventi browser

Gli eventi principali sono:

```text
movementDetected
```

Dettaglio:

```ts
{
  serviceId,
  direction: 'forward' | 'backward',
  intensity
}
```

```text
depthUpdate
```

Dettaglio:

```ts
{
  serviceId,
  depth,
  delta,
  neutral,
  threshold
}
```

```text
landmarksProcessed
```

Dettaglio:

```ts
{
  serviceId,
  landmarks
}
```

```text
movementCenterUpdate
```

Dettaglio:

```ts
{
  serviceId,
  center: { x, y }
}
```

---

## 9. Calibrazione

La calibrazione visibile utilizza:

1. countdown di 5 secondi;
2. stop temporaneo del rilevamento;
3. raccolta di campioni per circa 1500 ms;
4. minimo 8 campioni richiesti;
5. calcolo della deviazione standard;
6. soglia massima di deviazione standard `0.012`;
7. mediana dei campioni come posizione neutra.

La calibrazione fallisce se:

- MediaPipe non è pronto;
- il video non è disponibile;
- non ci sono almeno 8 campioni;
- la deviazione standard supera `0.012`.

Messaggio di errore tipico:

```text
Non ho rilevato abbastanza punti del corpo. Resta fermo, migliora la luce e riprova.
```

### Condizioni consigliate di utilizzo

- telefono stabile, preferibilmente su supporto;
- dispositivo all’altezza del busto;
- luce frontale uniforme;
- volto e spalle visibili;
- distanza sufficiente per inquadrare almeno dalla vita alla testa;
- abiti non completamente confusi con lo sfondo;
- nessuna persona aggiuntiva nell’inquadratura;
- browser aggiornato e permesso camera concesso.

---

## 10. Guida vocale e risposte

## 10.1 `AdvancedVoiceService.ts`

Il servizio coordina:

- Speech Synthesis del browser;
- Text-to-Speech nativo Capacitor, quando disponibile;
- Google Cloud Text-to-Speech, se API key presente;
- fallback voce browser;
- rilevazione manuale;
- domande con attesa risposta;
- timeout;
- pausa, ripresa e annullamento.

### `askQuestion()`

Il metodo:

1. pronuncia la domanda;
2. avvia il rilevamento dopo una breve pausa;
3. attende un movimento;
4. traduce `forward` in `SI`;
5. traduce `backward` in `NO`;
6. restituisce `NON_RILEVATO` allo scadere del timeout.

Timeout attuale:

```text
12 secondi
```

### Mappatura vocale

```text
forward  → SI
backward → NO
timeout  → NON_RILEVATO
```

### Compatibilità mobile

Su dispositivi iOS e Android il comportamento vocale può dipendere da:

- permessi audio;
- gesto iniziale dell’utente;
- browser utilizzato;
- autoplay policy;
- disponibilità di Speech Synthesis;
- eventuale plugin Capacitor in versione app nativa.

Il test deve sempre essere avviato con un’interazione esplicita dell’utente.

---

## 11. Test T.A.P.

File principali:

```text
src/screens/TestTAP.tsx
src/utils/tapEngine.ts
```

### 11.1 Sequenza

La sequenza è:

1. Cerchio;
2. Asta;
3. Triangolo.

Ogni simbolo resta attivo per:

```text
2 cicli × 6 secondi = 12 secondi
```

La rilevazione conta gli eventi:

- `forwardCount`;
- `backwardCount`.

Classificazione per simbolo:

| Condizione | Risultato |
|---|---|
| SÌ e NO entrambi zero | `NEUTRO` |
| SÌ e NO in parità | `NON_RILEVATO` |
| SÌ maggiore di NO | `SI` |
| NO maggiore di SÌ | `NO` |

Se un simbolo è `NEUTRO`, `NON_RILEVATO` o vuoto, la diagnosi complessiva non è valida e il test deve essere ripetuto.

### 11.2 Overlay T.A.P.

Nel T.A.P.:

- la sagoma umana è disattivata;
- il Cerchio è un disco nero pieno;
- l’Asta è un rettangolo nero pieno;
- il Triangolo è un triangolo nero pieno;
- l’animazione usa trasformazioni 3D e due cicli;
- sono stati ridotti filtri grafici costosi per limitare gli scatti su mobile.

Il checkbox “Simbolo in overlay su Webcam” consente di mostrare o nascondere l’overlay del simbolo.

### 11.3 Diagnosi

`computeTapDiagnosis()` usa:

- genere selezionato;
- simbolo con risposta `SI`;
- simboli con risposta `NO`;
- ordine e combinazione dei referenti.

Il motore distingue tabelle maschili e femminili e produce tipologie come:

- Conflittuale Padre dell’Essere;
- Conflittuale Madre dell’Avere;
- Ego-Maschio dell’Essere Base;
- Ego-Femmina dell’Avere Base;
- Conflittuale Madre dell’Essere;
- Conflittuale Padre dell’Avere;
- Ego-Maschio dell’Avere Base;
- Ego-Femmina dell’Essere Base;
- Ego Triadico dell’Essere.

### 11.4 Profilo interpretativo

`enrichTapDiagnosis()` aggiunge, solo per diagnosi valide:

- famiglia evolutiva;
- referente simbolico;
- origine;
- stile comportamentale;
- dinamica relazionale;
- polarità;
- meccanismo;
- orientamento.

Polarità interpretative:

#### Distonia dell’Essere

- Yin;
- passivo / role down;
- auto-attribuzione;
- orientamento al desiderio e al sogno;
- tempi più graduali.

#### Distonia dell’Avere

- Yang;
- attivo / role up;
- etero-attribuzione;
- orientamento al possesso e al bisogno;
- passaggio rapido all’azione.

#### Equilibrio triadico

- integrazione;
- complementarità;
- equilibrio tra referenti.

### 11.5 Risultato al soggetto

La schermata mostra:

- denominazione della tipologia;
- distonia;
- famiglia e referente;
- polarità;
- origine interpretativa;
- stile comportamentale;
- dinamica relazionale;
- meccanismo;
- orientamento.

La voce finale legge:

1. tipologia;
2. famiglia evolutiva;
3. referente simbolico;
4. polarità;
5. origine;
6. stile comportamentale;
7. dinamica diagnostica;
8. dinamica relazionale;
9. meccanismo;
10. orientamento.

La diagnosi viene salvata in:

```text
userData.testTAP
```

---

## 12. Test Induttore

File:

```text
src/screens/TestInduttore.tsx
```

Il test usa due domande:

1. mano destra;
2. mano sinistra.

L’utente sfrega il pollice con le altre dita mentre il servizio rileva l’oscillazione.

Mappatura:

- destra avanti + sinistra indietro → `Destro`;
- destra indietro + sinistra avanti → `Sinistro`;
- altra combinazione → risultato non valido e ripetizione consigliata.

Interpretazione applicativa:

- Induttore Destro → fase istituzionale, regole, ordine e dovere;
- Induttore Sinistro → fase trasgressiva, piacere, istinto e libertà.

Salvataggio:

```text
userData.testInduttore
userData.induttoreResult
completedTests.induttore
```

---

## 13. Test Nome

File:

```text
src/screens/TestNome.tsx
```

Il test pone due domande:

1. conferma del nome reale dell’utente;
2. verifica di un nome falso generato casualmente.

Salvataggio:

```text
userData.testNome.nomeVero
userData.testNome.nomeFalso
completedTests.nome
```

Se il nome vero non viene confermato, il sistema consiglia di ripetere ma consente comunque il proseguimento nello stato previsto dal componente.

---

## 14. Test 8 — Punti Distonici

File:

```text
src/screens/TestPuntiDistonici.tsx
```

Aree analizzate:

1. rapporti con la famiglia d’origine;
2. rapporti sentimentali e affettivi;
3. rapporti sessuali e passionali;
4. autorealizzazione, hobby e lavoro.

Per ogni area viene pronunciata una domanda SÌ/NO e la risposta viene salvata.

### Modalità Percorso Completo

Se emergono più risposte `NO`, il wizard può chiedere quale area l’utente desidera affrontare subito e salva `puntoDistonicoFinale`.

### Modalità Test Singolo

Quando `isWizard` è falso:

- tutte le risposte restano registrate;
- non viene richiesta la scelta di un solo punto prioritario;
- il test termina con un riepilogo dei punti rilevati;
- non viene introdotto un prerequisito verso il Test 9.

Salvataggio:

```text
userData.puntiDistonici
completedTests.puntiDistonici
```

---

## 15. Test 9 — Sigilli e Vincoli

File:

```text
src/screens/TestSigilliVincoli.tsx
```

Sigilli analizzati:

1. sensi di colpa;
2. paura dell’abbandono;
3. mancanza di autostima/disistima;
4. timore del giudizio degli altri.

### Modalità Percorso Completo

Il test richiede il `puntoDistonicoFinale` prodotto dal passaggio precedente. Se emergono più sigilli, può chiedere quale sigillo sia prioritario e valorizzare `sigilloFinale`.

### Modalità Test Singolo

Quando `isWizard` è falso:

- non richiede il completamento del Test 8;
- non blocca l’avvio se `puntoDistonicoFinale` è vuoto;
- registra tutti i quattro risultati SÌ/NO;
- non forza la selezione di un unico sigillo.

Salvataggio:

```text
userData.sigilli
completedTests.sigilli
```

---

## 16. Test singolo 10–11–12

File:

```text
src/screens/IndagineSingola.tsx
```

È un ciclo unico per i test precedentemente separati:

```text
problema dichiarato → età → stagione → mese → giorno → testimone
```

### 16.1 Input iniziali

Richiede:

- nome;
- età numerica;
- problema da risolvere.

La domanda iniziale usa il problema anagrafico:

```text
Caro inconscio di [nome], quando accadde quell’evento che, se non si fosse verificato, oggi non avresti il problema da risolvere: [problema]?
```

### 16.2 Ricerca dell’età

Usa una ricerca binaria tra 0 e l’età attuale.

Ogni domanda chiede se l’evento sia accaduto prima di una certa età.

Salva:

```text
userData.timeLine
completedTests.timeLine
```

### 16.3 Ricerca della data

Ordine:

1. stagione;
2. mese nella stagione selezionata;
3. giorno tramite ricerca binaria.

Salva:

```text
userData.giornoEvento
completedTests.qualeGiorno
```

### 16.4 Ricerca del testimone

Il test chiede:

1. uomo o donna;
2. figura specifica tra candidati;
3. per alcuni parenti ambigui, ramo paterno o materno.

Salva:

```text
userData.testimoneChiave
completedTests.testimone
completedTests.indagineSingola
```

### Differenza dal wizard

Il ciclo singolo non contiene la domanda finale sulla giustificazione del torto. La domanda `giustificatoTorto` è presente nella Grande Indagine del Percorso Completo.

---

## 17. Risultati finali

File:

```text
src/screens/Risultati.tsx
```

La schermata include:

- riepilogo dei dati utente;
- grafico radar delle quattro aree distoniche;
- Time Line;
- fase e induttore;
- area di conflitto;
- sigillo difensivo;
- imprinting temporale;
- meccanismo reattivo;
- sintesi analogica incrociata;
- consiglio analogico;
- generazione AI opzionale;
- lettura vocale dell’analisi;
- esportazione PDF;
- salvataggio sessione Firestore.

### Analisi deterministica

`src/utils/AnalysisEngine.ts` genera una struttura `AnalysisSummary` senza chiamate AI.

Campi:

- `faseInconscia`;
- `areaConflitto`;
- `sigilloDifesa`;
- `imprintingTimeline`;
- `meccanismoReattivo`;
- `sintesiCompleta`;
- `consiglioAnalogico`.

### AI opzionale

`Risultati.tsx` usa `@google/genai` con modello:

```text
gemini-2.5-flash
```

La richiesta include:

- knowledge base analogica;
- nome;
- induttore;
- sigillo;
- punto distonico;
- Time Line;
- testimone;
- reazione al torto;
- eventuale storico della live chat.

L’utente deve avere una API key disponibile per generare questa analisi.

### PDF

Il PDF viene generato con jsPDF e include:

- intestazione;
- nome utente;
- data;
- induttore;
- punto distonico;
- sigillo;
- Time Line;
- reazione al torto;
- eventuale analisi AI;
- nota copyright.

---

## 18. Firebase, sessioni e storico

### Firebase client

Configurazione:

```text
src/services/firebase.ts
firebase-applet-config.json
```

Servizi usati:

- Firebase Auth;
- Google Provider;
- Firestore.

### Salvataggio sessione

`Risultati.tsx` crea documenti nella collection:

```text
sessions
```

Struttura concettuale:

```ts
{
  userId,
  userName,
  createdAt,
  status: 'completed',
  data: {
    ...userData,
    aiMetaphor
  }
}
```

### Storico

`History.tsx`:

- utenti normali: vede le proprie sessioni;
- amministratore: vede tutte le sessioni;
- permette di caricare una sessione nel `UserContext`;
- porta alla rotta `/risultati`.

Query utente:

```text
where userId == user.uid
orderBy createdAt desc
```

Query admin:

```text
orderBy createdAt desc
```

### Gestione errori Firestore

`src/utils/firestore.ts` registra:

- errore;
- tipo di operazione;
- percorso;
- UID;
- email;
- provider;
- stato di verifica.

---

## 19. Database Drizzle/PostgreSQL

Il database Drizzle è separato dalla persistenza Firestore delle sessioni.

File:

```text
src/db/schema.ts
src/db/index.ts
src/db/users.ts
src/db/drizzle.config.ts
```

Tabelle principali:

### `users`

- `id` seriale;
- `uid` Firebase univoco;
- `email`;
- `createdAt`.

### `entries`

- `id`;
- `userId`;
- `content`;
- `date`;
- `createdAt`.

Il server espone `POST /api/auth/sync` per creare o aggiornare l’utente nel database SQL dopo la verifica del token Firebase.

Variabili server previste:

```text
SQL_HOST
SQL_USER
SQL_PASSWORD
SQL_DB_NAME
```

---

## 20. PWA e distribuzione

La configurazione PWA è in `vite.config.ts`.

Manifest:

```text
public/manifest.json
```

Asset presenti:

```text
public/pwa-192x192.png
public/pwa-512x512.png
public/apple-touch-icon.png
public/favicon.ico
public/mask-icon.svg
```

La build produce:

- `dist/index.html`;
- asset JavaScript/CSS;
- service worker;
- manifest web;
- server bundle in base allo script `build`.

La web app è predisposta per essere installata su dispositivi mobili come PWA.

---

## 21. Struttura dei file principali

```text
.
├── src/
│   ├── App.tsx
│   ├── types.ts
│   ├── index.css
│   ├── components/
│   │   ├── CameraView.tsx
│   │   ├── AuthGate.tsx
│   │   ├── Header.tsx
│   │   ├── BottomNav.tsx
│   │   ├── TestControls.tsx
│   │   ├── TimeLineGraph.tsx
│   │   ├── VideoAccordion.tsx
│   │   └── ...
│   ├── contexts/
│   │   ├── UserContext.tsx
│   │   ├── AuthContext.tsx
│   │   ├── ApiKeyContext.tsx
│   │   └── HeaderContext.tsx
│   ├── screens/
│   │   ├── Dashboard.tsx
│   │   ├── PercorsoCompleto.tsx
│   │   ├── ChiSei.tsx
│   │   ├── CalibrazioneScreen.tsx
│   │   ├── TestTAP.tsx
│   │   ├── TestInduttore.tsx
│   │   ├── TestNome.tsx
│   │   ├── TestPuntiDistonici.tsx
│   │   ├── TestSigilliVincoli.tsx
│   │   ├── IndagineSingola.tsx
│   │   ├── Risultati.tsx
│   │   ├── History.tsx
│   │   └── ...
│   ├── services/
│   │   ├── MotionDetectionService.ts
│   │   ├── AdvancedVoiceService.ts
│   │   ├── AudioAtmosphereService.ts
│   │   └── firebase.ts
│   ├── utils/
│   │   ├── tapEngine.ts
│   │   ├── AnalysisEngine.ts
│   │   ├── knowledgeBase.ts
│   │   ├── firestore.ts
│   │   └── sound.ts
│   └── db/
│       ├── schema.ts
│       ├── index.ts
│       └── users.ts
├── public/
├── server.ts
├── package.json
├── vite.config.ts
├── tsconfig.json
├── eslint.config.js
└── firebase-applet-config.json
```

---

## 22. Comandi di sviluppo

Installazione:

```bash
npm install --legacy-peer-deps
```

Sviluppo:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Lint:

```bash
npm run lint
```

Controllo TypeScript:

```bash
npx tsc --noEmit
```

Preview Vite:

```bash
npm run preview
```

Server produzione:

```bash
npm run build
npm start
```

Health check backend:

```text
GET http://localhost:3000/api/health
```

Risposta attesa:

```json
{ "status": "ok" }
```

---

## 23. Collaudo funzionale consigliato

### 23.1 Collaudo iniziale

- aprire l’app in HTTPS;
- verificare caricamento banner;
- verificare menu e navigazione;
- compilare nome, età, genere e problema;
- verificare salvataggio in localStorage;
- ricaricare la pagina e verificare ripristino dati.

### 23.2 Collaudo webcam Android

- Chrome Android aggiornato;
- permesso fotocamera concesso;
- dispositivo stabile;
- luce sufficiente;
- soggetto visibile dalla vita alla testa;
- verifica fallback GPU/CPU nei log;
- calibrazione riuscita;
- verifica barra centro/avanti/indietro;
- risposta SÌ con oscillazione avanti;
- risposta NO con oscillazione indietro.

### 23.3 Collaudo iOS

- Safari aggiornato;
- pagina in HTTPS;
- avvio dopo gesto esplicito;
- verifica permessi fotocamera;
- verifica audio dopo interazione;
- verifica che il dispositivo non vada in blocco schermo durante test lunghi;
- verifica ritorno dal background.

### 23.4 Collaudo T.A.P.

Verificare:

- assenza sagoma;
- Cerchio nero pieno;
- Asta nera piena;
- Triangolo nero pieno;
- 2 cicli da 6 secondi per simbolo;
- filtro serviceId;
- parità classificata come `NON_RILEVATO`;
- zero movimenti classificato come `NEUTRO`;
- diagnosi bloccata se un simbolo non è valido;
- profilo visualizzato;
- profilo letto interamente dalla voce;
- salvataggio in `userData.testTAP`.

### 23.5 Collaudo test singoli

- Test 8 senza selezione obbligatoria di un solo punto;
- Test 8 salvataggio di tutte le risposte;
- Test 9 avviabile senza Test 8;
- Test 9 salvataggio di tutti i sigilli;
- Indagine singola avviabile indipendentemente;
- ciclo 10–11–12 completato in un’unica schermata;
- nessun collegamento automatico verso test vecchi separati.

### 23.6 Collaudo Percorso Completo

- dati iniziali richiesti;
- ripresa da `wizardStep`;
- calibrazione;
- avanzamento in ordine;
- prerequisito del Test 9 preservato nel wizard;
- Grande Indagine con conferma età;
- data e testimone;
- giustificazione del torto;
- rimozione di `wizardStep` al termine.

### 23.7 Collaudo report

- schermata Risultati;
- grafico radar;
- Time Line;
- sintesi deterministica;
- API key assente: messaggio chiaro;
- API key presente: generazione Gemini;
- fallback TTS browser;
- PDF generato;
- sessione Firestore salvata;
- sessione visibile nello Storico;
- caricamento sessione nello stato locale.

---

## 24. Criticità e limiti tecnici da conoscere

### 24.1 Dipendenza da CDN MediaPipe

WASM e modello Pose Landmarker vengono caricati da URL remoti. Se CDN, rete o policy CSP bloccano il caricamento, la webcam può funzionare ma il rilevatore non si inizializza.

Per una distribuzione più robusta si può valutare il packaging locale degli asset MediaPipe, verificando licenze e dimensioni.

### 24.2 Qualità della stima

La profondità è una stima derivata da landmark 2D e non una misura fisica reale in centimetri. Il risultato può dipendere da:

- prospettiva;
- distanza dalla camera;
- inclinazione del telefono;
- luce;
- abiti;
- visibilità dei landmark;
- movimento laterale;
- presenza di più persone.

### 24.3 Termini clinici e interpretativi

Le etichette interpretative devono essere accompagnate da un linguaggio non diagnostico e da una chiara informativa d’uso. Il sistema non deve trasformare automaticamente un risultato analogico in diagnosi sanitaria.

### 24.4 Risultati vocali lunghi

La lettura completa del profilo T.A.P. è volutamente lunga. Su alcuni browser o dispositivi può:

- essere troncata da policy audio;
- risultare lenta;
- essere interrotta da una nuova richiesta;
- richiedere un gesto iniziale.

Per produzione si può aggiungere un pulsante “Ripeti profilo vocale”.

### 24.5 Dati locali

`localStorage` non è un archivio clinico sicuro. Chiunque abbia accesso al browser può potenzialmente leggere i dati della sessione. Per dati sensibili è necessario valutare cifratura, minimizzazione e policy privacy.

### 24.6 Autenticazione

Il componente `AuthGate` non blocca attualmente il rendering dell’app. Se si vuole rendere obbligatorio il login prima dei test o dei risultati, la policy deve essere implementata esplicitamente.

### 24.7 Firestore e indici

La query dello storico che combina `where` e `orderBy` può richiedere un indice Firestore. Se Firebase restituisce un errore di indice, creare l’indice suggerito dalla console Firebase.

### 24.8 Differenza wizard/test singoli

Il ciclo `IndagineSingola.tsx` è volutamente diverso dalla Grande Indagine in `PercorsoCompleto.tsx`:

- il singolo parte direttamente dal problema anagrafico;
- non include la conferma dell’età come il wizard;
- non include la domanda finale sulla giustificazione del torto;
- salva il ciclo come `indagineSingola`.

Questa differenza deve essere mantenuta documentata per evitare fusioni accidentali.

### 24.9 Build chunk size

La build Vite produce un warning su chunk JavaScript superiori a 500 kB. Non è un errore bloccante, ma per ottimizzare il mobile si può introdurre code splitting con `dynamic import()` e route lazy.

---

## 25. Regole per future modifiche

Ogni modifica deve rispettare queste regole:

1. non cambiare `forward = SI` e `backward = NO` senza approvazione esplicita;
2. non fondere la logica dei test singoli con il wizard;
3. non inserire prerequisiti nei test singoli senza richiesta esplicita;
4. mantenere `showSilhouette={false}` solo nel T.A.P.;
5. mantenere il filtro `serviceId` negli ascoltatori globali;
6. non considerare parità e assenza di movimento come risposta certa;
7. non modificare `PercorsoCompleto.tsx` per correggere un test singolo;
8. testare Android prima di introdurre filtri grafici o animazioni pesanti;
9. non pubblicare API key nel codice;
10. creare un tag di rollback prima di una modifica ampia;
11. eseguire TypeScript, lint e build prima del push;
12. verificare `git diff --check`;
13. registrare commit e file modificati;
14. sincronizzare Studio IA da GitHub prima di effettuare modifiche locali;
15. non fare push inverso Studio IA → GitHub senza un diff controllato.

---

## 26. Procedura GitHub ↔ Google AI Studio

### 26.1 GitHub come sorgente di verità

Il repository GitHub deve essere considerato la sorgente principale del codice verificato.

Procedura consigliata:

1. controllare il commit GitHub corrente;
2. eseguire sync GitHub → Studio IA;
3. risolvere i conflitti preferendo GitHub per i file già verificati;
4. controllare `git status` nello Studio IA;
5. eseguire build e TypeScript;
6. non modificare funzionalità senza richiesta esplicita;
7. solo dopo approvazione, eseguire Studio IA → GitHub.

### 26.2 Risoluzione conflitti

Per `src/screens/TestTAP.tsx`, se Studio IA mostra un conflitto tra workspace locale e GitHub:

- selezionare il file;
- mantenere la versione GitHub se il conflitto riguarda codice già verificato;
- non selezionare automaticamente la versione locale dello Studio IA;
- eseguire nuovamente TypeScript e build.

### 26.3 Prompt operativo per Studio IA

```text
Il repository GitHub è la sorgente di verità. Sincronizza il workspace con il branch main e mantieni la versione GitHub per i conflitti sui file già verificati. Non modificare la logica SI/NO, il filtro serviceId, la calibrazione MediaPipe, il T.A.P., gli altri test o PercorsoCompleto.tsx. Esegui TypeScript e build. Mostra git status, commit corrente, diff e risultato della build. Non pubblicare su GitHub senza approvazione.
```

### 26.4 Prima di un push Studio IA → GitHub

Controllare sempre:

```text
git status
commit corrente
git diff --stat
git diff --name-only
```

Verificare che non compaiano modifiche inattese a:

- `PercorsoCompleto.tsx`;
- `MotionDetectionService.ts`;
- `AdvancedVoiceService.ts`;
- test non coinvolti;
- file di configurazione;
- chiavi o credenziali.

---

## 27. Checklist di consegna per un nuovo agente IA

Un nuovo agente deve essere in grado di replicare l’app seguendo questo ordine:

1. clonare il repository;
2. leggere `package.json`;
3. leggere `src/App.tsx`;
4. leggere `src/screens/Dashboard.tsx`;
5. leggere `src/types.ts`;
6. leggere `src/contexts/UserContext.tsx`;
7. leggere `src/components/CameraView.tsx`;
8. leggere `src/services/MotionDetectionService.ts`;
9. leggere `src/services/AdvancedVoiceService.ts`;
10. leggere `src/screens/PercorsoCompleto.tsx`;
11. leggere tutti i test singoli;
12. leggere `src/utils/tapEngine.ts`;
13. leggere `src/utils/AnalysisEngine.ts`;
14. leggere `src/screens/Risultati.tsx`;
15. eseguire `npm install --legacy-peer-deps`;
16. eseguire `npx tsc --noEmit`;
17. eseguire `npm run lint`;
18. eseguire `npm run build`;
19. verificare la matrice mobile;
20. creare un piano prima di modificare il codice.

---

## 28. Definizione di “replica corretta”

Una replica è corretta quando:

- l’app parte dalla Dashboard;
- il flusso dati anagrafici funziona;
- la webcam richiede permesso e mostra il video;
- MediaPipe prova GPU e poi CPU;
- la calibrazione raccoglie campioni e verifica stabilità;
- avanti e indietro mantengono il significato esistente;
- gli eventi sono filtrati per `serviceId`;
- il T.A.P. usa Cerchio, Asta e Triangolo in quell’ordine;
- il T.A.P. usa 2 cicli da 6 secondi per simbolo;
- il T.A.P. non mostra la sagoma;
- gli altri test mostrano la sagoma;
- `NEUTRO` e `NON_RILEVATO` non vengono forzati in una diagnosi valida;
- il profilo T.A.P. viene visualizzato e letto vocalmente;
- il Test 8 singolo salva tutte le risposte;
- il Test 9 singolo è autonomo;
- il ciclo 10–11–12 singolo è un’unica schermata;
- il Percorso Completo mantiene il proprio wizard;
- i dati vengono persistiti localmente;
- il report può essere generato;
- TypeScript e build passano;
- il commit viene registrato e verificato.

---

## 29. Stato finale sintetico

L’app attuale è una PWA React/TypeScript con:

- percorso guidato separato dai test singoli;
- webcam e Pose Landmarker MediaPipe;
- calibrazione robusta multi-campione;
- fallback GPU → CPU;
- guida vocale;
- T.A.P. con diagnosi e profilo interpretativo;
- profilo T.A.P. letto anche vocalmente;
- test 8 e 9 indipendenti in modalità singola;
- test 10–11–12 riuniti in un unico ciclo singolo;
- risultati deterministici e AI opzionali;
- PDF;
- Firebase Auth, Firestore e storico sessioni;
- PWA installabile;
- backend Express con endpoint health e sincronizzazione SQL.

Il riferimento tecnico da usare per la replica è il commit:

```text
d79ed48
```

---

**Fine documento.**

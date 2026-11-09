# Guida Tecnica: Logica dell'App per l'Analogista

Per l'Agente IA che dovrà costruire l'app, ecco i pilastri logici:

## 1. Monitoraggio Oscillazione (Webcam)
- **Tecnologia:** Utilizzare `Mediapipe` o `TensorFlow.js` (modello PoseNet o MoveNet).
- **Logica:** Tracciare la posizione del 'naso' o delle 'spalle'. 
- **Rilevamento:** 
  - Calibrare una posizione "zero" (neutra).
  - Se la coordinata Z (profondità/dimensione del volto) aumenta -> Movimento in AVANTI (Sì).
  - Se diminuisce -> Movimento all'INDIETRO (No).
- **Integrazione:** Il risultato del test deve far scattare automaticamente il passaggio allo "Step" successivo nelle rotte di React.

## 2. Motore delle Regole (Decision Tree)
L'indagine segue una struttura ad albero:
- **Calibrazione:** Definisce la soglia di sensibilità dell'oscillazione.
- **Test Induttori:**
  - Risultato "Destro": Carica il modulo informativo "Induttore Destro" e sblocca le domande sulla linea temporale paterna.
  - Risultato "Sinistro": Carica il modulo "Induttore Sinistro" e sblocca le domande sulla sfera materna.

## 3. Interfaccia di Supporto (UI Condizionale)
- Ogni selezione (manuale o tramite webcam) deve aggiornare un "Knowledge Panel" laterale.
- **Contenuto Dinamico:** Non solo testo, ma suggerimenti pratici ("Ora prova a chiedere se il blocco è situato prima dei 10 anni").
- **Stato Globale:** Usare React Context per mantenere la storia dell'indagine e generare un PDF finale dei risultati.

## 4. Estetica (Design System)
- **Mood:** Professionale, clinico ma artistico.
- **Backgrounds:** Immagini bianco/nero con overlay in "Glassmorphism" (sfondi sfocati e traslucidi) per non distrarre l'analogista durante la sessione.

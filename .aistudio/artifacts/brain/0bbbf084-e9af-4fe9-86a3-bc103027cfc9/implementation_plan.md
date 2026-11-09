# Implementation Plan - Analogista Virtuale T.A.P. Test Enhancement

We will refine the T.A.P. Test (Asta, Cerchio, Triangolo) and overall application according to Stefano Benemeglio's Analogical Disciplines and the user's specific instructions.

## Proposed Changes

### 1. T.A.P. Test Sequence & Timing (`src/screens/TestTAP.tsx`)
- Ensure the test sequence runs continuously in the exact order requested:
  1. **Cerchio (O)** - 2 cycles (approx. 10 seconds)
  2. **Asta (|)** - 2 cycles
  3. **Triangolo (Δ)** - 2 cycles
- Real-time oscillation detection (Forward = SI / Gradimento, Backward = NO / Rifiuto) recorded in the background for each symbol.
- Integrated voice guidance (`AdvancedVoiceService`) and visual countdowns during calibration and symbol transitions.
- Direct overlay of the advancing symbol on the webcam view with smooth CSS zoom animation (`animate-symbol-zoom-slow`).

### 2. Diagnostic Engine & Report (`src/utils/tapEngine.ts` & `src/screens/Risultati.tsx`)
- Ensure full coverage of all male (M) and female (F) T.A.P. combinations (Ego-Maschio, Ego-Femmina, Conflittuale Madre/Padre, Ego Triadico, etc.).
- Provide a rich, detailed diagnostic report displaying the detected typology, dystonia ("Io Sono" vs "Io Ho"), analogical dynamics, and personalized advice.

### 3. Login / Auth Gate Cleanup
- Ensure no Google login gate or unwanted login instructions appear at startup, keeping access frictionless and direct as requested.

## Verification Plan
- Compile the applet with `compile_applet` to verify zero TypeScript or build errors.
- Test the T.A.P. test workflow and report generation.

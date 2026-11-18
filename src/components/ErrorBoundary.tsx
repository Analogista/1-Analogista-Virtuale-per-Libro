/* © 2027 Max Pisani - PACommunication. Tutti i diritti riservati. */
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  declare readonly props: Readonly<ErrorBoundaryProps>;
  declare setState: (
    state:
      | Partial<ErrorBoundaryState>
      | ((prevState: Readonly<ErrorBoundaryState>) => Partial<ErrorBoundaryState> | null)
      | null,
    callback?: () => void
  ) => void;

  public state: ErrorBoundaryState = {
    hasError: false,
  };

  public static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Errore imprevisto intercettato da ErrorBoundary:', error, errorInfo);
  }

  private handleGoHome = () => {
    this.setState({ hasError: false });
    window.location.hash = '#/';
    window.location.reload();
  };

  private handleRetry = () => {
    this.setState({ hasError: false });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-lg p-6 sm:p-8 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-2xl">
              ⚠️
            </div>
            <h1 className="font-serif font-bold text-xl text-slate-900">
              Si è verificato un imprevisto
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              La schermata ha riscontrato un problema temporaneo. I tuoi dati salvati nel browser non sono stati eliminati.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleRetry}
                className="flex-1 bg-white hover:bg-slate-100 text-slate-800 font-bold py-2.5 px-4 rounded-xl border border-slate-300 transition text-sm"
              >
                Riprova
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl shadow transition text-sm"
              >
                Torna alla Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

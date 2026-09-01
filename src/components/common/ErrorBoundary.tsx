import React from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';

interface Props {
  children?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error in React App:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    } catch (e) {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center shadow-2xl">
            <div className="w-12 h-12 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">Ops! Algo inesperado aconteceu.</h2>
            <p className="text-xs text-slate-400 mb-6">
              Ocorreu um erro inesperado ao renderizar esta tela. Você pode tentar recarregar ou restaurar o sistema.
            </p>
            {this.state.error?.message && (
              <div className="mb-4 p-2.5 rounded-lg bg-slate-950/80 border border-rose-900/40 text-[11px] text-rose-300 text-left font-mono break-all max-h-24 overflow-y-auto">
                {this.state.error.message}
              </div>
            )}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={this.handleRetry}
                className="w-full py-2.5 px-4 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Tentar Novamente</span>
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition"
              >
                <span>Limpar Dados e Reiniciar Sistema</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

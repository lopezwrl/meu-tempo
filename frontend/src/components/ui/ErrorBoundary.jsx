import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-surface border border-primary-border/60 rounded-3xl shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-text mb-1">
            Algo não carregou como esperado nesta visualização
          </h2>
          <p className="text-xs text-text-3 max-w-md mb-6 leading-relaxed">
            Seus dados continuam 100% seguros. Clique abaixo para recarregar esta seção.
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary text-white text-xs font-bold shadow-md shadow-[#D63B6A]/20 hover:bg-primary-light transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Recarregar página</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

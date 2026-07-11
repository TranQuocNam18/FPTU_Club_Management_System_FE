import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCcw, Home } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/dashboard';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-100">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.12),transparent_50%)]" />
          <div className="max-w-md w-full bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 p-8 rounded-3xl shadow-2xl relative z-10 text-center space-y-6">
            <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-rose-500/5">
              <AlertOctagon size={32} />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">Da xay ra su co he thong</h2>
              <p className="text-slate-400 text-sm">
                Ung dung gap loi khong mong muon. Vui long thu tai lai trang hoac quay lai trang chu.
              </p>
            </div>

            {this.state.error && (
              <div className="text-left bg-slate-950/60 border border-slate-800/60 rounded-xl p-4 overflow-auto max-h-40 text-xs font-mono text-rose-400">
                <p className="font-bold mb-1">{this.state.error.name}: {this.state.error.message}</p>
                <p className="opacity-70 whitespace-pre-wrap">{this.state.error.stack}</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button 
                variant="outline" 
                className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                onClick={() => window.location.reload()}
                icon={<RotateCcw size={16} />}
              >
                Tai lai trang
              </Button>
              <Button 
                variant="primary" 
                className="flex-1"
                onClick={this.handleReset}
                icon={<Home size={16} />}
              >
                Trang chu
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

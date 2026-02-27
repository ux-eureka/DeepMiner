import React from 'react';

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  message: string;
};

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: unknown): State {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { hasError: true, message };
  }

  componentDidCatch(error: unknown) {
    if (error instanceof Error) {
      console.error(error);
    } else {
      console.error('Unknown error', error);
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, message: '' });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen flex items-center justify-center bg-white text-slate-800">
          <div className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold">页面加载失败</div>
            <div className="mt-2 text-sm text-zinc-600 whitespace-pre-wrap">{this.state.message}</div>
            <button
              onClick={this.handleReset}
              className="mt-4 inline-flex items-center justify-center rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              刷新重试
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}


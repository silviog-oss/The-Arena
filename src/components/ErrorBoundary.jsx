import { Component } from 'react';

/** Shows a recovery screen instead of a blank page if something crashes. */
export default class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error('The Arena crashed:', error, info);
  }
  clearCache = async () => {
    try {
      const regs = (await navigator.serviceWorker?.getRegistrations?.()) || [];
      await Promise.all(regs.map((r) => r.unregister()));
      const keys = (await window.caches?.keys?.()) || [];
      await Promise.all(keys.map((k) => caches.delete(k)));
    } finally {
      location.reload();
    }
  };
  backup = () => {
    const raw = localStorage.getItem('arena.state.v1') || '{}';
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([raw], { type: 'application/json' }));
    a.download = 'the-arena-backup.json';
    a.click();
  };
  reset = () => {
    if (confirm('Delete all saved progress on this device?')) {
      localStorage.removeItem('arena.state.v1');
      location.reload();
    }
  };
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="onboarding">
        <div className="ob-step">
          <h2>Something went wrong</h2>
          <p className="muted">The Arena hit an error. Your progress is still saved. Try these in order:</p>
          <button className="btn btn-primary btn-lg w-full" onClick={this.clearCache}>1 · Clear cache & reload</button>
          <button className="btn btn-ghost btn-md w-full" onClick={this.backup}>2 · Download a backup of my data</button>
          <button className="btn btn-danger btn-md w-full" onClick={this.reset}>3 · Reset app data</button>
          <pre className="note small" style={{ whiteSpace: 'pre-wrap' }}>{String(this.state.error?.message || this.state.error)}</pre>
        </div>
      </div>
    );
  }
}

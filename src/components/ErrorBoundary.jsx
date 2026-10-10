import React from 'react';
import { AlertTriangle, RefreshCw, Copy, Check, ExternalLink } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Captured by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleCopy = () => {
    const { error, errorInfo } = this.state;
    const text = `LuckyGuy Crash Report:
Error: ${error?.toString() || 'Unknown Error'}
Stack:
${error?.stack || 'No stack trace'}

Component Stack:
${errorInfo?.componentStack || 'No component stack'}`;

    navigator.clipboard.writeText(text).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2500);
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleReportGitHub = () => {
    const { error, errorInfo } = this.state;
    const errMessage = error?.message || error?.toString() || 'Crash Report';
    const title = encodeURIComponent(`[Bug Report]: ${errMessage.slice(0, 75)}`);

    const activeTheme = (() => {
      try {
        return localStorage.getItem('localguy-theme') || 'unknown';
      } catch {
        return 'unknown';
      }
    })();

    const bodyContent = [
      '### Describe the Bug',
      'An unexpected error occurred while using LuckyGuy.',
      '',
      '### Error Diagnostics',
      '```text',
      error?.toString() || 'Unknown Error',
      '```',
      '',
      '### Component Stack',
      '```text',
      errorInfo?.componentStack ? errorInfo.componentStack.trim() : 'No component stack',
      '```',
      '',
      '### Stack Trace',
      '```text',
      error?.stack ? error.stack.trim() : 'No stack trace',
      '```',
      '',
      '### Environment',
      '- **Application**: LuckyGuy',
      '- **Platform**: Windows',
      `- **Theme**: ${activeTheme}`,
      `- **Timestamp**: ${new Date().toISOString()}`
    ].join('\n');

    const issueUrl = `https://github.com/nishantkumrmishra/LuckyGuy/issues/new?title=${title}&body=${encodeURIComponent(bodyContent)}`;

    if (window.electronAPI?.openExternal) {
      window.electronAPI.openExternal(issueUrl);
    } else {
      window.open(issueUrl, '_blank');
    }
  };

  handleResetState = () => {
    try {
      localStorage.removeItem('luckyguy-extensions');
      localStorage.removeItem('localguy-active-tab');
    } catch (e) {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, copied } = this.state;
      const errorText = `${error?.toString()}\n\nComponent Trace:${errorInfo?.componentStack || ''}\n\nStack:\n${error?.stack || ''}`;

      const savedTheme = (() => {
        try {
          return localStorage.getItem('localguy-theme') || document.documentElement.getAttribute('data-theme') || 'light';
        } catch {
          return 'light';
        }
      })();
      const isDark = savedTheme === 'dark';

      // Adaptive Theme Styling
      const styles = {
        containerBg: isDark ? '#0a0a0a' : '#f4f4f5',
        cardBg: isDark ? '#161616' : '#ffffff',
        cardBorder: isDark ? '1px solid #27272a' : '1px solid #e4e4e7',
        cardShadow: isDark ? '0 20px 40px rgba(0,0,0,0.6)' : '0 12px 32px rgba(0,0,0,0.08)',
        titleColor: isDark ? '#ffffff' : '#09090b',
        subtitleColor: isDark ? '#a1a1aa' : '#71717a',
        codeBg: isDark ? '#09090b' : '#fef2f2',
        codeBorder: isDark ? '1px solid #27272a' : '1px solid #fecaca',
        codeColor: isDark ? '#f87171' : '#dc2626',
        btnReloadBg: isDark ? '#27272a' : '#f4f4f5',
        btnReloadBorder: isDark ? '1px solid #3f3f46' : '1px solid #e4e4e7',
        btnReloadColor: isDark ? '#f4f4f5' : '#18181b',
        btnGithubBg: isDark ? '#1f2937' : '#0f172a',
        btnGithubColor: '#ffffff',
        linkResetColor: isDark ? '#71717a' : '#a1a1aa',
      };

      return (
        <div
          style={{
            height: '100vh',
            width: '100vw',
            backgroundColor: styles.containerBg,
            color: styles.titleColor,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px',
            boxSizing: 'border-box',
            userSelect: 'text',
          }}
        >
          <div
            style={{
              maxWidth: '740px',
              width: '100%',
              backgroundColor: styles.cardBg,
              border: styles.cardBorder,
              borderRadius: '12px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: styles.cardShadow,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  color: '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <AlertTriangle size={22} />
              </div>
              <div>
                <h1 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: styles.titleColor }}>
                  Something went wrong in LuckyGuy
                </h1>
                <p style={{ fontSize: '12px', color: styles.subtitleColor, margin: '3px 0 0 0' }}>
                  An unexpected error occurred. You can post this problem directly on GitHub, copy diagnostics, or reload.
                </p>
              </div>
            </div>

            <div
              style={{
                backgroundColor: styles.codeBg,
                border: styles.codeBorder,
                borderRadius: '8px',
                padding: '12px',
                maxHeight: '260px',
                overflowY: 'auto',
                fontSize: '11.5px',
                fontFamily: 'monospace',
                color: styles.codeColor,
                whiteSpace: 'pre-wrap',
                lineHeight: '1.45',
              }}
            >
              {errorText}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={this.handleReportGitHub}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    backgroundColor: styles.btnGithubBg,
                    border: 'none',
                    color: styles.btnGithubColor,
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                  title="Open GitHub Issues with prefilled crash details"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                  <span>Post Problem on GitHub</span>
                  <ExternalLink size={12} style={{ opacity: 0.8 }} />
                </button>

                <button
                  type="button"
                  onClick={this.handleCopy}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    backgroundColor: '#7c5cbf',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy Error Report'}</span>
                </button>

                <button
                  type="button"
                  onClick={this.handleReload}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    backgroundColor: styles.btnReloadBg,
                    border: styles.btnReloadBorder,
                    color: styles.btnReloadColor,
                    fontSize: '12.5px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  <RefreshCw size={14} />
                  <span>Reload Application</span>
                </button>
              </div>

              <button
                type="button"
                onClick={this.handleResetState}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: styles.linkResetColor,
                  fontSize: '11.5px',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Reset Extensions State
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

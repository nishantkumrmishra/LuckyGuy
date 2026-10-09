import React, { useState } from 'react';
import {
  FolderOpen,
  Sun,
  Moon,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Music,
  Download,
  FolderSync,
  Layers,
  X
} from 'lucide-react';

export default function SetupWizard({
  isOpen,
  onClose,
  preferences = {},
  onSavePreferences,
  theme = 'light',
  onToggleTheme,
}) {
  const [step, setStep] = useState(1);
  const [downloadFolder, setDownloadFolder] = useState(
    preferences?.downloadFolder || 'C:\\Users\\nishant\\Music'
  );
  const [selectedTheme, setSelectedTheme] = useState(theme || 'light');
  const [autoOrganize, setAutoOrganize] = useState(true);

  if (!isOpen) return null;

  const handlePickFolder = async () => {
    if (window.electronAPI?.openDirectoryDialog) {
      const selected = await window.electronAPI.openDirectoryDialog();
      if (selected) {
        setDownloadFolder(selected);
      }
    }
  };

  const handleFinish = () => {
    const updated = {
      ...preferences,
      downloadFolder,
      autoOrganize,
      isSetupCompleted: true,
    };
    if (onSavePreferences) {
      onSavePreferences(updated);
    }
    try {
      localStorage.setItem('luckyguy-setup-completed', 'true');
    } catch (e) {}
    onClose();
  };

  const selectTheme = (th) => {
    setSelectedTheme(th);
    if (th !== theme && onToggleTheme) {
      onToggleTheme();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          backgroundColor: 'var(--bg-card, #ffffff)',
          borderRadius: '16px',
          border: '1px solid var(--border-medium, rgba(0,0,0,0.1))',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {/* Top Header & Progress */}
        <div
          style={{
            padding: '20px 24px 16px 24px',
            borderBottom: '1px solid var(--border-light, rgba(0,0,0,0.06))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(124, 92, 191, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Music size={18} color="var(--primary, #7c5cbf)" />
            </div>
            <div>
              <h2
                style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  margin: 0,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.01em',
                }}
              >
                LuckyGuy Setup Wizard
              </h2>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Step {step} of 4
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                style={{
                  width: s === step ? '20px' : '6px',
                  height: '6px',
                  borderRadius: '3px',
                  backgroundColor: s === step ? 'var(--primary, #7c5cbf)' : 'var(--border-medium)',
                  transition: 'all 0.25s ease',
                }}
              />
            ))}
          </div>
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px 28px', minHeight: '280px', display: 'flex', flexDirection: 'column' }}>
          {/* STEP 1: WELCOME */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ textAlign: 'center', padding: '10px 0 16px 0' }}>
                <div
                  style={{
                    display: 'inline-flex',
                    padding: '8px 14px',
                    borderRadius: '999px',
                    backgroundColor: 'rgba(124, 92, 191, 0.1)',
                    color: 'var(--primary, #7c5cbf)',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    marginBottom: '10px',
                    gap: '6px',
                    alignItems: 'center',
                  }}
                >
                  <Sparkles size={13} />
                  <span>Welcome to LuckyGuy</span>
                </div>
                <h3
                  style={{
                    fontSize: '20px',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    margin: '0 0 6px 0',
                  }}
                >
                  Your Ultimate Windows Music Hub
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  High-speed multi-threaded media transfers, 320kbps stream resolution, and automatic library management designed for Windows.
                </p>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--bg-main, #f8fafc)',
                    border: '1px solid var(--border-medium)',
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'flex-start',
                  }}
                >
                  <Download size={16} color="var(--primary, #7c5cbf)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      200+ Track Playlists
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Automated Spotify & multi-platform batch downloading.
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--bg-main, #f8fafc)',
                    border: '1px solid var(--border-medium)',
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'flex-start',
                  }}
                >
                  <FolderSync size={16} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Smart Genre Folders
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Auto-sorts into Bollywood, Pop, Rock, Electronic, etc.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: MUSIC DIRECTORY */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h3
                  style={{
                    fontSize: '17px',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    margin: '0 0 4px 0',
                  }}
                >
                  Choose Your Music Storage
                </h3>
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0 }}>
                  Select the main directory where your audio files and folders will be saved and managed.
                </p>
              </div>

              <div
                style={{
                  padding: '16px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--bg-main, #f8fafc)',
                  border: '1px solid var(--border-medium)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  Default Library Folder
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    readOnly
                    value={downloadFolder}
                    style={{
                      flex: 1,
                      height: '38px',
                      padding: '0 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-medium)',
                      backgroundColor: 'var(--bg-card, #ffffff)',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      color: 'var(--text-primary)',
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={handlePickFolder}
                    style={{
                      height: '38px',
                      padding: '0 14px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--primary, #7c5cbf)',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      flexShrink: 0,
                    }}
                  >
                    <FolderOpen size={14} />
                    <span>Browse</span>
                  </button>
                </div>
              </div>

              <div
                onClick={() => setAutoOrganize(!autoOrganize)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-medium)',
                  backgroundColor: autoOrganize ? 'rgba(124, 92, 191, 0.05)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '5px',
                    border: autoOrganize ? 'none' : '1.5px solid var(--border-medium)',
                    backgroundColor: autoOrganize ? 'var(--primary, #7c5cbf)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {autoOrganize && <CheckCircle2 size={14} color="#ffffff" />}
                </div>
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Auto-organize files into Genre subfolders
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Files will automatically sort into Bollywood, Pop, Rock, Electronic, Hip-Hop, etc.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: APPEARANCE & THEME */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h3
                  style={{
                    fontSize: '17px',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    margin: '0 0 4px 0',
                  }}
                >
                  Select Visual Style
                </h3>
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0 }}>
                  Choose how you want LuckyGuy to look. You can toggle this anytime from the sidebar.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div
                  onClick={() => selectTheme('light')}
                  style={{
                    padding: '20px',
                    borderRadius: '12px',
                    border: selectedTheme === 'light' ? '2px solid var(--primary, #7c5cbf)' : '1px solid var(--border-medium)',
                    backgroundColor: selectedTheme === 'light' ? 'rgba(124, 92, 191, 0.06)' : 'var(--bg-main)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '10px',
                    textAlign: 'center',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      backgroundColor: '#ffffff',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Sun size={20} color="#f59e0b" />
                  </div>
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Light Theme
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Clean, minimalist studio look
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => selectTheme('dark')}
                  style={{
                    padding: '20px',
                    borderRadius: '12px',
                    border: selectedTheme === 'dark' ? '2px solid var(--primary, #7c5cbf)' : '1px solid var(--border-medium)',
                    backgroundColor: selectedTheme === 'dark' ? 'rgba(124, 92, 191, 0.12)' : 'var(--bg-main)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '10px',
                    textAlign: 'center',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      backgroundColor: '#18181b',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Moon size={20} color="#a855f7" />
                  </div>
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Obsidian Dark
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Deep dark with violet accents
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: READY TO GO */}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center', padding: '10px 0' }}>
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                }}
              >
                <CheckCircle2 size={32} color="#10b981" />
              </div>
              <div>
                <h3
                  style={{
                    fontSize: '20px',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    margin: '0 0 6px 0',
                  }}
                >
                  Setup Complete!
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  LuckyGuy is fully initialized and configured for your machine. You can paste any media link into Downloads Manager or begin playing your local library immediately.
                </p>
              </div>

              <div
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--bg-main, #f8fafc)',
                  border: '1px solid var(--border-medium)',
                  fontSize: '11.5px',
                  color: 'var(--text-muted)',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div><strong>Library Path:</strong> {downloadFolder}</div>
                <div><strong>Genre Organization:</strong> {autoOrganize ? 'Enabled' : 'Disabled'}</div>
                <div><strong>Theme:</strong> {selectedTheme === 'dark' ? 'Obsidian Dark' : 'Light Mode'}</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border-light, rgba(0,0,0,0.06))',
            backgroundColor: 'var(--bg-main, #f8fafc)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border-medium)',
                backgroundColor: 'var(--bg-card, #ffffff)',
                color: 'var(--text-secondary)',
                fontSize: '12.5px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 20px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: 'var(--primary, #7c5cbf)',
                color: '#ffffff',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(124, 92, 191, 0.25)',
              }}
            >
              <span>Continue</span>
              <ArrowRight size={14} />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 22px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: 'var(--primary, #7c5cbf)',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(124, 92, 191, 0.3)',
              }}
            >
              <Sparkles size={14} />
              <span>Launch LuckyGuy</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

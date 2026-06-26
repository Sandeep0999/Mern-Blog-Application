import { useState, useEffect, useRef } from 'react';
import { X, Flag, Loader2, CheckCircle2, AlertCircle, ChevronRight } from 'lucide-react';
import API from '../api/axios';
import { toast } from 'react-toastify';

/* ══════════════════════════════════════════════════════
   REPORT REASONS CONFIG
   ══════════════════════════════════════════════════════ */
const REPORT_REASONS = [
  { id: 'spam',                label: 'Spam',                     desc: 'Repetitive, unsolicited content'       },
  { id: 'harassment_or_hate', label: 'Harassment or Hate',        desc: 'Targeting individuals or groups'       },
  { id: 'misinformation',     label: 'Misinformation',            desc: 'Deliberately false or misleading info' },
  { id: 'nsfw_adult_content', label: 'NSFW / Adult Content',      desc: 'Sexually explicit or graphic material' },
  { id: 'violence',           label: 'Violence',                  desc: 'Graphic violence or threats'           },
  { id: 'copyright_violation',label: 'Copyright Violation',       desc: 'Stolen or infringing content'          },
  { id: 'scam_or_fraud',      label: 'Scam or Fraud',             desc: 'Deceptive or fraudulent content'       },
  { id: 'fake_information',   label: 'Fake Information',          desc: 'Fabricated facts or impersonation'     },
  { id: 'plagiarism',         label: 'Plagiarism',                desc: 'Content copied without attribution'    },
  { id: 'offensive_content',  label: 'Offensive Content',         desc: 'Deeply offensive or hurtful language'  },
  { id: 'low_quality_ai_spam',label: 'Low Quality / AI Spam',     desc: 'Meaningless AI-generated spam'         },
  { id: 'other',              label: 'Other',                     desc: 'Something not listed above'            },
];

/* ══════════════════════════════════════════════════════
   REPORT MODAL COMPONENT
   ══════════════════════════════════════════════════════ */
const ReportModal = ({ postId, postTitle, isOpen, onClose }) => {
  const [step, setStep] = useState('select'); // 'select' | 'loading' | 'success' | 'error' | 'duplicate'
  const [selectedReason, setSelectedReason] = useState(null);
  const [customMessage, setCustomMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const overlayRef = useRef(null);
  const panelRef = useRef(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('select');
      setSelectedReason(null);
      setCustomMessage('');
      setErrorMsg('');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleSubmit = async () => {
    if (!selectedReason) return;
    if (selectedReason === 'other' && !customMessage.trim()) {
      setErrorMsg('Please describe the issue.');
      return;
    }

    setStep('loading');
    setErrorMsg('');

    try {
      await API.post('/reports', {
        targetPostId: postId,
        reason: selectedReason,
        customMessage: selectedReason === 'other' ? customMessage.trim() : undefined,
      });
      setStep('success');
    } catch (err) {
      if (err.response?.status === 409) {
        setStep('duplicate');
      } else {
        setErrorMsg(err.response?.data?.message || 'Failed to submit report. Please try again.');
        setStep('error');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'reportFadeIn 0.22s ease both',
      }}
    >
      <div
        ref={panelRef}
        style={{
          background: 'var(--dp-bg)',
          border: '1px solid var(--dp-border)',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '480px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
          animation: 'reportSlideUp 0.3s cubic-bezier(0.34,1.56,0.64,1) both',
          overflow: 'hidden',
        }}
      >
        {/* ── Header ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px 16px',
          borderBottom: '1px solid var(--dp-border)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '10px',
              background: 'rgba(239,68,68,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Flag style={{ width: '15px', height: '15px', color: '#ef4444' }} />
            </div>
            <div>
              <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--dp-heading)', lineHeight: 1.2 }}>
                Report Post
              </p>
              {postTitle && (
                <p style={{
                  fontSize: '0.68rem', color: 'var(--dp-muted)', marginTop: '2px',
                  maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {postTitle}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close report dialog"
            style={{
              padding: '6px', borderRadius: '8px', border: 'none',
              background: 'transparent', cursor: 'pointer',
              color: 'var(--dp-muted)', transition: 'all 0.18s ease',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--dp-s1)'; e.currentTarget.style.color = 'var(--dp-body)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--dp-muted)'; }}
          >
            <X style={{ width: '16px', height: '16px' }} />
          </button>
        </div>

        {/* ── Body ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>

          {/* SELECT STATE */}
          {(step === 'select' || step === 'error') && (
            <>
              <p style={{ fontSize: '0.78rem', color: 'var(--dp-subtle)', marginBottom: '14px', fontWeight: 500 }}>
                Why are you reporting this post?
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {REPORT_REASONS.map(({ id, label, desc }) => (
                  <button
                    key={id}
                    onClick={() => { setSelectedReason(id); setErrorMsg(''); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '11px 14px',
                      borderRadius: '12px',
                      border: `1.5px solid ${selectedReason === id ? 'var(--dp-accent-border)' : 'var(--dp-border)'}`,
                      background: selectedReason === id ? 'var(--dp-accent-light)' : 'var(--dp-s1)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={e => {
                      if (selectedReason !== id) {
                        e.currentTarget.style.border = '1.5px solid var(--dp-s3)';
                        e.currentTarget.style.background = 'var(--dp-s2)';
                      }
                    }}
                    onMouseLeave={e => {
                      if (selectedReason !== id) {
                        e.currentTarget.style.border = '1.5px solid var(--dp-border)';
                        e.currentTarget.style.background = 'var(--dp-s1)';
                      }
                    }}
                  >
                    <div>
                      <p style={{
                        fontSize: '0.82rem', fontWeight: 600,
                        color: selectedReason === id ? 'var(--dp-accent)' : 'var(--dp-heading)',
                        lineHeight: 1.3,
                      }}>
                        {label}
                      </p>
                      <p style={{ fontSize: '0.7rem', color: 'var(--dp-muted)', marginTop: '2px' }}>
                        {desc}
                      </p>
                    </div>
                    <ChevronRight style={{
                      width: '14px', height: '14px', flexShrink: 0,
                      color: selectedReason === id ? 'var(--dp-accent)' : 'var(--dp-muted)',
                      opacity: selectedReason === id ? 1 : 0.4,
                      transition: 'opacity 0.15s ease',
                    }} />
                  </button>
                ))}
              </div>

              {/* Custom message textarea for 'other' */}
              {selectedReason === 'other' && (
                <div style={{ marginTop: '12px' }}>
                  <textarea
                    value={customMessage}
                    onChange={e => setCustomMessage(e.target.value)}
                    placeholder="Please describe the issue in detail..."
                    maxLength={500}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1.5px solid var(--dp-border)',
                      background: 'var(--dp-s1)',
                      color: 'var(--dp-heading)',
                      fontSize: '0.82rem',
                      fontFamily: 'var(--dp-font-ui)',
                      resize: 'none',
                      outline: 'none',
                      transition: 'border-color 0.18s ease',
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = 'var(--dp-accent-border)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'var(--dp-border)'; }}
                  />
                  <p style={{ fontSize: '0.65rem', color: 'var(--dp-muted)', textAlign: 'right', marginTop: '4px' }}>
                    {customMessage.length}/500
                  </p>
                </div>
              )}

              {/* Error message */}
              {step === 'error' && errorMsg && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  marginTop: '12px', padding: '10px 14px',
                  background: 'rgba(239,68,68,0.08)', borderRadius: '10px',
                  border: '1px solid rgba(239,68,68,0.2)',
                }}>
                  <AlertCircle style={{ width: '14px', height: '14px', color: '#ef4444', flexShrink: 0 }} />
                  <p style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 500 }}>{errorMsg}</p>
                </div>
              )}
            </>
          )}

          {/* LOADING STATE */}
          {step === 'loading' && (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', padding: '40px 0', gap: '16px',
            }}>
              <Loader2 style={{ width: '32px', height: '32px', color: 'var(--dp-accent)', animation: 'spin 0.9s linear infinite' }} />
              <p style={{ fontSize: '0.82rem', color: 'var(--dp-muted)', fontWeight: 500 }}>
                Submitting your report...
              </p>
            </div>
          )}

          {/* SUCCESS STATE */}
          {step === 'success' && (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              textAlign: 'center', padding: '32px 16px', gap: '12px',
            }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '50%',
                background: 'rgba(52,211,153,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: 'reportScalePop 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
              }}>
                <CheckCircle2 style={{ width: '28px', height: '28px', color: '#34d399' }} />
              </div>
              <div>
                <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--dp-heading)', marginBottom: '6px' }}>
                  Report Submitted
                </p>
                <p style={{ fontSize: '0.82rem', color: 'var(--dp-subtle)', lineHeight: 1.6, maxWidth: '300px' }}>
                  Thanks for helping keep DailyPen safe. Our moderation team will review this within 24 hours.
                </p>
              </div>
              <button
                onClick={onClose}
                style={{
                  marginTop: '8px', padding: '9px 28px',
                  borderRadius: '9999px', border: 'none',
                  background: 'var(--dp-heading)', color: 'var(--dp-bg)',
                  fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.18s ease',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                Got it
              </button>
            </div>
          )}

          {/* DUPLICATE STATE */}
          {step === 'duplicate' && (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              textAlign: 'center', padding: '32px 16px', gap: '12px',
            }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '50%',
                background: 'rgba(232,168,56,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <AlertCircle style={{ width: '28px', height: '28px', color: 'var(--dp-accent)' }} />
              </div>
              <div>
                <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--dp-heading)', marginBottom: '6px' }}>
                  Already Reported
                </p>
                <p style={{ fontSize: '0.82rem', color: 'var(--dp-subtle)', lineHeight: 1.6 }}>
                  You have already submitted a report for this post. Our team is already reviewing it.
                </p>
              </div>
              <button
                onClick={onClose}
                style={{
                  marginTop: '8px', padding: '9px 28px',
                  borderRadius: '9999px', border: 'none',
                  background: 'var(--dp-heading)', color: 'var(--dp-bg)',
                  fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.18s ease',
                }}
              >
                Close
              </button>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        {(step === 'select' || step === 'error') && (
          <div style={{
            padding: '14px 24px 20px',
            borderTop: '1px solid var(--dp-border)',
            display: 'flex',
            gap: '10px',
            flexShrink: 0,
          }}>
            <button
              onClick={onClose}
              style={{
                flex: 1, padding: '10px', borderRadius: '10px',
                border: '1.5px solid var(--dp-border)', background: 'transparent',
                color: 'var(--dp-subtle)', fontSize: '0.82rem', fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.18s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--dp-s1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedReason || (selectedReason === 'other' && !customMessage.trim())}
              style={{
                flex: 2, padding: '10px', borderRadius: '10px', border: 'none',
                background: selectedReason ? '#ef4444' : 'var(--dp-s2)',
                color: selectedReason ? '#fff' : 'var(--dp-muted)',
                fontSize: '0.82rem', fontWeight: 700, cursor: selectedReason ? 'pointer' : 'default',
                transition: 'all 0.2s ease',
                boxShadow: selectedReason ? '0 4px 16px rgba(239,68,68,0.3)' : 'none',
              }}
              onMouseEnter={e => { if (selectedReason) e.currentTarget.style.background = '#dc2626'; }}
              onMouseLeave={e => { if (selectedReason) e.currentTarget.style.background = '#ef4444'; }}
            >
              Submit Report
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportModal;

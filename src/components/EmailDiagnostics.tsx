import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { signInWithGoogle, getGoogleAccessToken, auth } from '../lib/firebase';
import { Mail, Settings, Key, RefreshCw, AlertCircle, CheckCircle2, Loader2, Lock, Server, Check } from 'lucide-react';

export function EmailDiagnostics({ token }: { token: string | null }) {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [testEmail, setTestEmail] = useState('bansalaryan0702@gmail.com');
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [authorizing, setAuthorizing] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/admin/email-status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setStatus(data);
      } else {
        console.error('Failed to fetch email status:', data.error);
      }
    } catch (e) {
      console.error('Error fetching email status:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchStatus();
    }
  }, [token]);

  const handleLinkGoogle = async () => {
    setAuthorizing(true);
    setAuthError(null);
    try {
      // 1. Trigger the standard Google popup sign-in with Gmail scopes configured on client
      await signInWithGoogle();
      
      // 2. Fetch the ID token from current authorized user
      const idToken = await auth.currentUser?.getIdToken(true);
      const googleAccessToken = await getGoogleAccessToken();
      
      if (!idToken || !googleAccessToken) {
        throw new Error('Failed to retrieve authentication tokens.');
      }

      // 3. Post to backend to save / update the googleAccessToken
      const res = await apiFetch('/api/users/google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: idToken, googleAccessToken })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to register token with the system.');
      }

      // Refresh status from backend
      await fetchStatus();
    } catch (err: any) {
      console.error('Google authorization error:', err);
      setAuthError(err.message || 'Authorization failed or popup closed.');
    } finally {
      setAuthorizing(false);
    }
  };

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestLoading(true);
    setTestResult(null);
    try {
      const res = await apiFetch('/api/admin/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ testEmail })
      });
      const data = await res.json();
      setTestResult({
        ok: res.ok && data.success,
        data: data
      });
    } catch (err: any) {
      setTestResult({
        ok: false,
        error: err.message || 'Failed to trigger test email.'
      });
    } finally {
      setTestLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-gray-100 shadow-sm min-h-[300px]">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin mb-3" />
        <p className="text-gray-500 font-medium">Loading email configuration status...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Overview Card */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-2xl border border-purple-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Mail className="w-6 h-6 text-purple-600" />
            Printfield Notification System
          </h2>
          <p className="text-gray-600 max-w-2xl leading-relaxed">
            Configure, manage, and diagnostic-test email delivery for order quotations, bulk RFQs, and password resets. The system sends emails securely and directly via the Gmail API.
          </p>
        </div>
        <button
          onClick={fetchStatus}
          className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 hover:text-gray-900 border border-gray-200 hover:border-gray-300 rounded-xl font-medium transition-all text-sm shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Status
        </button>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Gmail API Status */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Lock className="w-5 h-5 text-red-500" />
                Gmail API Integration
              </h3>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                status?.gmailLinked
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                <span className={`w-2 h-2 rounded-full ${status?.gmailLinked ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                {status?.gmailLinked ? 'Linked' : 'Not Linked'}
              </span>
            </div>
            
            <p className="text-sm text-gray-500 leading-relaxed">
              Allows the applet to send official notifications directly from the admin Gmail account (<code>{status?.adminEmail}</code>) securely via the Google OAuth 2.0 API.
            </p>

            {status?.gmailLinked && (
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <div className="text-sm text-gray-600 truncate">
                  Token registered in cache: <span className="font-semibold text-emerald-700">{status?.hasTokenInCache ? 'Yes (Fresh)' : 'No (DB Only)'}</span>
                </div>
              </div>
            )}

            {authError && (
              <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 text-rose-700 text-sm flex items-start gap-2 leading-relaxed">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Authorization Failed:</span> {authError}
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-gray-100">
            <button
              onClick={handleLinkGoogle}
              disabled={authorizing}
              className={`w-full py-3 px-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all shadow-sm ${
                authorizing 
                  ? 'bg-purple-400 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              {authorizing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Authorizing in popup...
                </>
              ) : (
                <>
                  <Key className="w-5 h-5" />
                  {status?.gmailLinked ? 'Re-Authorize Google Gmail Account' : 'Link Admin Google Gmail Account'}
                </>
              )}
            </button>
            <p className="text-[11px] text-gray-400 mt-2 text-center">
              Requires <code>https://www.googleapis.com/auth/gmail.send</code> scope. Standard Google sign-in terms apply.
            </p>
          </div>
        </div>
      </div>

      {/* Test Console */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Settings className="w-5 h-5 text-gray-600" />
          Real-time Diagnostic Test Console
        </h3>
        
        <form onSubmit={handleSendTest} className="flex flex-col sm:flex-row gap-3 items-end max-w-2xl">
          <div className="flex-1 w-full space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Test Recipient Email Address</label>
            <input
              type="email"
              required
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="e.g. bansalaryan0702@gmail.com"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent text-sm text-gray-800"
            />
          </div>
          <button
            type="submit"
            disabled={testLoading}
            className="w-full sm:w-auto px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {testLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending Test...
              </>
            ) : (
              'Send Test Notification Email'
            )}
          </button>
        </form>

        {testResult && (
          <div className={`p-5 rounded-2xl border ${
            testResult.ok 
              ? 'bg-emerald-50/50 border-emerald-200 text-emerald-800' 
              : 'bg-rose-50/50 border-rose-200 text-rose-800'
          } space-y-4`}>
            <div className="flex items-center gap-2 font-bold text-sm">
              {testResult.ok ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  Diagnostic Test Successful!
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-rose-600" />
                  Diagnostic Test Failed
                </>
              )}
            </div>

            <div className="text-xs space-y-3 leading-relaxed font-medium">
              {testResult.ok ? (
                <>
                  <p>
                    A test email was successfully dispatched to <span className="font-bold">{testEmail}</span>.
                  </p>
                  <p className="flex items-center gap-1.5">
                    Primary dispatch transport: <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold font-mono uppercase">{testResult.data?.results?.methodUsed}</span>
                  </p>
                </>
              ) : (
                <>
                  <p>The application was unable to send the test notification email. Review the system diagnostics log below:</p>
                  <div className="bg-gray-950 text-gray-200 p-4 rounded-xl font-mono text-[11px] leading-relaxed overflow-x-auto border border-gray-800 space-y-2">
                    <div className="text-amber-400 font-bold border-b border-gray-800 pb-1.5 mb-1.5">DIAGNOSTIC REPORT:</div>
                    {testResult.data?.results ? (
                      <>
                        <div>
                          <span className="text-cyan-400">[Gmail API Attempt]</span>: {testResult.data?.results?.gmail?.attempted ? 'Attempted' : 'Skipped (No active/valid token found)'}
                        </div>
                        {testResult.data?.results?.gmail?.error && (
                          <div className="text-rose-400 pl-4">
                            Error: {testResult.data?.results?.gmail?.error}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-rose-400">Error: {testResult.error || 'System timeout or generic network failure.'}</div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

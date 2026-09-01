import { getSecurityLogs } from "@/lib/store";
import { ShieldCheck, ShieldAlert, XCircle, Clock } from "lucide-react";

export default async function SecurityLogsPage() {
  const logs = await getSecurityLogs();

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1>Security Logs</h1>
        <p style={{ color: 'var(--text-secondary)' }}>A real-time audit of every URL processed by Secure Form AI.</p>
      </div>

      {logs.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <ShieldCheck size={48} color="var(--text-secondary)" style={{ margin: '0 auto 1rem' }} />
          <h3>No Scans Yet</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Paste a URL in the dashboard to initiate a real security scan.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {logs.map((log) => (
            <div key={log.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: `4px solid ${log.classification === 'unsafe' ? 'var(--danger)' : log.classification === 'suspicious' ? 'var(--warning)' : 'var(--success)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Clock size={14} /> {new Date(log.timestamp).toLocaleString()}
                  </div>
                  <div style={{ wordBreak: 'break-all', fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                    {log.url}
                  </div>
                </div>
                <span className={`badge ${log.classification === 'unsafe' ? 'badge-danger' : log.classification === 'suspicious' ? 'badge-warning' : 'badge-success'}`}>
                  {log.classification.toUpperCase()}
                </span>
              </div>
              
              <div style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: '8px' }}>
                <h4 style={{ fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Threat Signals Detected:</h4>
                <ul style={{ listStylePosition: 'inside', fontSize: '0.875rem' }}>
                  {log.signals.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

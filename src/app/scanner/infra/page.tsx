"use client";

import { useState } from "react";
import { runInfraScan } from "./actions";
import { InfraScannerResult } from "@/types";
import { ShieldCheck, ShieldAlert, Loader2, Server, Globe } from "lucide-react";

export default function InfraScannerPage() {
  const [target, setTarget] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InfraScannerResult | null>(null);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!target) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await runInfraScan(target);
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ width: '100%' }}>
      <header style={{ marginBottom: "2rem" }}>
        <div>
          <h1>Infrastructure Scanner (CloudSec)</h1>
          <p style={{ color: "#a1a1aa", marginTop: "0.5rem" }}>
            Analyze IPs or domains for open ports and HTTP security headers (CORS, CSP, HSTS).
          </p>
        </div>
      </header>

      <div className="glass-card" style={{ marginBottom: "2rem" }}>
        <form onSubmit={handleScan} style={{ display: "flex", gap: "1rem" }}>
          <input
            type="text"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="example.com or 192.168.1.1"
            required
            className="input-field"
            style={{ flex: 1 }}
          />
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : "Scan Infrastructure"}
          </button>
        </form>
      </div>

      {result && (
        <div className="glass-card">
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
            {result.status === "secure" ? (
              <ShieldCheck size={32} color="#10b981" />
            ) : (
              <ShieldAlert size={32} color="#ef4444" />
            )}
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Scan Results</h2>
              <p style={{ color: "#a1a1aa", fontSize: "0.875rem" }}>
                Target: {result.target}
              </p>
            </div>
            <div style={{ marginLeft: "auto" }}>
               <span className={`badge ${result.status === "secure" ? "badge-success" : "badge-danger"}`}>
                  {result.status.toUpperCase()}
               </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid #3f3f46', paddingBottom: '0.5rem' }}>
                <Server size={20} color="#a1a1aa" />
                <h3>Open Ports</h3>
              </div>
              {result.open_ports.length === 0 ? (
                <p style={{ color: '#10b981' }}>No common exposed ports found.</p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {result.open_ports.map((port, i) => (
                    <span key={i} style={{ padding: '0.25rem 0.75rem', backgroundColor: '#3f3f46', borderRadius: '4px', fontSize: '0.875rem' }}>
                      Port {port}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid #3f3f46', paddingBottom: '0.5rem' }}>
                <Globe size={20} color="#a1a1aa" />
                <h3>Security Headers</h3>
              </div>
              
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>CORS (Cross-Origin Resource Sharing)</span>
                  <span style={{ color: result.security_headers.cors ? '#10b981' : '#ef4444' }}>
                     {result.security_headers.cors ? "Present (Secure)" : "Missing / Insecure"}
                  </span>
                </li>
                <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>CSP (Content Security Policy)</span>
                  <span style={{ color: result.security_headers.csp ? '#10b981' : '#ef4444' }}>
                     {result.security_headers.csp ? "Present (Secure)" : "Missing / Insecure"}
                  </span>
                </li>
                <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>HSTS (Strict Transport Security)</span>
                  <span style={{ color: result.security_headers.hsts ? '#10b981' : '#ef4444' }}>
                     {result.security_headers.hsts ? "Present (Secure)" : "Missing / Insecure"}
                  </span>
                </li>
              </ul>
              
              {Object.keys(result.security_headers.details).length > 0 && (
                <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <p style={{ color: '#fca5a5', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Details:</p>
                  <ul style={{ fontSize: '0.875rem', color: '#fca5a5', listStyle: 'disc', paddingLeft: '1.5rem' }}>
                    {Object.entries(result.security_headers.details).map(([key, value]) => (
                      <li key={key}>{value}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

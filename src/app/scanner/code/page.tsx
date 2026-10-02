"use client";

import { useState } from "react";
import { runCodeScan } from "./actions";
import { CodeScannerResult } from "@/types";
import { ShieldCheck, ShieldAlert, Loader2 } from "lucide-react";

export default function CodeScannerPage() {
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CodeScannerResult | null>(null);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await runCodeScan(repoUrl);
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
          <h1>Code & Dependency Scanner (SAST)</h1>
          <p style={{ color: "#a1a1aa", marginTop: "0.5rem" }}>
            Analyze GitHub repositories for hardcoded secrets and vulnerable dependencies (OSV).
          </p>
        </div>
      </header>

      <div className="glass-card" style={{ marginBottom: "2rem" }}>
        <form onSubmit={handleScan} style={{ display: "flex", gap: "1rem" }}>
          <input
            type="url"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/user/repo"
            required
            className="input-field"
            style={{ flex: 1 }}
          />
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : "Scan Codebase"}
          </button>
        </form>
      </div>

      {result && (
        <div className="glass-card">
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
            {result.status === "safe" ? (
              <ShieldCheck size={32} color="#10b981" />
            ) : (
              <ShieldAlert size={32} color="#ef4444" />
            )}
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Scan Results</h2>
              <p style={{ color: "#a1a1aa", fontSize: "0.875rem" }}>
                Target: {result.repoUrl}
              </p>
            </div>
            <div style={{ marginLeft: "auto" }}>
               <span className={`badge ${result.status === "safe" ? "badge-success" : "badge-danger"}`}>
                  {result.status.toUpperCase()}
               </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div>
              <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid #3f3f46', paddingBottom: '0.5rem' }}>Hardcoded Secrets</h3>
              {result.hardcoded_secrets.length === 0 ? (
                <p style={{ color: '#a1a1aa' }}>No secrets found.</p>
              ) : (
                <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', color: '#fca5a5' }}>
                  {result.hardcoded_secrets.map((secret, i) => (
                    <li key={i}>{secret}</li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid #3f3f46', paddingBottom: '0.5rem' }}>Vulnerable Dependencies</h3>
              {result.vulnerabilities.length === 0 ? (
                <p style={{ color: '#a1a1aa' }}>No vulnerable dependencies found.</p>
              ) : (
                <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', color: '#fca5a5' }}>
                  {result.vulnerabilities.map((vuln, i) => (
                    <li key={i}>{vuln.package}@{vuln.version} (Vuln: {vuln.vulnerability})</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

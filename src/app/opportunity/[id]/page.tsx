import { getOpportunities, getUserProfile, saveTrackingRecord } from "@/lib/store";
import { checkEligibility, generateFieldMappings } from "@/lib/pipeline";
import { analyzeUrlSecurity } from "@/lib/security";
import { ShieldAlert, ShieldCheck, CheckCircle, AlertTriangle, XCircle, Send } from "lucide-react";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export default async function OpportunityPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const opportunities = await getOpportunities();
  const opportunity = opportunities.find(o => o.opportunity_id === resolvedParams.id);
  const profile = await getUserProfile();

  if (!opportunity || !profile) {
    return <div>Opportunity or Profile not found.</div>;
  }

  // Run Pipeline Stages
  const eligibility = checkEligibility(profile, opportunity);
  
  // Real dynamic security check (Stage 4) using Puppeteer
  const security = await analyzeUrlSecurity(opportunity.apply_url);
  
  let autofill = null;
  if (security.classification === "safe" || security.user_override) {
    autofill = generateFieldMappings(profile, opportunity);
  }

  async function applyAction() {
    "use server";
    console.log(`Submitting application to ${opportunity?.apply_url}`);
    
    await saveTrackingRecord({
      opportunity_id: opportunity!.opportunity_id,
      org: opportunity!.org,
      title: opportunity!.title,
      status: "submitted",
      last_updated: new Date().toISOString()
    });

    revalidatePath("/tracking");
    redirect("/tracking");
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem' }}>{opportunity.title}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem' }}>{opportunity.org}</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Stage 3: Eligibility Verdict */}
        <div className="glass-card">
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {eligibility.verdict === 'eligible' ? <CheckCircle color="var(--success)"/> : <XCircle color="var(--danger)"/>}
            Eligibility Check
          </h3>
          <ul style={{ listStylePosition: 'inside', color: 'var(--text-secondary)' }}>
            {eligibility.reasons.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </div>

        {/* Stage 4: Security Verdict */}
        <div className={`glass-card ${security.classification === 'unsafe' ? 'unsafe-card' : ''}`} style={security.classification === 'unsafe' ? { borderColor: 'var(--danger)', background: 'rgba(239, 68, 68, 0.05)' } : {}}>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: security.classification === 'unsafe' ? 'var(--danger)' : security.classification === 'suspicious' ? 'var(--warning)' : 'var(--success)' }}>
            {security.classification === 'safe' ? <ShieldCheck /> : <ShieldAlert />}
            Security Check: {security.classification.toUpperCase()}
          </h3>
          <ul style={{ listStylePosition: 'inside', color: 'var(--text-secondary)' }}>
            {security.signals.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
          {security.classification === 'unsafe' && (
            <div style={{ marginTop: '1rem', color: 'var(--danger)', fontWeight: 600 }}>
              PIPELINE HALTED: This URL is unsafe. Auto-fill and submission are blocked.
            </div>
          )}
        </div>

        {/* Stage 6: Human Verification Screen */}
        {autofill && (
          <div className="glass-card" style={{ border: '1px solid var(--accent-primary)' }}>
            <h3 style={{ marginBottom: '1rem' }}>Stage 6: Review Application Data</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Please review the fields prepared for submission. We will never auto-submit without your approval.
            </p>
            
            <div style={{ display: 'grid', gap: '1rem' }}>
              {autofill.field_mappings.map((field, idx) => (
                <div key={idx} style={{ padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{field.field_name.replace('_', ' ')}</span>
                    <span className={`badge ${field.source === 'ai_generated' ? 'badge-warning' : field.source === 'unmapped' ? 'badge-danger' : 'badge-neutral'}`}>
                      {field.source}
                    </span>
                  </div>
                  
                  {field.source === 'unmapped' ? (
                    <div style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <AlertTriangle size={16} /> Needs manual input
                    </div>
                  ) : (
                    <div style={{ color: 'var(--text-secondary)' }}>{field.value}</div>
                  )}
                </div>
              ))}
            </div>

            <form action={applyAction} style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" style={{ padding: '1rem 2rem' }}>
                <Send size={20} /> Confirm and Apply
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

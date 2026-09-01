import { getOpportunities, saveOpportunities } from "@/lib/store";
import { Search, Briefcase, Calendar, GraduationCap, AlertTriangle, Link as LinkIcon, PlusCircle } from "lucide-react";
import Link from "next/link";
import { extractOpportunity } from "@/lib/extractor";
import { redirect } from "next/navigation";

export default async function Dashboard() {
  const opportunities = await getOpportunities();

  async function addOpportunityAction(formData: FormData) {
    "use server";
    const url = formData.get("url") as string;
    if (!url) return;

    // Dynamically fetch and parse the opportunity using Puppeteer
    const newOpp = await extractOpportunity(url);
    
    // Save to store
    const allOpps = await getOpportunities();
    allOpps.unshift(newOpp);
    await saveOpportunities(allOpps);

    // Redirect to the new opportunity verification flow
    redirect(`/opportunity/${newOpp.opportunity_id}`);
  }

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Discover Opportunities</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Process real application links safely.</p>
        </div>
        <form action={addOpportunityAction} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <input name="url" type="url" required placeholder="Paste real application URL here..." className="input-field" style={{ minWidth: '350px' }} />
          </div>
          <button type="submit" className="btn btn-primary"><PlusCircle size={20} /> Analyze Link</button>
        </form>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {opportunities.map((opp) => (
          <div key={opp.opportunity_id} className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{opp.title}</h3>
                <div style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Briefcase size={16} /> {opp.org}
                </div>
              </div>
              <span className="badge badge-neutral" style={{ textTransform: 'capitalize' }}>
                {opp.type}
              </span>
            </div>

            <div style={{ margin: '1.5rem 0', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                <GraduationCap size={16} color="var(--accent-primary)" />
                Min CGPA: <span style={{ fontWeight: 600 }}>{opp.requirements.min_cgpa}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                <Calendar size={16} color="var(--accent-primary)" />
                Deadline: <span style={{ fontWeight: 600 }}>{opp.deadline ? new Date(opp.deadline).toLocaleDateString() : 'Not specified'}</span>
              </div>
            </div>

            {opp.data_quality === 'incomplete' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: 'rgba(245,158,11,0.1)', color: 'var(--warning)', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                <AlertTriangle size={16} />
                Missing data (e.g. deadline). Verify before applying.
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', marginTop: 'auto' }}>
              <Link href={`/opportunity/${opp.opportunity_id}`} className="btn btn-primary" style={{ flex: 1, textDecoration: 'none' }}>
                View & Check Eligibility
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

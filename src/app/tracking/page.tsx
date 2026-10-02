import { getTrackingRecords, saveTrackingRecord, getEmailOpportunities } from "@/lib/store";
import { Clock, Mail, RefreshCw, Briefcase, GraduationCap, AlertCircle } from "lucide-react";
import { revalidatePath } from "next/cache";
import { fetchAndAnalyzeEmailsAction, registerEmailOpportunityAction } from "./actions";

export default async function TrackingPage() {
  const records = await getTrackingRecords();
  const emailOpps = await getEmailOpportunities();

  async function mockEmailUpdateAction(formData: FormData) {
    "use server";
    const id = formData.get("opportunity_id") as string;
    
    const records = await getTrackingRecords();
    const record = records.find(r => r.opportunity_id === id);
    if (record) {
      record.status = "interview";
      record.last_updated = new Date().toISOString();
      await saveTrackingRecord(record);
      revalidatePath("/tracking");
    }
  }

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Applications & Inbox</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Track applications and AI-analyzed opportunities from your Gmail.</p>
        </div>
        <form action={fetchAndAnalyzeEmailsAction}>
          <button type="submit" className="btn btn-primary">
            <RefreshCw size={18} /> Sync Gmail Now
          </button>
        </form>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        
        {/* Standard Tracking */}
        <div>
          <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={20} color="var(--accent-primary)" /> Application Status
          </h2>
          
          {records.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <p style={{ color: 'var(--text-secondary)' }}>No applications submitted yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {records.map((record) => (
                <div key={record.opportunity_id} className="glass-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ fontSize: '1.1rem' }}>{record.title}</h3>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{record.org}</div>
                    </div>
                    <div className={`badge ${record.status === 'interview' ? 'badge-success' : 'badge-neutral'}`}>
                      {record.status}
                    </div>
                  </div>
                  {record.status === 'submitted' && (
                    <form action={mockEmailUpdateAction} style={{ marginTop: '1rem' }}>
                      <input type="hidden" name="opportunity_id" value={record.opportunity_id} />
                      <button type="submit" className="btn btn-secondary" style={{ width: '100%', fontSize: '0.875rem' }}>
                        Simulate AI Email Update
                      </button>
                    </form>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Email Scanned Opportunities */}
        <div>
          <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Mail size={20} color="var(--accent-primary)" /> Inbox Opportunities
          </h2>
          
          {emailOpps.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <p style={{ color: 'var(--text-secondary)' }}>No opportunities found in recent emails.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {emailOpps.map((opp: any) => (
                <div key={opp.id} className="glass-card">
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                     <h3 style={{ fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '70%' }} title={opp.subject}>
                       {opp.subject}
                     </h3>
                     <span className={`badge ${opp.category === 'internship' ? 'badge-success' : opp.category === 'scholarship' ? 'badge-warning' : opp.category === 'education_form' ? 'badge-primary' : 'badge-neutral'}`} style={{ textTransform: 'capitalize' }}>
                       {opp.category.replace('_', ' ')}
                     </span>
                   </div>
                   <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                     From: {opp.from}
                   </div>
                   <p style={{ fontSize: '0.875rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '1rem' }}>
                     {opp.snippet}
                   </p>
                   <form action={registerEmailOpportunityAction}>
                     <input type="hidden" name="snippet" value={opp.snippet} />
                     <input type="hidden" name="subject" value={opp.subject} />
                     <input type="hidden" name="emailId" value={opp.id} />
                     <button type="submit" className="btn btn-secondary" style={{ width: '100%', fontSize: '0.875rem' }}>
                       Register & Analyze Link
                     </button>
                   </form>
                </div>
              ))}
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}

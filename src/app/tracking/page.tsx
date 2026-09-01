import { getTrackingRecords, saveTrackingRecord } from "@/lib/store";
import { Clock, Mail } from "lucide-react";
import { revalidatePath } from "next/cache";

export default async function TrackingPage() {
  const records = await getTrackingRecords();

  async function mockEmailUpdateAction(formData: FormData) {
    "use server";
    const id = formData.get("opportunity_id") as string;
    
    const records = await getTrackingRecords();
    const record = records.find(r => r.opportunity_id === id);
    if (record) {
      // Stage 9: Mock Email Classification Result
      record.status = "interview";
      record.last_updated = new Date().toISOString();
      await saveTrackingRecord(record);
      revalidatePath("/tracking");
    }
  }

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1>Application Tracking</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Monitor your submitted applications and AI email updates.</p>
      </div>

      {records.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <Clock size={48} color="var(--text-secondary)" style={{ margin: '0 auto 1rem' }} />
          <h3>No Applications Yet</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Submit an application from the dashboard to track it here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {records.map((record) => (
            <div key={record.opportunity_id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem' }}>{record.title}</h3>
                <div style={{ color: 'var(--text-secondary)' }}>{record.org}</div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                    Status
                  </div>
                  <div className={`badge ${record.status === 'interview' ? 'badge-success' : 'badge-neutral'}`}>
                    {record.status}
                  </div>
                </div>

                {record.status === 'submitted' && (
                  <form action={mockEmailUpdateAction}>
                    <input type="hidden" name="opportunity_id" value={record.opportunity_id} />
                    <button type="submit" className="btn btn-secondary" title="Simulate receiving an email update">
                      <Mail size={16} /> Simulate Update
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

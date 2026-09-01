"use client";

import { useState } from "react";
import { UserProfile } from "@/types";
import { Book, Briefcase, FileText, User, Save, X } from "lucide-react";
import { updateProfileAction } from "./actions";

export default function ProfileForm({ initialProfile }: { initialProfile: UserProfile }) {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile>(initialProfile);

  const handleSave = async () => {
    await updateProfileAction(profile);
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1>My Profile</h1>
          <button className="btn btn-secondary" onClick={() => setIsEditing(true)}>Edit Profile</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          {/* Identity & Education & Skills */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="glass-card">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <User size={20} color="var(--accent-primary)"/> Identity
              </h3>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontWeight: 600 }}>{profile.first_name} {profile.last_name}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{profile.email}</div>
              </div>
            </div>

            <div className="glass-card">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Book size={20} color="var(--accent-primary)"/> Education
              </h3>
              {profile.education.map((edu, idx) => (
                <div key={idx} style={{ marginBottom: '1rem' }}>
                  <div style={{ fontWeight: 600 }}>{edu.degree}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{edu.institution} • Class of {edu.year}</div>
                  <div className="badge badge-success" style={{ marginTop: '0.5rem' }}>CGPA: {edu.cgpa}</div>
                </div>
              ))}
            </div>

            <div className="glass-card">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <User size={20} color="var(--accent-primary)"/> Skills
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {profile.skills.map((skill, idx) => (
                  <span key={idx} className="badge badge-neutral">{skill}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Experience & Documents */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="glass-card">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Briefcase size={20} color="var(--accent-primary)"/> Experience
              </h3>
              {profile.experience.map((exp, idx) => (
                <div key={idx} style={{ marginBottom: '1rem' }}>
                  <div style={{ fontWeight: 600 }}>{exp.role}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{exp.org} • {exp.duration}</div>
                  <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>{exp.description}</p>
                </div>
              ))}
            </div>

            <div className="glass-card">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <FileText size={20} color="var(--accent-primary)"/> Documents
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <a href="#" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>📄 {profile.documents.resume_url.split('/').pop()}</a>
                <a href="#" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>🎓 {profile.documents.transcript_url.split('/').pop()}</a>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Edit Mode
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Edit Profile</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-secondary" onClick={() => setIsEditing(false)}>
            <X size={16} /> Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            <Save size={16} /> Save Changes
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="glass-card">
             <h3 style={{ marginBottom: '1rem' }}>Identity</h3>
             <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
               <input className="input-field" value={profile.first_name || ""} onChange={e => setProfile({...profile, first_name: e.target.value})} placeholder="First Name" />
               <input className="input-field" value={profile.last_name || ""} onChange={e => setProfile({...profile, last_name: e.target.value})} placeholder="Last Name" />
             </div>
             <input className="input-field" value={profile.email || ""} onChange={e => setProfile({...profile, email: e.target.value})} placeholder="Email" />
          </div>

          <div className="glass-card">
             <h3 style={{ marginBottom: '1rem' }}>Education</h3>
             {profile.education.map((edu, idx) => (
               <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                 <input className="input-field" value={edu.degree} onChange={e => {
                   const newEdu = [...profile.education];
                   newEdu[idx].degree = e.target.value;
                   setProfile({...profile, education: newEdu});
                 }} placeholder="Degree" />
                 <input className="input-field" value={edu.institution} onChange={e => {
                   const newEdu = [...profile.education];
                   newEdu[idx].institution = e.target.value;
                   setProfile({...profile, education: newEdu});
                 }} placeholder="Institution" />
                 <div style={{ display: 'flex', gap: '1rem' }}>
                   <input className="input-field" type="number" step="0.01" value={edu.cgpa} onChange={e => {
                     const newEdu = [...profile.education];
                     newEdu[idx].cgpa = parseFloat(e.target.value) || 0;
                     setProfile({...profile, education: newEdu});
                   }} placeholder="CGPA" />
                   <input className="input-field" type="number" value={edu.year} onChange={e => {
                     const newEdu = [...profile.education];
                     newEdu[idx].year = parseInt(e.target.value) || 0;
                     setProfile({...profile, education: newEdu});
                   }} placeholder="Year" />
                 </div>
               </div>
             ))}
          </div>

          <div className="glass-card">
             <h3 style={{ marginBottom: '1rem' }}>Skills (comma separated)</h3>
             <textarea className="input-field" style={{ minHeight: '100px' }} value={profile.skills.join(", ")} onChange={e => {
                 setProfile({...profile, skills: e.target.value.split(",").map(s => s.trim()).filter(s => s)});
             }} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="glass-card">
             <h3 style={{ marginBottom: '1rem' }}>Experience</h3>
             {profile.experience.map((exp, idx) => (
               <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                 <input className="input-field" value={exp.role} onChange={e => {
                   const newExp = [...profile.experience];
                   newExp[idx].role = e.target.value;
                   setProfile({...profile, experience: newExp});
                 }} placeholder="Role" />
                 <input className="input-field" value={exp.org} onChange={e => {
                   const newExp = [...profile.experience];
                   newExp[idx].org = e.target.value;
                   setProfile({...profile, experience: newExp});
                 }} placeholder="Organization" />
                 <input className="input-field" value={exp.duration} onChange={e => {
                   const newExp = [...profile.experience];
                   newExp[idx].duration = e.target.value;
                   setProfile({...profile, experience: newExp});
                 }} placeholder="Duration" />
                 <textarea className="input-field" value={exp.description} onChange={e => {
                   const newExp = [...profile.experience];
                   newExp[idx].description = e.target.value;
                   setProfile({...profile, experience: newExp});
                 }} placeholder="Description" />
               </div>
             ))}
          </div>

          <div className="glass-card">
             <h3 style={{ marginBottom: '1rem' }}>Documents</h3>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
               <input className="input-field" value={profile.documents?.resume_url || ""} onChange={e => {
                 setProfile({...profile, documents: {...profile.documents, resume_url: e.target.value}});
               }} placeholder="Resume URL" />
               <input className="input-field" value={profile.documents?.transcript_url || ""} onChange={e => {
                 setProfile({...profile, documents: {...profile.documents, transcript_url: e.target.value}});
               }} placeholder="Transcript URL" />
             </div>
          </div>
        </div>
      </div>
    </>
  );
}

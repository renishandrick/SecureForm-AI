import { getUserProfile } from "@/lib/store";
import ProfileForm from "./ProfileForm";

export default async function ProfilePage() {
  const profile = await getUserProfile();

  if (!profile) {
    return (
      <div className="animate-fade-in">
        <h1>My Profile</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>No profile data found. Please set up your profile.</p>
        <button className="btn btn-primary" style={{ marginTop: '1rem' }}>Create Profile</button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <ProfileForm initialProfile={profile} />
    </div>
  );
}

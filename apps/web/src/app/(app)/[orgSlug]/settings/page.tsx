import { redirect } from 'next/navigation';

export default function SettingsPage({ params }: { params: { orgSlug: string } }) {
  redirect(`/${params.orgSlug}/settings/profile`);
}

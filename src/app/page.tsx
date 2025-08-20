// src/app/page.tsx
import { redirect } from 'next/navigation';

export default function RootPage() {
  // The root page redirects to the main dashboard.
  // The middleware will intercept and redirect to /login if the user is not authenticated.
  redirect('/dashboard');
}

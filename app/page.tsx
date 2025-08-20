// app/page.tsx
import { redirect } from 'next/navigation';

export default function RootPage() {
  // A página raiz redireciona para o login.
  // O middleware cuidará de redirecionar usuários já logados para o dashboard correto.
  redirect('/login');
}

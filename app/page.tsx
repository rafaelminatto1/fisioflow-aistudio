// app/page.tsx
import { redirect } from 'next/navigation';

/**
 * Página raiz da aplicação.
 * Esta página não renderiza nenhum conteúdo visível, sua única função é
 * redirecionar o usuário para a página de login. O middleware de autenticação
 * interceptará a requisição e, se o usuário já estiver logado, o redirecionará
 * para o dashboard apropriado.
 */
export default function RootPage() {
  // A página raiz redireciona para o login.
  // O middleware cuidará de redirecionar usuários já logados para o dashboard correto.
  redirect('/login');
}

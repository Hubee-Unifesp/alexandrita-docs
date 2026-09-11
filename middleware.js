// Vercel Edge Middleware: protege todo o site com autenticação HTTP Basic
// (usuário/senha únicos, compartilhados com o time).
//
// Configure as variáveis de ambiente SITE_USER e SITE_PASSWORD no projeto
// Vercel (Settings > Environment Variables) antes do deploy.
//
// Funciona com qualquer framework (inclusive sites estáticos como o
// Docusaurus), pois o middleware roda na Edge Network do Vercel antes do
// conteúdo ser servido. Ver: https://vercel.com/docs/functions/edge-middleware

export const config = {
  matcher: '/((?!favicon.ico).*)',
};

function unauthorizedResponse() {
  return new Response('Autenticação necessária.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Alexandrita Docs", charset="UTF-8"',
    },
  });
}

export default function middleware(request) {
  const expectedUser = process.env.SITE_USER;
  const expectedPassword = process.env.SITE_PASSWORD;

  // Se as credenciais não estiverem configuradas, bloqueia por segurança
  // em vez de deixar o site aberto por engano.
  if (!expectedUser || !expectedPassword) {
    return unauthorizedResponse();
  }

  const authHeader = request.headers.get('authorization');

  if (authHeader && authHeader.startsWith('Basic ')) {
    const base64Credentials = authHeader.slice('Basic '.length);
    const decoded = atob(base64Credentials);
    const separatorIndex = decoded.indexOf(':');
    const user = decoded.slice(0, separatorIndex);
    const password = decoded.slice(separatorIndex + 1);

    if (user === expectedUser && password === expectedPassword) {
      return;
    }
  }

  return unauthorizedResponse();
}

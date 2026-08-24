import { next } from '@vercel/edge'

// Basic Auth na hraně sítě - běží dřív, než Vercel vrátí jakýkoli statický
// soubor nebo HTML. Heslo se tak nikdy nedostane do JS bundlu (na rozdíl od
// bývalého src/components/PasswordGate.tsx) a neprojde ani přes curl/DevTools
// bez správných přihlašovacích údajů.
//
// BASIC_AUTH_USER a BASIC_AUTH_PASSWORD se nastavují jako Environment
// Variables v Vercel projektu (Production i Preview) - viz .env.example pro
// lokální vývoj přes `vercel dev`.
export default function middleware(request: Request) {
  const user = process.env.BASIC_AUTH_USER
  const pass = process.env.BASIC_AUTH_PASSWORD

  if (!user || !pass) {
    // Bez nastavených proměnných raději appku zavřít, než ji nechat omylem
    // otevřenou pro kohokoli.
    return new Response('Missing BASIC_AUTH_USER / BASIC_AUTH_PASSWORD', { status: 500 })
  }

  const auth = request.headers.get('authorization')
  if (auth?.startsWith('Basic ')) {
    const decoded = atob(auth.slice('Basic '.length))
    const sep = decoded.indexOf(':')
    const reqUser = decoded.slice(0, sep)
    const reqPass = decoded.slice(sep + 1)
    if (reqUser === user && reqPass === pass) {
      return next()
    }
  }

  return new Response('Auth required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="myBRIK"' },
  })
}

export const config = {
  matcher: '/(.*)',
}

import React from 'react'
import ReactDOM from 'react-dom/client'
import { polyfillCountryFlagEmojis } from 'country-flag-emoji-polyfill'
import vlajkyFontUrl from 'country-flag-emoji-polyfill/dist/TwemojiCountryFlags.woff2?url'
import '@matusgallo/mysabds/tokens.css'
import '@matusgallo/mysabds/styles.css'
import './index.css'
import App from './App'
import PasswordGate from './components/PasswordGate'

// Emoji vlajky (předvolby telefonu) - Windows pro ně nemá glyfy a vykreslí místo
// vlajky dvě kapitálky kódu státu. Polyfill doplní font, který vlajky má, a to
// jen tam, kde chybí: sám si ověří, že emoji fungují a vlajky ne, takže na macOS
// a Androidu zůstanou nativní a nic se nestahuje. Font hostíme sami (Vite ho
// zabundluje), aby aplikace nesahala na cizí CDN.
if (polyfillCountryFlagEmojis('Twemoji Country Flags', vlajkyFontUrl)) {
  // DS čte písmo ze --fontFamilyBase na 113 místech, takže rodina s vlajkami
  // musí být první v tomhle tokenu. Původní hodnotu si přečteme z DS a jen před
  // ni přidáme - stack fontů se tím neduplikuje a upgrade DS ho nepřepere.
  // @font-face polyfillu má unicode-range jen na kódy vlajek, na ostatní text
  // proto rodina nemá vliv.
  const root = document.documentElement
  const zaklad = getComputedStyle(root).getPropertyValue('--fontFamilyBase').trim()
  root.style.setProperty('--fontFamilyBase', `'Twemoji Country Flags', ${zaklad || 'Inter, sans-serif'}`)
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PasswordGate>
      <App />
    </PasswordGate>
  </React.StrictMode>,
)


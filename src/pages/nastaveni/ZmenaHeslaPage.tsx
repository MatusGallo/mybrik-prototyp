import { useState } from 'react'
import { Input, Button } from '@matusgallo/mysabds'

export default function ZmenaHeslaPage() {
  const [aktualniHeslo, setAktualniHeslo] = useState('')
  const [noveHeslo, setNoveHeslo] = useState('')
  const [noveHesloZnova, setNoveHesloZnova] = useState('')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      {/* Scrollable content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, flex: 1, padding: 24 }}>
        <h1
          style={{
            fontSize: 20,
            fontWeight: 600,
            lineHeight: '28px',
            color: 'var(--t-textPrimary)',
            margin: 0,
          }}
        >
          Změna hesla
        </h1>

        <p
          style={{
            fontSize: 14,
            fontWeight: 400,
            lineHeight: '20px',
            color: 'var(--t-textPrimary)',
            margin: 0,
          }}
        >
          Heslo musí obsahovat minimálně jedno velké písmeno, jedno malé písmeno a jednu číslici o celkové délce minimálně 8 znaků.
        </p>

        <Input
          label="Aktuální heslo"
          required
          type="password"
          placeholder="Zadejte aktuální heslo"
          value={aktualniHeslo}
          onChange={setAktualniHeslo}
          width="100%"
        />

        <div style={{ height: 1, background: 'var(--t-borderPrimary)' }} />

        <Input
          label="Heslo"
          required
          type="password"
          placeholder="Nové heslo"
          value={noveHeslo}
          onChange={setNoveHeslo}
          width="100%"
        />

        <Input
          label="Heslo znova"
          required
          type="password"
          placeholder="Zopakujte nové heslo"
          value={noveHesloZnova}
          onChange={setNoveHesloZnova}
          width="100%"
        />
      </div>

      {/* Sticky footer */}
      <div style={{ position: 'sticky', bottom: 0, background: 'var(--t-bgPrimary)' }}>
        <div style={{ height: 1, background: 'var(--t-borderPrimary)' }} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 24px' }}>
          <Button label="Změnit heslo" variant="primary" size="lg" onClick={() => {}} />
        </div>
      </div>
    </div>
  )
}

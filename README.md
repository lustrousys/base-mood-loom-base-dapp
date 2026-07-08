# Base Mood Loom

## Purpose

Use Base Mood Loom when you need a clean Base surface for mood traces. The main operation is to saving a feeling; the result is a mood tile.

## Verification checklist

- Build ID: `6a05b7d98f636ba200aa0266`
- Builder Wallet: `0x5afbF8586feF6d25A1FF82e7Bb91Ff08a8EfDa45`
- Builder Code: `bc_7faorijw`
- Live deployment: https://base-mood-loom.vercel.app
- Repository: https://github.com/lustrousys/base-mood-loom-base-dapp
- Chain: Base

## Operator steps

1. Install dependencies.
2. Start the development server.
3. Connect a wallet in the browser.
4. Confirm the `/builder` proof values.

```bash
npm install
npm run dev
```

## Implementation

Next.js UI plus wagmi/viem for wallet and Base chain behavior.

## Secret policy

Do not commit `.env`, private keys, seed phrases, RPC keys, GitHub tokens, or Vercel tokens. Use `.env.example` only for placeholders.

MIT.

# 🍗 Fingers Me

A provably-fair **gamble-to-mint** game + the **$FINGERS** token launch on **Robinhood Chain** (chainId 4663, Uniswap v4).

Pay **1 USDG**, pull the trigger: **40%** mints a **Winner NFT** you can stake for real USDG yield and claim a pro-rata slice of **50,000,000 $FINGERS**; **60%** mints a saucy **Loser** badge. Won and want out? **Sell a Winner back for 75%.**

> ⚠️ **Not an independent audit.** Written defensively and unit + live-fork tested, but a professional audit is still pending. Play with money you can afford to lose. Nothing here is financial advice.

## Layout
- **`contracts/`** — Hardhat (solc 0.8.28, OZ 5.x, viaIR). Game, token, NFTs, staking, claim, v4 hook/migrator/seeder/zap. `SECURITY.md` documents the self-review; 33/33 tests green (incl. live Robinhood-v4 fork).
- **`frontend/`** — Vite + React + TS + wagmi + viem + RainbowKit. Full-width terminal-console UI. Builds to a static `dist/` (GitHub Pages + Netlify ready).

## Key economics
- Winner cap **1,000,000** (hard). $FINGERS fixed **100,000,000** (50M LP + 50M winner claim).
- Loss split: **25% → NFT stakers**, **75% → treasury sink** (immutable). Wins retained for LP; sell-back refunds 75%.
- **No guaranteed-winner path** — even free rolls (team giveaways / owner unlimited) are the same 40% gamble.
- **Community-gated emergency:** the team cannot unilaterally drain pooled USDG — it needs a proposal that **50% of Winner NFTs vote to approve**.

## Develop
```bash
# contracts
cd contracts && npm install && npx hardhat test
npx hardhat run scripts/deploy.js --network robinhood   # needs contracts/.env DEPLOYER_PRIVATE_KEY (gitignored)
node scripts/gen-abis.js                                  # sync ABIs into the frontend after a contract change

# frontend
cd frontend && npm install && npm run dev
npm run build                                             # static dist/
```

Set deployed addresses in `frontend/.env` (`VITE_ADDR_*`) from `contracts/fingers-deployment.robinhood.json`.

## Deploy the site (GitHub Pages)
Published from the committed **`docs/`** folder (no GitHub Actions needed). To update after a change:
```bash
cd frontend && VITE_BASE=/ npm run build
cd .. && rm -rf docs && cp -r frontend/dist docs && cp docs/index.html docs/404.html && touch docs/.nojekyll
git add docs && git commit -m "rebuild site" && git push
```
Pages is configured as **Settings → Pages → Source: Deploy from a branch → `main` / `/docs`**. Live at **https://avaloveapp.github.io/**.

**Secrets never leave your machine:** `contracts/.env` (the deployer private key) and every `.env` are gitignored. The contract addresses baked into the site are public.

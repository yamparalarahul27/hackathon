# Action Items — DeFi Triangle

> Last updated: 2026-04-17
> Two sections: **Your Actions** (manual, needs dashboard/signup) and **Claude Actions** (code, triggered when you provide inputs)

---

## Your Actions (Manual)

### Immediate (this week — Birdeye Sprint 1 deadline Apr 25)

- [ ] **Set `BIRDEYE_API_KEY` on Vercel** — key: `<REDACTED_ROTATED>`
- [ ] **Set `ALLOWED_ORIGINS` on Vercel** — value: `http://localhost:3000,https://defitriangle.xyz`
- [ ] **Set `NEXT_PUBLIC_APP_URL` on Vercel** — value: `https://defitriangle.xyz`
- [ ] **Post on X for Birdeye Sprint 1** — tag `@birdeye_data` + `#BirdeyeAPI`, show screenshots of safety score + trending rail + new listings
- [ ] **Submit Birdeye Sprint 1** via Superteam Earn listing before Apr 25 — include: project name, GitHub link, X post link, Birdeye endpoints used

### Torque Setup

- [ ] **Join Torque hackathon TG group** — link from their Superteam listing
- [ ] **Sign up at `platform.torque.so`** — get `TORQUE_API_TOKEN`
- [ ] **Set `TORQUE_API_TOKEN` on Vercel**
- [ ] **Set up Torque MCP in Claude Code:**
  ```bash
  claude mcp add torque -e TORQUE_API_TOKEN=<your-token> -- npx @torque-labs/mcp
  ```
- [ ] **Create project via MCP:** tell Claude *"Create a project called DeFi Triangle"*
- [ ] **Create custom events via MCP:**
  - *"Create custom event `defi_triangle_swap` with fields: inputMint (string), outputMint (string), inputAmount (string), outputAmount (string), txSignature (string)"*
  - *"Create custom event `defi_triangle_deposit` with fields: vaultAddress (string), amount (string), txSignature (string)"*
  - *"Create custom event `defi_triangle_connect` with fields: action (string)"*
  - *"Create custom event `defi_triangle_shield` with fields: mint (string), amount (string)"*
- [ ] **Create API key via MCP:** *"Create an API key called defi-triangle-prod"*
- [ ] **Set `TORQUE_API_KEY` on Vercel** — the key from above step
- [ ] **Create an incentive campaign via MCP:** *"Create a weekly swap leaderboard — top 10 users by swap count, 7-day evaluation period"*
- [ ] **Give Claude the `incentiveId` + `configId`** from the created campaign → Claude wires leaderboard into dashboard
- [ ] **Post on X** — tag `@torqueprotocol`, show leaderboard screenshot
- [ ] **Write Friction Log** — short doc on what worked/broke in the MCP experience

### Umbra Testing

- [ ] **Check if `QUICKNODE_WSS_URL` is set on Vercel** — if yes, Umbra is ready. If not, add `NEXT_PUBLIC_UMBRA_WSS_RPC=wss://api.devnet.solana.com`
- [ ] **Test on devnet:** connect Phantom (devnet mode) → fund with devnet SOL → go to `/cockpit/wallet` → click "Enable Privacy" → try shield/unshield
- [ ] **Report results** to Claude — what worked, what errored

### Palm USD (BLOCKED — awaiting Solana mint)

- [ ] **⚠️ Get PUSD Solana SPL mint address from Palm USD team** — currently only confirmed on Ethereum (`0xfaf0cee6b20e2aaa4b80748a6af4cd89609a3d78`). You've contacted the team — awaiting reply.
- [ ] **When you get the Solana mint → give it to Claude** → Claude updates `PUSD_MINT` in constants, Freedom Swap card goes live automatically
- [ ] **Verify PUSD has Jupiter liquidity** — search "PUSD" in swap combobox
- [ ] **Create 5-min pitch deck** (max 12 slides) — for Palm USD track submission
- [ ] **Record demo video** — for Palm USD + all other track submissions

### Domain & DNS

- [ ] **Buy `defitriangle.xyz`** domain (if not done)
- [ ] **Point DNS:** `defitriangle.xyz` CNAME → `cname.vercel-dns.com`
- [ ] **Add custom domain in Vercel** project settings → `defitriangle.xyz`

### Supabase (for landing page counter)

- [ ] **Run this SQL in Supabase dashboard → SQL Editor:**
  ```sql
  create table counters (id text primary key, count int8 default 0);
  insert into counters (id, count) values ('landing_interest', 0);

  create table counter_votes (
    id uuid primary key default gen_random_uuid(),
    fingerprint text unique
  );

  create function increment_counter(counter_id text) returns int8 as $$
    update counters set count = count + 1
    where id = counter_id returning count;
  $$ language sql;
  ```

### Content Creation (before May 12)

- [ ] **Demo video** (2-3 min) — screen recording of full product flow
- [ ] **Pitch deck** for Palm USD (12 slides max)
- [ ] **Jupiter DX Report** — written feedback on Ultra API developer experience (35% of Jupiter track judging!)
- [ ] **Torque Friction Log** — written feedback on MCP developer experience
- [ ] **Submit to all tracks** via Superteam Earn + Colosseum

---

## Claude Actions (triggered when you provide inputs)

### When you provide `TORQUE_API_KEY` + campaign IDs

- [ ] Wire `TorqueLeaderboard` component into `/cockpit` dashboard page with real `incentiveId` + `configId`
- [ ] Verify events flow end-to-end (swap → ingest → leaderboard)

### When you provide PUSD mint address

- [ ] Add PUSD mint to token constants
- [ ] Build "Freedom Swap" card — USDC → PUSD with "why non-freezable matters" explainer
- [ ] Add "Non-freezable" badge on PUSD token detail page
- [ ] Wire PUSD + Umbra shield (just add mint to known tokens)
- [ ] Show PUSD vault yield paths (if any Kamino vaults accept PUSD)

### When you confirm Umbra devnet test results

- [ ] Fix any bugs from testing
- [ ] Polish the shield/unshield UI based on your feedback

### When you provide LI.FI decision (go/no-go)

- [ ] If go: build `/cockpit/bridge` page with LI.FI Widget
- [ ] If no-go: skip entirely

### Before each stage → main merge

- [ ] Strip Agentation from `package.json`, `cockpit/layout.tsx`, `(public)/layout.tsx`
- [ ] Verify 0 `agentation` refs in `package-lock.json`
- [ ] Regenerate lockfile if needed

### Weekly (Birdeye Sprints 2-4)

- [ ] Iterate on Birdeye features based on Sprint 1 feedback
- [ ] Submit via Earn listing each week

---

## Vercel Env Vars Summary

| Variable | Value | Status |
|----------|-------|--------|
| `HELIUS_RPC_URL` | (existing) | ✅ Set |
| `NEXT_PUBLIC_HELIUS_RPC_URL` | (existing) | ✅ Set |
| `QUICKNODE_RPC_URL` | (existing) | ✅ Set |
| `QUICKNODE_WSS_URL` | (existing) | ✅ Set |
| `NEXT_PUBLIC_SUPABASE_URL` | (existing) | ✅ Set |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (existing) | ✅ Set |
| `JUPITER_API_KEY` | (existing) | ✅ Set |
| `NEXT_PUBLIC_APP_URL` | `https://defitriangle.xyz` | ⚠️ Update |
| `ALLOWED_ORIGINS` | `http://localhost:3000,https://defitriangle.xyz` | ⚠️ Update |
| `BIRDEYE_API_KEY` | `8192b2e...` | ⚠️ Add |
| `TORQUE_API_TOKEN` | (from platform.torque.so) | ❌ Need |
| `TORQUE_API_KEY` | (from MCP `create_api_key`) | ❌ Need |
| `NEXT_PUBLIC_UMBRA_WSS_RPC` | `wss://api.devnet.solana.com` | ⚠️ Check if QUICKNODE_WSS_URL covers it |

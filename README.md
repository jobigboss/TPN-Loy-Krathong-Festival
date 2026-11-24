# TPN FlexPak Loy Krathong Festival v0.2

Real-time multiplayer prototype. Node.js 20+; no external dependencies.

## Free shared online event (GitHub Pages + Supabase)

1. Create a project at https://supabase.com/dashboard using the **Free** plan. Wait for it to become ready.
2. In SQL Editor, run the entire contents of [supabase/setup.sql](supabase/setup.sql).
3. Get the Project URL and Publishable key (or legacy anon key) from the project's Connect/API settings.
4. Set supabaseUrl and supabaseKey in [public/config.js](public/config.js), then commit and push. These are public browser values. Never use secret or service_role keys.
5. On GitHub, open Settings > Pages > Build and deployment > Source and select **GitHub Actions**.
6. Open Actions > Publish festival to GitHub Pages and run the workflow, or push a commit to main.
7. Open https://jobigboss.github.io/TPN-Loy-Krathong-Festival/ on two devices and submit a wish. Both should show it within about five seconds. Refresh both to verify database persistence.

All participants use the same Supabase table; no browser-only wish storage. The river shows the latest 80 entries and the database retains all wishes. Polling pauses to 30-second intervals in hidden tabs. The cloud version does not report an online visitor count. Local wishes are not automatically migrated.

The SQL allows public reading of wishes and validated submissions through a restricted function, with a basic two-second device cooldown. Clients cannot directly update/delete rows. Device IDs can be replaced, so the cooldown is basic spam resistance rather than strong abuse protection. Manage/delete entries using the Supabase dashboard. Do not enter private information in public wishes.

Free usage is subject to Supabase/GitHub quotas; Supabase Free projects may pause after inactivity. Check the project is active before the event. No paid plan or Render service is needed. Until config.js is filled in, GitHub Pages shows the game with a database setup status and disables submission.

References: https://supabase.com/pricing and https://supabase.com/docs/guides/api

## Run
Extract ZIP, open a terminal in the loy-krathong folder, run `npm start`, then visit http://localhost:3000. For phones on the same LAN, use http://<server-LAN-IP>:3000 and allow inbound TCP 3000 on a trusted private network only. Do not disable the firewall. For internet deployment use HTTPS and a reverse proxy configured for unbuffered SSE.

## Test
`npm test` — integration test for two concurrent SSE clients, valid/invalid submissions, throttling and HTTP routes. `node --check public/app.js` checks syntax. Browser/device rendering and load testing are not yet performed.

## Architecture
Browser Canvas + HTML/CSS/JS; POST /float submits a krathong; GET /events streams snapshot, new krathong and connection count. The river displays the latest 80 krathongs; all accepted wishes are saved to data/wishes.json, 300 maximum SSE connections, per-IP submission cooldown 2 seconds. Saved wishes reload on restart. Online count is connections, not unique people. No login or moderation. IP cooldown can affect users sharing an address. Wishes are public; avoid personal data. Do not deploy to the public internet before implementing moderation, durable storage, proxy-aware abuse protection, privacy policy, TLS and load testing. Animation positions vary slightly across clients.

## Event display
Open `http://localhost:3000/?display=1` on the LED-connected computer. Use browser fullscreen (F11). The river counter shows currently retained krathongs, not total submissions. This mode hides the form visually; it is not an authorization boundary. Branding uses proposed colors, not verified official CI.

## Wish storage and GitHub

Accepted wishes are saved before broadcasting or returning success. `data/wishes.json` contains the complete archive; the river reloads its latest 80 entries after restart. Back up this file regularly. A failed save returns HTTP 503 without adding the wish. Invalid existing data stops startup so it cannot be silently overwritten. Run only one server process against this file.

Set `DATA_DIR` to a durable storage directory on your server. The default is `data/` beside `server.js`. Temporary hosting disks do not preserve files across redeployments; use a persistent volume for this directory. This JSON store suits a small event, rather than large-scale concurrent hosting.

The `.gitignore` excludes wish data, local environment files, and dependencies. Upload application source to GitHub, keeping participant wishes in your private backup. GitHub Pages cannot run the Node.js server or save shared wishes: deploy this application to a host supporting Node.js, persistent storage, and SSE.

PowerShell example on port 3001:

```powershell
$env:PORT='3001'
npm.cmd start
```

Place the background song at `public/music/background.mp3`. The music button plays this bundled file on a loop at 45% volume. Commit the song with the source to include it in deployment. Playback starts after clicking the music button.

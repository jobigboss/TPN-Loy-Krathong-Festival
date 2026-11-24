# TPN FlexPak Loy Krathong Festival v0.2

Real-time multiplayer prototype. Node.js 20+; no external dependencies.

## Shared online event (Render)

[Deploy the shared festival on Render](https://render.com/deploy?repo=https://github.com/jobigboss/TPN-Loy-Krathong-Festival)

The included `render.yaml` runs the frontend and Node.js backend on the same URL, with one instance and a 1 GB persistent disk mounted at `/var/data`. All visitors on that URL receive the same live wishes. This configuration uses a paid Starter web service and disk; review Render's displayed charges before deploying. No service is created by committing this file.

1. Open the deployment link and connect your GitHub account to Render.
2. Review the Blueprint, service plan, and persistent disk, then deploy.
3. Wait until the service is live and open its actual `https://…onrender.com` URL.
4. Share that URL with participants; use `/?display=1` for the event screen.

GitHub Pages remains a documentation page; the shared game runs at the Render URL. Existing local wishes are not automatically uploaded. To migrate them, privately copy `data/wishes.json` to `/var/data/wishes.json` while the hosted application is stopped, then restart it. Keep a separate backup. Verify with two devices that a new wish appears on both, and restart the service to confirm persistence before the event.

References: [Render Blueprints](https://render.com/docs/blueprint-spec), [persistent disks](https://render.com/docs/disks).

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

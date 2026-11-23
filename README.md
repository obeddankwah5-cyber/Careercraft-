# CareerCraft

CareerCraft is a Ghana-focused document builder for CVs/resumes, application letters and tenancy agreement drafts. The web app includes a guided form, template choices, live preview, Paystack checkout and PDF delivery after server-side payment verification.

## Run locally

1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env` and add your Paystack secret key.
4. Run `npm start`.
5. Open `http://localhost:3000`.

## Render deployment

Create a **Web Service** from this GitHub repository.

- Build command: `npm install`
- Start command: `npm start`
- Runtime: Node.js

Set these environment variables in Render:

- `PAYSTACK_SECRET_KEY`: your Paystack **secret** key (keep it private; never put it in frontend code or GitHub).
- `PUBLIC_URL`: your deployed HTTPS service URL, for example `https://your-service.onrender.com`.
- `DATA_DIR`: `/var/data` when using a Render persistent disk mounted at `/var/data`.

For durable order and PDF storage, attach a Render persistent disk mounted at `/var/data`. The app stores order records and generated PDFs in that directory. Without a persistent disk, local files may be lost when the service restarts or redeploys.

## Paystack setup

1. Add your Paystack secret key in Render environment variables.
2. In the Paystack dashboard, configure the webhook URL as `https://YOUR-DOMAIN/api/payments/webhook`.
3. Test with Paystack test credentials before switching to live credentials.
4. The server verifies the transaction reference, successful status, GHS currency and the expected GHS 10 amount before marking an order as paid and generating its PDF.

The frontend never receives the secret key. Do not commit real keys to this repository.

## Important notes

- The current document fee is GHS 10 per document, configured on the server.
- The tenancy agreement output is a drafting aid and is not a substitute for legal review.
- Add your business support contact and privacy/terms pages before opening the service to the public.
- Configure a persistent disk before relying on generated PDFs for customer delivery.

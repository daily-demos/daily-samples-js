# Daily participation tracker sample app (with Daily Prebuilt)

This demo app shows how to 

## Run project locally

### Create a Daily account

To use this app, you will need to create a [Daily account](https://dashboard.daily.co/signup).

### Add environment variables

To add the required environment variables, start by copying the example `.env` file:

```bash
cp .env.example .env
```

In `.env`, add your Daily API key, which can be found in the [Daily dashboard](https://dashboard.daily.co/developers).

```
DAILY_API_KEY=<your-daily-api-key>
```

### Start dev server

To run this project locally, install project dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

## Using this demo app

To use this demo app, 

---

(Note: This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).)

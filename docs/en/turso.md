# Turso Database Detailed Setup

This page covers one thing only: **how to prepare a production Turso database for Origami**.

## Final `.env` values you need

```txt
TURSO_DATABASE_URL=libsql://origami-prod-xxxxx.turso.io
TURSO_AUTH_TOKEN=...
```

For Origami, only two values matter here:

- URL: which database to connect to
- token: whether the app has permission to connect

## Official reference

- Turso Quickstart  
  <https://docs.turso.tech/quickstart>
- Turso CLI installation  
  <https://docs.turso.tech/cli/installation>
- Turso DB token creation  
  <https://docs.turso.tech/cli/db/tokens/create>
- Turso pricing  
  <https://turso.tech/pricing>

## Write this cheat sheet first

```txt
Database name
origami-prod

Production app URL
https://mail.example.com

Values to fill
TURSO_DATABASE_URL=...
TURSO_AUTH_TOKEN=...
```

## Why use “dashboard to create, CLI to fetch”

The dashboard UI can move around. The CLI path for the database URL and token is usually more stable and easier to reproduce.

Recommended flow:

1. create the database in the web dashboard
2. use the CLI to fetch the URL
3. use the CLI to create the token
4. copy both values into `.env`

## Click-by-click setup

### 1. Open Turso and sign in

Open:

- <https://turso.tech/>

Sign in and enter the dashboard.

### 2. Confirm your plan

For a self-hosted personal instance, starting with the currently available free tier is usually fine. Plans may change, so always verify against the pricing page:

- <https://turso.tech/pricing>

### 3. Create the database in the dashboard

Find:

- **Create database**

Recommended database name:

```txt
origami-prod
```

For the location, choose a region reasonably close to where you deploy Origami.

### 4. Install the Turso CLI

#### macOS

```bash
brew install tursodatabase/tap/turso
```

#### Linux

```bash
curl -sSfL https://get.tur.so/install.sh | bash
```

Then run:

```bash
turso
```

### 5. Sign in through the CLI

```bash
turso auth login
```

### 6. Get the database URL

```bash
turso db show origami-prod --url
```

You should get something like:

```txt
libsql://origami-prod-xxxxx.turso.io
```

Copy it into:

```txt
TURSO_DATABASE_URL=libsql://origami-prod-xxxxx.turso.io
```

### 7. Create the database token

```bash
turso db tokens create origami-prod
```

Copy the result into:

```txt
TURSO_AUTH_TOKEN=...
```

## Minimal working `.env` example

```txt
TURSO_DATABASE_URL=libsql://origami-prod-xxxxx.turso.io
TURSO_AUTH_TOKEN=eyJhbGciOi...
```

## Check before testing

Make sure:

- the database exists in the Turso dashboard
- `TURSO_DATABASE_URL` came directly from `turso db show origami-prod --url`
- `TURSO_AUTH_TOKEN` came directly from `turso db tokens create origami-prod`
- there are no accidental spaces or quotes in `.env`

## How to verify it works

After filling both values into `.env`, run:

```bash
npm run db:setup
```

If the connection is correct, this should complete successfully.

## Common errors

### 1. the database URL is wrong

Make sure:

- it starts with `libsql://`
- it came from `turso db show origami-prod --url`
- it was not hand-written from memory

### 2. the token was not created for this database

The safest command is:

```bash
turso db tokens create origami-prod
```

### 3. the CLI is not actually signed in

If you see auth errors, run:

```bash
turso auth login
```

### 4. the database exists, but no token was created

Origami needs both:

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`

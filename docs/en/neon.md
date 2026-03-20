# Neon PostgreSQL Detailed Setup

This page covers one thing only: **how to prepare a production Neon PostgreSQL database for Origami**.

## What this page helps you get

By the time you finish this page, you should have:

- a created Neon project
- a database ready for Origami
- a complete `DATABASE_URL` you can paste into `.env`
- a setup that can pass `npm run db:setup`

## Final `.env` value you need

```txt
DATABASE_URL=postgresql://user:password@ep-example.ap-southeast-1.aws.neon.tech/origami?sslmode=require
```

## Official reference

- Neon Docs  
  <https://neon.tech/docs>
- Neon Console  
  <https://console.neon.tech/>
- Neon pricing  
  <https://neon.tech/pricing>

## Recommended flow

1. create a Neon project
2. choose a region close to where Origami runs
3. confirm the database / branch you want to use
4. copy the full PostgreSQL connection string from the Neon dashboard
5. paste it into `DATABASE_URL` unchanged
6. run `npm run db:setup`

## Key steps

### 1. Sign in to Neon

Open:

- <https://console.neon.tech/>

### 2. Create a project

A practical production name is:

```txt
origami-prod
```

### 3. Confirm the database and branch

What matters is simply that:

- you know which project the app will use
- you know which database the app will use
- production does not accidentally point to a test branch or test database

### 4. Copy the connection string

It will look roughly like this:

```txt
postgresql://user:password@ep-example-pooler.ap-southeast-1.aws.neon.tech/origami?sslmode=require
```

> The safest approach is to copy the full Neon connection string exactly as shown.  
> Do not manually remove `sslmode=require`, and do not hand-build the host or query parameters.

Origami now uses the `postgres` driver and works with Neon pooled or direct URLs. Keep the full URL unchanged.

### 5. Put it into `.env`

```txt
DATABASE_URL=postgresql://user:password@ep-example.ap-southeast-1.aws.neon.tech/origami?sslmode=require
```

## How to verify it works

After filling `DATABASE_URL` into `.env`, run:

```bash
npm install
npm run db:setup
```

If the connection is correct, this should complete successfully.

## Common errors

### 1. still using old Turso variables

Origami no longer uses:

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`

Use this instead:

- `DATABASE_URL`

### 2. manually breaking the Neon connection string

Make sure:

- the URL came directly from the Neon dashboard
- you did not remove the query parameters
- you did not mix production and development projects

### 3. pointing at the wrong branch or database

If you have multiple branches or databases, double-check:

- which one is in `.env`
- which one the deployment is using
- which one `db:setup` actually ran against

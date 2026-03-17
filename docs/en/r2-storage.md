# Cloudflare R2 / Bucket: Detailed Setup

This page explains one thing only: **how to configure attachment storage for Origami**.

Origami stores attachments in Cloudflare R2 instead of putting them directly into the database. For email attachments, that is a much better fit.

If your goal right now is:

> “I want to click through Cloudflare, configure R2, and then paste the values back into `.env`.”

follow this page step by step.

---

## What should you have at the end of this step?

You should end up with these values in `.env`:

```txt
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=origami-attachments-prod
R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

It is also useful to keep:

```txt
R2_ACCOUNT_ID=...
```

The runtime does not strictly require it today, but it is very useful for troubleshooting.

You can think of this step as:

> create a bucket in Cloudflare, create a key that can access that bucket, then copy those values back into `.env`.

---

## Which two places will you keep switching between?

For this step, you mostly switch between **two places**:

### Place A: Cloudflare Dashboard

This is where you will:

- find the Account ID
- create the bucket
- create the R2 API token
- copy the Access Key ID and Secret Access Key

### Place B: the `.env` file in the Origami project

This is where you will fill:

```txt
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_ENDPOINT=
```

The simplest way to remember it is:

> **Cloudflare generates the storage values. `.env` receives the storage values.**

---

## Official reference

- Cloudflare R2: Create buckets  
  <https://developers.cloudflare.com/r2/buckets/create-buckets/>
- Cloudflare R2: API tokens / S3 auth  
  <https://developers.cloudflare.com/r2/api/tokens/>
- Cloudflare: Find your Account ID  
  <https://developers.cloudflare.com/fundamentals/account/find-account-and-zone-ids/>

---

## Before you start, write this checklist down

Write these values somewhere first:

```txt
Cloudflare Account ID = ...
Bucket name = origami-attachments-prod
R2 endpoint = https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

If you want separate environments, I strongly recommend names like:

- development: `origami-attachments-dev`
- production: `origami-attachments-prod`

> Strong recommendation: use separate buckets for development and production.

---

## If the UI does not look exactly like this page

Cloudflare changes its dashboard too. Focus on these keywords:

- `R2 Object Storage`
- `Buckets`
- `Manage R2 API tokens`
- `Account ID`

If the menu position looks different, trust the page title and search more than the exact layout in this guide.

---

## User click script: configure R2 from scratch

### Step 1: open Cloudflare Dashboard

Open:

- <https://dash.cloudflare.com/>

Sign in to your Cloudflare account.

### What should you see now?

You should already be inside the Cloudflare dashboard and see:

- the account home area
- the left sidebar
- or a search entry point

If you manage multiple Cloudflare accounts, first make sure you are in the one where you want R2 to live.

---

### Step 2: find the Account ID first

Inside Cloudflare Dashboard, go like this:

1. open **Account home** or **Workers & Pages**
2. find **Account ID**
3. copy it

Official docs:

- <https://developers.cloudflare.com/fundamentals/account/find-account-and-zone-ids/>

### Which line should you note down right now?

```txt
R2_ACCOUNT_ID=<your Account ID>
```

Then also build the endpoint immediately:

```txt
R2_ENDPOINT=https://<your Account ID>.r2.cloudflarestorage.com
```

For example:

```txt
R2_ENDPOINT=https://1234567890abcdef1234567890abcdef.r2.cloudflarestorage.com
```

---

### Step 3: open the R2 page and create the bucket

Still in Cloudflare, find:

- **R2 Object Storage**

Then create a bucket.

### What should you name the bucket?

I recommend:

- development: `origami-attachments-dev`
- production: `origami-attachments-prod`

### What matters most at this step?

Not advanced settings. Just these two things:

1. **the bucket is actually created successfully**
2. **you remember the exact bucket name**

That exact name later goes into:

```txt
R2_BUCKET_NAME=origami-attachments-prod
```

### What should you see now?

After successful creation, you should usually see:

- the bucket list
- the new bucket name
- an entry point into bucket details

If you do not even see the bucket in the list, this step is not done yet.

---

### Step 4: create the R2 API token

Now find:

- **Manage R2 API tokens**

You will usually see entries like:

- **Create Account API token**
- **Create User API token**

For personal use, either can often work. The safest practical pattern is:

- permission = **Object Read & Write**
- scope = only the bucket you just created

### Why this permission choice?

Because Origami only needs to:

- upload attachments into that bucket
- read attachments back from that bucket

It does not need broader access.

---

### Step 5: copy the Access Key and Secret Access Key

After creating the token, Cloudflare shows:

- **Access Key ID**
- **Secret Access Key**

Copy them immediately.

They go back into `.env` like this:

```txt
R2_ACCESS_KEY_ID=<Access Key ID>
R2_SECRET_ACCESS_KEY=<Secret Access Key>
```

> Important: the Secret Access Key is often shown only once.

---

## Now go back to `.env`: which lines should you fill?

Switch back to the `.env` file in the Origami project and fill:

```txt
R2_ACCOUNT_ID=1234567890abcdef1234567890abcdef
R2_ACCESS_KEY_ID=xxxxxxxxxxxxxxxxxxxx
R2_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
R2_BUCKET_NAME=origami-attachments-prod
R2_ENDPOINT=https://1234567890abcdef1234567890abcdef.r2.cloudflarestorage.com
```

### The simplest way to think about those 5 lines

- `R2_ACCOUNT_ID`: which Cloudflare account owns this R2 setup
- `R2_ACCESS_KEY_ID`: the public part of the key
- `R2_SECRET_ACCESS_KEY`: the private part of the key
- `R2_BUCKET_NAME`: which bucket stores attachments
- `R2_ENDPOINT`: the connection endpoint for that R2 storage

---

## After editing `.env`, verify these items immediately

Check them one by one:

- Is `R2_ACCOUNT_ID` the exact Account ID you copied?
- Is `R2_ENDPOINT` exactly `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`?
- Is `R2_BUCKET_NAME` the exact bucket name you created?
- Did you accidentally swap `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY`?
- Does the token have at least **Object Read & Write**?
- Does the token scope include that bucket?

If these are all correct, R2 is usually fine.

---

## Next: go back to Origami and verify attachment upload

Now you can run Origami:

```bash
npm run dev
```

Then sign in and follow this verification flow:

1. open compose
2. upload a small attachment
3. finish the send or save flow
4. open the message detail and try downloading the attachment

### What should you see now?

The ideal outcome is:

- upload succeeds without errors
- send / save succeeds
- the attachment can be downloaded from the detail view

If both upload and download work, the R2 setup is basically correct.

---

## Most common problems, and how to find them fast

### 1. `R2_ENDPOINT` is wrong

This is the most common one.

The only correct format is:

```txt
https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

Do not forget:

- `https://`
- `.r2.cloudflarestorage.com`

### 2. Access Key and Secret are swapped

Also very common.

Remember:

- `R2_ACCESS_KEY_ID` is not `R2_SECRET_ACCESS_KEY`

### 3. the token does not have object read/write permission

If the token is too restricted, Origami may still boot, but attachment upload will fail.

Minimum recommendation:

- **Object Read & Write**
- scope to the target bucket

### 4. the bucket name points to the wrong environment

For example:

- the token belongs to the prod bucket
- but `.env` contains the dev bucket name

That looks like an upload failure, but the real cause is bucket / permission mismatch.

### 5. the Account ID came from the wrong Cloudflare account

If you manage multiple accounts, it is easy to copy the wrong Account ID.

Then you get this confusing situation:

- the endpoint looks real
- the key looks real
- but they do not belong to the same account

### 6. assuming the bucket must be public

Usually it does **not** need to be public.

Origami handles uploads and downloads on the server side. You do not need to expose the bucket to the whole internet.

---

## What I recommend in practice

If you ask me for the safest setup, I would recommend:

1. **separate buckets for development and production**
2. **token permission = Object Read & Write only**
3. **scope the token to one bucket only**
4. **keep `R2_ACCOUNT_ID` in `.env`**

It is simple, boring, and hard to mess up.

---

## What to read next

After R2 works, continue with:

1. [GitHub Auth detailed setup](/en/github-auth)
2. [Gmail OAuth detailed setup](/en/gmail-oauth)
3. [Outlook OAuth detailed setup](/en/outlook-oauth)

# Cloudflare R2 / Bucket: Detailed Setup

This page explains one thing only: **how to configure attachment storage for Origami**.

Origami stores attachments in Cloudflare R2 instead of pushing binary blobs directly into the database. For email attachments, that is the saner design.

---

## First, what do you need in the end?

You will eventually put these values into `.env`:

```txt
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=origami-attachments
R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

It is also useful to keep:

```txt
R2_ACCOUNT_ID=...
```

The runtime does not strictly require it today, but it is very helpful when debugging.

---

## Official references

- Cloudflare R2: Create buckets  
  <https://developers.cloudflare.com/r2/buckets/create-buckets/>
- Cloudflare R2: API tokens / authentication  
  <https://developers.cloudflare.com/r2/api/tokens/>
- Cloudflare: Find your account ID  
  <https://developers.cloudflare.com/fundamentals/account/find-account-and-zone-ids/>

---

## The plain-English mental model

Origami really only needs four things from R2:

1. **one bucket name**
2. **one Access Key ID**
3. **one Secret Access Key**
4. **one S3-compatible endpoint**

If those four values are correct, Origami can upload and download attachments.

So even though the Cloudflare dashboard has many concepts, the values you actually need to bring back to `.env` are very small in number.

---

## Before you start, write these values down

It helps to write down what you plan to use first:

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

Cloudflare also changes dashboard layouts from time to time. These keywords matter most:

- `R2 Object Storage`
- `Buckets`
- `Manage R2 API tokens`
- `Account ID`

If the navigation hierarchy looks slightly different, trust search and page titles more than the exact menu position in this guide.

---

## Baby-step guide: configure R2 from scratch

### Step 1: sign in to the Cloudflare dashboard

Open:

- <https://dash.cloudflare.com/>

Sign in to your Cloudflare account.

---

### Step 2: find your Account ID

If you do not know your Account ID yet:

1. open Cloudflare Dashboard
2. go to **Account home** or **Workers & Pages**
3. find **Account ID**
4. copy it

Official docs:

- <https://developers.cloudflare.com/fundamentals/account/find-account-and-zone-ids/>

You will use it later to build `R2_ENDPOINT`:

```txt
https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

### At this point, write these two lines down

```txt
R2_ACCOUNT_ID=<your Account ID>
R2_ENDPOINT=https://<your Account ID>.r2.cloudflarestorage.com
```

---

### Step 3: create a bucket

Go to:

- **R2 Object Storage**

Then create a bucket.

Recommended names:

- `origami-attachments-dev`
- `origami-attachments-prod`

This makes the environment obvious immediately.

### The two most important things at this step are not advanced options

They are simply:

1. **use a clear environment-specific name**
2. **remember the exact bucket name you created**

Later you will copy that exact value into:

```txt
R2_BUCKET_NAME=origami-attachments-prod
```

Official docs:

- <https://developers.cloudflare.com/r2/buckets/create-buckets/>

---

### Step 4: create an R2 API token

In Cloudflare Dashboard, go to:

- **R2 Object Storage**
- **Manage R2 API tokens**

You will usually see entries like:

- **Create Account API token**
- **Create User API token**

For personal use, either can work. The safest least-privilege idea is:

- grant only **Object Read & Write**
- scope it only to the bucket you just created

That way Origami can read and write objects in that bucket, and nothing more.

Official docs:

- <https://developers.cloudflare.com/r2/api/tokens/>

---

### Step 5: save Access Key ID and Secret Access Key

After the token is created, Cloudflare shows:

- **Access Key ID**
- **Secret Access Key**

Save both and put them into:

```txt
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
```

> Important: the secret is often not shown again in full. Save it immediately.

---

### Step 6: put the bucket name into `.env`

If the bucket you created is the production bucket:

```txt
R2_BUCKET_NAME=origami-attachments-prod
```

If you are configuring development, use the dev bucket name instead.

One of the easiest mistakes here is:

- the token points to the prod bucket
- but `.env` contains the dev bucket name

That looks like a tiny mismatch, but it leads directly to upload failures.

---

### Step 7: put the endpoint into `.env`

`R2_ENDPOINT` always has this format:

```txt
https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

Example:

```txt
R2_ENDPOINT=https://1234567890abcdef1234567890abcdef.r2.cloudflarestorage.com
```

If you want, also keep `R2_ACCOUNT_ID`:

```txt
R2_ACCOUNT_ID=1234567890abcdef1234567890abcdef
```

---

## Minimal `.env` example

```txt
R2_ACCOUNT_ID=1234567890abcdef1234567890abcdef
R2_ACCESS_KEY_ID=xxxxxxxxxxxxxxxxxxxx
R2_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
R2_BUCKET_NAME=origami-attachments-prod
R2_ENDPOINT=https://1234567890abcdef1234567890abcdef.r2.cloudflarestorage.com
```

---

## After configuration, verify these items in order

Check them one by one:

- Is `R2_ACCOUNT_ID` from the correct Cloudflare account?
- Is `R2_ENDPOINT` exactly `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`?
- Is `R2_BUCKET_NAME` the exact bucket name you created?
- Did you accidentally swap `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY`?
- Does the token have at least **Object Read & Write** permission?
- Does the token scope include that bucket?

If these six items are all correct, the R2 setup is usually fine.

---

## How should you verify that it really works?

The easiest real-world test is:

1. run Origami
2. sign in
3. open compose
4. upload a small attachment
5. complete the send or save flow
6. later try downloading that attachment again

If both upload and download work, your R2 configuration is basically correct.

---

## Most common problems, and how to recognize them quickly

### 1. wrong endpoint

This is the most common one.

`R2_ENDPOINT` must be the full value:

```txt
https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

Do not forget:

- `https://`
- `.r2.cloudflarestorage.com`

### 2. Access Key and Secret are swapped

Also very common.

Remember:

- `R2_ACCESS_KEY_ID` is not the same as `R2_SECRET_ACCESS_KEY`

### 3. the token does not have object read/write permission

If the token is too restricted, Origami may still boot, but attachment upload will fail.

Minimum recommendation:

- **Object Read & Write**
- scoped to the target bucket

### 4. the bucket name points to the wrong environment

Examples:

- production points to the dev bucket
- the bucket was never created
- the token only covers prod, but `.env` names a different bucket

These failures often look like a generic upload error, but the real cause is bucket or permission mismatch.

### 5. the Account ID belongs to another Cloudflare account

If you manage multiple Cloudflare accounts, copying the wrong Account ID is easy.

Then you get a very annoying situation:

- the endpoint looks valid
- the token also looks real
- but the endpoint, token, and bucket do not belong to the same account

### 6. assuming the bucket must be public

It usually does **not** need to be public.

Origami uploads and downloads attachments through the server side; you do not need to expose the bucket publicly.

---

## What I recommend in practice

If you ask me for the safest setup, I would recommend:

1. separate `origami-attachments-dev` and `origami-attachments-prod`
2. token permission = **Object Read & Write** only
3. scope the token to a single bucket
4. keep `R2_ACCOUNT_ID` in `.env` for easier debugging

This is boring in the best way: simple and hard to mess up.

---

## What to read next

- [Gmail OAuth detailed setup](/en/gmail-oauth)
- [Outlook OAuth detailed setup](/en/outlook-oauth)

# Cloudflare R2 / Bucket: Detailed Setup

This page explains one thing only: **how to configure attachment storage for Origami**.

Origami stores attachments in Cloudflare R2 instead of putting binary blobs directly into the database. This is a much better fit for email attachments.

## Environment variables you will eventually set

```txt
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=origami-attachments
R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

You can also keep:

```txt
R2_ACCOUNT_ID=...
```

The runtime does not strictly require it today, but it is still useful for debugging.

## Official references

- Cloudflare R2: Create buckets  
  <https://developers.cloudflare.com/r2/buckets/create-buckets/>
- Cloudflare R2: API tokens / authentication  
  <https://developers.cloudflare.com/r2/api/tokens/>
- Cloudflare: Find your account ID  
  <https://developers.cloudflare.com/fundamentals/account/find-account-and-zone-ids/>

## What Origami actually needs from R2

You can simplify it into four values:

1. one bucket name
2. one Access Key ID
3. one Secret Access Key
4. one S3-compatible endpoint

If those four values are correct, Origami can upload and download attachments.

## Baby-step guide: configure R2 from scratch

### Step 1: sign in to the Cloudflare dashboard

Open:

- <https://dash.cloudflare.com/>

### Step 2: find your Account ID

If you do not know your Cloudflare Account ID yet:

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

### Step 3: create a bucket

Open:

- **R2 Object Storage**

Then create a bucket.

Suggested names:

- `origami-attachments-dev`
- `origami-attachments-prod`

This makes environments obvious and reduces mistakes.

> Recommended: use separate buckets for local/dev and production.

Official docs:

- <https://developers.cloudflare.com/r2/buckets/create-buckets/>

### Step 4: create an R2 API token

Still in Cloudflare Dashboard, go to:

- **R2 Object Storage**
- **Manage R2 API tokens**

Then choose either:

- **Create Account API token**
- or **Create User API token**

For a personal setup, both often work. A safe least-privilege pattern is:

- choose **Object Read & Write**
- scope it only to the bucket you just created

That way Origami gets read/write access only to that bucket, not to everything else.

Official docs:

- <https://developers.cloudflare.com/r2/api/tokens/>

### Step 5: save Access Key ID and Secret Access Key

After the token is created, Cloudflare gives you:

- **Access Key ID**
- **Secret Access Key**

Put them into:

```txt
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
```

> Important: save the secret immediately. Many platforms do not show it again.

### Step 6: set the bucket name

Use the exact bucket name you created:

```txt
R2_BUCKET_NAME=origami-attachments-prod
```

### Step 7: set the endpoint

The endpoint format is:

```txt
https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

Example:

```txt
R2_ENDPOINT=https://1234567890abcdef1234567890abcdef.r2.cloudflarestorage.com
```

If you also want to keep `R2_ACCOUNT_ID`, set it too:

```txt
R2_ACCOUNT_ID=1234567890abcdef1234567890abcdef
```

## Minimal `.env` example

```txt
R2_ACCOUNT_ID=1234567890abcdef1234567890abcdef
R2_ACCESS_KEY_ID=xxxxxxxxxxxxxxxxxxxx
R2_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
R2_BUCKET_NAME=origami-attachments-prod
R2_ENDPOINT=https://1234567890abcdef1234567890abcdef.r2.cloudflarestorage.com
```

## How to verify the setup

The easiest test is:

1. run Origami
2. sign in
3. open compose
4. upload a small attachment
5. send or otherwise complete the flow
6. check that downloading the attachment later also works

If upload and download both work, your R2 configuration is probably correct.

## Common problems

### 1. wrong endpoint

The most common issue. `R2_ENDPOINT` must be the full value:

```txt
https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

Do not forget:

- `https://`
- `.r2.cloudflarestorage.com`

### 2. Access Key and Secret are swapped

Also common.

- `R2_ACCESS_KEY_ID` is not the same as `R2_SECRET_ACCESS_KEY`

### 3. token does not have object read/write permission

If the token is too restricted, Origami may boot but attachment upload will fail.

Minimum recommendation:

- **Object Read & Write**
- scoped to the target bucket

### 4. wrong bucket name or wrong environment

Examples:

- production is pointing at the dev bucket
- the bucket was never created

This often looks like a generic upload failure, but the real cause is bucket mismatch.

### 5. wrong Account ID from another Cloudflare account

If you manage multiple Cloudflare accounts, copying the wrong Account ID is easy.

Then the endpoint looks valid, but the token and bucket do not belong together.

## What I recommend in practice

If you want the safest setup:

1. separate `origami-attachments-dev` and `origami-attachments-prod`
2. token permission = **Object Read & Write** only
3. scope the token to a single bucket
4. keep `R2_ACCOUNT_ID` in `.env` for easier debugging

## What to read next

- [Gmail OAuth detailed setup](/en/gmail-oauth)
- [Outlook OAuth detailed setup](/en/outlook-oauth)

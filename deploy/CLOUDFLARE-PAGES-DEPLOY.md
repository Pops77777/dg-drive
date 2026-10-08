# DGx Cloud — 100% Free Cloudflare Pages Deployment (Unlimited Bandwidth & Requests)

## Key Advantages
- **Unlimited Bandwidth** (330+ Cloudflare edge locations worldwide)
- **Unlimited Requests** (No 100,000/day limit — Cloudflare Pages serves unlimited page loads)
- **0s Cold Starts** (Never sleeps like free container hosts)
- **₹0 Cost Forever & No Credit/Debit Card Required**

---

## Step-by-Step Deployment (2 Minutes)

### Step 1: Create a Free Cloudflare Account (If you haven't already)
1. Go to [dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up).
2. Enter your Email and choose a Password.
3. Verify your email. (No payment method or card is needed).

---

### Step 2: Connect GitHub to Cloudflare Pages
1. In Cloudflare Dashboard, click **Workers & Pages** in the left sidebar.
2. Click **Create Application** (or **Create**).
3. Select the **Pages** tab.
4. Click **Connect to Git**.
5. Choose **GitHub** and authorize Cloudflare to access your GitHub repository (`Pops77777/dgx-cloud`).
6. Select the repository and click **Begin setup**.

---

### Step 3: Configure Build Settings
Fill in these simple fields:
- **Project name**: `dgx-cloud` (or any name you like; this gives you `https://dgx-cloud.pages.dev`)
- **Production branch**: `main`
- **Framework preset**: `None`
- **Build command**: *(Leave empty)*
- **Build output directory**: `public`

Click **Save and Deploy**.

---

### Step 4: Live!
In about 15-30 seconds, Cloudflare will deploy your site and provide your permanent URL:
`https://dgx-cloud.pages.dev` (or your chosen project name).

Every time you push new code to your GitHub repo, Cloudflare Pages will automatically rebuild and deploy your site in seconds!

# Deployment Guide: bambinitracker.com

This document provides step-by-step instructions to deploy your marketing landing page to your new domain.

## Recommended Hosting: Vercel

Vercel is highly recommended for static marketing pages due to its global CDN, automatic SSL, and ease of use with custom domains.

### 1. Unified Repository (Monorepo)
Since you already have a repository for `bambinitracker`, we'll keep everything together. This is simpler to manage and keeps your project context unified.

### 2. Push to your existing GitHub Repo
Just commit and push as you normally do from the root:
```bash
git add .
git commit -m "feat: marketing landing page"
git push origin main
```

### 3. Link to Vercel (Subfolder Deployment)
When linking to Vercel, you need to tell it where the web files are:
1. Go to [vercel.com](https://vercel.com) and import your main **bambinitracker** repository.
2. Under **Project Settings**, look for **Root Directory**.
3. Click **Edit** and select the folder: `marketing/landing-page`.
4. Click **Deploy**.

### 4. Configure Domain (HostGator)
Once deployed on Vercel:
1. Go to **Settings** > **Domains** in your Vercel project.
2. Add `bambinitracker.com`.
3. Vercel will provide the DNS records. 

#### DNS Records to add in HostGator:
| Type  | Name | Value |
|-------|------|-------|
| **A** | `@`  | `76.76.21.21` |
| **CNAME** | `www` | `cname.vercel-dns.com` |

---

## Alternative: HostGator Shared Hosting
If you prefer to use the hosting included with your domain purchase:
1. Log in to your HostGator cPanel.
2. Open **File Manager**.
3. Navigate to `public_html`.
4. Upload all files from `marketing/landing-page/` (index.html, style.css, script.js, and the assets folder).

---

## Bonus: Free Professional Email (hello@bambinitracker.com)

You don't need to pay for Google Workspace or Microsoft 365 to have a professional email. Here are the best free options:

### 1. Cloudflare Email Routing (Recommended & Chosen)
**Cost**: $0
**Target Forwarding Email**: `bambinidevelopment@gmail.com`

**How to set up**:
1.  **Add Site to Cloudflare**: Sign up at [cloudflare.com](https://www.cloudflare.com) and add `bambinitracker.com`.
2.  **Update Nameservers**: Cloudflare will provide two nameservers (e.g., `aria.ns.cloudflare.com`). Log in to **HostGator**, go to Domain Management, and replace your current nameservers with the Cloudflare ones.
3.  **Enable Email Routing**: In the Cloudflare dashboard for your domain, go to **Email** > **Email Routing**.
4.  **Add Destination**: Add `bambinidevelopment@gmail.com` as a destination address and verify it.
5.  **Create Custom Addresses**: Create "Custom Addresses" like `hello@bambinitracker.com` and set them to forward to your destination.
6.  **DNS Config**: Cloudflare will automatically offer to add the necessary MX and TXT records for you. Click **Add records and enable**.

### 2. Zoho Mail (Forever Free Plan)
**Cost**: $0 (up to 5 users)
**How it works**: A dedicated professional inbox for your domain.
- **Pros**: You get a real inbox (not just forwarding), very professional.
- **Cons**: Web-only access (no mobile app integration on the free plan).
- **Setup**: Sign up for the "Forever Free" plan at zoho.com/mail.

### 3. ForwardEmail.net
**Cost**: $0
**How it works**: Open-source email forwarding.
- **Pros**: Privacy-focused, extremely simple DNS-only setup.

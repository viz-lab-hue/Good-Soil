# 🌱 Good Soil — Google Sheets Automated Lead Capture

Every submission on the Good Soil website (Weekend Class Bookings, Workshop Enquiries, Curriculum Downloads, Kit Orders, and Newsletter Subscriptions) is now wired to automatically save directly to your **Google Sheet / Excel** in real-time.

---

## ⚡ 1-Minute Setup Guide

### Step 1: Create Your Google Sheet
1. Go to [sheets.new](https://sheets.new) (or open Google Drive and create a new blank spreadsheet).
2. Title it: **`Good Soil — Leads & Bookings`**.

---

### Step 2: Paste the Automation Script
1. In the top menu of your Google Sheet, click **Extensions** > **Apps Script**.
2. Delete any default code in the editor (`function myFunction() { ... }`).
3. Open [`google_sheets_backend.js`](./google_sheets_backend.js) in this project, copy all its code, and paste it into the editor.
4. Click the **Save** icon (💾) or press `Ctrl + S`.

---

### Step 3: Deploy as a Web App
1. In the top right corner of the Apps Script window, click the blue **Deploy** button > **New deployment**.
2. Click the **gear icon** (⚙️) next to "Select type" and choose **Web app**.
3. Fill in the fields:
   * **Description:** `Good Soil Lead Webhook`
   * **Execute as:** `Me (your-email@gmail.com)`
   * **Who has access:** `Anyone` *(Crucial: allows the website to post new rows)*
4. Click **Deploy**.
5. Google will show an authorization prompt:
   * Click **Review permissions** > Choose your Google account.
   * Click **Advanced** > **Go to Untitled project (unsafe)** > Click **Allow**.
6. Copy the **Web app URL** (it looks like `https://script.google.com/macros/s/AKfycb.../exec`).

---

### Step 4: Add to Vercel (Done!)
1. Go to your [Vercel Dashboard](https://vercel.com) > Select your **Good Soil** project.
2. Go to **Settings** > **Environment Variables**.
3. Add a new variable:
   * **Key:** `GOOGLE_SHEET_WEBHOOK_URL`
   * **Value:** *(Paste your Web app URL from Step 3)*
4. Click **Save** and redeploy.

---

## 📊 What You Get in Your Google Sheet

Your spreadsheet will automatically create and format the following columns in Good Soil green:

| Timestamp (IST) | Lead Type | Name | Phone / WhatsApp | Email | Student Age | Format / Track / Product | Message / Details | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `2026-11-15 21:50:00` | Weekend Class Booking | Priya Sharma | `98765 43210` | `priya@example.com` | Junior (7–10) | Weekend classes | Interested in Sunday morning batch | **New Lead** |
| `2026-11-15 21:55:12` | Kit Order | Rajesh Kumar | `98123 45678` | `rajesh@gmail.com` | 10–14+ yrs | DIY Drone Kit (x1) | Promo GOODSOIL10 applied · ₹2,249 | **New Lead** |
| `2026-11-15 22:01:45` | Newsletter Subscriber | — | — | `parent@outlook.com` | — | Camp Dates Alert | Subscribed via footer | **New Lead** |

You can now:
* Open the **Google Sheets app** on your phone anytime to view new leads.
* Tap any phone number to call or WhatsApp parents directly.
* Change the **Status** column to `Contacted`, `Enrolled`, `Paid`, or `Completed`.
* Download or export as an **Excel (.xlsx)** or **CSV** file whenever you like!

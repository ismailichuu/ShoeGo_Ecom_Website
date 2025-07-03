# 👟 ShoeGo – E‑commerce Shoe Store

Welcome to **ShoeGo**, a modern and responsive web app for buying shoes online.

> 🚧 **NOTE**: The live site&nbsp;— <https://shoego.shop> — is **temporarily offline** while we refactor the codebase and polish the UI. Follow this repo for updates!

---

## 📑 Table&nbsp;of&nbsp;Contents
1. [Key Features](#-key-features)
2. [Planned Improvements](#-planned-improvements)
3. [Tech Stack](#-tech-stack)
4. [Local Setup](#-local-setup)
5. [Screenshots](#-screenshots)
6. [Contributing](#-contributing)
7. [License](#-license)
8. [Contact](#-contact)

---

## 🔑 Key Features

### 👤 User Side
- Secure **signup / login** with token‑based auth  
- **Browse** products by 20 shoe categories  
- **Product detail** page with multiple images & size selector  
- **Cart** + **wishlist** with real‑time price updates  
- **Address management** & streamlined checkout (Razorpay)  
- **Order tracking** + cancel / return flow (reason required)  
- **Download invoice** as PDF  

### 🛠️ Admin Panel
- Admin login & dashboard overview  
- CRUD for **users, products, categories**  
- Toggle product **visibility / status**  
- Pagination, search & sort everywhere  
- **Sales reports** (day / week / month / custom) exportable to **PDF** & **Excel**  

---

## 🗓️ Planned Improvements

| Area | Task |
| ---- | ---- |
| **Error Handling** | Catch & surface all bad‑param / invalid‑ID cases with friendly messages |
| **404 Page** | Branded “Page Not Found” component with quick links |
| **UI Polish** | Tighter spacing & alignment (esp. *Order Details* & admin tables) |
| **Frontend Validation** | Client‑side rules for every form (signup, checkout, product editor, etc.) |

---

## 🧰 Tech Stack

- **Frontend:** HTML • Tailwind CSS • Vanilla JS • EJS templates  
- **Backend:** Node.js • Express  
- **Database:** MongoDB + Mongoose  
- **Auth:** JWT + cookies  
- **File Uploads:** Multer  
- **Reports:** PDFKit, ExcelJS  
- **Payments:** Razorpay  
- **Misc:** PM2, Morgan, dotenv, ESLint / Prettier

---

## 💻 Local Setup

```bash
# 1. Clone
git clone https://github.com/<your‑username>/shoego.git
cd shoego

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env       # edit DB_URI, JWT_SECRET, RAZORPAY keys, etc.

# 4. Run dev server
npm run dev

# 👟 ShoeGo – E‑commerce Shoe Store

Welcome to **ShoeGo**, a modern and responsive web app for buying shoes online.

> 🚧 **NOTE**: The live site&nbsp;— <https://shoego.shop> — is **temporarily offline** while we refactor the codebase and polish the UI. Follow this repo for updates!

## 🔑 Key Features

### 👤 User Side
- JWT-based **signup / login**, **googleAuth Available**
- **Browse products** by category  
- **Product detail** page with multiple images (stored in Cloudinary)  
- **Cart and wishlist** functionality  
- **Debounced search** for fast product lookup  
- **Address management**
- **Wallet with wallet purchase**
- Razorpay-integrated **checkout**  
- **Order tracking** with cancel/return flow  
- **Invoice download** in PDF format  

### 🛠️ Admin Panel
- Admin login with dashboard overview  
- **Product, user, category management**  
- Toggle product **status (Active/Inactive)**  
- **Search, filter, and pagination** with debounce  
- **Sales reports** by day/week/month/custom – export to PDF or Excel  

---

## 🗓️ Planned Improvements

| Area             | Task                                                                 |
|------------------|----------------------------------------------------------------------|
| Error Handling    | Improve responses for invalid parameters and non-existent resources |
| 404 Page          | Custom “Page Not Found” component                                   |
| UI Polish         | Improve spacing and layout (especially Order Details page)         |
| Frontend Validation | Add client-side form validation using JavaScript                 |

---

## 🧰 Tech Stack

- **Frontend:** HTML • Tailwind CSS • JavaScript • EJS templates  
- **Backend:** Node.js • Express.js  
- **Database:** MongoDB + Mongoose  
- **Auth:** JWT + Cookies  
- **File Uploads:** Multer + Cloudinary  
- **Search:** Debounced input using JavaScript  
- **PDF/Excel Reports:** PDFKit, ExcelJS  
- **Payments:** Razorpay  
- **Tools:** PM2, Morgan, Dotenv

## 💻 Local Setup

```bash
# 1. Clone
git clone https://github.com/<your‑username>/shoego.git
cd shoego

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.global      #JWT_SECRET, RAZORPAY keys, etc.
cp .env.local       # edit DB_URI, callback_url  etc.

# 4. Run dev server
npm run dev

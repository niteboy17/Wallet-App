# Wallet App

A simple JavaScript-based Wallet App to help users track their balance, income, and expenses in one place.

## Features

- **Secure Authentication** with Clerk (Sign In / Sign Up)
- **Add transactions** for income and expenses
- **View current balance** updated in real time
- **Transaction history** with clear entries
- **Automation settings** support
- **Responsive mobile experience** built with Expo/React Native

## What the App Does

The Wallet App is a personal finance tracker that allows users to:

1. Create an account and securely sign in
2. Record money coming in (income)
3. Record money going out (expenses)
4. Automatically calculate and display remaining balance
5. Review transaction activity for better budgeting
6. Manage automation-related preferences

## App Screenshot Preview

<p align="center">
  <img src="./screenshots/Sign%20In.png" alt="Sign In" width="210" />
  <img src="./screenshots/Sign%20Up.png" alt="Sign Up" width="210" />
  <img src="./screenshots/Home.png" alt="Home" width="210" />
</p>

<p align="center">
  <img src="./screenshots/Create%20Transactions%20for%20Income.png" alt="Create Income Transaction" width="210" />
  <img src="./screenshots/Create%20Transactions%20for%20Expense.png" alt="Create Expense Transaction" width="210" />
  <img src="./screenshots/Automation%20Settings.png" alt="Automation Settings" width="210" />
</p>

## Tech Stack / What Was Used to Build It

This project is built with:

- **JavaScript** (100%)
- Mobile: **Expo / React Native**
- Authentication: **Clerk**
- Backend: **Node.js** (if applicable)
- Data Store / Caching: **Upstash Redis**
- Database: configured via `DATABASE_URL`

> Update this section to match your exact project structure.

## Installation

### 1) Clone the repository

```bash
git clone https://github.com/niteboy17/Wallet-App.git
cd Wallet-App
```

### 2) Install dependencies

Install root dependencies:

```bash
npm install
```

Install mobile dependencies:

```bash
cd mobile
npm install
cd ..
```

## Environment Variables

This project uses **two `.env` files**:

1. One for the **backend** (project root)
2. One for the **mobile app** (`mobile/` folder)

---

### 1) Backend `.env`

Create this file in the root of the repo:

```bash
touch .env
```

Path:
- `Wallet-App/.env`

Add:

```env
PORT=5000
DATABASE_URL=postgresql://username:password@localhost:5432/wallet_app

EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key

UPSTASH_REDIS_REST_URL=https://your-redis-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token
```

---

### 2) Mobile `.env`

Create this file inside the `mobile` folder:

```bash
touch mobile/.env
```

Path:
- `Wallet-App/mobile/.env`

Add:

```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
EXPO_PUBLIC_API_URL=http://localhost:5000
```

If testing on a **real phone**, replace localhost with your computer's local IP:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.100:5000
```

## Example `.env.example` files

You can also create template files for contributors.

Root `/.env.example`:

```env
PORT=
DATABASE_URL=

EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=

UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

`/mobile/.env.example`:

```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=
EXPO_PUBLIC_API_URL=
```

## Start the App

Backend (from root):

```bash
npm run dev
```

Mobile (from `mobile/`):

```bash
npx expo start
```

## Scripts

(Adjust to your actual `package.json` scripts)

- `npm start` — run app
- `npm run dev` — run development mode
- `npm test` — run tests

## Contributing

1. Fork the repo
2. Create a feature branch
3. Commit your changes
4. Open a pull request

## License

Specify your license here (e.g., MIT).

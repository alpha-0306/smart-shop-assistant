# Setup Guide - Smart Shop Assistant

## 🔑 API Key Configuration

### Step 1: Get Your OpenAI API Key
1. Visit: https://platform.openai.com/api-keys
2. Sign in or create account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-...`)

### Step 2: Add Key to .env File
1. Open the `.env` file in the project root
2. Replace `your_api_key_here` with your actual key:
   ```
   EXPO_PUBLIC_OPENAI_API_KEY=sk-your-actual-key-here
   ```
3. Save the file

### Step 3: Restart the App (CRITICAL!)
**⚠️ IMPORTANT:** You MUST restart the app with cache cleared for the API key to load!

```bash
# Stop the current dev server (Ctrl+C in terminal)
# Then clear cache and restart:
npx expo start --clear
```

**Why?** Environment variables are loaded at app startup. Without restarting, the app won't see your API key.

---

## 📱 Quick Start

### First Time Setup:
1. Add API key to `.env` file (see above)
2. Start app: `npm start`
3. Scan QR code with Expo Go
4. Add products via shelf photo
5. Start using Listen feature!

### Adding Products:
1. Go to Inventory tab
2. Tap camera button (top right)
3. Take/pick photo of products
4. AI analyzes automatically
5. Review and save

### Recording Sales:
1. Go to Listen tab
2. Use Demo Mode for testing
3. Or press & hold mic for real audio
4. Confirm suggested products
5. Sale recorded automatically!

---

## 🔧 Troubleshooting

### "API Key Missing" Error
- Make sure you added the key to `.env` file
- **RESTART THE APP** with `npx expo start --clear`
- Check the key starts with `sk-`
- Verify no extra spaces in the .env file

### Products Not Getting Analyzed
- **First:** Restart app with `npx expo start --clear`
- Check console logs for errors
- Verify internet connection
- See TROUBLESHOOTING.md for detailed steps

### App Not Detecting .env Changes
```bash
# ALWAYS restart with --clear flag after changing .env
npx expo start --clear
```

### Products Not Showing
- Make sure you saved products after analysis
- Check Inventory tab
- Try reloading the app

---

## 📁 Project Structure

```
smart-shop-assistant/
├── .env                    ← Add your API key here
├── .env.example            ← Template file
├── src/
│   ├── screens/
│   ├── utils/
│   └── store/
└── ...
```

---

## ✅ Verification

After setup, verify everything works:

1. **API Key**: App doesn't ask for key
2. **Products**: Can add via photo
3. **Listen**: Demo mode works
4. **Inventory**: Products persist after reload

---

## 🚀 You're Ready!

The app is now configured and ready to use. No more entering API keys in the UI!

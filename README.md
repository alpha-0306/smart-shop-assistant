# Smart Shop Assistant

AI-powered inventory management for Indian kirana stores.

## Screenshots

<div align="center">
  <img src="screenshots/01-dashboard.jpg" width="250" alt="Dashboard" />
  <img src="screenshots/02-listen.jpg" width="250" alt="UPI Audio Processing" />
  <img src="screenshots/03-inventory.jpg" width="250" alt="Inventory Management" />
</div>

<div align="center">
  <img src="screenshots/04-chat.jpg" width="250" alt="AI Chat Assistant" />
  <img src="screenshots/05-onboarding.jpg" width="250" alt="Onboarding" />
  <img src="screenshots/06-product-recognition.jpg" width="250" alt="Product Recognition" />
</div>

<div align="center">
  <img src="screenshots/07-analytics.jpg" width="250" alt="Analytics" />
  <img src="screenshots/08-suggestions.jpg" width="250" alt="Smart Suggestions" />
  <img src="screenshots/09-multilingual.jpg" width="250" alt="Multilingual Support" />
</div>

## Features

- **UPI Audio Processing** - Automatically detect payment amounts from UPI sounds
- **AI Product Recognition** - Add products by taking photos of your shelf
- **Multilingual Support** - Works in English, Hindi, and Kannada
- **Smart Analytics** - Track sales, inventory, and get business insights
- **Voice Assistant** - Ask questions about your business in your preferred language

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Add your OpenAI API key**
   - Copy `.env.example` to `.env`
   - Add your OpenAI API key to the `.env` file

3. **Start the app**
   ```bash
   npm start
   ```

4. **Scan QR code** with Expo Go app on your phone

## Tech Stack

- React Native (Expo)
- TypeScript
- OpenAI GPT-4 Vision API
- Zustand for state management

## Demo

The app includes sample data and demo modes to showcase all features without requiring real products or payments.

## License

MIT
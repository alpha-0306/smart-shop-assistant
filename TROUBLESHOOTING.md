# Troubleshooting Guide

## Products Not Getting Analyzed

If products aren't being analyzed after taking a photo, follow these steps:

### 1. Check API Key Configuration

**Verify .env file:**
```bash
# Open .env file and check if API key is present
EXPO_PUBLIC_OPENAI_API_KEY=sk-proj-...
```

**Important:** After adding or changing the API key, you MUST restart the Expo app with cache cleared:
```bash
# Stop the current app (Ctrl+C)
# Then restart with:
npx expo start --clear
```

### 2. Check Console Logs

Open the terminal where Expo is running and look for these logs:

**Expected logs when working:**
```
Auto-analyzing image with API key...
analyzeShelfImage called with URI: file://...
API key present: true
Converting image to base64...
Image converted, base64 length: 123456
Sending request to OpenAI API...
OpenAI response received
AI response text: [{"name":"...
Parsed products: 5
Analysis complete, detected products: 5
```

**If you see errors:**
- `API key present: false` → API key not loaded, restart with `--clear`
- `401 Invalid API key` → Check your API key is correct
- `429 Rate limit exceeded` → Wait a few minutes or upgrade OpenAI plan
- `No valid JSON found` → AI response format issue, try re-analyzing

### 3. Test API Key Manually

You can test if your API key works by running this in a separate terminal:

```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY_HERE"
```

If this returns a list of models, your API key is valid.

### 4. Common Issues

**Issue:** "No products detected in the image"
- **Solution:** Make sure products are clearly visible in the photo
- Take photo in good lighting
- Ensure products are not too small or blurry

**Issue:** Analysis takes too long
- **Solution:** This is normal, GPT-4o Vision can take 10-30 seconds
- Wait for the "Analyzing products..." screen to complete

**Issue:** App crashes during analysis
- **Solution:** Image might be too large
- Try taking a smaller photo or use gallery image

### 5. Force Re-analysis

If analysis gets stuck:
1. Go back to the previous screen
2. Take/select the photo again
3. Or tap "Re-analyze" button if available

### 6. Check Network Connection

The app needs internet to call OpenAI API:
- Make sure your device has WiFi or mobile data
- Check if you can access other websites
- Try disabling VPN if you're using one

### 7. Still Not Working?

Check the full error in console:
```bash
# Look for lines starting with:
ERROR  Analysis error:
ERROR  AI Vision error:
```

Common error messages and solutions:
- `Invalid API key` → Get new key from platform.openai.com/api-keys
- `Rate limit exceeded` → Wait or upgrade OpenAI plan
- `Failed to convert image` → Try different image
- `Network request failed` → Check internet connection

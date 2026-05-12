# Birthday Celebration - Local File Upload

## Simple Setup - No Backend Required!

The application now stores photos and videos locally using browser localStorage. Everything works right in the browser.

### How to Run

1. **Open the application** directly:
   - Simply open `index.html` in your web browser
   - Or go to `http://localhost:5500` if using VS Code Live Server

2. **That's it!** No installation or server setup needed.

### How It Works

- The page opens directly into the **HEMA celebration view**
- A large greeting appears first, then the moments section follows
- Photos and videos are loaded from browser localStorage
- Wishes are displayed in the wishes section

### Storage Limitation

⚠️ **Important**: 
- Data is stored in browser localStorage (~5-10MB limit per domain)
- Data persists on the **same device/browser**
- Clearing browser cache/storage will delete the data
- Sharing between devices requires copying the stored data

### For Multi-Device Sharing

To transfer uploads between devices:
1. In browser DevTools (F12) → Application → LocalStorage
2. Find `photoLibrary` and `videoLibrary`
3. Export and import to another device

### File Structure

- `index.html` - Main HEMA celebration page
- `main.js` - HEMA-only page logic
- `styles.css` - Styling

**No Node.js or database needed!** 🎉


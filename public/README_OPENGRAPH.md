# Open Graph Implementation for StockAnalyzer Pro

This document explains how the Open Graph meta tags have been implemented for StockAnalyzer Pro to enable rich link previews when sharing your website in chat apps, social media, and other platforms.

## Files Added/Modified

1. `index.html` - Updated with proper Open Graph and Twitter Card meta tags
2. `public/og-image.svg` - Vector version of the Open Graph image
3. `public/og-image-generator.html` - Tool to convert the SVG to PNG if needed

## How to Test Open Graph Tags

1. **Facebook Sharing Debugger**: Visit [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) and enter your website URL.
2. **Twitter Card Validator**: Visit [Twitter Card Validator](https://cards-dev.twitter.com/validator) and enter your website URL.
3. **LinkedIn Post Inspector**: Visit [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/) and enter your website URL.
4. **General Open Graph Test**: Visit [OpenGraph.xyz](https://www.opengraph.xyz/) and enter your website URL.

## Important Notes

1. **Domain Replacement**: Replace `https://your-domain.com` in the meta tags with your actual domain.
2. **Image Formats**: While SVG is used, some platforms prefer PNG/JPG. Use the generator tool to create a PNG version if needed.
3. **Image Dimensions**: The Open Graph image is designed at 1200×630px, which is the recommended size for most platforms.

## Converting SVG to PNG

To convert the SVG to PNG:
1. Open `public/og-image-generator.html` in a browser
2. Right-click on the generated image and save it as "og-image.png"
3. Place the PNG in the public directory
4. Update the meta tags to reference the PNG instead of SVG if needed

## Additional Customization

You can customize the Open Graph image by editing the `og-image.svg` file. The current design includes:
- A blue background representing the StockAnalyzer Pro brand
- A simple logo placeholder
- The application name and description
- Visual elements representing stock charts

For best results across all platforms, consider creating platform-specific images if needed.

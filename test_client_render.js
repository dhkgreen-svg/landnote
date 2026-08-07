const puppeteer = require('puppeteer');

async function run() {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  const urls = [
    'http://localhost:3000/bot/A6BEC',
    'http://localhost:3000/bot/AB7A0'
  ];
  
  for (const url of urls) {
    console.log("\nNavigating to:", url);
    try {
      await page.goto(url, { waitUntil: 'networkidle0' });
      // Wait for any async API response to finish rendering
      await new Promise(r => setTimeout(r, 2000));
      
      const bodyText = await page.evaluate(() => document.body.innerText);
      console.log("Rendered Body Text:");
      console.log(bodyText.substring(0, 500));
    } catch (e) {
      console.error("Error navigating:", e);
    }
  }
  
  await browser.close();
}

run();

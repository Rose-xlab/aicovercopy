import puppeteerCore from 'puppeteer-core';
// Correct import for @sparticuz/chromium v123+
// If using older version, it might just be `import chromium from '@sparticuz/chromium'`
import chromium from '@sparticuz/chromium';

interface PDFGenerationOptions {
  format?: 'A4' | 'Letter';
  landscape?: boolean;
  margins?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  scale?: number;
  preferCSSPageSize?: boolean;
  timeout?: number;
  retries?: number;
}

/**
 * Generate a PDF from HTML content
 * Enhanced version with better error handling, retries, and optimization for production environments
 */
export async function generatePDF(htmlContent: string, options?: PDFGenerationOptions): Promise<Buffer> {
  // Default options
  const format = options?.format || 'A4';
  const landscape = options?.landscape || false;
  const margins = {
    top: options?.margins?.top || '0mm',
    right: options?.margins?.right || '0mm',
    bottom: options?.margins?.bottom || '0mm',
    left: options?.margins?.left || '0mm'
  };
  const scale = options?.scale || 1;
  const preferCSSPageSize = options?.preferCSSPageSize ?? false; // Changed to false
  const timeout = options?.timeout || 60000; // 60 seconds default
  const maxRetries = options?.retries || 2;

  let browser;
  let retries = 0;
  let lastError: Error | null = null;

  while (retries <= maxRetries) {
    try {
      console.log(`PDF generation attempt ${retries + 1}/${maxRetries + 1}`);

      // Different browser launch config based on environment
      if (process.env.NODE_ENV === 'development') {
        // In development, use the installed Chrome browser via channel
        console.log('Using local Chrome via channel for PDF generation in development mode');
        browser = await puppeteerCore.launch({
          headless: "new", // Use the new headless mode
          channel: 'chrome', // Tell puppeteer-core to find standard Chrome
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage', // Prevents OOM issues in Docker/Linux
            '--disable-gpu', // Sometimes needed
            '--font-render-hinting=none', // Better font rendering
          ],
        });
      } else {
        // In production/serverless, use @sparticuz/chromium with optimized settings
        console.log('Using @sparticuz/chromium for PDF generation in production mode');

        // Ensure @sparticuz/chromium is properly initialized for the environment if needed
        const executablePath = await chromium.executablePath();

        if (!executablePath) {
             throw new Error("Could not find Chromium executable via @sparticuz/chromium. Ensure it's installed correctly for your production environment.");
        }

        browser = await puppeteerCore.launch({
          args: [
            ...chromium.args,
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--font-render-hinting=none',
            '--disable-web-security', // Allow loading fonts and resources
            '--disable-features=IsolateOrigins,site-per-process', // Better resource handling
          ],
          executablePath: executablePath,
          headless: chromium.headless, // Use the headless mode recommended by @sparticuz/chromium
          ignoreHTTPSErrors: true, // Prevent HTTPS errors from causing PDF generation to fail
        });
      }

      console.log('Browser launched successfully, creating page');
      const page = await browser.newPage();

      // Set timeout for all operations
      page.setDefaultTimeout(timeout);

      // Set content and wait for rendering
      console.log('Setting HTML content...');
      await page.setContent(htmlContent, {
        waitUntil: ['networkidle0', 'load', 'domcontentloaded'],
        timeout,
      });

      // Wait a bit for styles to fully apply
      await page.waitForTimeout(500);

      // --- FIX START ---
      // This is the new line. It forces Puppeteer to use the color styles
      // from your CSS instead of the black and white print styles.
      await page.emulateMediaType('screen');
      // --- FIX END ---

      // Generate PDF with optimized settings
      console.log('Generating PDF...');
      const pdfBuffer = await page.pdf({
        format: format as any,
        landscape,
        printBackground: true,
        margin: margins, // Use the margins directly
        preferCSSPageSize: preferCSSPageSize,
        scale,
        timeout,
        displayHeaderFooter: false,
      });

      // Close browser
      console.log('PDF generated successfully, closing browser');
      await browser.close();

      return pdfBuffer;
    } catch (error) {
      lastError = error as Error;
      console.error(`Error during PDF generation (attempt ${retries + 1}/${maxRetries + 1}):`, error);

      // Ensure browser is closed even if there's an error
      if (browser) {
        try {
          await browser.close();
          console.log('Browser closed after error');
        } catch (closeError) {
          console.error('Error closing browser:', closeError);
        }
        browser = undefined; // Ensure browser is reset for retry
      }

      retries++;

      // If we've reached max retries, throw the error
      if (retries > maxRetries) {
        throw new Error(`Failed to generate PDF after ${retries} attempts: ${lastError?.message}`);
      }

      // Wait before retrying (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, retries), 10000); // Max 10 seconds
      console.log(`Waiting ${delay}ms before retry ${retries}...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // This should technically not be reachable due to the throw in the catch block after max retries
  throw new Error(`Failed to generate PDF: Max retries (${maxRetries}) exceeded. Last error: ${lastError?.message}`);
}
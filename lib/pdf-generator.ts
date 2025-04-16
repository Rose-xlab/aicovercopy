// lib/pdf-generator.ts
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
    top: options?.margins?.top || '10mm',
    right: options?.margins?.right || '10mm',
    bottom: options?.margins?.bottom || '10mm',
    left: options?.margins?.left || '10mm'
  };
  const scale = options?.scale || 1;
  const preferCSSPageSize = options?.preferCSSPageSize ?? true;
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
          // --- MODIFIED ---
          headless: "new", // Use the new headless mode
          channel: 'chrome', // Tell puppeteer-core to find standard Chrome
          // --- /MODIFIED ---
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage', // Prevents OOM issues in Docker/Linux
            '--disable-gpu', // Sometimes needed
            '--font-render-hinting=none', // Better font rendering
            // Remove explicit executablePath: undefined
          ],
        });
      } else {
        // In production/serverless, use @sparticuz/chromium with optimized settings
        // This block looks suitable for production using @sparticuz/chromium
        console.log('Using @sparticuz/chromium for PDF generation in production mode');

        // Ensure @sparticuz/chromium is properly initialized for the environment if needed
        // Usually it handles this automatically based on the platform (AWS Lambda, etc.)

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
            // Consider adding '--single-process' if experiencing crashes in constrained environments
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

      // Set proper viewport for PDF generation (optional, might rely on CSS @page)
      // console.log('Setting viewport...');
      // await page.setViewport({
      //   width: 794, // A4 width in pixels at 96 DPI
      //   height: 1123, // A4 height in pixels at 96 DPI
      //   deviceScaleFactor: 2,
      // });

      // Add print styles to optimize PDF rendering
      console.log('Adding print styles...');
      await page.addStyleTag({
        content: `
          @page {
            size: ${format} ${landscape ? 'landscape' : 'portrait'};
            margin: ${margins.top} ${margins.right} ${margins.bottom} ${margins.left}; /* Use margins here */
          }
          body {
            -webkit-print-color-adjust: exact !important; /* Important needed sometimes */
            print-color-adjust: exact !important;
            -webkit-font-smoothing: antialiased;
            margin: 0;
            padding: 0;
          }
          * {
            box-sizing: border-box;
          }
          /* Force background printing */
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          /* Ensure proper font rendering (basic example) */
          @media print {
            body {
              /* Consider setting a base font used in your HTML */
              color: black;
            }
          }
        `
      });

      // Wait a short time for styles to apply (might not be needed with networkidle0)
      // await page.waitForTimeout(100);

      // Generate PDF with optimized settings
      console.log('Generating PDF...');
      const pdfBuffer = await page.pdf({
        // format: format as any, // preferCSSPageSize handles this via @page
        landscape,
        printBackground: true,
        // margin: margins, // Margins handled by @page CSS
        preferCSSPageSize: preferCSSPageSize, // Use @page size if true
        scale,
        timeout,
        displayHeaderFooter: false, // Usually false unless header/footer templates are provided
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
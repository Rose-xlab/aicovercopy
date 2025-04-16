// lib/pdf-generator.ts
import puppeteerCore from 'puppeteer-core';
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
        // In development, use the installed Chrome browser
        console.log('Using local Chrome for PDF generation in development mode');
        browser = await puppeteerCore.launch({
          headless: true,
          args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox', 
            '--disable-dev-shm-usage', // Prevents OOM issues in Docker/Linux
            '--disable-gpu',
            '--font-render-hinting=none', // Better font rendering
          ],
          // In dev, we let Puppeteer find the installed browser
          executablePath: undefined 
        });
      } else {
        // In production/serverless, use @sparticuz/chromium with optimized settings
        console.log('Using @sparticuz/chromium for PDF generation in production mode');
        browser = await puppeteerCore.launch({
          args: [
            ...chromium.args,
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--font-render-hinting=none',
            '--disable-web-security', // Allow loading fonts and resources
            '--disable-features=IsolateOrigins,site-per-process', // Better resource handling
          ],
          executablePath: await chromium.executablePath(),
          headless: chromium.headless,
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
      
      // Set proper viewport for PDF generation
      console.log('Setting viewport...');
      await page.setViewport({
        width: 794, // A4 width in pixels at 96 DPI
        height: 1123, // A4 height in pixels at 96 DPI
        deviceScaleFactor: 2,
      });
      
      // Add print styles to optimize PDF rendering
      console.log('Adding print styles...');
      await page.addStyleTag({
        content: `
          @page {
            size: ${format} ${landscape ? 'landscape' : 'portrait'};
            margin: 0;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
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
          /* Ensure proper font rendering */
          @media print {
            body {
              font-family: 'Arial', 'Helvetica', sans-serif;
              color: black;
            }
          }
        `
      });
      
      // Wait a short time for styles to apply
      await page.waitForTimeout(100);
      
      // Generate PDF with optimized settings
      console.log('Generating PDF...');
      const pdfBuffer = await page.pdf({
        format: format as any,
        landscape,
        printBackground: true,
        margin: margins,
        preferCSSPageSize,
        scale,
        timeout,
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
      }
      
      retries++;
      
      // If we've reached max retries, throw the error
      if (retries > maxRetries) {
        throw new Error(`Failed to generate PDF after ${maxRetries + 1} attempts: ${lastError?.message}`);
      }
      
      // Wait before retrying (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, retries), 10000);
      console.log(`Waiting ${delay}ms before retry ${retries}...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // This should never be reached due to the throw in the catch block
  throw new Error('Failed to generate PDF: Unexpected execution path');
}
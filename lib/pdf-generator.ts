// lib/pdf-generator.ts
import puppeteerCore from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

/**
 * Generate a PDF from HTML content
 * Works in both development and production (serverless) environments
 */
export async function generatePDF(htmlContent: string, options?: {
  format?: 'A4' | 'Letter',
  landscape?: boolean,
  margins?: {
    top?: string,
    right?: string,
    bottom?: string,
    left?: string
  }
}): Promise<Buffer> {
  // Default options
  const format = options?.format || 'A4';
  const landscape = options?.landscape || false;
  const margins = {
    top: options?.margins?.top || '10mm',
    right: options?.margins?.right || '10mm',
    bottom: options?.margins?.bottom || '10mm',
    left: options?.margins?.left || '10mm'
  };

  let browser;
  try {
    // Different browser launch config based on environment
    if (process.env.NODE_ENV === 'development') {
      // In development, use the installed Chrome browser
      browser = await puppeteerCore.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        // In dev, we let Puppeteer find the installed browser
        executablePath: undefined 
      });
    } else {
      // In production/serverless, use @sparticuz/chromium
      browser = await puppeteerCore.launch({
        args: chromium.args,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
      });
    }

    const page = await browser.newPage();
    
    // Set content and wait for rendering
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    // Set proper viewport for PDF generation
    await page.setViewport({
      width: 794, // A4 width in pixels at 96 DPI
      height: 1123, // A4 height in pixels at 96 DPI
      deviceScaleFactor: 2,
    });
    
    // Add print styles
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
        }
        * {
          box-sizing: border-box;
        }
      `
    });
    
    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: format as any,
      landscape,
      printBackground: true,
      margin: margins,
      preferCSSPageSize: true,
    });
    
    // Close browser
    await browser.close();
    
    return pdfBuffer;
  } catch (error) {
    // Ensure browser is closed even if there's an error
    if (browser) {
      await browser.close();
    }
    console.error('Error generating PDF:', error);
    throw new Error(`Failed to generate PDF: ${error.message}`);
  }
}
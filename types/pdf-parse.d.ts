// Create this file at: project/types/pdf-parse.d.ts
declare module 'pdf-parse' {
    interface PDFOptions {
      pagerender?: (pageData: PDFPageData) => Promise<string>;
      max?: number;
      version?: string;
    }
  
    interface PDFPageData {
      pageIndex: number;
      pageInfo: {
        num: number;
        scale: number;
        rotation: number;
        offsetX: number;
        offsetY: number;
        width: number;
        height: number;
      };
      render: any;
    }
  
    interface PDFExtractResult {
      numpages: number;
      numrender: number;
      info: {
        PDFFormatVersion: string;
        IsAcroFormPresent: boolean;
        IsXFAPresent: boolean;
        [key: string]: any;
      };
      metadata: {
        [key: string]: any;
      };
      text: string;
      version: string;
    }
  
    function PDFParse(
      dataBuffer: Buffer | Uint8Array | ArrayBuffer,
      options?: PDFOptions
    ): Promise<PDFExtractResult>;
  
    export = PDFParse;
  }
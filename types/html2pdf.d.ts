declare module 'html2pdf.js' {
  interface Html2PdfOptions {
    margin?: number | number[];
    filename?: string;
    image?: {
      type?: string;
      quality?: number;
    };
    html2canvas?: {
      scale?: number;
      useCORS?: boolean;
      allowTaint?: boolean;
      scrollX?: number;
      scrollY?: number;
      backgroundColor?: string;
      windowWidth?: number;
      windowHeight?: number;
      width?: number;
      height?: number;
      letterRendering?: boolean;
      logging?: boolean;
      imageTimeout?: number;
    };
    jsPDF?: {
      unit?: string;
      format?: string;
      orientation?: string;
      compress?: boolean;
    };
    pagebreak?: {
      mode?: string[];
      before?: string;
      after?: string;
      avoid?: string;
    };
  }

  interface Html2PdfWorker {
    set(options: Html2PdfOptions): Html2PdfWorker;
    from(element: Element | Document): Html2PdfWorker;
    save(): Promise<void>;
    output(type?: string): Promise<any>;
    outputPdf(type?: string): Promise<any>;
    outputImg(type?: string): Promise<any>;
  }

  const html2pdf: () => Html2PdfWorker;
  export default html2pdf;
}

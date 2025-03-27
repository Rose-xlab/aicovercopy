"use client";

import TemplateBrowser from "@/components/TemplateBrowser";

export default function TemplatesPage() {
  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Cover Letter Templates</h1>
        <p className="text-muted-foreground">Browse and preview available templates for your cover letters</p>
      </header>

      <TemplateBrowser />
    </div>
  );
}
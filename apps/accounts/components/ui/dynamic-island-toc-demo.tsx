"use client";

import { DynamicIslandTOC } from "@/components/ui/dynamic-island-toc";

export function DynamicIslandTOCDemo() {
  return (
    <div className="relative min-h-screen bg-background text-foreground selection:bg-primary/20">
      <DynamicIslandTOC />

      <main className="mx-auto max-w-3xl px-6 py-24 sm:py-32 lg:px-8">
        <article className="prose prose-zinc mx-auto flex flex-col gap-8 dark:prose-invert lg:prose-lg">
          <div className="mb-10 text-center">
            <h1 className="mb-4 text-4xl font-extrabold tracking-tight sm:text-5xl">Dynamic TOC Demo</h1>
            <p className="text-lg text-muted-foreground">Scroll the article and open the island to navigate quickly.</p>
          </div>

          <img
            src="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=1400&q=80"
            alt="Writing notes on laptop"
            className="h-72 w-full rounded-2xl border border-border object-cover"
          />

          <h2>Section One</h2>
          <p>Content placeholder for section one. Replace this with your legal, blog, or documentation content.</p>

          <h3>Subsection One-A</h3>
          <p>The TOC tracks active headings automatically as the user scrolls.</p>

          <h2 data-toc-title="Custom TOC Title">Section Two with Long Title for Preview</h2>
          <p>You can override the displayed TOC text using the data-toc-title attribute.</p>

          <div data-toc data-toc-depth="2" data-toc-title="Custom Block" className="rounded-xl border border-border bg-muted/30 p-6">
            <h3 className="mt-0">Custom Element in TOC</h3>
            <p className="mb-0 text-muted-foreground">Any element can appear in TOC using data-toc and data-toc-depth attributes.</p>
          </div>
        </article>
      </main>
    </div>
  );
}

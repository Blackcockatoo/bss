/**
 * Simple markdown-to-HTML renderer for curriculum docs.
 * Uses dangerouslySetInnerHTML — content is all internal/static build-time inlined text.
 */

interface MarkdownContentProps {
  content: string;
  className?: string;
}

function renderMarkdown(md: string): string {
  return md
    // Headings
    .replace(/^#### (.+)$/gm, '<h4 class="text-lg font-semibold text-primary mt-6 mb-2">$1</h4>')
    .replace(/^### (.+)$/gm, '<h3 class="text-xl font-semibold text-primary mt-8 mb-3">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold text-primary mt-10 mb-4 pb-2 border-b border-border">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-3xl font-bold text-primary mb-2">$1</h1>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Code inline
    .replace(/`([^`]+)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr class="border-border my-6" />')
    // Unordered lists
    .replace(/^\- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    // Ordered lists — numbered items
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal" value="$1">$2</li>')
    // Wrap consecutive li items
    .replace(/(<li[^>]*>.*<\/li>\n?)+/g, (match) => `<ul class="space-y-1 my-3 pl-4">${match}</ul>`)
    // Blank lines to paragraph breaks
    .replace(/\n\n+/g, '</p><p class="my-3 leading-relaxed">')
    // Wrap in paragraph tag
    .replace(/^(.+)$/, '<p class="my-3 leading-relaxed">$1</p>')
    // Clean up empty paragraphs
    .replace(/<p[^>]*>\s*<\/p>/g, '')
    .replace(/<p[^>]*>(<h[1-6])/g, '$1')
    .replace(/(<\/h[1-6]>)<\/p>/g, '$1')
    .replace(/<p[^>]*>(<hr)/g, '$1')
    .replace(/(<\/hr>|<hr[^>]*\/>)<\/p>/g, '$1')
    .replace(/<p[^>]*>(<ul)/g, '$1')
    .replace(/(<\/ul>)<\/p>/g, '$1');
}

export default function MarkdownContent({ content, className = "" }: MarkdownContentProps) {
  const html = renderMarkdown(content);
  return (
    <div
      className={`prose prose-green max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

import { useMemo } from 'react';
import { marked } from 'marked';

marked.setOptions({
  breaks: true,
  gfm: true,
});

export function Markdown({ content }: { content: string }) {
  const html = useMemo(() => {
    try {
      return marked.parse(content || '', { async: false }) as string;
    } catch {
      return content;
    }
  }, [content]);

  return <div className="hush-md" dangerouslySetInnerHTML={{ __html: html }} />;
}

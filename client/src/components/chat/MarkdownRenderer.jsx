import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';

export default function MarkdownRenderer({ content }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          const lang = match?.[1];
          const text = String(children).replace(/\n$/, '');
          if (inline) return <code className={className} {...props}>{children}</code>;
          return <CodeBlock language={lang} text={text} />;
        }
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

function CodeBlock({ language, text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  return (
    <div className="relative my-4 border border-rule bg-paper">
      {/* terminal header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-rule-subtle">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rule-strong"></span>
            <span className="w-2 h-2 rounded-full bg-rule-strong"></span>
            <span className="w-2 h-2 rounded-full bg-signal"></span>
          </div>
          <span className="label-xs text-ink-faint">{language || 'text'}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 label-xs text-ink-faint hover:text-signal transition-colors"
        >
          {copied ? <><Check className="w-3 h-3 text-signal" /> COPIED</> : <><Copy className="w-3 h-3" /> COPY</>}
        </button>
      </div>
      <SyntaxHighlighter
        language={language || 'text'}
        style={atomDark}
        customStyle={{
          margin: 0,
          padding: '14px 16px',
          background: '#0A0907',
          fontSize: '13px',
          lineHeight: '1.7'
        }}
        codeTagProps={{ style: { fontFamily: '"JetBrains Mono", monospace' } }}
      >
        {text}
      </SyntaxHighlighter>
    </div>
  );
}

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, Sparkles } from 'lucide-react';

export default function MarkdownRenderer({ content, onExplain }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          const lang = match?.[1];
          const text = String(children).replace(/\n$/, '');
          if (inline) return <code className={className} {...props}>{children}</code>;
          return <CodeBlock language={lang} text={text} onExplain={onExplain} />;
        },
        table({ children }) {
          return <div className="overflow-x-auto my-4 rounded-xl border border-line2"><table className="min-w-full">{children}</table></div>;
        }
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

function CodeBlock({ language, text, onExplain }) {
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
    <div className="relative my-4 rounded-xl border border-line2 overflow-hidden">
      {/* terminal header */}
      <div className="flex items-center justify-between px-4 py-2 bg-card-raised border-b border-line2">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="w-2 h-2 rounded-full bg-line2-strong"></span>
            <span className="w-2 h-2 rounded-full bg-line2-strong"></span>
            <span className="w-2 h-2 rounded-full bg-brand"></span>
          </div>
          <span className="text-[11px] font-mono text-text2-faint">{language || 'text'}</span>
        </div>
        <div className="flex items-center gap-3">
          {onExplain && (
            <button
              onClick={() => onExplain(text, language)}
              className="flex items-center gap-1.5 text-[11px] text-text2-faint hover:text-brand-soft transition-colors"
            >
              <Sparkles className="w-3 h-3" /> Explain
            </button>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-[11px] text-text2-faint hover:text-brand-soft transition-colors"
          >
            {copied ? <><Check className="w-3 h-3 text-state-success" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
          </button>
        </div>
      </div>
      <SyntaxHighlighter
        language={language || 'text'}
        style={atomDark}
        customStyle={{
          margin: 0,
          padding: '14px 16px',
          background: '#0D0E14',
          fontSize: '13px',
          lineHeight: '1.7',
          overflowX: 'auto'
        }}
        codeTagProps={{ style: { fontFamily: '"JetBrains Mono", monospace' } }}
      >
        {text}
      </SyntaxHighlighter>
    </div>
  );
}

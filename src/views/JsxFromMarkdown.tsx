import React, { useState } from 'react';
import Markdown from 'markdown-to-jsx';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { CopyToClipboard } from 'react-copy-to-clipboard'; // Or implement native clipboard API

interface CodeBlockProps {
  className?: string;
  children: React.ReactNode;
}

// Custom Code component
function Code({ className, children }: CodeBlockProps) {
  const language = className ? className.replace('lang-', '') : 'text';
  const codeContent = String(children).replace(/\n$/, '');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Reset copied state after 2 seconds
  };

  return (
    <div style={{ position: 'relative' }}>
      <SyntaxHighlighter language={language} style={vs}>
        {codeContent}
      </SyntaxHighlighter>
      <CopyToClipboard text={codeContent} onCopy={handleCopy}>
        <button
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            padding: '5px 10px',
            backgroundColor: '#333',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </CopyToClipboard>
    </div>
  );
}

interface JsxFromMarkdownProps {
  markdownContent: string;
}

// Markdown component with custom code override
function JsxFromMarkdown({ markdownContent }: JsxFromMarkdownProps) {
  return (
    <div className="markdownContainer">
      <Markdown
        options={{
          overrides: {
            code: {
              component: Code,
            },
          },
        }}
      >
        {markdownContent}
      </Markdown>
    </div>
  );
}

export default JsxFromMarkdown;
import { Button } from '@fluentui/react-components';
import { ClipboardCheck, Copy } from 'lucide-react';
import Markdown from 'markdown-to-jsx';
import React, { useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './codeblock.css';
import sql from 'react-syntax-highlighter/dist/esm/languages/prism/sql';

interface CodeBlockProps {
  className?: string;
  children: React.ReactNode;
}

interface JsxFromMarkdownProps {
  markdownContent: string;
}

SyntaxHighlighter.registerLanguage('sql', sql);

// Helper to extract language from className (supports lang- and language- prefixes)
function extractLanguage(className?: string): string {
  if (!className) return '';
  const match = className.match(/lang(?:uage)?-([\w+-]+)/);
  return match ? match[1] : '';
}

// Custom Code component supporting both inline and block code
function Code({ className, children }: CodeBlockProps) {
  const rawContent = String(children);
  const codeContent = rawContent.replace(/\n$/, '');
  const language = extractLanguage(className) || 'plaintext';
  const isBlock = Boolean(extractLanguage(className));
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isBlock) {
    return <code className="inline-code">{codeContent}</code>;
  }

  return (
    <div className="code-block-container">
      <div className="code-block-header">
        <span className="code-language">{language}</span>
        <CopyToClipboard text={codeContent} onCopy={handleCopy}>
          <Button
            size="small"
            appearance="subtle"
            className="copy-button"
            title="Copy code"
          >
            {copied ? <ClipboardCheck size={16} /> : <Copy size={16} />}
          </Button>
        </CopyToClipboard>
      </div>

      <SyntaxHighlighter
        language={language}
        style={vs}
        customStyle={{ margin: 0, borderRadius: '0 0 5px 5px' }}
        showLineNumbers={true}
      >
        {codeContent}
      </SyntaxHighlighter>
    </div>
  );
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
            // You can add overrides for other elements like p, h1, etc. if needed
            // p: {
            //   props: {
            //     className: 'markdown-paragraph',
            //   },
            // },
          },
        }}
      >
        {markdownContent}
      </Markdown>
    </div>
  );
}

export default JsxFromMarkdown;
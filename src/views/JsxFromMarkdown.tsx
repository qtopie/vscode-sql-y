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

// Custom Code component
function Code({ className, children }: CodeBlockProps) {
  // Extract language from className, default to 'plaintext' if not specified
  const language = className ? className.replace('lang-', '') : 'plaintext';
  const codeContent = String(children).replace(/\n$/, '');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Reset copied state after 2 seconds
  };

  return (
    <div className="code-block-container">
      {/* Header for language name and copy button */}
      <div className="code-block-header">
        <span className="code-language">{language}</span>
        <CopyToClipboard text={codeContent} onCopy={handleCopy}>
          <Button
            size='small'
            appearance='subtle'
            className="copy-button"
            title="Copy code"
          >
            {copied ? <ClipboardCheck size={16} /> : <Copy size={16} />}
          </Button>
        </CopyToClipboard>
      </div>

      {/* Syntax highlighter component */}
      <SyntaxHighlighter
        language={language}
        style={vs} // Using a dark theme that fits well with VS Code
        customStyle={{ margin: 0, borderRadius: '0 0 5px 5px' }} // Remove default margins
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
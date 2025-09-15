import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs } from 'react-syntax-highlighter/dist/esm/styles/prism'; // Or any other theme

interface CodeBlockProps {
  className?: string;
  children: React.ReactNode;
}


const CodeBlock = ({ className, children }: CodeBlockProps) => {
  const language = className ? className.replace(/language-/, '') : undefined;

  return (
    <SyntaxHighlighter style={vs} language={language} PreTag="div">
      {String(children).replace(/\n$/, '')}
    </SyntaxHighlighter>
  );
};

export default CodeBlock;
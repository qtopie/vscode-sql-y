import { Button, Card, CardHeader, Textarea } from "@fluentui/react-components";
import { BotRegular, PersonVoiceRegular } from '@fluentui/react-icons';
import { useVirtualizer } from '@tanstack/react-virtual';
import { SendHorizontal } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import './App.css';
import JsxFromMarkdown from "./JsxFromMarkdown";

// Define the structure for the VS Code API, message object, and component props
interface VSCodeAPI {
  postMessage(message: any): void;
}

interface AppProps {
  vscode: VSCodeAPI;
}

interface Message {
  content: string;
  isUser: boolean;
}

const App: React.FC<AppProps> = ({ vscode }) => {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const MAX_MESSAGES = 50; // Keep a buffer of 50 messages

  // Ref for the scrollable messages container
  const parentRef = useRef<HTMLDivElement>(null);

  // TanStack Virtual hook setup
  const rowVirtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120, // An estimated average height for a message
    overscan: 5, // Render 5 extra items for smoother scrolling
  });

  // Effect to handle messages from the VS Code extension
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;

      switch (message.command) {
        case 'sendMessage':
          setMessages((prevMessages) => {
            // Add the final message to the array and enforce the limit
            // The last message is already being updated by `addResponse`
            // We can use this command to signal the end of the streaming
            // and apply the message limit.
            const updatedMessages = [...prevMessages].slice(-20);
            return [
              ...updatedMessages,
              { content: message.text, isUser: true, seq: 0 },
            ];
          });
          break;
        // This command streams the bot's response
        case 'addResponse':
          setMessages((prevMessages) => {
            const lastMessage = prevMessages[prevMessages.length - 1];
            // If the last message is from the bot, append to it
            if (lastMessage && !lastMessage.isUser) {
              const updatedMessages = [...prevMessages];
              updatedMessages[updatedMessages.length - 1] = {
                ...lastMessage,
                content: lastMessage.content + message.text,
              };
              return updatedMessages;
            }
            // Otherwise, create a new bot message
            return [
              ...prevMessages,
              { content: message.text, isUser: false },
            ];
          });
          break;
        case 'END_OF_STREAM':
          setMessages((prevMessages) => {
            // Add the final message to the array and enforce the limit
            // The last message is already being updated by `addResponse`
            // We can use this command to signal the end of the streaming
            // and apply the message limit.
            const updatedMessages = [...prevMessages].slice(-20);
            return [
              ...updatedMessages,
              { content: '', isUser: false, seq: Number.MAX_SAFE_INTEGER },
            ];
          });
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Effect to scroll to the latest message
  useEffect(() => {
    if (messages.length > 0) {
      rowVirtualizer.scrollToIndex(messages.length - 1, { align: 'end' });
    }
  }, [messages.length, rowVirtualizer]);

  const handleSendMessage = () => {
    if (inputText.trim()) {
      const newUserMessage: Message = { content: inputText, isUser: true };

      // Add the new message and trim the history to MAX_MESSAGES
      setMessages(prev => [...prev, newUserMessage].slice(-MAX_MESSAGES));

      vscode.postMessage({ command: 'sendMessage', text: inputText });
      setInputText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="app-container">
      {/* Scrollable Message List */}
      <div ref={parentRef} className="messages-list">
        {/* Inner container for total height, required by the virtualizer */}
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {/* Render only the virtual items */}
          {rowVirtualizer.getVirtualItems().map((virtualItem) => {
            const msg = messages[virtualItem.index];
            if (!msg || !msg.content.trim()) return null;

            return (
              <div
                key={virtualItem.key}
                data-index={virtualItem.index}
                ref={rowVirtualizer.measureElement}
                className="virtual-item"
                style={{
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <div className={`message-container ${msg.isUser ? 'user-container' : 'bot-container'}`}>
                  <div className="message-icon">
                    {msg.isUser ? <PersonVoiceRegular /> : <BotRegular />}
                  </div>
                  <Card className={`message ${msg.isUser ? 'user-message' : 'bot-message'}`}>
                    <CardHeader>
                      <b>{msg.isUser ? 'You' : 'Bot'}</b>
                    </CardHeader>
                    {msg.isUser ? (
                      <p className="message-content">{msg.content}</p>
                    ) : (
                      <JsxFromMarkdown markdownContent={msg.content} />
                    )}
                  </Card>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Input Box Area */}
      <div className="input-area">
        <Textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question..."
          className="input-box"
          resize="vertical"
        />
        <Button
          appearance="primary"
          icon={<SendHorizontal />}
          onClick={handleSendMessage}
          disabled={!inputText.trim()}
        />
      </div>
    </div>
  );
};

export default App;
import {
  Button,
  Card,
  CardFooter,
  CardHeader,
  CardPreview,
  Textarea
} from "@fluentui/react-components";
import { BotRegular, PersonVoiceRegular } from '@fluentui/react-icons';
import { SendHorizontal } from 'lucide-react';
import Markdown from 'markdown-to-jsx';
import React, { useEffect, useRef, useState } from 'react';
import './App.css';
import CodeBlock from "./CodeBlock";
import JsxFromMarkdown from "./JsxFromMarkdown";

// Define the structure for the VS Code API, message object, and component props
interface VSCodeAPI {
  postMessage(message: any): void;
}

interface AppProps {
  vscode: VSCodeAPI;
}

interface Message {
  sessionId?: string;
  seq: number;
  content: string;
  isUser: boolean;
}

const App: React.FC<AppProps> = ({ vscode }) => {
  const [sessionId, setSessionId] = useState(null);
  const [currentSeq, setCurrentSeq] = useState(1);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);

  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);


  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;

      // Finalize the bot message and apply the message limit
      if (message?.command === 'sendMessage') {
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
      }

      // Real-time streaming for bot responses
      if (message?.command === 'addResponse') {
        setMessages((prevMessages) => {
          // If the last message is from the bot, append the new text
          const lastMessage = prevMessages[prevMessages.length - 1];
          if (lastMessage && !lastMessage.isUser && lastMessage.seq <= message.seq) {
            const updatedMessages = [...prevMessages];
            updatedMessages[updatedMessages.length - 1] = {
              ...lastMessage,
              content: lastMessage.content + message.text,
            };
            return updatedMessages;
          }
          // Otherwise, start a new bot message for the real-time stream
          return [
            ...prevMessages,
            { content: message.text, isUser: false, seq: currentSeq },
          ];
        });
      }

      // Finalize the bot message and apply the message limit
      if (message?.command === 'END_OF_STREAM') {
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
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const handleSendMessage = () => {
    if (inputText.trim()) {
      const newUserMessage: Message = {
        content: inputText,
        isUser: true,
        seq: currentSeq + 1
      };
      setMessages((prevMessages) => {
        // Enforce the message limit on the user's message as well
        const updatedMessages = [...prevMessages, newUserMessage].slice(-20);
        return updatedMessages;
      });

      vscode.postMessage({ command: 'sendMessage', text: inputText });
      setInputText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Check if the Enter key was pressed
    if (e.key === 'Enter') {
      // Prevent the default behavior (creating a new line)
      e.preventDefault();

      // If the Shift key is also pressed, insert a new line character
      if (e.shiftKey) {
        setInputText(prevText => prevText + '\n');
      } else {
        // Otherwise, send the message
        handleSendMessage();
      }
    }
  };

  return (
    <div id="container">
      <div id="messages">
        {messages.filter(e => e.content.trim())
          .map((msg, index) => (
            <div
              key={index}
              className={`message-container ${msg.isUser ? 'user-container' : 'bot-container'}`}
            >
              <div className="message-icon">
                {msg.isUser ? <PersonVoiceRegular /> : <BotRegular />}

              </div>
              <Card className={`message ${msg.isUser ? 'user-message' : 'bot-message'}`}>
                <CardHeader>
                  <p>{msg.isUser ? 'You' : 'Bot'}</p>
                </CardHeader>
                <CardPreview>
                  {/* Optional: Add a preview image here */}
                </CardPreview>
                {msg.isUser ? (
                  <p>{msg.content}</p>
                ) : (
                  <JsxFromMarkdown markdownContent={msg.content} />
                )}
                <CardFooter>
                  {/* Optional: Add footer content here */}
                </CardFooter>
              </Card>
            </div>
          ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="input-box">
        <Textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
        />
        <Button icon={<SendHorizontal />}
          style={{ marginLeft: 'auto', justifyContent: 'flex-end' }}
          onClick={handleSendMessage}
        />
      </div>
    </div>
  );
};

export default App;
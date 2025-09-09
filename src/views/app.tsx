import React, { useState, useEffect, useRef } from 'react';
// import { Mdx } from "@m2d/react-markdown/server";

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

  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Refactored message handling logic
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;

      // Real-time streaming for bot responses
      if (message?.command === 'addResponse') {
        setMessages((prevMessages) => {
          // If the last message is from the bot, append the new text
          const lastMessage = prevMessages[prevMessages.length - 1];
          if (lastMessage && !lastMessage.isUser) {
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
            { content: message.text, isUser: false },
          ];
        });
      }

      // Finalize the bot message and apply the message limit
      if (message?.command === 'endResponse') {
        setMessages((prevMessages) => {
          // Add the final message to the array and enforce the limit
          // The last message is already being updated by `addResponse`
          // We can use this command to signal the end of the streaming
          // and apply the message limit.
          const updatedMessages = [...prevMessages].slice(-20);
          return updatedMessages;
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

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div id="container">
      <div id="messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.isUser ? 'user' : 'bot'}`}>
            {msg.content}
            {/* <Mdx>{msg.content}</Mdx> */}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div id="inputArea">
        <input
          id="inputText"
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
        />
        <button id="sendButton" onClick={handleSendMessage}>
          Send
        </button>
      </div>
    </div>
  );
};

export default App;
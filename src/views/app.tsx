import React from 'react';

interface VSCodeAPI {
  postMessage(message: any): void;
  getState(): any;
  setState(state: any): void;
}

interface AppProps {
  vscode: VSCodeAPI;
}

const App: React.FC<AppProps> = ({ vscode }) => {
  const [inputText, setInputText] = React.useState('');
  const [displayText, setDisplayText] = React.useState('Loading...');

  const appendMoreText = (text: string) => {
    setDisplayText(prevText => prevText + text);
  }

  const appendMessage = (text: string, isUser: boolean) => {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    messageDiv.classList.add(isUser ? 'user' : 'bot');
    messageDiv.innerText = text;

    const messagesDiv = document.getElementById('messages');
    if (messagesDiv) {
      messagesDiv.appendChild(messageDiv);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
  };

  const handleSendMessage = () => {
    if (inputText.trim()) {
      appendMessage(inputText, true);
      
      vscode.postMessage({ command: 'sendMessage', text: inputText });
      setInputText('');
    }
  };

  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      if (message?.command === 'addResponse') {
        appendMessage(message.text, false);
      }
    }

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    }
  }, []);

  return (
    <div id="container">
      <div id='messages'></div>
      <div id='inputArea'>
        <input 
          id='inputText'
          type='text'
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder='Type a message...'
        />
        <button id='sendButton' onClick={handleSendMessage}>
          Send
        </button>
      </div>

    </div>

);
}

export default App;
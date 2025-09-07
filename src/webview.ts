export function getWebviewContent(): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>SQL-Y Chat</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
        #container { display: flex; flex-direction: column; height: 100vh; }
        #messages { flex: 1; padding: 10px; overflow-y: auto; }
        .message { margin-bottom: 10px; }
        .user { font-weight: bold; }
        .bot { color: blue; }
        #inputArea { display: flex; padding: 10px; }
        #inputText { flex: 1; padding: 10px; font-size: 16px; }
        #sendButton { padding: 10px 20px; font-size: 16px; cursor: pointer; }
      </style>
    </head>
    <body>
      <div id="container">
        <div id="messages"></div>
        <div id="inputArea">
          <input id="inputText" type="text" placeholder="Type a message..." />
          <button id="sendButton">Send</button>
        </div>
      </div>
      <script>
        const vscode = acquireVsCodeApi();
        const messagesDiv = document.getElementById('messages');
        const inputText = document.getElementById('inputText');
        const sendButton = document.getElementById('sendButton');

        function appendMessage(text, isUser) {
          const messageDiv = document.createElement('div');
          messageDiv.className = 'message';
          messageDiv.classList.add(isUser ? 'user' : 'bot');
          messageDiv.innerText = text;
          messagesDiv.appendChild(messageDiv);
          messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }

        sendButton.addEventListener('click', () => {
          const text = inputText.value;
          if (text) {
            appendMessage(text, true);
            vscode.postMessage({ command: 'sendMessage', text });
            inputText.value = '';
          }
        });

        window.addEventListener('message', (event) => {
          const message = event.data;
          if (message.command === 'addResponse') {
            appendMessage(message.text, false);
          }
        });
      </script>
    </body>
    </html>
  `;
}

import { createRoot } from 'react-dom/client';
import React from 'react';
import App from "./App";
import { FluentProvider, webLightTheme } from '@fluentui/react-components';

declare const vscode: any;

const container = document.getElementById("root");
const root = createRoot(container!);

root.render(
  <FluentProvider theme={webLightTheme}>
    <App vscode={vscode} />
  </FluentProvider>
);
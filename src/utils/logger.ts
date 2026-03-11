import * as vscode from 'vscode';

let outputChannel: vscode.OutputChannel | undefined;

function getOutputChannel(): vscode.OutputChannel {
  if (!outputChannel) {
    outputChannel = vscode.window.createOutputChannel('Context Organizer');
  }
  return outputChannel;
}

export function log(message: string, ...args: any[]): void {
  const channel = getOutputChannel();
  const timestamp = new Date().toLocaleTimeString();
  
  // Combine message with args like console.log
  const parts = [message, ...args].map(arg => {
    if (typeof arg === 'object') {
      return JSON.stringify(arg, null, 2);
    }
    return String(arg);
  });
  
  channel.appendLine(`[${timestamp}] ${parts.join(' ')}`);
}

export function error(message: string, error?: any): void {
  const channel = getOutputChannel();
  const timestamp = new Date().toLocaleTimeString();
  channel.appendLine(`[${timestamp}] ❌ ERROR: ${message}`);
  if (error) {
    if (error instanceof Error) {
      channel.appendLine(`   ${error.message}`);
      channel.appendLine(`   ${error.stack}`);
    } else {
      channel.appendLine(JSON.stringify(error, null, 2));
    }
  }
}

export function showChannel(): void {
  getOutputChannel().show();
}

export function dispose(): void {
  if (outputChannel) {
    outputChannel.dispose();
    outputChannel = undefined;
  }
}

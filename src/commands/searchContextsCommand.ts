import * as vscode from 'vscode';

/**
 * Opens the search panel view
 */
export async function searchContextsCommand() {
  try {
    // Focus the search panel view
    await vscode.commands.executeCommand('contextOrganizerSearchPanel.focus');
  } catch (error) {
    vscode.window.showErrorMessage(
      `Failed to open search panel: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Command to add a note/comment to a file in a context.
 * Prompts the user for text input and stores it in the notes section of contexts.json.
 */
export async function addNoteToFileCommand(fileItem: any) {
	const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
	if (!workspaceRoot) {
		vscode.window.showErrorMessage('No workspace folder is open');
		return;
	}

	const configPath = path.join(workspaceRoot, '.vscode', 'contexts.json');
	
	if (!fs.existsSync(configPath)) {
		vscode.window.showErrorMessage('contexts.json file not found');
		return;
	}

	// Get the relative path of the file
	const absolutePath = fileItem.filePath;
	const relativePath = path.relative(workspaceRoot, absolutePath);

	// Read current configuration
	let config: any;
	try {
		config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
	} catch (error) {
		vscode.window.showErrorMessage('Error reading contexts.json');
		return;
	}

	// Initialize notes section if it doesn't exist
	if (!config.notes) {
		config.notes = {};
	}

	// Get existing note if any
	const existingNote = config.notes[relativePath] || '';

	// Show input box with existing note as default
	const note = await vscode.window.showInputBox({
		prompt: `Add note for ${path.basename(relativePath)}`,
		placeHolder: 'Enter your note here...',
		value: existingNote,
		ignoreFocusOut: true
	});

	// If user cancels or enters empty string, handle accordingly
	if (note === undefined) {
		return; // User cancelled
	}

	if (note === '') {
		// Remove note if empty
		delete config.notes[relativePath];
		// Clean up notes section if empty
		if (Object.keys(config.notes).length === 0) {
			delete config.notes;
		}
	} else {
		// Add or update note
		config.notes[relativePath] = note;
	}

	// Write back to file
	try {
		fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
		vscode.window.showInformationMessage(note === '' ? 'Note removed' : 'Note saved');
		
		// Refresh the tree view
		vscode.commands.executeCommand('context-organizer.refresh');
	} catch (error) {
		vscode.window.showErrorMessage('Error saving note to contexts.json');
	}
}

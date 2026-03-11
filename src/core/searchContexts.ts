import * as fs from 'fs';
import * as path from 'path';
import * as logger from '../utils/logger';

export interface SearchMatch {
  lineNumber: number;
  lineText: string;
  matchStart: number;
  matchEnd: number;
}

export interface SearchResultFile {
  filePath: string;
  absolutePath: string;
  matches: SearchMatch[];
}

export interface SearchOptions {
  matchCase: boolean;
  matchWholeWord: boolean;
  useRegex: boolean;
}

export function performSearch(
  filePaths: string[],
  workspaceRoot: string,
  searchTerm: string,
  options: SearchOptions
): SearchResultFile[] {
  if (!searchTerm) {
    logger.log('⚠️ Empty search term');
    return [];
  }

  logger.log('🔎 performSearch called with:', {
    fileCount: filePaths.length,
    workspaceRoot,
    searchTermLength: searchTerm.length,
    useRegex: options.useRegex,
    matchCase: options.matchCase
  });

  const results: SearchResultFile[] = [];

  for (const relativePath of filePaths) {
    try {
      const absolutePath = path.join(workspaceRoot, relativePath);

      // Check if file exists
      if (!fs.existsSync(absolutePath)) {
        logger.log(`⚠️ File not found: ${absolutePath}`);
        continue;
      }

      // Read file content
      const fileContent = fs.readFileSync(absolutePath, 'utf-8');
      const lines = fileContent.split('\n');

      logger.log(`📄 Processing: ${relativePath} (${lines.length} lines)`);

      // Build regex pattern
      let pattern: RegExp;
      try {
        let regexPattern = searchTerm;

        if (!options.useRegex) {
          // Escape special regex characters if not using regex mode
          regexPattern = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }

        if (options.matchWholeWord) {
          // Add word boundaries if whole word matching is enabled
          regexPattern = `\\b${regexPattern}\\b`;
        }

        const flags = options.matchCase ? 'g' : 'gi';
        pattern = new RegExp(regexPattern, flags);
        logger.log(`   Regex: /${pattern.source}/${pattern.flags}`);
      } catch (e) {
        // If regex is invalid, skip this file
        logger.error(`⚠️ Invalid regex for file ${relativePath}:`, e);
        continue;
      }

      const matches: SearchMatch[] = [];

      // Search through each line
      for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {
        const lineText = lines[lineNumber];
        let match;

        // Reset regex lastIndex for global flag
        pattern.lastIndex = 0;

        while ((match = pattern.exec(lineText)) !== null) {
          matches.push({
            lineNumber: lineNumber + 1,
            lineText,
            matchStart: match.index,
            matchEnd: match.index + match[0].length
          });
        }
      }

      // Only add file to results if it has matches
      if (matches.length > 0) {
        logger.log(`   ✅ Found ${matches.length} matches`);
        results.push({
          filePath: relativePath,
          absolutePath,
          matches
        });
      }
    } catch (error) {
      // Skip files that can't be read
      logger.error(`❌ Error reading file ${relativePath}:`, error);
      continue;
    }
  }

  logger.log(`🎉 Search complete: ${results.length} files with matches`);
  return results;
}

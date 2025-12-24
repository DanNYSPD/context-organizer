#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Script to bump version based on conventional commits
 * - feat: bumps minor version (x.MINOR.x)
 * - fix: bumps patch version (x.x.PATCH)
 * - BREAKING CHANGE or feat!/fix!: bumps major version (MAJOR.x.x)
 * - other: bumps patch version (x.x.PATCH)
 */

function getLastCommitMessage() {
	try {
		const message = execSync('git log -1 --pretty=%B', { encoding: 'utf-8' }).trim();
		return message;
	} catch (error) {
		console.error('Error getting last commit message:', error.message);
		process.exit(1);
	}
}

function getCurrentVersion() {
	const packagePath = path.join(__dirname, '..', 'package.json');
	const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
	return packageJson.version;
}

function parseVersion(version) {
	const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
	if (!match) {
		throw new Error(`Invalid version format: ${version}`);
	}
	return {
		major: parseInt(match[1], 10),
		minor: parseInt(match[2], 10),
		patch: parseInt(match[3], 10)
	};
}

function determineVersionBump(commitMessage) {
	const firstLine = commitMessage.split('\n')[0].toLowerCase();
	const fullMessage = commitMessage.toLowerCase();

	// Check for breaking changes
	if (fullMessage.includes('breaking change') || 
	    firstLine.includes('!:') || 
	    firstLine.match(/^(feat|fix|chore|docs|style|refactor|perf|test)!:/)) {
		return 'major';
	}

	// Check commit type
	if (firstLine.startsWith('feat:') || firstLine.startsWith('feat(')) {
		return 'minor';
	}

	if (firstLine.startsWith('fix:') || firstLine.startsWith('fix(')) {
		return 'patch';
	}

	// Default to patch for other commit types
	// (chore, docs, style, refactor, perf, test, build, ci, revert)
	return 'patch';
}

function bumpVersion(version, bumpType) {
	const parsed = parseVersion(version);

	switch (bumpType) {
		case 'major':
			return `${parsed.major + 1}.0.0`;
		case 'minor':
			return `${parsed.major}.${parsed.minor + 1}.0`;
		case 'patch':
			return `${parsed.major}.${parsed.minor}.${parsed.patch + 1}`;
		default:
			throw new Error(`Unknown bump type: ${bumpType}`);
	}
}

function updatePackageJson(newVersion) {
	const packagePath = path.join(__dirname, '..', 'package.json');
	const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
	packageJson.version = newVersion;
	fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n', 'utf-8');
}

function main() {
	const args = process.argv.slice(2);
	const forceType = args[0]; // Can be 'major', 'minor', 'patch', or undefined

	// Get current version
	const currentVersion = getCurrentVersion();
	console.log(`Current version: ${currentVersion}`);

	// Determine bump type
	let bumpType;
	if (forceType && ['major', 'minor', 'patch'].includes(forceType)) {
		bumpType = forceType;
		console.log(`Force bumping ${bumpType} version`);
	} else {
		const commitMessage = getLastCommitMessage();
		console.log(`Last commit: ${commitMessage.split('\n')[0]}`);
		bumpType = determineVersionBump(commitMessage);
		console.log(`Suggested bump type: ${bumpType}`);
	}

	// Calculate new version
	const newVersion = bumpVersion(currentVersion, bumpType);
	console.log(`New version: ${newVersion}`);

	// Prompt for confirmation (unless --yes flag is provided)
	if (!args.includes('--yes') && !args.includes('-y')) {
		console.log('\nTo apply this version bump, run:');
		console.log(`  node scripts/bump-version.js ${bumpType} --yes`);
		console.log('\nOr add this to package.json scripts and run:');
		console.log('  npm run bump-version');
		return;
	}

	// Update package.json
	updatePackageJson(newVersion);
	console.log(`\n✓ Version bumped to ${newVersion} in package.json`);
	
	console.log('\nNext steps:');
	console.log('  1. Review the changes');
	console.log('  2. Commit: git add package.json && git commit -m "chore: bump version to ' + newVersion + '"');
	console.log('  3. Tag: git tag v' + newVersion);
	console.log('  4. Push: git push && git push --tags');
}

main();

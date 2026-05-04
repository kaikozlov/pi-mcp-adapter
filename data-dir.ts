// data-dir.ts - Unified data directory for pi-mcp-adapter
// All extension-managed data lives under ~/.pi/agent/extensions/data/pi-mcp-adapter/
import { existsSync, mkdirSync, readdirSync, renameSync } from "node:fs";
import { join, dirname } from "node:path";
import { getAgentDir } from "./agent-dir.ts";

export const DATA_DIR = join(getAgentDir(), "extensions", "data", "pi-mcp-adapter");

/** Ensure the data directory exists. */
export function ensureDataDir(): void {
	if (!existsSync(DATA_DIR)) {
		mkdirSync(DATA_DIR, { recursive: true });
	}
}

/**
 * One-shot migration from legacy paths to the unified data directory.
 * Moves files from old scattered locations under ~/.pi/agent/ into DATA_DIR.
 * Safe to call multiple times — skips if new paths already exist.
 */
let migrationDone = false;

export function migrateFromLegacyPaths(): void {
	if (migrationDone) return;
	migrationDone = true;

	const agentDir = getAgentDir();
	const migrations: Array<{ oldPath: string; newPath: string; isDir?: boolean }> = [
		{ oldPath: join(agentDir, "mcp-cache.json"), newPath: join(DATA_DIR, "cache.json") },
		{ oldPath: join(agentDir, "mcp-npx-cache.json"), newPath: join(DATA_DIR, "npx-cache.json") },
		{ oldPath: join(agentDir, "mcp-oauth"), newPath: join(DATA_DIR, "oauth"), isDir: true },
	];

	for (const { oldPath, newPath, isDir } of migrations) {
		if (!existsSync(oldPath)) continue;
		if (existsSync(newPath)) continue; // already migrated

		try {
			ensureDataDir();
			if (isDir) {
				// Move entire directory
				renameSync(oldPath, newPath);
			} else {
				// Move file
				mkdirSync(dirname(newPath), { recursive: true });
				renameSync(oldPath, newPath);
			}
		} catch {
			// Migration is best-effort; don't block startup
		}
	}
}

// Run migration eagerly on module load
migrateFromLegacyPaths();

import { CodeScannerResult } from "../types";
import { exec } from "child_process";
import util from "util";
import fs from "fs/promises";
import path from "path";
import os from "os";

const execPromise = util.promisify(exec);

const SECRET_PATTERNS = [
  { name: "AWS Access Key", regex: /AKIA[0-9A-Z]{16}/g },
  { name: "Google API Key", regex: /AIza[0-9A-Za-z-_]{35}/g },
  { name: "Stripe Standard API Key", regex: /sk_live_[0-9a-zA-Z]{24}/g },
  { name: "Generic Secret", regex: /("password"|"secret"|"api_key"|"apiKey"|"token")\s*:\s*["'][^"']+["']/gi },
];

export async function scanCodebase(repoUrl: string): Promise<CodeScannerResult> {
  const result: CodeScannerResult = {
    repoUrl,
    status: "safe",
    hardcoded_secrets: [],
    vulnerabilities: [],
  };

  let tempDir = "";

  try {
    // 1. Create temporary directory
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "omniguard-scanner-"));

    // 2. Clone repository (depth 1 to be fast)
    // Basic validation to prevent command injection
    if (!repoUrl.startsWith("https://github.com/") && !repoUrl.startsWith("https://gitlab.com/")) {
        throw new Error("Only GitHub or GitLab HTTPS URLs are supported.");
    }
    await execPromise(`git clone --depth 1 "${repoUrl}" "${tempDir}"`);

    // 3. Scan for secrets in text files
    const files = await getFiles(tempDir);
    for (const file of files) {
      if (file.includes(".git") || file.includes("node_modules")) continue;
      
      const stat = await fs.stat(file);
      if (stat.size > 1024 * 1024) continue; // Skip files larger than 1MB

      try {
        const content = await fs.readFile(file, "utf8");
        for (const pattern of SECRET_PATTERNS) {
          if (pattern.regex.test(content)) {
            const relativePath = path.relative(tempDir, file);
            result.hardcoded_secrets.push(`Found potential ${pattern.name} in ${relativePath}`);
            result.status = "vulnerable";
          }
        }
      } catch (err) {
        // Ignored, might be a binary file
      }
    }

    // 4. Check for dependencies (package.json)
    const packageJsonPath = path.join(tempDir, "package.json");
    try {
      const packageJsonContent = await fs.readFile(packageJsonPath, "utf8");
      const packageJson = JSON.parse(packageJsonContent);
      const deps = { ...(packageJson.dependencies || {}), ...(packageJson.devDependencies || {}) };
      
      const osvQueries = Object.keys(deps).map(pkg => ({
        package: { name: pkg, ecosystem: "npm" },
        version: deps[pkg].replace(/[^0-9.]/g, "") // Best effort version parsing
      }));

      if (osvQueries.length > 0) {
        // Query OSV API in batches or bulk (OSV supports POST /v1/querybatch)
        const response = await fetch("https://api.osv.dev/v1/querybatch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ queries: osvQueries }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.results) {
            data.results.forEach((res: any, index: number) => {
              if (res.vulns && res.vulns.length > 0) {
                result.status = "vulnerable";
                result.vulnerabilities.push({
                  package: osvQueries[index].package.name,
                  version: osvQueries[index].version,
                  vulnerability: res.vulns[0].id // Just storing the ID for brevity
                });
              }
            });
          }
        }
      }
    } catch (err) {
      // No package.json found or invalid
    }

    return result;
  } catch (error: any) {
    return {
      ...result,
      status: "error",
      hardcoded_secrets: [error.message], // Using this array to pass the error message for simplicity
    };
  } finally {
    // 5. Cleanup
    if (tempDir) {
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch (e) {
        console.error("Failed to clean up temp dir", e);
      }
    }
  }
}

async function getFiles(dir: string): Promise<string[]> {
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(dirents.map((dirent) => {
    const res = path.resolve(dir, dirent.name);
    return dirent.isDirectory() ? getFiles(res) : res;
  }));
  return Array.prototype.concat(...files);
}

"use server";

import { scanCodebase } from "@/lib/code-scanner";
import { CodeScannerResult } from "@/types";

export async function runCodeScan(repoUrl: string): Promise<CodeScannerResult> {
  return await scanCodebase(repoUrl);
}

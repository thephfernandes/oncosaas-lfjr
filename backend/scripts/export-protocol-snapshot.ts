/**
 * Gera shared/clinical-protocol-snapshot.v1.json a partir dos templates NestJS.
 * Executar a partir da pasta backend: npm run export-protocol-snapshot
 */
import * as fs from 'fs';
import * as path from 'path';
import { PROTOCOL_TEMPLATES } from '../src/clinical-protocols/clinical-protocols.service';

function main() {
  const cancerTypes: Record<string, { checkInRules: Record<string, unknown> }> =
    {};
  for (const [cancerType, template] of Object.entries(PROTOCOL_TEMPLATES)) {
    cancerTypes[cancerType] = {
      checkInRules: (template as { checkInRules?: Record<string, unknown> })
        .checkInRules ?? {},
    };
  }
  const snapshot = {
    version: 1,
    cancerTypes,
  };
  const repoRoot = path.resolve(__dirname, '..', '..');
  const outDir = path.join(repoRoot, 'shared');
  const outFile = path.join(outDir, 'clinical-protocol-snapshot.v1.json');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outFile, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf-8');
  // eslint-disable-next-line no-console
  console.log(`Wrote ${outFile}`);
}

main();

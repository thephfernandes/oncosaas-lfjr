/**
 * Importa catálogo global (exam_catalog_items) a partir de JSON gerado pelo
 * script Python exam-catalog-from-tuss-xlsx.py.
 *
 * Não passa pela API: exige acesso ao banco (DATABASE_URL). O catálogo é
 * compartilhado entre todos os tenants; usuários autenticados não devem poder
 * sobrescrevê-lo via HTTP.
 *
 * Uso:
 *   npx ts-node -r tsconfig-paths/register scripts/import-exam-catalog-json.ts path/to/exam-catalog-import.json
 */

import 'dotenv/config';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  PrismaClient,
  ComplementaryExamType,
} from '@generated/prisma/client';

type ImportRow = {
  code: string;
  name: string;
  type: ComplementaryExamType;
  rolItemCode?: string | null;
  specimenDefault?: string | null;
  unit?: string | null;
  referenceRange?: string | null;
};

type Payload = {
  items: ImportRow[];
  sourceVersion?: string;
};

function loadPayload(filePath: string): Payload {
  const abs = resolve(process.cwd(), filePath);
  const raw = readFileSync(abs, 'utf-8');
  const data = JSON.parse(raw) as Payload;
  if (!data || !Array.isArray(data.items)) {
    throw new Error('JSON inválido: esperado { items: [...], sourceVersion?: string }');
  }
  return data;
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error(
      'Uso: ts-node scripts/import-exam-catalog-json.ts <arquivo.json>',
    );
    process.exit(1);
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL não definido.');
    process.exit(1);
  }

  const payload = loadPayload(filePath);
  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    await prisma.$connect();
    const result = await prisma.$transaction(async (tx) => {
      let upserted = 0;
      const sourceVersion = payload.sourceVersion ?? null;
      for (const row of payload.items) {
        await tx.examCatalogItem.upsert({
          where: { code: row.code },
          create: {
            code: row.code,
            name: row.name,
            type: row.type,
            rolItemCode: row.rolItemCode ?? null,
            specimenDefault: row.specimenDefault ?? null,
            unit: row.unit ?? null,
            referenceRange: row.referenceRange ?? null,
            sourceVersion,
          },
          update: {
            name: row.name,
            type: row.type,
            rolItemCode: row.rolItemCode ?? null,
            specimenDefault: row.specimenDefault ?? null,
            unit: row.unit ?? null,
            referenceRange: row.referenceRange ?? null,
            ...(payload.sourceVersion !== undefined
              ? { sourceVersion: payload.sourceVersion }
              : {}),
          },
        });
        upserted++;
      }
      return { upserted, sourceVersion };
    });
    console.log(
      `OK: ${result.upserted} itens upsertados (sourceVersion=${result.sourceVersion ?? 'null'})`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

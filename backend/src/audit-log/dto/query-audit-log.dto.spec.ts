import { validate } from 'class-validator';
import { QueryAuditLogDto } from './query-audit-log.dto';

describe('QueryAuditLogDto', () => {
  it('rejeita userId que não é UUID', async () => {
    const dto = Object.assign(new QueryAuditLogDto(), {
      userId: 'not-a-uuid',
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'userId')).toBe(true);
  });

  it('aceita filtros opcionais com UUIDs válidos (v4)', async () => {
    const dto = Object.assign(new QueryAuditLogDto(), {
      userId: 'c56a4180-65aa-42ec-a945-5fd21dec0538',
      resourceId: 'c56a4180-65aa-42ec-a946-5fd21dec0539',
      limit: 50,
      offset: 0,
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});

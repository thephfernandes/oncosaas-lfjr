import { parseXlsxFile } from '../xlsx-parser';

function bufferToArrayBuffer(data: ArrayBuffer | SharedArrayBuffer): ArrayBuffer {
  if (data instanceof ArrayBuffer) return data;
  return new Uint8Array(data).slice().buffer;
}

describe('parseXlsxFile (exceljs)', () => {
  it('interpreta uma planilha mínima com cabeçalhos esperados', async () => {
    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('Pacientes');
    ws.addRow(['NOME', 'PRONTUÁRIO', 'SEXO']);
    ws.addRow(['Maria Silva', '12345', 'F']);

    const raw = await workbook.xlsx.writeBuffer();
    const arrayBuffer = bufferToArrayBuffer(
      raw instanceof ArrayBuffer ? raw : new Uint8Array(raw).buffer,
    );

    const { sheets } = await parseXlsxFile(arrayBuffer);
    expect(sheets).toHaveLength(1);
    expect(sheets[0].rows.length).toBe(1);
    expect(sheets[0].rows[0].name).toBe('Maria Silva');
    expect(sheets[0].rows[0].medicalRecordNumber).toBe('12345');
    expect(sheets[0].rows[0].gender).toBe('female');
  }, 15000);
});

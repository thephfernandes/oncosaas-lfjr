'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { usePatientImport } from '@/hooks/use-patient-import';
import {
  Upload,
  AlertCircle,
  CheckCircle2,
  Download,
  Info,
} from 'lucide-react';
import Papa from 'papaparse';
import { csvRowSchema, CsvRow } from '@/lib/validations/import-csv';

interface PatientImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export function PatientImportDialog({
  open,
  onOpenChange,
}: PatientImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<CsvRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    []
  );
  const [showInstructions, setShowInstructions] = useState(true);
  const { mutate: importPatients, isPending } = usePatientImport();

  const downloadTemplate = () => {
    const headers = [
      'name',
      'cpf',
      'dataNascimento',
      'sexo',
      'telefone',
      'email',
      'tipoCancer',
      'dataDiagnostico',
      'estagio',
      'oncologistaResponsavel',
    ];

    const exampleRow = [
      'João Silva',
      '12345678900',
      '1980-05-15',
      'male',
      '11987654321',
      'joao.silva@email.com',
      'breast',
      '2024-01-10',
      'II',
      'Dr. Maria Santos',
    ];

    const csvContent = [
      headers.join(','),
      exampleRow.map((cell) => `"${cell}"`).join(','),
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_importacao_pacientes.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setPreviewData([]);
    setValidationErrors([]);

    // Parse CSV
    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows: CsvRow[] = [];
        const errors: ValidationError[] = [];

        results.data.forEach((row: any, index: number) => {
          try {
            const validated = csvRowSchema.parse(row);
            rows.push(validated);
          } catch (error: any) {
            if (error.errors) {
              error.errors.forEach((err: any) => {
                errors.push({
                  row: index + 2, // +2 porque linha 1 é header e index começa em 0
                  field: err.path.join('.'),
                  message: err.message,
                });
              });
            }
          }
        });

        setPreviewData(rows);
        setValidationErrors(errors);
      },
      error: (error) => {
        console.error('Erro ao parsear CSV:', error);
      },
    });
  };

  const handleImport = () => {
    if (!file) return;
    importPatients(file, {
      onSuccess: () => {
        setFile(null);
        setPreviewData([]);
        setValidationErrors([]);
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Pacientes via CSV</DialogTitle>
          <DialogDescription>
            Selecione um arquivo CSV com os dados dos pacientes ou baixe o
            template para ver o formato esperado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Instruções e Template */}
          {showInstructions && (
            <div className="border rounded-lg p-4 bg-blue-50 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900 mb-2">
                      Estrutura do Arquivo CSV
                    </h3>
                    <p className="text-sm text-blue-800 mb-3">
                      O arquivo CSV deve conter as seguintes colunas na primeira
                      linha (cabeçalho):
                    </p>
                    <div className="bg-white rounded border border-blue-200 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-blue-100">
                          <tr>
                            <th className="px-3 py-2 text-left font-semibold text-blue-900">
                              Coluna
                            </th>
                            <th className="px-3 py-2 text-left font-semibold text-blue-900">
                              Tipo
                            </th>
                            <th className="px-3 py-2 text-left font-semibold text-blue-900">
                              Obrigatório
                            </th>
                            <th className="px-3 py-2 text-left font-semibold text-blue-900">
                              Exemplo
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-blue-100">
                          <tr>
                            <td className="px-3 py-2 font-mono text-xs">
                              name
                            </td>
                            <td className="px-3 py-2">Texto</td>
                            <td className="px-3 py-2">
                              <span className="text-red-600 font-semibold">
                                Sim
                              </span>
                            </td>
                            <td className="px-3 py-2">João Silva</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 font-mono text-xs">cpf</td>
                            <td className="px-3 py-2">Texto (11 dígitos)</td>
                            <td className="px-3 py-2">
                              <span className="text-red-600 font-semibold">
                                Sim
                              </span>
                            </td>
                            <td className="px-3 py-2">12345678900</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 font-mono text-xs">
                              dataNascimento
                            </td>
                            <td className="px-3 py-2">Data (YYYY-MM-DD)</td>
                            <td className="px-3 py-2">
                              <span className="text-red-600 font-semibold">
                                Sim
                              </span>
                            </td>
                            <td className="px-3 py-2">1980-05-15</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 font-mono text-xs">
                              sexo
                            </td>
                            <td className="px-3 py-2">male, female ou other</td>
                            <td className="px-3 py-2">
                              <span className="text-red-600 font-semibold">
                                Sim
                              </span>
                            </td>
                            <td className="px-3 py-2">male</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 font-mono text-xs">
                              telefone
                            </td>
                            <td className="px-3 py-2">
                              Texto (mín. 10 dígitos)
                            </td>
                            <td className="px-3 py-2">
                              <span className="text-red-600 font-semibold">
                                Sim
                              </span>
                            </td>
                            <td className="px-3 py-2">11987654321</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 font-mono text-xs">
                              email
                            </td>
                            <td className="px-3 py-2">Email válido</td>
                            <td className="px-3 py-2">
                              <span className="text-green-600">Não</span>
                            </td>
                            <td className="px-3 py-2">joao@email.com</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 font-mono text-xs">
                              tipoCancer
                            </td>
                            <td className="px-3 py-2">
                              breast, lung, colorectal, prostate, kidney,
                              bladder, testicular, other
                            </td>
                            <td className="px-3 py-2">
                              <span className="text-red-600 font-semibold">
                                Sim
                              </span>
                            </td>
                            <td className="px-3 py-2">breast</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 font-mono text-xs">
                              dataDiagnostico
                            </td>
                            <td className="px-3 py-2">Data (YYYY-MM-DD)</td>
                            <td className="px-3 py-2">
                              <span className="text-green-600">
                                Não (obrigatório se não estiver em rastreio)
                              </span>
                            </td>
                            <td className="px-3 py-2">2024-01-10</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 font-mono text-xs">
                              estagio
                            </td>
                            <td className="px-3 py-2">Texto</td>
                            <td className="px-3 py-2">
                              <span className="text-green-600">Não</span>
                            </td>
                            <td className="px-3 py-2">II</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 font-mono text-xs">
                              oncologistaResponsavel
                            </td>
                            <td className="px-3 py-2">Texto</td>
                            <td className="px-3 py-2">
                              <span className="text-green-600">Não</span>
                            </td>
                            <td className="px-3 py-2">Dr. Maria Santos</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowInstructions(false)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  ✕
                </button>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-blue-200">
                <p className="text-xs text-blue-700">
                  💡 Dica: Baixe o template para ver um exemplo completo do
                  formato esperado
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadTemplate}
                  className="bg-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Template CSV
                </Button>
              </div>
            </div>
          )}

          {!showInstructions && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowInstructions(true)}
              className="w-full"
            >
              <Info className="h-4 w-4 mr-2" />
              Ver instruções de formato CSV
            </Button>
          )}
          {/* Upload */}
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
              id="csv-upload"
            />
            <label
              htmlFor="csv-upload"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm font-medium">
                {file ? file.name : 'Clique para selecionar arquivo CSV'}
              </span>
              <span className="text-xs text-muted-foreground">
                Apenas arquivos .csv
              </span>
            </label>
          </div>

          {/* Preview */}
          {previewData.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Preview dos Dados</h3>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    {previewData.length} válido(s)
                  </div>
                  {validationErrors.length > 0 && (
                    <div className="flex items-center gap-1 text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      {validationErrors.length} erro(s)
                    </div>
                  )}
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left">Nome</th>
                        <th className="px-3 py-2 text-left">CPF</th>
                        <th className="px-3 py-2 text-left">Tipo Câncer</th>
                        <th className="px-3 py-2 text-left">
                          Data Diagnóstico
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {previewData.slice(0, 10).map((row, index) => (
                        <tr key={index}>
                          <td className="px-3 py-2">{row.name}</td>
                          <td className="px-3 py-2">{row.cpf}</td>
                          <td className="px-3 py-2">{row.tipoCancer}</td>
                          <td className="px-3 py-2">{row.dataDiagnostico}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {previewData.length > 10 && (
                  <div className="px-3 py-2 text-xs text-muted-foreground bg-muted">
                    Mostrando 10 de {previewData.length} linhas
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Erros */}
          {validationErrors.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-destructive">
                Erros de Validação
              </h3>
              <div className="border border-destructive/50 rounded-lg p-4 max-h-48 overflow-y-auto">
                <div className="space-y-2 text-sm">
                  {validationErrors.map((error, index) => (
                    <div key={index} className="text-destructive">
                      <strong>Linha {error.row}</strong> - {error.field}:{' '}
                      {error.message}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleImport}
              disabled={!file || previewData.length === 0 || isPending}
            >
              {isPending
                ? 'Importando...'
                : `Importar ${previewData.length} paciente(s)`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

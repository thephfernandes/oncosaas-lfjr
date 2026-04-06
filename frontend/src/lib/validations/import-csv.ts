import { z } from 'zod';

/** Normaliza cabeçalhos do CSV para o nome canônico do campo. */
export function normalizeCsvHeader(header: string): string {
  const aliases: Record<string, string> = {
    // name
    name: 'name',
    nome: 'name',
    // cpf
    cpf: 'cpf',
    // dataNascimento
    datanascimento: 'dataNascimento',
    data_nascimento: 'dataNascimento',
    'data nascimento': 'dataNascimento',
    nascimento: 'dataNascimento',
    birthdate: 'dataNascimento',
    // sexo
    sexo: 'sexo',
    genero: 'sexo',
    gênero: 'sexo',
    gender: 'sexo',
    // telefone
    telefone: 'telefone',
    phone: 'telefone',
    celular: 'telefone',
    // email
    email: 'email',
    // tipoCancer
    tipocancer: 'tipoCancer',
    tipo_cancer: 'tipoCancer',
    'tipo cancer': 'tipoCancer',
    'tipo de cancer': 'tipoCancer',
    'tipo de câncer': 'tipoCancer',
    cancertype: 'tipoCancer',
    cancer: 'tipoCancer',
    câncer: 'tipoCancer',
    // dataDiagnostico
    datadiagnostico: 'dataDiagnostico',
    data_diagnostico: 'dataDiagnostico',
    'data diagnostico': 'dataDiagnostico',
    'data de diagnostico': 'dataDiagnostico',
    'data de diagnóstico': 'dataDiagnostico',
    diagnosisdate: 'dataDiagnostico',
    // estagio
    estagio: 'estagio',
    estágio: 'estagio',
    stage: 'estagio',
    // oncologistaResponsavel
    oncologistaresponsavel: 'oncologistaResponsavel',
    oncologista_responsavel: 'oncologistaResponsavel',
    oncologista: 'oncologistaResponsavel',
    // currentStage
    currentstage: 'currentStage',
    current_stage: 'currentStage',
    etapa: 'currentStage',
    jornada: 'currentStage',
  };
  const key = header.trim().toLowerCase();
  return aliases[key] ?? header.trim();
}

export const csvRowSchema = z.object({
  name: z.string().min(2),
  cpf: z.string().optional().or(z.literal('')),
  dataNascimento: z.string().optional().or(z.literal('')),
  sexo: z
    .enum(['male', 'female', 'other'])
    .optional()
    .or(z.literal('')),
  telefone: z.string().optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  tipoCancer: z
    .enum([
      'breast',
      'lung',
      'colorectal',
      'prostate',
      'kidney',
      'bladder',
      'testicular',
      'other',
    ])
    .optional()
    .or(z.literal('')),
  dataDiagnostico: z.string().optional().or(z.literal('')),
  estagio: z.string().optional(),
  oncologistaResponsavel: z.string().optional(),
  currentStage: z
    .enum([
      'SCREENING',
      'DIAGNOSIS',
      'TREATMENT',
      'FOLLOW_UP',
      'PALLIATIVE',
    ])
    .optional(),
});

export type CsvRow = z.infer<typeof csvRowSchema>;

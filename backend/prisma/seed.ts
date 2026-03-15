import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Carregar variáveis de ambiente do arquivo .env na raiz do projeto
dotenv.config({ path: resolve(__dirname, '../../.env') });

const prisma = new PrismaClient();

// ════════════════════════════════════════════════════════════════════════════════
// SEED COMPLETO — OncoNav PoC
// ════════════════════════════════════════════════════════════════════════════════
//
// Mapeamento funcionalidade-PoC coberta por este seed:
//
// PoC 2.1 — Tenant e jornada: 1 tenant, 8 pacientes fictícios, jornada colorretal
// PoC 2.2 — Agente WhatsApp: Conversas simuladas com detecção de sintomas críticos
// PoC 2.3 — Priorização com IA: PriorityScore histórico, scores variados, explicabilidade
// PoC 2.4 — Dashboard enfermagem:
//           - Lista ordenada por prioridade (priorityScore em todos os pacientes)
//           - Histórico de conversas (8 conversas com mensagens variadas)
//           - Alertas em tempo real (CRITICAL_SYMPTOM, NO_RESPONSE, NAVIGATION_DELAY)
//           - Ação "Assumir conversa" (Intervention ASSUME + Conversation handoff)
// PoC 2.5 — Backend e dados:
//           - Autenticação (users com roles)
//           - CRUD pacientes (dados completos)
//           - Mensagens WhatsApp e eventos
//           - CancerDiagnosis + Treatment por paciente em tratamento
//           - NavigationStep (etapas de navegação oncológica)
//           - Observations (FHIR), InternalNote, AgentDecisionLog
//           - WhatsAppConnection placeholder
// ════════════════════════════════════════════════════════════════════════════════

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Contadores para resumo final
  const counts = {
    patients: 0,
    conversations: 0,
    messages: 0,
    alerts: 0,
    priorityScores: 0,
    cancerDiagnoses: 0,
    treatments: 0,
    navigationSteps: 0,
    interventions: 0,
    observations: 0,
    internalNotes: 0,
    agentDecisionLogs: 0,
    whatsappConnections: 0,
  };

  // ─── Tenant ────────────────────────────────────────────────────────────────
  const tenant = await prisma.tenant.upsert({
    where: { schemaName: 'hospital_teste' },
    update: {},
    create: {
      name: 'Hospital de Teste',
      schemaName: 'hospital_teste',
      settings: {
        timezone: 'America/Sao_Paulo',
        language: 'pt-BR',
      },
    },
  });

  console.log('✅ Tenant criado:', tenant.name);

  // ─── Usuários ──────────────────────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash('senha123', 10);

  const admin = await prisma.user.upsert({
    where: {
      tenantId_email: { tenantId: tenant.id, email: 'admin@hospitalteste.com' },
    },
    update: {},
    create: {
      email: 'admin@hospitalteste.com',
      password: hashedPassword,
      name: 'Administrador',
      role: 'ADMIN',
      tenantId: tenant.id,
    },
  });

  const oncologist = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: 'oncologista@hospitalteste.com',
      },
    },
    update: {},
    create: {
      email: 'oncologista@hospitalteste.com',
      password: hashedPassword,
      name: 'Dr. João Silva',
      role: 'ONCOLOGIST',
      tenantId: tenant.id,
    },
  });

  const nurse = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: 'enfermeira@hospitalteste.com',
      },
    },
    update: {},
    create: {
      email: 'enfermeira@hospitalteste.com',
      password: hashedPassword,
      name: 'Maria Santos',
      role: 'NURSE',
      tenantId: tenant.id,
    },
  });

  const coordinator = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: 'coordenador@hospitalteste.com',
      },
    },
    update: {},
    create: {
      email: 'coordenador@hospitalteste.com',
      password: hashedPassword,
      name: 'Carlos Oliveira',
      role: 'COORDINATOR',
      tenantId: tenant.id,
    },
  });

  console.log('✅ Usuários criados:');
  console.log('  - Admin:', admin.email);
  console.log('  - Oncologista:', oncologist.email);
  console.log('  - Enfermeira:', nurse.email);
  console.log('  - Coordenador:', coordinator.email);

  // ─── Limpar dados dependentes antes de recriar ─────────────────────────────
  console.log('🧹 Limpando dados existentes...');
  await prisma.agentDecisionLog.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.intervention.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.internalNote.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.observation.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.message.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.conversation.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.priorityScore.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.alert.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.treatment.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.navigationStep.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.cancerDiagnosis.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.patientJourney.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.patient.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.whatsAppConnection.deleteMany({ where: { tenantId: tenant.id } });
  console.log('✅ Dados anteriores removidos');

  // ─── Datas de referência ───────────────────────────────────────────────────
  const now = new Date();
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600000);
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000);
  const daysFromNow = (d: number) => new Date(now.getTime() + d * 86400000);

  // Helper para criar datas SEMPRE dentro do dia civil atual (não cruza meia-noite).
  // Usado para dados que alimentam indicadores "hoje" do dashboard da enfermeira.
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayAt = (h: number, m = 0) =>
    new Date(todayStart.getTime() + h * 3600000 + m * 60000);

  // ═══════════════════════════════════════════════════════════════════════════
  // PoC 2.1 — PACIENTES (8 pacientes fictícios com perfis variados)
  // PoC 2.3 — PRIORIZAÇÃO: priorityScore, priorityCategory, priorityReason,
  //           priorityUpdatedAt e lastInteraction em todos os pacientes
  // ═══════════════════════════════════════════════════════════════════════════

  const patientDefs = [
    {
      key: 'ana',
      name: 'Ana Oliveira',
      cancerType: 'breast',
      gender: 'female',
      stage: 'IIA',
      currentStage: 'TREATMENT' as const,
      priorityScore: 75,
      priorityCategory: 'HIGH' as const,
      priorityReason:
        'Náusea grau 7/10 pós-quimioterapia – monitorar hidratação',
      status: 'IN_TREATMENT' as const,
      birthDate: new Date(1978, 3, 12),
      lastInteraction: hoursAgo(2),
      phone: '+5511999999999',
      email: 'paciente1@email.com',
    },
    {
      key: 'roberto',
      name: 'Roberto Ferreira',
      cancerType: 'lung',
      gender: 'male',
      stage: null,
      currentStage: 'DIAGNOSIS' as const,
      priorityScore: 65,
      priorityCategory: 'HIGH' as const,
      priorityReason:
        'Aguardando resultado de tomografia – fase diagnóstica ativa',
      status: 'ACTIVE' as const,
      birthDate: new Date(1965, 8, 22),
      lastInteraction: hoursAgo(6),
      phone: '+5511999999998',
      email: 'paciente2@email.com',
    },
    {
      key: 'marcos',
      name: 'Marcos Pereira',
      cancerType: 'colorectal',
      gender: 'male',
      stage: 'IIIA',
      currentStage: 'TREATMENT' as const,
      priorityScore: 90,
      priorityCategory: 'CRITICAL' as const,
      priorityReason:
        'Febre 38.5°C + dor abdominal 8/10 durante quimioterapia – risco neutropenia febril',
      status: 'IN_TREATMENT' as const,
      birthDate: new Date(1958, 1, 5),
      lastInteraction: hoursAgo(1),
      phone: '+5511999999997',
      email: 'paciente3@email.com',
    },
    {
      key: 'jose',
      name: 'José Santos',
      cancerType: 'prostate',
      gender: 'male',
      stage: 'II',
      currentStage: 'FOLLOW_UP' as const,
      priorityScore: 30,
      priorityCategory: 'LOW' as const,
      priorityReason: 'Seguimento pós-cirúrgico – sem sintomas novos',
      status: 'FOLLOW_UP' as const,
      birthDate: new Date(1952, 11, 18),
      lastInteraction: hoursAgo(48),
      phone: '+5511999999996',
      email: 'paciente4@email.com',
    },
    {
      key: 'paulo',
      name: 'Paulo Mendes',
      cancerType: 'kidney',
      gender: 'male',
      stage: null,
      currentStage: 'SCREENING' as const,
      priorityScore: 45,
      priorityCategory: 'MEDIUM' as const,
      priorityReason: 'Sem resposta há 8 dias – necessita contato ativo',
      status: 'ACTIVE' as const,
      birthDate: new Date(1970, 6, 30),
      // PoC: paciente sem interação há vários dias → alerta NO_RESPONSE
      lastInteraction: daysAgo(8),
      phone: '+5511999999995',
      email: 'paciente5@email.com',
    },
    {
      key: 'fernando',
      name: 'Fernando Lima',
      cancerType: 'bladder',
      gender: 'male',
      stage: 'III',
      currentStage: 'TREATMENT' as const,
      priorityScore: 70,
      priorityCategory: 'HIGH' as const,
      priorityReason: 'Disúria e hematúria leve pós-tratamento – monitorar',
      status: 'IN_TREATMENT' as const,
      birthDate: new Date(1962, 4, 8),
      lastInteraction: hoursAgo(12),
      phone: '+5511999999994',
      email: 'paciente6@email.com',
    },
    {
      key: 'lucas',
      name: 'Lucas Almeida',
      cancerType: 'testicular',
      gender: 'male',
      stage: 'I',
      currentStage: 'TREATMENT' as const,
      priorityScore: 55,
      priorityCategory: 'MEDIUM' as const,
      priorityReason: 'Em quimioterapia ciclo 2/4 – acompanhamento de rotina',
      status: 'IN_TREATMENT' as const,
      birthDate: new Date(1990, 9, 14),
      lastInteraction: hoursAgo(24),
      phone: '+5511999999993',
      email: 'paciente7@email.com',
    },
    {
      key: 'antonio',
      name: 'Antônio Ribeiro',
      cancerType: 'lung',
      gender: 'male',
      stage: 'IV',
      currentStage: 'FOLLOW_UP' as const,
      priorityScore: 85,
      priorityCategory: 'CRITICAL' as const,
      priorityReason:
        'Dor não controlada 9/10 em paliativo – necessita ajuste analgésico urgente',
      status: 'PALLIATIVE_CARE' as const,
      birthDate: new Date(1955, 5, 15),
      lastInteraction: hoursAgo(3),
      phone: '+5511999999992',
      email: 'paciente.paliativo@email.com',
    },
  ];

  // Criar pacientes
  const patientMap: Record<
    string,
    { id: string; cancerType: string; currentStage: string; name: string }
  > = {};

  for (const def of patientDefs) {
    const patient = await prisma.patient.create({
      data: {
        tenantId: tenant.id,
        name: def.name,
        birthDate: def.birthDate,
        gender: def.gender,
        phone: def.phone,
        email: def.email,
        cancerType: def.cancerType,
        stage: def.stage,
        currentStage: def.currentStage,
        priorityScore: def.priorityScore,
        priorityCategory: def.priorityCategory,
        priorityReason: def.priorityReason,
        priorityUpdatedAt: hoursAgo(1),
        status: def.status,
        lastInteraction: def.lastInteraction,
      },
    });
    patientMap[def.key] = {
      id: patient.id,
      cancerType: def.cancerType,
      currentStage: def.currentStage,
      name: patient.name,
    };
  }

  counts.patients = patientDefs.length;
  console.log(`✅ Pacientes criados: ${counts.patients}`);
  for (const def of patientDefs) {
    console.log(
      `  ${def.name} (${def.cancerType} - ${def.currentStage}) score=${def.priorityScore}`,
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PatientJourney para cada paciente
  // ═══════════════════════════════════════════════════════════════════════════

  const journeyMap: Record<string, string> = {};

  for (const def of patientDefs) {
    const p = patientMap[def.key];
    const journeyData: any = {
      tenantId: tenant.id,
      patientId: p.id,
    };

    if (def.key === 'antonio') {
      // Paliativo
      journeyData.screeningDate = new Date('2023-06-01');
      journeyData.screeningResult = 'Rastreio positivo - lung';
      journeyData.diagnosisDate = new Date('2023-07-15');
      journeyData.diagnosisConfirmed = true;
      journeyData.stagingDate = new Date('2023-08-01');
      journeyData.treatmentStartDate = new Date('2023-09-01');
      journeyData.treatmentType = 'CHEMOTHERAPY';
      journeyData.treatmentProtocol = 'Protocolo paliativo - lung';
      journeyData.lastFollowUpDate = daysAgo(30);
      journeyData.nextFollowUpDate = daysFromNow(15);
      journeyData.currentStep = 'Cuidados paliativos - controle de sintomas';
      journeyData.nextStep = 'Avaliação de qualidade de vida';
      journeyData.blockers = [];
    } else if (p.currentStage === 'SCREENING') {
      journeyData.screeningDate = daysAgo(10);
      journeyData.screeningResult = `Rastreio agendado - ${p.cancerType}`;
    } else if (p.currentStage === 'DIAGNOSIS') {
      journeyData.screeningDate = daysAgo(30);
      journeyData.screeningResult = `Achado suspeito - ${p.cancerType}`;
      journeyData.diagnosisDate = daysAgo(10);
      journeyData.diagnosisConfirmed = true;
    } else if (p.currentStage === 'TREATMENT') {
      journeyData.screeningDate = daysAgo(120);
      journeyData.screeningResult = `Rastreio positivo - ${p.cancerType}`;
      journeyData.diagnosisDate = daysAgo(100);
      journeyData.diagnosisConfirmed = true;
      journeyData.stagingDate = daysAgo(90);
      journeyData.treatmentStartDate = daysAgo(60);
      journeyData.treatmentType = 'CHEMOTHERAPY';
      journeyData.treatmentProtocol = `Protocolo padrão - ${p.cancerType}`;
      journeyData.currentCycle = 3;
      journeyData.totalCycles = 8;
      journeyData.nextFollowUpDate = daysFromNow(7);
    } else if (p.currentStage === 'FOLLOW_UP') {
      journeyData.screeningDate = daysAgo(365);
      journeyData.screeningResult = `Rastreio inicial - ${p.cancerType}`;
      journeyData.diagnosisDate = daysAgo(330);
      journeyData.diagnosisConfirmed = true;
      journeyData.stagingDate = daysAgo(320);
      journeyData.treatmentStartDate = daysAgo(300);
      journeyData.treatmentType = 'SURGERY';
      journeyData.treatmentProtocol = `Tratamento cirúrgico - ${p.cancerType}`;
      journeyData.lastFollowUpDate = daysAgo(30);
      journeyData.nextFollowUpDate = daysFromNow(60);
    }

    const journey = await prisma.patientJourney.create({ data: journeyData });
    journeyMap[def.key] = journey.id;
  }

  console.log(`✅ PatientJourney criado para ${patientDefs.length} pacientes`);

  // ═══════════════════════════════════════════════════════════════════════════
  // PoC 2.5 — CancerDiagnosis + Treatment (pacientes em TREATMENT / FOLLOW_UP)
  // ═══════════════════════════════════════════════════════════════════════════

  const diagnosisMap: Record<string, string> = {};

  // Ana Oliveira — Câncer de mama IIA
  const anaDiagnosis = await prisma.cancerDiagnosis.create({
    data: {
      tenantId: tenant.id,
      patientId: patientMap.ana.id,
      cancerType: 'Câncer de Mama',
      icd10Code: 'C50.9',
      stage: 'IIA',
      tStage: 'T2',
      nStage: 'N0',
      mStage: 'M0',
      grade: 'G2',
      histologicalType: 'Carcinoma ductal invasivo',
      diagnosisDate: daysAgo(100),
      diagnosisConfirmed: true,
      stagingDate: daysAgo(90),
      her2Status: 'negativo',
      erStatus: 'positivo',
      prStatus: 'positivo',
      ki67Percentage: 15,
      isPrimary: true,
      isActive: true,
    },
  });
  diagnosisMap['ana'] = anaDiagnosis.id;
  counts.cancerDiagnoses++;

  // Marcos Pereira — Câncer colorretal IIIA
  const marcosDiagnosis = await prisma.cancerDiagnosis.create({
    data: {
      tenantId: tenant.id,
      patientId: patientMap.marcos.id,
      cancerType: 'Câncer Colorretal',
      icd10Code: 'C18.9',
      stage: 'IIIA',
      tStage: 'T3',
      nStage: 'N1',
      mStage: 'M0',
      grade: 'G2',
      histologicalType: 'Adenocarcinoma',
      diagnosisDate: daysAgo(100),
      diagnosisConfirmed: true,
      stagingDate: daysAgo(90),
      krasMutation: 'wild-type',
      msiStatus: 'MSS',
      ceaBaseline: 12.5,
      isPrimary: true,
      isActive: true,
    },
  });
  diagnosisMap['marcos'] = marcosDiagnosis.id;
  counts.cancerDiagnoses++;

  // Fernando Lima — Câncer de bexiga III
  const fernandoDiagnosis = await prisma.cancerDiagnosis.create({
    data: {
      tenantId: tenant.id,
      patientId: patientMap.fernando.id,
      cancerType: 'Câncer de Bexiga',
      icd10Code: 'C67.9',
      stage: 'III',
      tStage: 'T3',
      nStage: 'N0',
      mStage: 'M0',
      grade: 'G3',
      histologicalType: 'Carcinoma urotelial',
      diagnosisDate: daysAgo(100),
      diagnosisConfirmed: true,
      stagingDate: daysAgo(90),
      isPrimary: true,
      isActive: true,
    },
  });
  diagnosisMap['fernando'] = fernandoDiagnosis.id;
  counts.cancerDiagnoses++;

  // Lucas Almeida — Câncer testicular I
  const lucasDiagnosis = await prisma.cancerDiagnosis.create({
    data: {
      tenantId: tenant.id,
      patientId: patientMap.lucas.id,
      cancerType: 'Câncer Testicular',
      icd10Code: 'C62.9',
      stage: 'I',
      tStage: 'T1',
      nStage: 'N0',
      mStage: 'M0',
      histologicalType: 'Seminoma',
      diagnosisDate: daysAgo(90),
      diagnosisConfirmed: true,
      stagingDate: daysAgo(80),
      afpBaseline: 2.1,
      hcgBaseline: 0.5,
      isPrimary: true,
      isActive: true,
    },
  });
  diagnosisMap['lucas'] = lucasDiagnosis.id;
  counts.cancerDiagnoses++;

  // José Santos — Câncer de próstata II (follow-up)
  const joseDiagnosis = await prisma.cancerDiagnosis.create({
    data: {
      tenantId: tenant.id,
      patientId: patientMap.jose.id,
      cancerType: 'Câncer de Próstata',
      icd10Code: 'C61',
      stage: 'II',
      tStage: 'T2',
      nStage: 'N0',
      mStage: 'M0',
      grade: 'G2',
      histologicalType: 'Adenocarcinoma acinar',
      diagnosisDate: daysAgo(330),
      diagnosisConfirmed: true,
      stagingDate: daysAgo(320),
      psaBaseline: 8.2,
      gleasonScore: '3+4=7',
      isPrimary: true,
      isActive: true,
    },
  });
  diagnosisMap['jose'] = joseDiagnosis.id;
  counts.cancerDiagnoses++;

  // Antônio Ribeiro — Câncer de pulmão IV (paliativo)
  const antonioDiagnosis = await prisma.cancerDiagnosis.create({
    data: {
      tenantId: tenant.id,
      patientId: patientMap.antonio.id,
      cancerType: 'Câncer de Pulmão',
      icd10Code: 'C34.9',
      stage: 'IV',
      tStage: 'T4',
      nStage: 'N2',
      mStage: 'M1',
      grade: 'G3',
      histologicalType: 'Adenocarcinoma',
      diagnosisDate: daysAgo(600),
      diagnosisConfirmed: true,
      stagingDate: daysAgo(590),
      egfrMutation: 'wild-type',
      alkRearrangement: 'negativo',
      pdl1Expression: 5,
      isPrimary: true,
      isActive: true,
    },
  });
  diagnosisMap['antonio'] = antonioDiagnosis.id;
  counts.cancerDiagnoses++;

  console.log(`✅ CancerDiagnosis criados: ${counts.cancerDiagnoses}`);

  // ─── Treatments ────────────────────────────────────────────────────────────

  // Ana — Quimioterapia AC-T (mama)
  await prisma.treatment.create({
    data: {
      tenantId: tenant.id,
      patientId: patientMap.ana.id,
      diagnosisId: diagnosisMap['ana'],
      treatmentType: 'CHEMOTHERAPY',
      treatmentName: 'AC-T',
      protocol: 'Doxorrubicina + Ciclofosfamida → Paclitaxel',
      line: 1,
      intent: 'ADJUVANT',
      startDate: daysAgo(60),
      plannedEndDate: daysFromNow(90),
      lastApplicationDate: daysAgo(7),
      currentCycle: 3,
      totalCycles: 8,
      cyclesCompleted: 2,
      status: 'ACTIVE',
      isActive: true,
      frequency: 'A cada 21 dias',
      administrationRoute: 'IV',
      institutionName: 'Hospital de Teste',
      physicianName: 'Dr. João Silva',
    },
  });
  counts.treatments++;

  // Marcos — FOLFOX (colorretal)
  await prisma.treatment.create({
    data: {
      tenantId: tenant.id,
      patientId: patientMap.marcos.id,
      diagnosisId: diagnosisMap['marcos'],
      treatmentType: 'CHEMOTHERAPY',
      treatmentName: 'FOLFOX',
      protocol: '5-Fluorouracil + Leucovorina + Oxaliplatina',
      line: 1,
      intent: 'ADJUVANT',
      startDate: daysAgo(60),
      plannedEndDate: daysFromNow(120),
      lastApplicationDate: daysAgo(10),
      currentCycle: 4,
      totalCycles: 12,
      cyclesCompleted: 3,
      status: 'ACTIVE',
      isActive: true,
      frequency: 'A cada 14 dias',
      administrationRoute: 'IV',
      institutionName: 'Hospital de Teste',
      physicianName: 'Dr. João Silva',
    },
  });
  counts.treatments++;

  // Fernando — Cisplatina + Gencitabina (bexiga)
  await prisma.treatment.create({
    data: {
      tenantId: tenant.id,
      patientId: patientMap.fernando.id,
      diagnosisId: diagnosisMap['fernando'],
      treatmentType: 'CHEMOTHERAPY',
      treatmentName: 'GC',
      protocol: 'Gencitabina + Cisplatina',
      line: 1,
      intent: 'NEOADJUVANT',
      startDate: daysAgo(45),
      plannedEndDate: daysFromNow(45),
      lastApplicationDate: daysAgo(5),
      currentCycle: 3,
      totalCycles: 6,
      cyclesCompleted: 2,
      status: 'ACTIVE',
      isActive: true,
      frequency: 'A cada 21 dias',
      administrationRoute: 'IV',
      institutionName: 'Hospital de Teste',
      physicianName: 'Dr. João Silva',
    },
  });
  counts.treatments++;

  // Lucas — BEP (testicular)
  await prisma.treatment.create({
    data: {
      tenantId: tenant.id,
      patientId: patientMap.lucas.id,
      diagnosisId: diagnosisMap['lucas'],
      treatmentType: 'CHEMOTHERAPY',
      treatmentName: 'BEP',
      protocol: 'Bleomicina + Etoposídeo + Cisplatina',
      line: 1,
      intent: 'ADJUVANT',
      startDate: daysAgo(42),
      plannedEndDate: daysFromNow(42),
      lastApplicationDate: daysAgo(14),
      currentCycle: 2,
      totalCycles: 4,
      cyclesCompleted: 1,
      status: 'ACTIVE',
      isActive: true,
      frequency: 'A cada 21 dias',
      administrationRoute: 'IV',
      institutionName: 'Hospital de Teste',
      physicianName: 'Dr. João Silva',
    },
  });
  counts.treatments++;

  // José — Prostatectomia (completa)
  await prisma.treatment.create({
    data: {
      tenantId: tenant.id,
      patientId: patientMap.jose.id,
      diagnosisId: diagnosisMap['jose'],
      treatmentType: 'SURGERY',
      treatmentName: 'Prostatectomia radical',
      protocol: 'Prostatectomia radical laparoscópica',
      line: 1,
      intent: 'CURATIVE',
      startDate: daysAgo(300),
      actualEndDate: daysAgo(300),
      status: 'COMPLETED',
      isActive: false,
      institutionName: 'Hospital de Teste',
      physicianName: 'Dr. João Silva',
      response: 'COMPLETE_RESPONSE',
      responseDate: daysAgo(270),
      responseNotes: 'PSA indetectável pós-cirúrgico',
    },
  });
  counts.treatments++;

  // Antônio — Quimioterapia paliativa (pulmão)
  await prisma.treatment.create({
    data: {
      tenantId: tenant.id,
      patientId: patientMap.antonio.id,
      diagnosisId: diagnosisMap['antonio'],
      treatmentType: 'CHEMOTHERAPY',
      treatmentName: 'Carboplatina + Pemetrexede',
      protocol: 'Carboplatina AUC5 + Pemetrexede 500mg/m²',
      line: 2,
      intent: 'PALLIATIVE',
      startDate: daysAgo(180),
      lastApplicationDate: daysAgo(30),
      currentCycle: 6,
      totalCycles: null,
      cyclesCompleted: 5,
      status: 'ACTIVE',
      isActive: true,
      frequency: 'A cada 21 dias',
      administrationRoute: 'IV',
      institutionName: 'Hospital de Teste',
      physicianName: 'Dr. João Silva',
      response: 'STABLE_DISEASE',
      responseDate: daysAgo(60),
    },
  });
  counts.treatments++;

  console.log(`✅ Treatments criados: ${counts.treatments}`);

  // ═══════════════════════════════════════════════════════════════════════════
  // PoC 2.4 — NavigationStep (etapas de navegação oncológica)
  // Jornada colorretal como principal + etapas para outros tipos
  // ═══════════════════════════════════════════════════════════════════════════

  // Marcos (colorretal) — jornada completa com etapas variadas
  // Dashboard: createdAt em etapas DIAGNOSIS deve ser anterior a diagnosisDate para time-to-diagnosis
  const marcosSteps = [
    {
      journeyStage: 'SCREENING' as const,
      stepKey: 'colonoscopy',
      stepName: 'Colonoscopia',
      status: 'COMPLETED' as const,
      isCompleted: true,
      completedAt: daysAgo(110),
      expectedDate: daysAgo(115),
      dueDate: daysAgo(110),
      result: 'Lesão polipóide em cólon sigmóide',
      createdAt: daysAgo(120),
    },
    {
      journeyStage: 'DIAGNOSIS' as const,
      stepKey: 'biopsy',
      stepName: 'Biópsia',
      status: 'COMPLETED' as const,
      isCompleted: true,
      completedAt: daysAgo(105),
      expectedDate: daysAgo(108),
      dueDate: daysAgo(100),
      result: 'Adenocarcinoma moderadamente diferenciado',
      createdAt: daysAgo(110), // antes de diagnosisDate (daysAgo(100))
    },
    {
      journeyStage: 'DIAGNOSIS' as const,
      stepKey: 'staging_ct',
      stepName: 'TC de estadiamento',
      status: 'COMPLETED' as const,
      isCompleted: true,
      completedAt: daysAgo(95),
      expectedDate: daysAgo(98),
      dueDate: daysAgo(90),
      result: 'T3N1M0 – sem metástases à distância',
      createdAt: daysAgo(100),
    },
    {
      journeyStage: 'TREATMENT' as const,
      stepKey: 'chemo_start',
      stepName: 'Início da quimioterapia (FOLFOX)',
      status: 'COMPLETED' as const,
      isCompleted: true,
      completedAt: daysAgo(60),
      expectedDate: daysAgo(65),
      dueDate: daysAgo(55),
      result: 'Ciclo 1 administrado sem intercorrências',
    },
    {
      journeyStage: 'TREATMENT' as const,
      stepKey: 'chemo_cycle4',
      stepName: 'Quimioterapia – Ciclo 4',
      status: 'IN_PROGRESS' as const,
      isCompleted: false,
      expectedDate: daysAgo(2),
      dueDate: daysFromNow(5),
    },
    {
      journeyStage: 'TREATMENT' as const,
      stepKey: 'surgery',
      stepName: 'Cirurgia (Colectomia)',
      status: 'PENDING' as const,
      isCompleted: false,
      expectedDate: daysFromNow(60),
      dueDate: daysFromNow(75),
    },
  ];

  for (const step of marcosSteps) {
    await prisma.navigationStep.create({
      data: {
        tenantId: tenant.id,
        patientId: patientMap.marcos.id,
        journeyId: journeyMap['marcos'],
        diagnosisId: diagnosisMap['marcos'],
        cancerType: 'colorectal',
        journeyStage: step.journeyStage,
        stepKey: step.stepKey,
        stepName: step.stepName,
        status: step.status,
        isCompleted: step.isCompleted,
        completedAt: step.completedAt,
        expectedDate: step.expectedDate,
        dueDate: step.dueDate,
        result: step.result,
        ...((step as any).createdAt && { createdAt: (step as any).createdAt }),
      },
    });
    counts.navigationSteps++;
  }

  // Ana (mama) — etapas de tratamento
  // Dashboard: createdAt em etapas DIAGNOSIS anterior a diagnosisDate para time-to-diagnosis
  const anaSteps = [
    {
      journeyStage: 'DIAGNOSIS' as const,
      stepKey: 'mammography',
      stepName: 'Mamografia diagnóstica',
      status: 'COMPLETED' as const,
      isCompleted: true,
      completedAt: daysAgo(115),
      expectedDate: daysAgo(120),
      dueDate: daysAgo(110),
      result: 'BIRADS 5 – altamente suspeito',
      createdAt: daysAgo(125), // antes de diagnosisDate (daysAgo(100))
    },
    {
      journeyStage: 'DIAGNOSIS' as const,
      stepKey: 'core_biopsy',
      stepName: 'Core biópsia',
      status: 'COMPLETED' as const,
      isCompleted: true,
      completedAt: daysAgo(105),
      expectedDate: daysAgo(108),
      dueDate: daysAgo(100),
      result: 'Carcinoma ductal invasivo – RE+/RP+/HER2-',
      createdAt: daysAgo(112),
    },
    {
      journeyStage: 'TREATMENT' as const,
      stepKey: 'chemo_ac',
      stepName: 'Quimioterapia AC – Fase 1',
      status: 'IN_PROGRESS' as const,
      isCompleted: false,
      expectedDate: daysAgo(60),
      dueDate: daysFromNow(30),
    },
    {
      journeyStage: 'TREATMENT' as const,
      stepKey: 'surgery_mastectomy',
      stepName: 'Mastectomia parcial',
      status: 'PENDING' as const,
      isCompleted: false,
      expectedDate: daysFromNow(90),
      dueDate: daysFromNow(105),
    },
  ];

  for (const step of anaSteps) {
    await prisma.navigationStep.create({
      data: {
        tenantId: tenant.id,
        patientId: patientMap.ana.id,
        journeyId: journeyMap['ana'],
        diagnosisId: diagnosisMap['ana'],
        cancerType: 'breast',
        journeyStage: step.journeyStage,
        stepKey: step.stepKey,
        stepName: step.stepName,
        status: step.status,
        isCompleted: step.isCompleted,
        completedAt: step.completedAt,
        expectedDate: step.expectedDate,
        dueDate: step.dueDate,
        result: step.result,
        ...((step as any).createdAt && { createdAt: (step as any).createdAt }),
      },
    });
    counts.navigationSteps++;
  }

  // Fernando (bexiga) — etapa OVERDUE para gerar alerta NAVIGATION_DELAY
  const fernandoSteps = [
    {
      journeyStage: 'DIAGNOSIS' as const,
      stepKey: 'cystoscopy',
      stepName: 'Cistoscopia',
      status: 'COMPLETED' as const,
      isCompleted: true,
      completedAt: daysAgo(110),
      expectedDate: daysAgo(115),
      dueDate: daysAgo(110),
      result: 'Lesão papilífera em parede lateral direita',
      createdAt: daysAgo(118), // antes de diagnosisDate (daysAgo(100))
    },
    {
      journeyStage: 'TREATMENT' as const,
      stepKey: 'chemo_gc',
      stepName: 'Quimioterapia GC – Neoadjuvante',
      status: 'IN_PROGRESS' as const,
      isCompleted: false,
      expectedDate: daysAgo(45),
      dueDate: daysFromNow(45),
    },
    {
      // PoC: Etapa OVERDUE → alerta NAVIGATION_DELAY
      journeyStage: 'TREATMENT' as const,
      stepKey: 'imaging_restaging',
      stepName: 'TC de reestadiamento',
      status: 'OVERDUE' as const,
      isCompleted: false,
      expectedDate: daysAgo(7),
      dueDate: daysAgo(3),
      notes: 'Exame atrasado – paciente precisa reagendar',
    },
  ];

  for (const step of fernandoSteps) {
    await prisma.navigationStep.create({
      data: {
        tenantId: tenant.id,
        patientId: patientMap.fernando.id,
        journeyId: journeyMap['fernando'],
        diagnosisId: diagnosisMap['fernando'],
        cancerType: 'bladder',
        journeyStage: step.journeyStage,
        stepKey: step.stepKey,
        stepName: step.stepName,
        status: step.status,
        isCompleted: step.isCompleted,
        completedAt: step.completedAt,
        expectedDate: step.expectedDate,
        dueDate: step.dueDate,
        result: step.result,
        notes: step.notes,
        ...((step as any).createdAt && { createdAt: (step as any).createdAt }),
      },
    });
    counts.navigationSteps++;
  }

  // José (próstata) — follow-up
  const joseSteps = [
    {
      journeyStage: 'TREATMENT' as const,
      stepKey: 'prostatectomy',
      stepName: 'Prostatectomia radical',
      status: 'COMPLETED' as const,
      isCompleted: true,
      completedAt: daysAgo(300),
      expectedDate: daysAgo(305),
      dueDate: daysAgo(295),
      result: 'Cirurgia bem sucedida, margens livres',
    },
    {
      journeyStage: 'FOLLOW_UP' as const,
      stepKey: 'psa_followup_1',
      stepName: 'PSA de controle – 3 meses',
      status: 'COMPLETED' as const,
      isCompleted: true,
      completedAt: daysAgo(200),
      expectedDate: daysAgo(210),
      dueDate: daysAgo(195),
      result: 'PSA < 0.01 ng/mL – indetectável',
    },
    {
      journeyStage: 'FOLLOW_UP' as const,
      stepKey: 'psa_followup_2',
      stepName: 'PSA de controle – 6 meses',
      status: 'COMPLETED' as const,
      isCompleted: true,
      completedAt: daysAgo(100),
      expectedDate: daysAgo(120),
      dueDate: daysAgo(90),
      result: 'PSA < 0.01 ng/mL – indetectável',
    },
    {
      journeyStage: 'FOLLOW_UP' as const,
      stepKey: 'psa_followup_3',
      stepName: 'PSA de controle – 12 meses',
      status: 'PENDING' as const,
      isCompleted: false,
      expectedDate: daysFromNow(30),
      dueDate: daysFromNow(45),
    },
  ];

  for (const step of joseSteps) {
    await prisma.navigationStep.create({
      data: {
        tenantId: tenant.id,
        patientId: patientMap.jose.id,
        journeyId: journeyMap['jose'],
        diagnosisId: diagnosisMap['jose'],
        cancerType: 'prostate',
        journeyStage: step.journeyStage,
        stepKey: step.stepKey,
        stepName: step.stepName,
        status: step.status,
        isCompleted: step.isCompleted,
        completedAt: step.completedAt,
        expectedDate: step.expectedDate,
        dueDate: step.dueDate,
        result: step.result,
        ...((step as any).createdAt && { createdAt: (step as any).createdAt }),
      },
    });
    counts.navigationSteps++;
  }

  console.log(`✅ NavigationStep criados: ${counts.navigationSteps}`);

  // ═══════════════════════════════════════════════════════════════════════════
  // PoC 2.2 — CONVERSAS E MENSAGENS (agente WhatsApp)
  // PoC 2.4 — Histórico de conversa no dashboard
  // ═══════════════════════════════════════════════════════════════════════════

  let msgCounter = 1;
  const mkMsgId = () => `wamid.seed${String(msgCounter++).padStart(4, '0')}`;

  // Helper para criar conversa + mensagens, retorna conversation + messages
  async function createConversation(
    patientId: string,
    status: 'ACTIVE' | 'WAITING' | 'ESCALATED' | 'CLOSED',
    handledBy: 'AGENT' | 'NURSING' | 'HYBRID',
    msgs: Array<{
      direction: 'INBOUND' | 'OUTBOUND';
      content: string;
      processedBy: 'AGENT' | 'NURSING';
      minutesOffset: number;
      structuredData?: any;
      criticalSymptomsDetected?: string[];
      alertTriggered?: boolean;
    }>,
    extra?: {
      assumedByUserId?: string;
      assumedAt?: Date;
    },
  ) {
    // Dashboard: usar data recente para que mensagens caiam nos últimos 30 dias
    const baseTime = new Date(now.getTime() - 2 * 3600000); // 2 horas atrás
    const lastMsg = msgs[msgs.length - 1];
    const lastMsgTime = new Date(
      baseTime.getTime() + lastMsg.minutesOffset * 60000,
    );

    const conversation = await prisma.conversation.create({
      data: {
        tenantId: tenant.id,
        patientId,
        channel: 'WHATSAPP',
        status,
        handledBy,
        messageCount: msgs.length,
        lastMessageAt: lastMsgTime,
        assumedByUserId: extra?.assumedByUserId,
        assumedAt: extra?.assumedAt,
      },
    });

    const createdMsgs: Array<{ id: string }> = [];
    for (const msg of msgs) {
      const timestamp = new Date(
        baseTime.getTime() + msg.minutesOffset * 60000,
      );
      const m = await prisma.message.create({
        data: {
          tenantId: tenant.id,
          patientId,
          conversationId: conversation.id,
          whatsappMessageId: mkMsgId(),
          whatsappTimestamp: timestamp,
          type: 'TEXT',
          direction: msg.direction,
          content: msg.content,
          processedBy: msg.processedBy,
          structuredData: msg.structuredData || undefined,
          criticalSymptomsDetected: msg.criticalSymptomsDetected || [],
          alertTriggered: msg.alertTriggered || false,
        },
      });
      createdMsgs.push({ id: m.id });
    }

    counts.conversations++;
    counts.messages += msgs.length;

    return { conversation, messages: createdMsgs };
  }

  // --- Conversa 1: Ana Oliveira (mama/treatment) - Náusea pós-quimio ---
  const anaConv = await createConversation(
    patientMap.ana.id,
    'ACTIVE',
    'AGENT',
    [
      {
        direction: 'INBOUND',
        content: 'Olá, estou sentindo muita náusea hoje após a quimioterapia',
        processedBy: 'AGENT',
        minutesOffset: 0,
      },
      {
        direction: 'OUTBOUND',
        content:
          'Olá Ana! Entendo que você está sentindo náusea. Em uma escala de 0 a 10, como você classificaria a intensidade?',
        processedBy: 'AGENT',
        minutesOffset: 1,
      },
      {
        direction: 'INBOUND',
        content: 'Acho que uns 7, está bem forte',
        processedBy: 'AGENT',
        minutesOffset: 3,
        criticalSymptomsDetected: ['náusea intensa'],
      },
      {
        direction: 'OUTBOUND',
        content:
          'Entendo, uma intensidade 7 é significativa. Você está conseguindo se manter hidratada? E está tomando o antiemético que foi prescrito (ondansetrona)?',
        processedBy: 'AGENT',
        minutesOffset: 4,
        structuredData: {
          symptoms: { nausea: 7 },
          scales: { nausea: 7 },
        },
      },
      {
        direction: 'INBOUND',
        content:
          'Estou tentando tomar água mas é difícil. O remédio eu tomei de manhã sim',
        processedBy: 'AGENT',
        minutesOffset: 6,
      },
      {
        direction: 'OUTBOUND',
        content:
          'É importante manter a hidratação. Tente pequenos goles de água gelada ou chupe gelo. Se a náusea persistir acima de 7 nas próximas horas ou se você não conseguir manter líquidos, procure atendimento. Vou notificar a equipe de enfermagem sobre seu quadro.',
        processedBy: 'AGENT',
        minutesOffset: 7,
      },
    ],
  );

  // --- Conversa 2: Marcos Pereira (colorectal/treatment) - Sintomas críticos ---
  // PoC 2.4: Conversa ESCALATED com handoff para enfermagem
  const marcosConv = await createConversation(
    patientMap.marcos.id,
    'ESCALATED',
    'NURSING',
    [
      {
        direction: 'INBOUND',
        content: 'Boa tarde, estou com febre e muita dor abdominal',
        processedBy: 'AGENT',
        minutesOffset: 60,
      },
      {
        direction: 'OUTBOUND',
        content:
          'Boa tarde Marcos. Febre e dor abdominal durante tratamento de quimioterapia são sintomas que precisam de atenção. Qual sua temperatura? E a dor, de 0 a 10?',
        processedBy: 'AGENT',
        minutesOffset: 61,
      },
      {
        direction: 'INBOUND',
        content: 'Temperatura 38.5 e a dor tá uns 8',
        processedBy: 'AGENT',
        minutesOffset: 63,
        criticalSymptomsDetected: ['febre neutropênica', 'dor abdominal intensa'],
      },
      {
        direction: 'OUTBOUND',
        content:
          'Marcos, febre de 38.5°C durante quimioterapia é um sinal de alerta importante que pode indicar neutropenia febril. Vou encaminhar seu caso imediatamente para a equipe de enfermagem. Por favor, NÃO tome medicamentos por conta própria e fique atento a qualquer piora.',
        processedBy: 'AGENT',
        minutesOffset: 64,
        structuredData: {
          symptoms: { febre: 8, dor_abdominal: 8 },
          scales: { pain: 8, fever: 38.5 },
        },
        criticalSymptomsDetected: ['febre neutropênica', 'dor abdominal'],
        alertTriggered: true,
      },
      {
        // PoC: Enfermeira responde após assumir a conversa
        direction: 'OUTBOUND',
        content:
          'Marcos, aqui é a enfermeira Maria. Recebi o alerta sobre seus sintomas. Febre 38.5°C com quimioterapia recente é urgente. Você precisa ir ao pronto-socorro AGORA. Leve este resumo: paciente em FOLFOX ciclo 4, D+10, febre 38.5°C + dor abdominal 8/10. Vou avisar o Dr. João.',
        processedBy: 'NURSING',
        minutesOffset: 70,
      },
      {
        direction: 'INBOUND',
        content: 'Tá bom enfermeira, minha esposa vai me levar agora. Obrigado',
        processedBy: 'NURSING',
        minutesOffset: 73,
      },
    ],
    {
      assumedByUserId: nurse.id,
      assumedAt: hoursAgo(1.5),
    },
  );

  // --- Conversa 3: Roberto Ferreira (pulmão/diagnosis) - Dúvidas sobre exames ---
  const robertoConv = await createConversation(
    patientMap.roberto.id,
    'ACTIVE',
    'AGENT',
    [
      {
        direction: 'INBOUND',
        content:
          'Bom dia, tenho exame de tomografia marcado para semana que vem. Preciso de algum preparo?',
        processedBy: 'AGENT',
        minutesOffset: 120,
      },
      {
        direction: 'OUTBOUND',
        content:
          'Bom dia Roberto! Sim, para a tomografia com contraste você precisa: 1) Jejum de 4 horas antes do exame; 2) Trazer exames de creatinina recentes; 3) Informar se tem alergia a contraste iodado. Você tem alguma dessas condições?',
        processedBy: 'AGENT',
        minutesOffset: 121,
      },
      {
        direction: 'INBOUND',
        content:
          'Não tenho alergia não. Mas estou ansioso com o resultado, pode demorar muito?',
        processedBy: 'AGENT',
        minutesOffset: 124,
      },
      {
        direction: 'OUTBOUND',
        content:
          'Entendo sua ansiedade, é completamente normal nessa fase. O resultado geralmente fica pronto em 3 a 5 dias úteis. O Dr. João irá analisar as imagens e agendar uma consulta para discutir os resultados com você. Qualquer dúvida, estou aqui.',
        processedBy: 'AGENT',
        minutesOffset: 125,
      },
    ],
  );

  // --- Conversa 4: José Santos (prostate/follow_up) - Acompanhamento ---
  const joseConv = await createConversation(
    patientMap.jose.id,
    'ACTIVE',
    'AGENT',
    [
      {
        direction: 'INBOUND',
        content: 'Olá, fiz o PSA semana passada e queria saber o resultado',
        processedBy: 'AGENT',
        minutesOffset: 180,
      },
      {
        direction: 'OUTBOUND',
        content:
          'Olá José! Verifiquei nos seus registros e o resultado do PSA ainda não foi inserido no sistema. Vou solicitar à equipe que verifique. Enquanto isso, como você está se sentindo? Algum sintoma novo?',
        processedBy: 'AGENT',
        minutesOffset: 181,
      },
      {
        direction: 'INBOUND',
        content:
          'Estou bem, sem sintomas novos. Só um pouco de cansaço mas acho que é da idade mesmo rs',
        processedBy: 'AGENT',
        minutesOffset: 184,
      },
      {
        direction: 'OUTBOUND',
        content:
          'Que bom que está se sentindo bem! O cansaço pode ter várias causas, mas vamos ficar de olho. Assim que o resultado do PSA estiver disponível, entraremos em contato. Lembre-se de manter a hidratação e as atividades físicas leves. Cuide-se!',
        processedBy: 'AGENT',
        minutesOffset: 185,
      },
    ],
  );

  // --- Conversa 5: Fernando Lima (bladder/treatment) - Efeitos colaterais ---
  const fernandoConv = await createConversation(
    patientMap.fernando.id,
    'ACTIVE',
    'AGENT',
    [
      {
        direction: 'INBOUND',
        content:
          'Estou com ardência para urinar e um pouco de sangue na urina. É normal?',
        processedBy: 'AGENT',
        minutesOffset: 240,
        criticalSymptomsDetected: ['hematúria', 'disúria'],
      },
      {
        direction: 'OUTBOUND',
        content:
          'Fernando, ardência ao urinar e hematúria (sangue na urina) podem ocorrer durante o tratamento de câncer de bexiga, mas precisamos avaliar. Desde quando começou? E a quantidade de sangue - é muito visível ou apenas um tom rosado?',
        processedBy: 'AGENT',
        minutesOffset: 241,
      },
      {
        direction: 'INBOUND',
        content:
          'Começou ontem. A urina tá meio rosada, não chega a ser vermelho forte',
        processedBy: 'AGENT',
        minutesOffset: 244,
      },
      {
        direction: 'OUTBOUND',
        content:
          'Entendi. Urina rosada pode ser um efeito esperado pós-tratamento, mas vamos monitorar. Mantenha boa hidratação (pelo menos 2 litros de água por dia). Se a cor ficar mais intensa, aparecer coágulos, ou surgir febre, entre em contato imediatamente. Vou registrar isso no seu prontuário.',
        processedBy: 'AGENT',
        minutesOffset: 245,
        structuredData: {
          symptoms: { disuria: 5, hematuria: 4 },
        },
      },
    ],
  );

  // --- Conversa 6: Antônio Ribeiro (paliativo) - Controle de dor ---
  // PoC 2.4: Conversa com handoff para enfermagem (WAITING → NURSING)
  const antonioConv = await createConversation(
    patientMap.antonio.id,
    'WAITING',
    'NURSING',
    [
      {
        direction: 'INBOUND',
        content:
          'Boa noite, a dor está muito forte hoje, o medicamento não está fazendo efeito',
        processedBy: 'AGENT',
        minutesOffset: 300,
      },
      {
        direction: 'OUTBOUND',
        content:
          'Boa noite Antônio. Sinto muito que a dor esteja forte. Em uma escala de 0 a 10, como está a dor agora? E onde é a dor principal?',
        processedBy: 'AGENT',
        minutesOffset: 301,
      },
      {
        direction: 'INBOUND',
        content: 'Dor 9, nas costas e no peito. Não consigo dormir',
        processedBy: 'AGENT',
        minutesOffset: 303,
        criticalSymptomsDetected: ['dor intensa não controlada', 'insônia'],
      },
      {
        direction: 'OUTBOUND',
        content:
          'Antônio, dor 9/10 é muito intensa e precisa de ajuste na medicação. Vou encaminhar imediatamente para a equipe de enfermagem para ajuste do esquema analgésico. Enquanto isso, tente encontrar a posição mais confortável possível.',
        processedBy: 'AGENT',
        minutesOffset: 304,
        structuredData: {
          symptoms: { dor: 9, insonia: 8 },
          scales: { pain: 9, sleep: 8 },
        },
        criticalSymptomsDetected: ['dor intensa não controlada'],
        alertTriggered: true,
      },
      {
        direction: 'OUTBOUND',
        content:
          'Antônio, aqui é a enfermeira Maria. Já vi seu caso. Vou ligar para o Dr. João para ajustar sua medicação. Você tem alguém aí com você?',
        processedBy: 'NURSING',
        minutesOffset: 310,
      },
      {
        direction: 'INBOUND',
        content: 'Sim, minha filha está aqui comigo. Obrigado por responder rápido.',
        processedBy: 'NURSING',
        minutesOffset: 313,
      },
      {
        direction: 'OUTBOUND',
        content:
          'Que bom que tem alguém com você. O Dr. João autorizou aumentar a dose da morfina de 10mg para 15mg a cada 4 horas. Se a dor não melhorar em 1 hora, me avise que encaminhamos para o PS. Fique tranquilo.',
        processedBy: 'NURSING',
        minutesOffset: 325,
      },
    ],
    {
      assumedByUserId: nurse.id,
      assumedAt: hoursAgo(2.5),
    },
  );

  // --- Conversa 7: Paulo Mendes (kidney/screening) - Sem resposta há dias ---
  // PoC: Paciente que parou de responder → gera alerta NO_RESPONSE
  const pauloConv = await createConversation(
    patientMap.paulo.id,
    'WAITING',
    'AGENT',
    [
      {
        direction: 'OUTBOUND',
        content:
          'Olá Paulo! Tudo bem? Estamos acompanhando seu caso. Você conseguiu agendar o exame de ultrassonografia renal que o Dr. João solicitou?',
        processedBy: 'AGENT',
        minutesOffset: 400,
      },
      {
        direction: 'INBOUND',
        content: 'Oi, ainda não consegui agendar. Vou tentar essa semana.',
        processedBy: 'AGENT',
        minutesOffset: 480,
      },
      {
        direction: 'OUTBOUND',
        content:
          'Entendi Paulo. É importante fazer o exame o quanto antes para que possamos dar andamento ao seu caso. Se precisar de ajuda para agendar, posso pedir para a equipe entrar em contato com o laboratório. Quer que eu faça isso?',
        processedBy: 'AGENT',
        minutesOffset: 481,
      },
      // Paciente não respondeu mais — última mensagem há 8 dias atrás
    ],
  );

  // --- Conversa 8: Lucas Almeida (testicular/treatment) - Efeitos do BEP ---
  const lucasConv = await createConversation(
    patientMap.lucas.id,
    'ACTIVE',
    'AGENT',
    [
      {
        direction: 'INBOUND',
        content:
          'Oi, terminei o segundo ciclo da quimio semana passada. Estou com cansaço muito forte e um pouco de falta de ar.',
        processedBy: 'AGENT',
        minutesOffset: 500,
      },
      {
        direction: 'OUTBOUND',
        content:
          'Olá Lucas! Obrigado por compartilhar como está se sentindo. Cansaço é um efeito comum do protocolo BEP. Quanto à falta de ar, vamos investigar melhor. De 0 a 10, como classificaria o cansaço e a falta de ar?',
        processedBy: 'AGENT',
        minutesOffset: 501,
      },
      {
        direction: 'INBOUND',
        content: 'Cansaço uns 6 e falta de ar uns 4, só quando faço esforço',
        processedBy: 'AGENT',
        minutesOffset: 504,
      },
      {
        direction: 'OUTBOUND',
        content:
          'Entendi. Cansaço 6/10 e dispneia 4/10 aos esforços. A bleomicina do BEP pode afetar os pulmões, então é importante monitorar a falta de ar. Se ela piorar em repouso ou ultrapassar 6/10, entre em contato imediatamente. Vou registrar esses sintomas e o Dr. João será notificado antes do seu próximo ciclo.',
        processedBy: 'AGENT',
        minutesOffset: 505,
        structuredData: {
          symptoms: { fadiga: 6, dispneia: 4 },
          scales: { fatigue: 6, dyspnea: 4 },
        },
      },
      {
        direction: 'INBOUND',
        content: 'Ok, obrigado. E sobre os exames de sangue, quando preciso repetir?',
        processedBy: 'AGENT',
        minutesOffset: 508,
      },
      {
        direction: 'OUTBOUND',
        content:
          'Os exames de sangue (hemograma e marcadores tumorais AFP e beta-HCG) devem ser repetidos antes do próximo ciclo, ou seja, na próxima semana. Você pode fazer no laboratório do hospital. Lembre-se de estar em jejum de 8 horas. Quer que eu anote um lembrete para você?',
        processedBy: 'AGENT',
        minutesOffset: 509,
      },
    ],
  );

  console.log(
    `✅ Conversas e mensagens criadas: ${counts.conversations} conversas, ${counts.messages} mensagens`,
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // PoC 2.4 — ALERTAS (CRITICAL_SYMPTOM, NO_RESPONSE, NAVIGATION_DELAY)
  // ═══════════════════════════════════════════════════════════════════════════

  // Alerta 1: Marcos — sintomas críticos (febre + dor) — ACKNOWLEDGED hoje
  await prisma.alert.create({
    data: {
      tenantId: tenant.id,
      patientId: patientMap.marcos.id,
      type: 'CRITICAL_SYMPTOM',
      severity: 'CRITICAL',
      message:
        'Paciente reportou febre de 38.5°C e dor abdominal intensa (8/10) durante quimioterapia FOLFOX – risco de neutropenia febril',
      context: {
        symptoms: ['febre neutropênica', 'dor abdominal'],
        temperature: 38.5,
        painLevel: 8,
        conversationId: marcosConv.conversation.id,
      },
      createdAt: hoursAgo(2),
      status: 'ACKNOWLEDGED',
      acknowledgedBy: nurse.id,
      acknowledgedAt: hoursAgo(1.5),
    },
  });
  counts.alerts++;

  // Alerta 2: Antônio — dor não controlada — RESOLVED hoje (resolvedAt > createdAt)
  // Dashboard: Alertas Resolvidos Hoje, Tempo Médio de Resposta, Resolução em 24h
  // Usa todayAt() para garantir que createdAt e resolvedAt estejam SEMPRE no dia civil atual
  await prisma.alert.create({
    data: {
      tenantId: tenant.id,
      patientId: patientMap.antonio.id,
      type: 'CRITICAL_SYMPTOM',
      severity: 'HIGH',
      message:
        'Dor não controlada (9/10) em paciente paliativo – necessita ajuste analgésico urgente',
      context: {
        symptoms: ['dor intensa não controlada'],
        painLevel: 9,
        conversationId: antonioConv.conversation.id,
      },
      createdAt: todayAt(7, 0),      // 07:00 hoje
      status: 'RESOLVED',
      acknowledgedBy: nurse.id,
      acknowledgedAt: todayAt(7, 15), // 07:15 hoje
      resolvedBy: nurse.id,
      resolvedAt: todayAt(8, 0),      // 08:00 hoje — 60 min para resolver
    },
  });
  counts.alerts++;

  // PoC: Alerta NO_RESPONSE — Paulo Mendes sem resposta há 8 dias
  await prisma.alert.create({
    data: {
      tenantId: tenant.id,
      patientId: patientMap.paulo.id,
      type: 'NO_RESPONSE',
      severity: 'MEDIUM',
      message:
        'Paciente Paulo Mendes não responde há 8 dias – última interação em rastreio renal. Necessita contato ativo.',
      context: {
        daysSinceLastInteraction: 8,
        lastInteraction: daysAgo(8).toISOString(),
        currentStage: 'SCREENING',
        conversationId: pauloConv.conversation.id,
      },
      status: 'PENDING',
    },
  });
  counts.alerts++;

  // PoC: Alerta NAVIGATION_DELAY — Fernando com TC de reestadiamento atrasada
  await prisma.alert.create({
    data: {
      tenantId: tenant.id,
      patientId: patientMap.fernando.id,
      type: 'NAVIGATION_DELAY',
      severity: 'HIGH',
      message:
        'TC de reestadiamento atrasada em 3 dias para Fernando Lima (bexiga, III) – exame necessário para avaliar resposta à quimioterapia neoadjuvante',
      context: {
        stepKey: 'imaging_restaging',
        stepName: 'TC de reestadiamento',
        daysOverdue: 3,
        dueDate: daysAgo(3).toISOString(),
      },
      status: 'PENDING',
    },
  });
  counts.alerts++;

  console.log(`✅ Alertas criados: ${counts.alerts}`);

  // ═══════════════════════════════════════════════════════════════════════════
  // PoC 2.3 — PriorityScore (histórico de priorização)
  // ═══════════════════════════════════════════════════════════════════════════

  // Marcos — escalação de prioridade (diagnóstico → tratamento → sintoma crítico)
  const marcosHistory = [
    {
      score: 50,
      category: 'MEDIUM' as const,
      reason: 'Diagnóstico confirmado – aguardando estadiamento',
      calculatedAt: daysAgo(100),
    },
    {
      score: 65,
      category: 'HIGH' as const,
      reason: 'Início de quimioterapia FOLFOX – monitoramento ativo',
      calculatedAt: daysAgo(60),
    },
    {
      score: 70,
      category: 'HIGH' as const,
      reason: 'Quimioterapia em andamento – ciclo 3 administrado',
      calculatedAt: daysAgo(14),
    },
    {
      score: 90,
      category: 'CRITICAL' as const,
      reason:
        'Febre 38.5°C + dor abdominal 8/10 – risco neutropenia febril',
      calculatedAt: hoursAgo(1),
    },
  ];

  for (const h of marcosHistory) {
    await prisma.priorityScore.create({
      data: {
        tenantId: tenant.id,
        patientId: patientMap.marcos.id,
        score: h.score,
        category: h.category,
        reason: h.reason,
        calculatedAt: h.calculatedAt,
        modelVersion: 'v1.0-poc',
      },
    });
    counts.priorityScores++;
  }

  // Ana — prioridade subiu com náusea
  const anaHistory = [
    {
      score: 55,
      category: 'MEDIUM' as const,
      reason: 'Início de quimioterapia AC-T – monitoramento padrão',
      calculatedAt: daysAgo(60),
    },
    {
      score: 60,
      category: 'HIGH' as const,
      reason: 'Quimioterapia em andamento – ciclo 2',
      calculatedAt: daysAgo(30),
    },
    {
      score: 75,
      category: 'HIGH' as const,
      reason: 'Náusea grau 7/10 pós-quimioterapia – monitorar hidratação',
      calculatedAt: hoursAgo(2),
    },
  ];

  for (const h of anaHistory) {
    await prisma.priorityScore.create({
      data: {
        tenantId: tenant.id,
        patientId: patientMap.ana.id,
        score: h.score,
        category: h.category,
        reason: h.reason,
        calculatedAt: h.calculatedAt,
        modelVersion: 'v1.0-poc',
      },
    });
    counts.priorityScores++;
  }

  // Antônio — paliativo, prioridade sempre alta
  const antonioHistory = [
    {
      score: 70,
      category: 'HIGH' as const,
      reason: 'Paciente paliativo – acompanhamento contínuo',
      calculatedAt: daysAgo(30),
    },
    {
      score: 85,
      category: 'CRITICAL' as const,
      reason:
        'Dor não controlada 9/10 – necessita ajuste analgésico urgente',
      calculatedAt: hoursAgo(3),
    },
  ];

  for (const h of antonioHistory) {
    await prisma.priorityScore.create({
      data: {
        tenantId: tenant.id,
        patientId: patientMap.antonio.id,
        score: h.score,
        category: h.category,
        reason: h.reason,
        calculatedAt: h.calculatedAt,
        modelVersion: 'v1.0-poc',
      },
    });
    counts.priorityScores++;
  }

  // Paulo — subiu por falta de resposta
  await prisma.priorityScore.create({
    data: {
      tenantId: tenant.id,
      patientId: patientMap.paulo.id,
      score: 20,
      category: 'LOW',
      reason: 'Rastreio renal – paciente estável',
      calculatedAt: daysAgo(15),
      modelVersion: 'v1.0-poc',
    },
  });
  counts.priorityScores++;

  await prisma.priorityScore.create({
    data: {
      tenantId: tenant.id,
      patientId: patientMap.paulo.id,
      score: 45,
      category: 'MEDIUM',
      reason: 'Sem resposta há 8 dias – necessita contato ativo',
      calculatedAt: hoursAgo(6),
      modelVersion: 'v1.0-poc',
    },
  });
  counts.priorityScores++;

  console.log(`✅ PriorityScore criados: ${counts.priorityScores}`);

  // ═══════════════════════════════════════════════════════════════════════════
  // PoC 2.4 — INTERVENTIONS (Handoff "Assumir conversa")
  // Rastreabilidade de ações da enfermagem
  // ═══════════════════════════════════════════════════════════════════════════

  // Marcos — enfermeira assumiu conversa após alerta de febre
  await prisma.intervention.create({
    data: {
      tenantId: tenant.id,
      patientId: patientMap.marcos.id,
      userId: nurse.id,
      messageId: marcosConv.messages[3].id, // mensagem com alerta
      type: 'ASSUME',
      notes:
        'Assumiu conversa após alerta de febre 38.5°C + dor abdominal 8/10 durante FOLFOX. Orientou ida ao PS.',
    },
  });
  counts.interventions++;

  // Marcos — enfermeira respondeu ao paciente
  await prisma.intervention.create({
    data: {
      tenantId: tenant.id,
      patientId: patientMap.marcos.id,
      userId: nurse.id,
      messageId: marcosConv.messages[4].id, // resposta da enfermeira
      type: 'RESPONSE',
      notes:
        'Respondeu ao paciente orientando ida imediata ao PS com resumo clínico.',
    },
  });
  counts.interventions++;

  // Antônio — enfermeira assumiu conversa por dor intensa
  await prisma.intervention.create({
    data: {
      tenantId: tenant.id,
      patientId: patientMap.antonio.id,
      userId: nurse.id,
      messageId: antonioConv.messages[3].id, // mensagem com alerta de dor
      type: 'ASSUME',
      notes:
        'Assumiu conversa após dor 9/10 não controlada. Contatou Dr. João para ajuste de morfina.',
    },
  });
  counts.interventions++;

  // Antônio — alerta resolvido (ajuste de medicação feito)
  await prisma.intervention.create({
    data: {
      tenantId: tenant.id,
      patientId: patientMap.antonio.id,
      userId: nurse.id,
      type: 'ALERT_RESOLVED',
      notes:
        'Alerta de dor resolvido – Dr. João autorizou aumento de morfina 10mg→15mg a cada 4h. Paciente orientado.',
    },
  });
  counts.interventions++;

  console.log(`✅ Interventions criadas: ${counts.interventions}`);

  // ═══════════════════════════════════════════════════════════════════════════
  // Observations (FHIR) — dados estruturados de sintomas
  // ═══════════════════════════════════════════════════════════════════════════

  // Ana — náusea 7/10
  await prisma.observation.create({
    data: {
      tenantId: tenant.id,
      patientId: patientMap.ana.id,
      messageId: anaConv.messages[3].id,
      code: '72823-4',
      display: 'Nausea severity',
      valueQuantity: 7,
      unit: '/10',
      effectiveDateTime: new Date('2024-12-10T09:04:00Z'),
      status: 'final',
    },
  });
  counts.observations++;

  // Marcos — dor 8/10
  await prisma.observation.create({
    data: {
      tenantId: tenant.id,
      patientId: patientMap.marcos.id,
      messageId: marcosConv.messages[3].id,
      code: '72514-3',
      display: 'Pain severity - 0-10 verbal numeric rating',
      valueQuantity: 8,
      unit: '/10',
      effectiveDateTime: new Date('2024-12-10T10:04:00Z'),
      status: 'final',
    },
  });
  counts.observations++;

  // Marcos — febre 38.5°C
  await prisma.observation.create({
    data: {
      tenantId: tenant.id,
      patientId: patientMap.marcos.id,
      messageId: marcosConv.messages[3].id,
      code: '8310-5',
      display: 'Body temperature',
      valueQuantity: 38.5,
      unit: '°C',
      effectiveDateTime: new Date('2024-12-10T10:04:00Z'),
      status: 'final',
    },
  });
  counts.observations++;

  // Antônio — dor 9/10
  await prisma.observation.create({
    data: {
      tenantId: tenant.id,
      patientId: patientMap.antonio.id,
      messageId: antonioConv.messages[3].id,
      code: '72514-3',
      display: 'Pain severity - 0-10 verbal numeric rating',
      valueQuantity: 9,
      unit: '/10',
      effectiveDateTime: new Date('2024-12-10T14:04:00Z'),
      status: 'final',
    },
  });
  counts.observations++;

  console.log(`✅ Observations criadas: ${counts.observations}`);

  // ═══════════════════════════════════════════════════════════════════════════
  // InternalNote — notas internas da equipe
  // ═══════════════════════════════════════════════════════════════════════════

  await prisma.internalNote.create({
    data: {
      tenantId: tenant.id,
      patientId: patientMap.marcos.id,
      authorId: nurse.id,
      content:
        'Paciente orientado a ir ao PS por suspeita de neutropenia febril (febre 38.5°C + D+10 de FOLFOX). Esposa acompanhando. Comunicado ao Dr. João Silva que solicitou hemograma urgente no PS. Aguardando retorno.',
    },
  });
  counts.internalNotes++;

  await prisma.internalNote.create({
    data: {
      tenantId: tenant.id,
      patientId: patientMap.antonio.id,
      authorId: nurse.id,
      content:
        'Ajuste de morfina autorizado pelo Dr. João: 10mg→15mg VO a cada 4h. Paciente referiu melhora para 5/10 após 1h. Filha acompanhando. Reavaliar amanhã.',
    },
  });
  counts.internalNotes++;

  console.log(`✅ InternalNotes criadas: ${counts.internalNotes}`);

  // ═══════════════════════════════════════════════════════════════════════════
  // AgentDecisionLog — audit trail de decisões do agente
  // ═══════════════════════════════════════════════════════════════════════════

  // Marcos — detecção de sintoma crítico e escalação
  await prisma.agentDecisionLog.create({
    data: {
      tenantId: tenant.id,
      conversationId: marcosConv.conversation.id,
      patientId: patientMap.marcos.id,
      decisionType: 'SYMPTOM_DETECTED',
      reasoning:
        'Paciente reportou febre 38.5°C e dor abdominal 8/10 durante quimioterapia FOLFOX (D+10). Classificado como potencial neutropenia febril.',
      confidence: 0.95,
      inputData: {
        message: 'Temperatura 38.5 e a dor tá uns 8',
        currentTreatment: 'FOLFOX ciclo 4',
        daysSinceChemo: 10,
      },
      outputAction: {
        action: 'CRITICAL_ESCALATION',
        alertType: 'CRITICAL_SYMPTOM',
        severity: 'CRITICAL',
      },
    },
  });
  counts.agentDecisionLogs++;

  await prisma.agentDecisionLog.create({
    data: {
      tenantId: tenant.id,
      conversationId: marcosConv.conversation.id,
      patientId: patientMap.marcos.id,
      decisionType: 'CRITICAL_ESCALATION',
      reasoning:
        'Febre em paciente em quimioterapia ativa requer escalação imediata para enfermagem. Critério: temperatura ≥ 38°C + tratamento quimioterápico ativo.',
      confidence: 0.98,
      inputData: {
        symptoms: ['febre neutropênica', 'dor abdominal'],
        temperature: 38.5,
        painLevel: 8,
      },
      outputAction: {
        action: 'HANDOFF_TO_NURSING',
        alertCreated: true,
        conversationStatus: 'ESCALATED',
      },
    },
  });
  counts.agentDecisionLogs++;

  await prisma.agentDecisionLog.create({
    data: {
      tenantId: tenant.id,
      conversationId: marcosConv.conversation.id,
      patientId: patientMap.marcos.id,
      decisionType: 'ALERT_CREATED',
      reasoning:
        'Alerta CRITICAL_SYMPTOM criado para equipe de enfermagem com severidade CRITICAL.',
      confidence: 1.0,
      inputData: {
        alertType: 'CRITICAL_SYMPTOM',
        symptoms: ['febre neutropênica', 'dor abdominal'],
      },
      outputAction: {
        alertId: 'auto-generated',
        notifiedUsers: ['enfermeira@hospitalteste.com'],
      },
    },
  });
  counts.agentDecisionLogs++;

  // Antônio — dor intensa → escalação
  await prisma.agentDecisionLog.create({
    data: {
      tenantId: tenant.id,
      conversationId: antonioConv.conversation.id,
      patientId: patientMap.antonio.id,
      decisionType: 'CRITICAL_ESCALATION',
      reasoning:
        'Dor 9/10 não controlada em paciente paliativo. Medicação atual (morfina 10mg 4/4h) insuficiente. Requer ajuste analgésico urgente.',
      confidence: 0.97,
      inputData: {
        painLevel: 9,
        currentMedication: 'Morfina 10mg VO 4/4h',
        patientStatus: 'PALLIATIVE_CARE',
      },
      outputAction: {
        action: 'HANDOFF_TO_NURSING',
        alertType: 'CRITICAL_SYMPTOM',
        severity: 'HIGH',
      },
    },
  });
  counts.agentDecisionLogs++;

  // Ana — detecção de sintoma e monitoramento
  await prisma.agentDecisionLog.create({
    data: {
      tenantId: tenant.id,
      conversationId: anaConv.conversation.id,
      patientId: patientMap.ana.id,
      decisionType: 'SYMPTOM_DETECTED',
      reasoning:
        'Náusea 7/10 pós-quimioterapia AC-T. Dentro do esperado mas requer monitoramento. Paciente tomando ondansetrona conforme prescrição.',
      confidence: 0.85,
      inputData: {
        symptom: 'nausea',
        severity: 7,
        treatment: 'AC-T ciclo 3',
        antiemeticInUse: true,
      },
      outputAction: {
        action: 'MONITOR',
        priorityUpdate: { from: 60, to: 75 },
        followUpScheduled: true,
      },
    },
  });
  counts.agentDecisionLogs++;

  console.log(`✅ AgentDecisionLog criados: ${counts.agentDecisionLogs}`);

  // ═══════════════════════════════════════════════════════════════════════════
  // PoC 2.2 — WhatsAppConnection (placeholder para configuração)
  // ═══════════════════════════════════════════════════════════════════════════

  await prisma.whatsAppConnection.create({
    data: {
      tenantId: tenant.id,
      name: 'WhatsApp Oncologia – Hospital de Teste',
      phoneNumber: '+5527999880001',
      phoneNumberId: '123456789012345',
      whatsappBusinessAccountId: 'WABA_DEMO_001',
      authMethod: 'OAUTH',
      status: 'CONNECTED',
      isActive: true,
      isDefault: true,
      lastSyncAt: hoursAgo(1),
      metadata: {
        displayName: 'OncoNav - Hospital de Teste',
        qualityRating: 'GREEN',
        messagingLimit: 1000,
      },
    },
  });
  counts.whatsappConnections++;

  console.log(`✅ WhatsAppConnection criada: ${counts.whatsappConnections}`);

  // ═══════════════════════════════════════════════════════════════════════════
  // AgentConfig
  // ═══════════════════════════════════════════════════════════════════════════

  const existingAgentConfig = await prisma.agentConfig.findUnique({
    where: { tenantId: tenant.id },
  });
  if (!existingAgentConfig) {
    await prisma.agentConfig.create({
      data: {
        tenantId: tenant.id,
        llmProvider: 'anthropic',
        llmModel: 'claude-sonnet-4-6',
        llmFallbackProvider: 'openai',
        llmFallbackModel: 'gpt-4o-mini',
        maxAutoReplies: 10,
        agentLanguage: 'pt-BR',
        escalationRules: {
          threshold: 'HIGH',
          workingHoursStart: '08:00',
          workingHoursEnd: '20:00',
        },
        defaultCheckInFrequency: { TREATMENT: 'daily', FOLLOW_UP: 'weekly' },
        riskBasedAdjustment: true,
      },
    });
    console.log('✅ AgentConfig criado para o tenant');
  } else {
    console.log('✅ AgentConfig já existe');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ClinicalProtocols
  // ═══════════════════════════════════════════════════════════════════════════

  const protocolTypes = [
    'colorectal',
    'bladder',
    'renal',
    'prostate',
    'breast',
  ];
  for (const cancerType of protocolTypes) {
    const existing = await prisma.clinicalProtocol.findFirst({
      where: { tenantId: tenant.id, cancerType },
    });
    if (!existing) {
      await prisma.clinicalProtocol.create({
        data: {
          tenantId: tenant.id,
          name: `Protocolo ${cancerType.charAt(0).toUpperCase() + cancerType.slice(1)}`,
          cancerType,
          version: '1.0',
          isActive: true,
          definition: {
            stages: ['SCREENING', 'DIAGNOSIS', 'TREATMENT', 'FOLLOW_UP'],
          },
          checkInRules: {
            SCREENING: { frequency: 'weekly', questionnaire: null },
            DIAGNOSIS: { frequency: 'twice_weekly', questionnaire: null },
            TREATMENT: { frequency: 'daily', questionnaire: 'ESAS' },
            FOLLOW_UP: { frequency: 'weekly', questionnaire: 'PRO_CTCAE' },
          },
          criticalSymptoms: {
            TREATMENT: [
              'febre neutropênica',
              'falta de ar',
              'sangramento',
              'obstrução intestinal',
            ],
          },
        },
      });
      console.log(`✅ Protocolo ${cancerType} criado`);
    } else {
      console.log(`✅ Protocolo ${cancerType} já existe`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Questionários ESAS e PRO-CTCAE
  // ═══════════════════════════════════════════════════════════════════════════

  const esasExists = await prisma.questionnaire.findFirst({
    where: { tenantId: tenant.id, type: 'ESAS' },
  });
  if (!esasExists) {
    await prisma.questionnaire.create({
      data: {
        tenantId: tenant.id,
        code: 'ESAS',
        name: 'ESAS — Edmonton Symptom Assessment System',
        type: 'ESAS',
        isActive: true,
        structure: {
          items: [
            { key: 'pain', label: 'Dor', scale: '0-10' },
            { key: 'fatigue', label: 'Cansaço', scale: '0-10' },
            { key: 'nausea', label: 'Náusea', scale: '0-10' },
            { key: 'depression', label: 'Humor/Depressão', scale: '0-10' },
            { key: 'anxiety', label: 'Ansiedade', scale: '0-10' },
            { key: 'drowsiness', label: 'Sonolência', scale: '0-10' },
            { key: 'appetite', label: 'Apetite', scale: '0-10' },
            { key: 'wellbeing', label: 'Bem-estar geral', scale: '0-10' },
            { key: 'dyspnea', label: 'Falta de ar', scale: '0-10' },
          ],
          alertThreshold: 7,
          totalAlertThreshold: 50,
        },
      },
    });
    console.log('✅ Questionário ESAS criado');
  } else {
    console.log('✅ Questionário ESAS já existe');
  }

  const proCtcaeExists = await prisma.questionnaire.findFirst({
    where: { tenantId: tenant.id, type: 'PRO_CTCAE' },
  });
  if (!proCtcaeExists) {
    await prisma.questionnaire.create({
      data: {
        tenantId: tenant.id,
        code: 'PRO_CTCAE',
        name: 'PRO-CTCAE — Patient-Reported Outcomes CTCAE',
        type: 'PRO_CTCAE',
        isActive: true,
        structure: {
          items: [
            { key: 'pain', attributes: ['severity', 'interference'] },
            { key: 'fatigue', attributes: ['severity', 'interference'] },
            { key: 'nausea', attributes: ['frequency', 'severity'] },
            { key: 'diarrhea', attributes: ['frequency', 'severity'] },
            { key: 'constipation', attributes: ['severity'] },
            { key: 'appetite_loss', attributes: ['severity', 'interference'] },
            { key: 'dyspnea', attributes: ['severity', 'interference'] },
            { key: 'insomnia', attributes: ['frequency', 'severity'] },
            { key: 'neuropathy', attributes: ['severity', 'interference'] },
            { key: 'mucositis', attributes: ['severity', 'interference'] },
          ],
          alertGrade: 3,
        },
      },
    });
    console.log('✅ Questionário PRO-CTCAE criado');
  } else {
    console.log('✅ Questionário PRO-CTCAE já existe');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Dashboard: ALERTAS RESOLVIDOS distribuídos nos últimos 7 dias
  // Alimenta: Alertas Resolvidos Hoje, Tempo Médio de Resposta,
  //           Resolução em 24h, gráfico Alertas por Severidade,
  //           Alertas/Dia (7d), Variação de Alertas
  // ═══════════════════════════════════════════════════════════════════════════

  // Alerta extra: resolvido pela enfermeira com tempo de resposta explícito (60 min)
  // Alimenta: "Alertas Resolvidos Hoje" e "Tempo Médio de Resposta" do dashboard enfermeira
  // Usa todayAt() para garantir que as datas estejam SEMPRE no dia civil atual
  await prisma.alert.create({
    data: {
      tenantId: tenant.id,
      patientId: patientMap.ana.id,
      type: 'SYMPTOM_WORSENING',
      severity: 'MEDIUM',
      message: 'Sintoma reportado – verificado e orientado pela enfermeira',
      status: 'RESOLVED',
      createdAt: todayAt(8, 30),      // 08:30 hoje
      resolvedBy: nurse.id,
      resolvedAt: todayAt(9, 30),     // 09:30 hoje — 60 min para resolver
      acknowledgedBy: nurse.id,
      acknowledgedAt: todayAt(8, 35), // 08:35 hoje
    },
  });
  counts.alerts++;

  const dashboardAlerts: Array<{
    patientKey: string;
    type: string;
    severity: string;
    message: string;
    status: string;
    createdAtOffset: number; // dias atrás
    resolvedMinutesLater?: number; // minutos após createdAt
  }> = [
    // Hoje — RESOLVED (para "Alertas Resolvidos Hoje" e "Resolução em 24h")
    {
      patientKey: 'ana',
      type: 'SYMPTOM_WORSENING',
      severity: 'HIGH',
      message: 'Piora de náusea pós-quimioterapia AC-T – paciente reportou dificuldade para manter hidratação',
      status: 'RESOLVED',
      createdAtOffset: 0, // hoje
      resolvedMinutesLater: 45, // resolvido em 45 min
    },
    {
      patientKey: 'lucas',
      type: 'SCORE_CHANGE',
      severity: 'MEDIUM',
      message: 'Score de prioridade subiu de 40 para 55 – fadiga e dispneia pós BEP ciclo 2',
      status: 'RESOLVED',
      createdAtOffset: 0,
      resolvedMinutesLater: 90,
    },
    // Ontem — RESOLVED
    {
      patientKey: 'fernando',
      type: 'CRITICAL_SYMPTOM',
      severity: 'HIGH',
      message: 'Hematúria reportada durante tratamento GC neoadjuvante – monitorado e estabilizado',
      status: 'RESOLVED',
      createdAtOffset: 1,
      resolvedMinutesLater: 120,
    },
    // 2 dias atrás — RESOLVED
    {
      patientKey: 'marcos',
      type: 'DELAYED_APPOINTMENT',
      severity: 'MEDIUM',
      message: 'Consulta de acompanhamento atrasada em 2 dias – reagendada',
      status: 'RESOLVED',
      createdAtOffset: 2,
      resolvedMinutesLater: 180,
    },
    // 3 dias atrás — PENDING (para gráfico por severidade)
    {
      patientKey: 'roberto',
      type: 'MISSING_EXAM',
      severity: 'LOW',
      message: 'Exame de creatinina não realizado antes da tomografia com contraste',
      status: 'PENDING',
      createdAtOffset: 3,
    },
    // 4 dias atrás — RESOLVED
    {
      patientKey: 'ana',
      type: 'QUESTIONNAIRE_ALERT',
      severity: 'MEDIUM',
      message: 'ESAS total acima do limiar (52/90) – dor 7, náusea 7, fadiga 6',
      status: 'RESOLVED',
      createdAtOffset: 4,
      resolvedMinutesLater: 60,
    },
    // 5 dias atrás — RESOLVED
    {
      patientKey: 'antonio',
      type: 'PALLIATIVE_SYMPTOM_WORSENING',
      severity: 'CRITICAL',
      message: 'Dispneia progressiva em paciente paliativo – necessitou oxigênio suplementar',
      status: 'RESOLVED',
      createdAtOffset: 5,
      resolvedMinutesLater: 30,
    },
    // 6 dias atrás — PENDING
    {
      patientKey: 'jose',
      type: 'FOLLOW_UP_OVERDUE',
      severity: 'LOW',
      message: 'Seguimento pós-operatório atrasado – PSA de controle pendente',
      status: 'PENDING',
      createdAtOffset: 6,
    },
  ];

  for (const a of dashboardAlerts) {
    const createdAt = new Date(now.getTime() - a.createdAtOffset * 86400000);
    createdAt.setHours(10, 0, 0, 0); // 10h no dia

    const data: any = {
      tenantId: tenant.id,
      patientId: patientMap[a.patientKey].id,
      type: a.type,
      severity: a.severity,
      message: a.message,
      status: a.status,
      createdAt,
    };

    if (a.status === 'RESOLVED' && a.resolvedMinutesLater) {
      const resolvedAt = new Date(createdAt.getTime() + a.resolvedMinutesLater * 60000);
      data.resolvedBy = nurse.id;
      data.resolvedAt = resolvedAt;
      data.acknowledgedBy = nurse.id;
      data.acknowledgedAt = new Date(createdAt.getTime() + 5 * 60000); // acknowledged 5 min após
    }

    await prisma.alert.create({ data });
    counts.alerts++;
  }

  console.log(`✅ Alertas adicionais para dashboard: ${dashboardAlerts.length}`);

  // ═══════════════════════════════════════════════════════════════════════════
  // Dashboard: INTERVENÇÕES HOJE (para "Pacientes Atendidos Hoje")
  // ═══════════════════════════════════════════════════════════════════════════

  // Intervenção hoje — Ana (náusea monitorada)
  // Alimenta: "Pacientes Atendidos Hoje" do dashboard enfermeira
  // Usa todayAt() para garantir que createdAt esteja SEMPRE no dia civil atual
  await prisma.intervention.create({
    data: {
      tenantId: tenant.id,
      patientId: patientMap.ana.id,
      userId: nurse.id,
      type: 'RESPONSE',
      notes: 'Monitorou náusea pós-quimioterapia. Paciente orientada sobre hidratação e antiemético.',
      createdAt: todayAt(9, 0), // 09:00 hoje
    },
  });
  counts.interventions++;

  // Intervenção hoje — Lucas (acompanhamento BEP)
  // Alimenta: "Pacientes Atendidos Hoje" do dashboard enfermeira
  await prisma.intervention.create({
    data: {
      tenantId: tenant.id,
      patientId: patientMap.lucas.id,
      userId: nurse.id,
      type: 'RESPONSE',
      notes: 'Acompanhamento pós-ciclo 2 BEP. Registrou fadiga 6/10 e dispneia 4/10. Alertou Dr. João.',
      createdAt: todayAt(9, 30), // 09:30 hoje
    },
  });
  counts.interventions++;

  console.log('✅ Intervenções de hoje adicionadas');

  // ═══════════════════════════════════════════════════════════════════════════
  // Dashboard: TAXA DE ADESÃO (paciente com ciclos completos)
  // O backend só conta pacientes com currentCycle >= 80% de totalCycles;
  // "on track" = currentCycle >= totalCycles. Precisamos de 1 paciente com
  // currentCycle == totalCycles no PatientJourney.
  // ═══════════════════════════════════════════════════════════════════════════

  // Atualizar José (próstata/follow-up) — cirurgia completa, sem ciclos
  // Melhor: criar/atualizar Fernando cujo journey tem ciclos 3/6 (não elegível)
  // Solução: atualizar PatientJourney do Antônio (paliativo) — 6 ciclos completos
  await prisma.patientJourney.update({
    where: { patientId: patientMap.antonio.id },
    data: {
      treatmentType: 'CHEMOTHERAPY',
      currentCycle: 6,
      totalCycles: 6,
    },
  });

  console.log('✅ PatientJourney atualizado para taxa de adesão (Antônio 6/6 ciclos)');

  // ═══════════════════════════════════════════════════════════════════════════
  // Dashboard: BIOMARCADORES PENDENTES
  // NavigationStep com stepKey em biomarkerStepKeys, isCompleted: false
  // ═══════════════════════════════════════════════════════════════════════════

  // Roberto (pulmão/diagnosis) — aguardando EGFR e PD-L1
  // createdAt após lung_biopsy (20d) e antes de diagnosisDate (10d) para não alterar
  // o "primeiro" step DIAGNOSIS no cálculo de Time-to-Diagnosis (deve ser lung_biopsy).
  await prisma.navigationStep.create({
    data: {
      tenantId: tenant.id,
      patientId: patientMap.roberto.id,
      journeyId: journeyMap['roberto'],
      cancerType: 'lung',
      journeyStage: 'DIAGNOSIS',
      stepKey: 'egfr_test',
      stepName: 'Teste EGFR',
      stepDescription: 'Teste de mutação EGFR para definição de terapia alvo',
      status: 'IN_PROGRESS',
      isCompleted: false,
      expectedDate: daysAgo(5),
      dueDate: daysFromNow(2),
      createdAt: daysAgo(8),
    },
  });
  counts.navigationSteps++;

  await prisma.navigationStep.create({
    data: {
      tenantId: tenant.id,
      patientId: patientMap.roberto.id,
      journeyId: journeyMap['roberto'],
      cancerType: 'lung',
      journeyStage: 'DIAGNOSIS',
      stepKey: 'pdl1_test',
      stepName: 'Teste PD-L1',
      stepDescription: 'Expressão PD-L1 para elegibilidade a imunoterapia',
      status: 'PENDING',
      isCompleted: false,
      expectedDate: daysFromNow(3),
      dueDate: daysFromNow(10),
      createdAt: daysAgo(6),
    },
  });
  counts.navigationSteps++;

  // Marcos (colorretal) — MSI/dMMR pendente
  await prisma.navigationStep.create({
    data: {
      tenantId: tenant.id,
      patientId: patientMap.marcos.id,
      journeyId: journeyMap['marcos'],
      diagnosisId: diagnosisMap['marcos'],
      cancerType: 'colorectal',
      journeyStage: 'DIAGNOSIS',
      stepKey: 'msi_test',
      stepName: 'Teste MSI/dMMR',
      stepDescription: 'Instabilidade de microssatélites para definição de imunoterapia',
      status: 'PENDING',
      isCompleted: false,
      expectedDate: daysAgo(3),
      dueDate: daysFromNow(5),
    },
  });
  counts.navigationSteps++;

  console.log('✅ Biomarcadores pendentes adicionados (EGFR, PD-L1, MSI)');

  // ═══════════════════════════════════════════════════════════════════════════
  // Dashboard: TIME-TO-DIAGNOSIS
  // Garantir que NavigationStep DIAGNOSIS de Roberto tenha createdAt anterior
  // a diagnosisDate do journey. Roberto já tem journey com diagnosisDate e
  // uma NavigationStep DIAGNOSIS (egfr_test criado acima), mas precisamos
  // de uma etapa DIAGNOSIS mais antiga para o cálculo funcionar.
  // ═══════════════════════════════════════════════════════════════════════════

  // Roberto — biópsia pulmonar (etapa DIAGNOSIS antiga)
  await prisma.navigationStep.create({
    data: {
      tenantId: tenant.id,
      patientId: patientMap.roberto.id,
      journeyId: journeyMap['roberto'],
      cancerType: 'lung',
      journeyStage: 'DIAGNOSIS',
      stepKey: 'lung_biopsy',
      stepName: 'Biópsia pulmonar',
      status: 'COMPLETED',
      isCompleted: true,
      completedAt: daysAgo(12),
      expectedDate: daysAgo(15),
      dueDate: daysAgo(10),
      result: 'Adenocarcinoma de pulmão confirmado',
      createdAt: daysAgo(20), // criado ANTES de diagnosisDate do journey
    },
  });
  counts.navigationSteps++;

  console.log('✅ NavigationStep DIAGNOSIS para time-to-diagnosis (Roberto)');

  // ═══════════════════════════════════════════════════════════════════════════
  // RESUMO FINAL
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('');
  console.log('🎉 Seed concluído com sucesso!');
  console.log('');
  console.log('📊 Resumo dos dados criados:');
  console.log(`  Pacientes:          ${counts.patients}`);
  console.log(`  Conversas:          ${counts.conversations}`);
  console.log(`  Mensagens:          ${counts.messages}`);
  console.log(`  Alertas:            ${counts.alerts} (resolvidos com datas corretas + pendentes distribuídos 7d)`);
  console.log(`  PriorityScore:      ${counts.priorityScores}`);
  console.log(`  CancerDiagnosis:    ${counts.cancerDiagnoses}`);
  console.log(`  Treatments:         ${counts.treatments}`);
  console.log(`  NavigationStep:     ${counts.navigationSteps} (incl. biomarcadores pendentes + OVERDUE)`);
  console.log(`  Interventions:      ${counts.interventions} (incl. intervenções de hoje)`);
  console.log(`  Observations:       ${counts.observations}`);
  console.log(`  InternalNotes:      ${counts.internalNotes}`);
  console.log(`  AgentDecisionLog:   ${counts.agentDecisionLogs}`);
  console.log(`  WhatsAppConnection: ${counts.whatsappConnections}`);
  console.log('');
  console.log('📋 Credenciais de teste:');
  console.log('  Email: admin@hospitalteste.com       | Senha: senha123');
  console.log('  Email: oncologista@hospitalteste.com  | Senha: senha123');
  console.log('  Email: enfermeira@hospitalteste.com   | Senha: senha123');
  console.log('  Email: coordenador@hospitalteste.com  | Senha: senha123');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

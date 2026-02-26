# Checklist de Compliance e Legal

## LGPD (Lei Geral de Proteção de Dados)

### Requisitos Fundamentais

- [ ] **DPO Designado**: Nomear Data Protection Officer
- [ ] **Inventário de Dados**: Mapear todos os dados pessoais coletados
- [ ] **Base Legal**: Definir base legal para tratamento (consentimento, execução de contrato)
- [ ] **Consentimento Explícito**:
  - [ ] Consentimento para uso de dados de saúde
  - [ ] Consentimento para interação via WhatsApp
  - [ ] Consentimento para processamento por IA
- [ ] **Direitos do Titular**:
  - [ ] Portabilidade de dados
  - [ ] Exclusão de dados
  - [ ] Acesso aos dados
  - [ ] Correção de dados
  - [ ] Revogação de consentimento
- [ ] **Política de Privacidade**: Documento claro e acessível
- [ ] **Termo de Consentimento**: Template para pacientes
- [ ] **Avisos de Privacidade**: Em todos os pontos de coleta
- [ ] **Registro de Atividades de Tratamento**: Log de todas as operações
- [ ] **Medidas de Segurança**: Criptografia, backups, acesso controlado
- [ ] **Relatório de Impacto à Proteção de Dados (RIPD)**: Documento técnico
- [ ] **Notificação de Incidentes**: Procedimento para vazamento de dados

### Checklist Técnico LGPD

- [ ] Criptografia em trânsito (TLS 1.3)
- [ ] Criptografia em repouso (AES-256)
- [ ] Logs de auditoria imutáveis (retenção 5 anos)
- [ ] Backup automático com georedundância
- [ ] Controle de acesso baseado em roles (RBAC)
- [ ] MFA obrigatório para profissionais de saúde
- [ ] Anonimização/pseudonimização quando possível
- [ ] Retenção de dados: política definida (ex: 7 anos após alta)

## ANVISA (SaMD - Software as Dispositivo Médico)

### Classificação

- [ ] **Avaliar Classificação**: Determinar classe do SaMD (I, II, III, IV)
  - Provável: Classe II (software de apoio à decisão clínica)
- [ ] **Registro/Cadastro**: Verificar necessidade de registro na ANVISA
- [ ] **Validação Clínica**: Estudos de validação (se necessário)
- [ ] **Documentação Técnica**: Manual técnico, especificações
- [ ] **Manual de Instruções**: Para usuários
- [ ] **Rótulo/Embalagem**: Informações de uso

### Requisitos Técnicos

- [ ] **RDC 330/2019**: Compreender requisitos específicos
- [ ] **Boas Práticas de Fabricação**: Se aplicável
- [ ] **Rastreabilidade**: Registro de versões, mudanças
- [ ] **Gestão de Riscos**: Análise de riscos (ISO 14971)

### Consultoria

- [ ] Contratar consultoria especializada em ANVISA
- [ ] Avaliar necessidade de registro antes do lançamento
- [ ] Preparar documentação técnica

## Resolução CFM 2.227/2018 (Telemedicina)

### Requisitos

- [ ] **Consentimento Informado**: Específico para telemedicina
- [ ] **Segurança da Plataforma**: Criptografia, autenticação
- [ ] **Auditoria**: Registro de todas as interações
- [ ] **Identificação**: Profissional e paciente identificados
- [ ] **Limites**: Não fazer diagnóstico via WhatsApp (apenas coleta de dados)
- [ ] **Documentação**: Registro no prontuário

### Observações

- Agente de IA não substitui médico
- Coleta de dados não é consulta médica
- Enfermagem pode monitorar e intervir quando necessário

## WhatsApp Business API

### Aprovação de Templates

- [ ] **Templates de Mensagens**: Criar templates iniciais
- [ ] **Aprovação Meta**: Submeter templates para aprovação
- [ ] **Política de Privacidade**: Link no perfil do WhatsApp Business
- [ ] **Termos de Uso**: Link no perfil
- [ ] **Política de Opt-out**: Como pacientes podem deixar de receber mensagens

### Requisitos

- [ ] Conta WhatsApp Business verificada
- [ ] Número de telefone dedicado
- [ ] Webhook configurado e seguro
- [ ] Rate limiting implementado
- [ ] Tratamento de opt-out

## Contratos e SLAs

### Contrato com Cliente (Hospital)

- [ ] **SLA (Service Level Agreement)**:
  - [ ] Uptime: 99.9% (≈8,76 horas downtime/ano)
  - [ ] Tempo de resposta: <2s (p95)
  - [ ] Suporte: Horários e canais
- [ ] **Termos de Uso**: Aceitação obrigatória
- [ ] **Política de Privacidade**: Específica para clientes
- [ ] **Responsabilidades**: Divisão clara entre plataforma e hospital
- [ ] **Limitação de Responsabilidade**: Erros de IA, integrações externas
- [ ] **Confidencialidade**: NDA se necessário
- [ ] **Propriedade Intelectual**: Definição clara
- [ ] **Termo de Rescisão**: Condições e prazos
- [ ] **Foro**: Jurisdição para resolução de conflitos

### Contrato com Fornecedores

- [ ] **WhatsApp Business API**: Contrato com provider
- [ ] **Cloud Provider (AWS/GCP)**: BAA (Business Associate Agreement) se necessário
- [ ] **APIs de IA**: Termos de uso (OpenAI, Anthropic)
- [ ] **STT**: Termos de uso (Google, AWS)

## Seguros

### Seguro de Responsabilidade Civil

- [ ] **Erros e Omissões (E&O)**: Cobertura para erros de software
- [ ] **Cyber Liability**: Cobertura para vazamento de dados
- [ ] **Erro Médico**: Cobertura para erros do agente de IA (se aplicável)
- [ ] **Valor Mínimo**: Avaliar valor necessário (R$ 1-5M?)

### Seguro de Dados

- [ ] Cobertura para vazamento de dados pessoais
- [ ] Cobertura para multas LGPD
- [ ] Cobertura para custos de notificação

## Propriedade Intelectual

- [ ] **Patentes**: Avaliar possibilidade de patentear algoritmos (se aplicável)
- [ ] **Marcas**: Registrar marca da plataforma
- [ ] **Software**: Licenciamento adequado (proprietário, SaaS)
- [ ] **Open Source**: Definir quais componentes podem ser open source

## Compliance Operacional

### Auditoria

- [ ] **Logs de Auditoria**: Todas as ações registradas
- [ ] **Retenção**: 5 anos (LGPD mínimo)
- [ ] **Acesso**: Apenas autorizado, com justificativa
- [ ] **Imutabilidade**: Logs não podem ser alterados

### Backup e Disaster Recovery

- [ ] **Backup Automático**: Diário
- [ ] **Backup Completo**: Semanal
- [ ] **Georedundância**: Backup em múltiplas regiões
- [ ] **Teste de Restore**: Mensal
- [ ] **Retenção**: 7 anos (compliance)

### Segurança

- [ ] **Penetration Testing**: Testes de segurança periódicos
- [ ] **Vulnerability Scanning**: Scan automático
- [ ] **Certificações**: ISO 27001 (futuro), SOC 2 (futuro)
- [ ] **Incident Response Plan**: Plano de resposta a incidentes

## Próximos Passos

1. Contratar consultoria jurídica especializada em healthtech
2. Contratar DPO (se necessário)
3. Preparar documentação inicial (políticas, termos)
4. Submeter templates WhatsApp para aprovação
5. Contratar seguros necessários
6. Preparar para registro ANVISA (se necessário)

## Documentos a Criar

- [ ] Política de Privacidade (pacientes)
- [ ] Política de Privacidade (clientes/hospitais)
- [ ] Termo de Consentimento (pacientes)
- [ ] Termos de Uso (plataforma)
- [ ] SLA (com hospitais)
- [ ] Contrato de Prestação de Serviços
- [ ] Manual de Instruções (usuários)
- [ ] Manual Técnico (ANVISA, se necessário)
- [ ] RIPD (Relatório de Impacto à Proteção de Dados)
- [ ] Incident Response Plan

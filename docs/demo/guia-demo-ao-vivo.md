# Guia de Demo Ao Vivo

## Plataforma de Otimização Oncológica

### Objetivo

Demonstrar ao vivo as funcionalidades principais da plataforma para gestores hospitalares, oncologistas e equipe de enfermagem.

### Duração Total: 30-40 minutos

- Apresentação: 10 minutos
- Demo ao vivo: 15-20 minutos
- Q&A: 10 minutos

---

## 1. Preparação Pré-Demo

### Ambiente de Demonstração

**Checklist:**

- [ ] Ambiente de staging/teste configurado e funcionando
- [ ] Dados de demonstração (pacientes fictícios) carregados
- [ ] WhatsApp Business API configurado (número de teste)
- [ ] Dashboard acessível via navegador
- [ ] Conexão estável com internet
- [ ] Backup: vídeo pré-gravado caso demo falhe

**Dados de Demonstração:**

- 10-15 pacientes fictícios com diferentes perfis
- Conversas WhatsApp simuladas
- Alertas configurados
- Scores de priorização variados

---

## 2. Roteiro da Demo

### Parte 1: Apresentação (10 min)

**Slide 1: Problema**

- Falta de coordenação
- Atrasos no diagnóstico
- Sobrecarga da equipe
- Custos elevados

**Slide 2: Solução**

- Visão geral da plataforma
- 4 pilares principais (Navegação, Priorização, Agente, Dashboard)

---

### Parte 2: Demo ao Vivo (15-20 min)

#### Demo 1: Dashboard de Navegação (3 min)

**Ações:**

1. Abrir dashboard no navegador
2. Mostrar lista de pacientes ordenada por prioridade
3. Explicar indicadores visuais (cores, scores)
4. Demonstrar filtros (tipo de câncer, estágio, etc.)

**Pontos a Destacar:**

- "Veja como os pacientes são ordenados automaticamente por prioridade"
- "O sistema identifica casos críticos em tempo real"
- "A equipe sabe exatamente em quem focar"

**Fala:**

> "Aqui está o dashboard principal. Vocês podem ver que os pacientes são ordenados automaticamente por score de prioridade. O sistema usa IA para analisar múltiplos fatores: sintomas reportados, estadiamento, tempo desde última consulta, e assim por diante. Casos em vermelho precisam de atenção imediata."

---

#### Demo 2: Visualização de Conversas WhatsApp (4 min)

**Ações:**

1. Selecionar paciente com conversa ativa
2. Mostrar histórico completo de conversas
3. Destacar mensagens do agente e do paciente
4. Mostrar dados estruturados extraídos
5. Demonstrar detecção de sintoma crítico

**Pontos a Destacar:**

- Conversa natural e empática
- Extração automática de dados
- Detecção de sintomas críticos
- Timeline completa

**Fala:**

> "Quando selecionamos um paciente, podemos ver toda a conversa que ele teve com nosso agente de IA via WhatsApp. Vejam como a conversa é natural - o paciente não precisa baixar um app ou preencher formulários. O agente pergunta sobre sintomas de forma conversacional e extrai dados estruturados automaticamente. Aqui, por exemplo, o paciente reportou dor intensa - o sistema detectou isso como sintoma crítico e gerou um alerta."

---

#### Demo 3: Sistema de Alertas (3 min)

**Ações:**

1. Mostrar notificação de alerta em tempo real
2. Demonstrar diferentes tipos de alertas
3. Mostrar como enfermagem recebe alerta
4. Explicar priorização automática

**Pontos a Destacar:**

- Alertas em tempo real
- Diferentes tipos de alertas
- Priorização automática
- Tempo de resposta reduzido

**Fala:**

> "Quando um sintoma crítico é detectado, a equipe de enfermagem recebe um alerta imediato. Vejam aqui - o paciente João Silva reportou dor intensa há 15 minutos. O sistema classificou isso como crítico e colocou o paciente no topo da lista. Antes, isso poderia levar dias para ser identificado."

---

#### Demo 4: Intervenção Manual (4 min)

**Ações:**

1. Mostrar botão "Assumir Conversa"
2. Demonstrar como enfermagem pode entrar na conversa
3. Enviar mensagem de teste (simulado)
4. Mostrar como marcar caso como resolvido
5. Explicar handoff agente → enfermagem → agente

**Pontos a Destacar:**

- Controle total da equipe
- Intervenção quando necessário
- Transição suave agente → humano
- Rastreabilidade completa

**Fala:**

> "A enfermagem sempre tem controle. Se a equipe decide intervir, pode simplesmente clicar em 'Assumir Conversa' e responder diretamente ao paciente pelo dashboard. A conversa volta para o agente automático quando a enfermagem marca como resolvido. Isso garante que casos complexos sempre tenham atenção humana quando necessário."

---

#### Demo 5: Priorização com IA (3 min)

**Ações:**

1. Mostrar diferentes pacientes com scores variados
2. Explicar razão da priorização (explicabilidade)
3. Demonstrar como score muda em tempo real
4. Mostrar métricas e analytics

**Pontos a Destacar:**

- Score automático (0-100)
- Explicabilidade (razão da priorização)
- Atualização em tempo real
- Validação clínica

**Fala:**

> "O sistema calcula um score de prioridade de 0 a 100 para cada paciente. Vejam aqui - o paciente Maria tem score 85 porque está com dor intensa, estágio IV, e não respondeu ao agente há 3 dias. O sistema explica a razão da priorização, então a equipe entende o porquê. Isso permite validação clínica e transparência."

---

#### Demo 6: Integração com EHR (2 min)

**Ações:**

1. Mostrar dados sincronizados (simulado)
2. Explicar integração FHIR
3. Demonstrar dados estruturados no prontuário

**Pontos a Destacar:**

- Sincronização automática
- Sem duplicação de dados
- Dados estruturados
- Integração com sistemas existentes

**Fala:**

> "Todos os dados coletados pelo agente são automaticamente sincronizados com o EHR do hospital via FHIR. Não há necessidade de duplicar dados - tudo é integrado. Os sintomas reportados pelo paciente aparecem como observações estruturadas no prontuário."

---

### Parte 3: Q&A (10 min)

**Perguntas Frequentes:**

1. **"Como funciona a integração com nosso EHR?"**
   - Integração via HL7/FHIR
   - Suporte para principais EHRs do mercado
   - Time de implementação: 2-4 semanas

2. **"E se o agente der uma resposta errada?"**
   - Guardrails rigorosos
   - Enfermagem sempre pode intervir
   - Agente não faz diagnósticos, apenas coleta dados
   - Validação clínica contínua

3. **"Quanto tempo leva para implementar?"**
   - Setup inicial: 1-2 semanas
   - Integração EHR: 2-4 semanas
   - Piloto: 30 dias
   - Rollout completo: 2-3 meses

4. **"E a segurança dos dados?"**
   - Criptografia end-to-end
   - Compliance LGPD
   - Auditoria completa
   - Isolamento multi-tenant

5. **"Como é o treinamento da equipe?"**
   - Treinamento presencial/remoto
   - Material de apoio
   - Suporte dedicado
   - Curva de aprendizado: 1-2 semanas

---

## 3. Casos de Uso Práticos para Demonstrar

### Caso 1: Detecção Precoce de Complicação

**Cenário:**

- Paciente em quimioterapia
- Reporta dor intensa (8/10) via WhatsApp
- Agente detecta sintoma crítico
- Alerta gerado automaticamente

**Demo:**

1. Mostrar conversa WhatsApp
2. Destacar detecção de sintoma crítico
3. Mostrar alerta em tempo real
4. Demonstrar intervenção da enfermagem

**Mensagem:**

> "Este é um exemplo real de como o sistema pode detectar complicações antes que se tornem graves. Antes, esse paciente poderia esperar dias até a próxima consulta. Agora, a equipe é alertada em minutos."

---

### Caso 2: Priorização Automática

**Cenário:**

- 50 pacientes ativos
- Sistema calcula prioridade automaticamente
- Paciente crítico identificado no topo

**Demo:**

1. Mostrar lista de 50 pacientes
2. Explicar ordenação automática
3. Destacar paciente crítico no topo
4. Mostrar razão da priorização

**Mensagem:**

> "Com 50 pacientes ativos, a equipe não consegue priorizar manualmente de forma eficiente. O sistema faz isso automaticamente, garantindo que casos críticos sejam identificados imediatamente."

---

### Caso 3: Coleta Remota de Dados

**Cenário:**

- Paciente não precisa ir à clínica
- Questionário EORTC QLQ-C30 via conversa
- Dados estruturados automaticamente

**Demo:**

1. Mostrar conversa de questionário
2. Destacar naturalidade da conversa
3. Mostrar dados estruturados extraídos
4. Mostrar dados no EHR

**Mensagem:**

> "O paciente não precisa mais ir à clínica apenas para reportar sintomas. O agente coleta questionários validados de forma conversacional, e os dados são automaticamente estruturados no prontuário."

---

## 4. Materiais de Apoio

### Slides de Apoio

- Problema e solução (2 slides)
- Casos de uso (3 slides)
- ROI (1 slide)
- Próximos passos (1 slide)

### Vídeo Backup

- Vídeo pré-gravado de 10 minutos
- Caso demo ao vivo falhe
- Mesmos casos de uso

### Documentação

- One-pager da plataforma
- Calculadora de ROI (online)
- FAQ completo

---

## 5. Checklist Pós-Demo

**Após a Demo:**

- [ ] Enviar materiais de apoio (one-pager, calculadora ROI)
- [ ] Agendar follow-up em 1 semana
- [ ] Enviar proposta comercial (se aplicável)
- [ ] Coletar feedback da equipe
- [ ] Responder perguntas pendentes

**Follow-up:**

- Email com resumo da demo
- Links para materiais
- Próximos passos
- Contato para dúvidas

---

## 6. Dicas para Sucesso

### Durante a Demo

1. **Foque em Valor, Não em Tecnologia**
   - "Isso reduz readmissões em 25%"
   - Não: "Usamos GPT-4 com RAG"

2. **Use Linguagem do Hospital**
   - "Prontuário", "EHR", "Jornada do paciente"
   - Evite jargões técnicos

3. **Demonstre Problemas Reais**
   - Use casos que o hospital enfrenta
   - Conecte com dores específicas

4. **Seja Transparente sobre Limitações**
   - "O agente não substitui a equipe, apenas coleta dados"
   - "Sempre há supervisão humana"

5. **Envolva a Audiência**
   - Pergunte sobre casos específicos
   - Adapte demo conforme interesse

### Evite

- ❌ Focar demais em tecnologia
- ❌ Prometer resultados impossíveis
- ❌ Ignorar perguntas técnicas
- ❌ Apressar a demo
- ❌ Não ter backup

---

## 7. Scripts de Fala

### Abertura

> "Bom dia/tarde! Obrigado por estarem aqui. Hoje vou demonstrar nossa plataforma de otimização oncológica, que usa IA e WhatsApp para transformar o cuidado com pacientes oncológicos. Vamos ver como isso pode reduzir custos, melhorar resultados e aumentar a eficiência da equipe."

### Transição entre Demos

> "Agora vou mostrar como funciona o sistema de alertas em tempo real..."

### Fechamento

> "Isso é apenas uma visão geral da plataforma. O próximo passo seria um piloto de 30 dias com um grupo pequeno de pacientes para validarmos os resultados. Quais são as principais dúvidas que vocês têm?"

---

## 8. Métricas para Destacar

### Durante a Demo

- ⚡ **Tempo de resposta**: 72 horas → 15 minutos (99% redução)
- 📉 **Readmissões**: 25% de redução
- 💰 **ROI**: 5x - 18x em 12 meses
- 📊 **Adesão a questionários**: 70% (vs. 30% antes)
- 👥 **Eficiência da equipe**: +15%

### Após Implementação (Piloto)

- Coletar métricas reais
- Comparar com baseline
- Ajustar projeções
- Validar ROI real

---

## 9. Próximos Passos

### Após Demo Bem-Sucedida

1. **Semana 1**: Enviar proposta comercial
2. **Semana 2**: Reunião de alinhamento
3. **Semana 3**: Contrato e início de setup
4. **Mês 1-2**: Implementação e integração
5. **Mês 3**: Piloto de 30 dias
6. **Mês 4**: Expansão gradual

---

## 10. Troubleshooting

### Problemas Comuns

**Demo não carrega:**

- Usar vídeo backup
- Continuar apresentação enquanto resolve
- Agendar nova demo técnica

**Pergunta difícil:**

- Ser honesto: "Não tenho certeza, vou verificar e retornar"
- Envolver time técnico se necessário

**Resistência da equipe:**

- Enfatizar supervisão humana
- Destacar benefícios operacionais
- Oferecer piloto pequeno

**Dúvidas sobre custo:**

- Apresentar calculadora de ROI
- Comparar com custos atuais
- Destacar economia de longo prazo

---

**FIM DO GUIA**

# Guardrail: Fontes de Busca na Internet

## Propósito

Este guardrail estabelece regras rigorosas para garantir que apenas fontes médicas confiáveis e qualificadas sejam utilizadas em buscas na internet, protegendo a qualidade e confiabilidade das informações médicas geradas.

## Regra Principal

**⚠️ REGRA OBRIGATÓRIA:**

- **NUNCA** fazer buscas na internet sem especificar domínio confiável (whitelist)
- **SEMPRE** validar que o domínio está na whitelist antes de executar query
- **REJEITAR** automaticamente qualquer query que não especifique domínio da whitelist

## Whitelist de Domínios Confiáveis

### 🏥 Sociedades Médicas BRASILEIRAS

| Domínio                 | Organização | Especialidade/Temas                               |
| ----------------------- | ----------- | ------------------------------------------------- |
| `diretrizes.cardiol.br` | SBC         | Cardiologia (HAS, IC, arritmias, SCA)             |
| `abc.cardiol.br`        | SBC         | Cardiologia (notícias, atualizações)              |
| `diabetes.org.br`       | SBD         | Diabetes (DM1, DM2, gestacional)                  |
| `sbpt.org.br`           | SBPT        | Pneumologia (DPOC, asma, pneumonia)               |
| `sbn.org.br`            | SBN         | Nefrologia (DRC, IRA, diálise)                    |
| `amb.org.br`            | AMB         | Múltiplas especialidades                          |
| `sbh.org.br`            | SBH         | Hematologia                                       |
| `sbcc.org.br`           | SBCC        | Cirurgia Cardiovascular                           |
| `sbgg.org.br`           | SBGG        | Geriatria e Gerontologia                          |
| `sbpc.org.br`           | SBPC        | Pediatria                                         |
| `febrasgo.org.br`       | FEBRASGO    | Ginecologia e Obstetricia                         |
| `sbacv.org.br`          | SBACV       | Angiologia e Cirurgia Vascular                    |
| `sbco.org.br`           | SBCO        | Coloproctologia                                   |
| `sbccp.org.br`          | SBCCP       | Colposcopia e Patologia do Trato Genital Inferior |

### 🏛️ Fontes Governamentais BRASIL

| Domínio              | Organização         | Temas                                                |
| -------------------- | ------------------- | ---------------------------------------------------- |
| `saude.gov.br`       | Ministério da Saúde | Protocolos clínicos (PCDT), programas, epidemiologia |
| `anvisa.gov.br`      | ANVISA              | Medicamentos aprovados, alertas sanitários           |
| `conitec.gov.br`     | CONITEC             | Tecnologias em saúde, pareceres técnicos             |
| `bvsms.saude.gov.br` | BVS                 | Biblioteca Virtual em Saúde                          |
| `portal.anm.org.br`  | ANM                 | Academia Nacional de Medicina                        |

### 🌎 Sociedades Médicas INTERNACIONAIS

#### Estados Unidos

| Domínio               | Organização      | Especialidade                                 |
| --------------------- | ---------------- | --------------------------------------------- |
| `heart.org`           | AHA              | Doenças cardiovasculares                      |
| `ahajournals.org`     | AHA Journals     | Pesquisas cardiovasculares                    |
| `acc.org`             | ACC              | Guidelines cardiológicos                      |
| `diabetes.org`        | ADA              | Standards of care diabetes                    |
| `cdc.gov`             | CDC              | Epidemiologia, vacinação, doenças infecciosas |
| `chestnet.org`        | CHEST            | Doenças pulmonares, TEP                       |
| `fda.gov`             | FDA              | Aprovação de medicamentos, alertas            |
| `nih.gov`             | NIH              | Pesquisas, guidelines                         |
| `mayoclinic.org`      | Mayo Clinic      | Informações sobre doenças                     |
| `clevelandclinic.org` | Cleveland Clinic | Protocolos clínicos                           |
| `hopkinsmedicine.org` | Johns Hopkins    | Pesquisas, tratamentos                        |
| `uptodate.com`        | UpToDate         | Referência médica evidence-based              |

#### Europa

| Domínio        | Organização | Especialidade                     |
| -------------- | ----------- | --------------------------------- |
| `escardio.org` | ESC         | Guidelines cardiológicos europeus |
| `ersnet.org`   | ERS         | Doenças respiratórias             |
| `easd.org`     | EASD        | Diabetes guidelines europeus      |
| `nice.org.uk`  | NICE        | Guidelines britânicos             |
| `cochrane.org` | Cochrane    | Revisões sistemáticas             |

### 📚 Bases de Dados Científicas

| Domínio                   | Organização      | Tipo de Conteúdo                      |
| ------------------------- | ---------------- | ------------------------------------- |
| `pubmed.ncbi.nlm.nih.gov` | PubMed/MEDLINE   | Artigos científicos, revisões         |
| `cochranelibrary.com`     | Cochrane Library | Revisões sistemáticas                 |
| `scholar.google.com`      | Google Scholar   | Artigos acadêmicos (usar com cautela) |

## Regras de Validação

### 1. Validação Obrigatória de Domínio

**ANTES de executar qualquer query de busca web, você DEVE:**

1. **Extrair o domínio da query:**
   - Verificar se contém `site:[domínio]`
   - Se não contém, **ADICIONAR** automaticamente um domínio da whitelist apropriado

2. **Validar que o domínio está na whitelist:**
   - Se o domínio NÃO estiver na whitelist → **REJEITAR** a busca
   - Retornar mensagem: "Domínio não autorizado. Use apenas fontes da whitelist."

3. **Múltiplos domínios na query:**
   - Se a query especificar múltiplos domínios, **TODOS** devem estar na whitelist
   - Se algum não estiver → REJEITAR

### 2. Formato Obrigatório de Queries

**✅ FORMATO CORRETO:**

```python
# web_search
web_search("hipertensão diretriz 2024 site:diretrizes.cardiol.br")

# Firecrawl
mcp_Firecrawl_Web_Search_firecrawl_search(
  query="heart failure guidelines 2023 site:heart.org",
  scrapeOptions={"formats": ["markdown"], "onlyMainContent": true}
)
```

**❌ FORMATO INCORRETO (REJEITAR):**

```python
# Sem site: especificado
web_search("hipertensão diretriz 2024")  # ❌ REJEITAR

# Domínio não autorizado
web_search("hipertensão site:wikipedia.org")  # ❌ REJEITAR

# Múltiplos domínios, um não autorizado
web_search("hipertensão site:diretrizes.cardiol.br OR site:blog.com")  # ❌ REJEITAR
```

### 3. Seleção Automática de Domínio

**Se o usuário não especificar `site:`, você DEVE adicionar automaticamente:**

**Por Especialidade:**

- **Cardiologia**: `site:diretrizes.cardiol.br` (padrão) ou `site:heart.org`
- **Diabetes**: `site:diabetes.org.br` ou `site:diabetes.org`
- **Pneumologia**: `site:sbpt.org.br` ou `site:chestnet.org`
- **Nefrologia**: `site:sbn.org.br`
- **Emergências**: `site:cdc.gov` (epidemiologia) ou `site:heart.org` (RCP)
- **Protocolos MS**: `site:saude.gov.br`

**Por Tipo de Conteúdo:**

- **Diretrizes brasileiras**: `site:diretrizes.cardiol.br` ou domínio específico da sociedade
- **Guidelines internacionais**: `site:heart.org`, `site:acc.org`, `site:escardio.org`
- **Epidemiologia**: `site:saude.gov.br` (BR) ou `site:cdc.gov` (internacional)
- **Aprovação de medicações**: `site:anvisa.gov.br` (BR) ou `site:fda.gov` (EUA)
- **Protocolos clínicos**: `site:saude.gov.br` (PCDT)

### 4. Validação para Firecrawl

**Para `firecrawl_search` e `firecrawl_scrape`:**

1. **firecrawl_search:**
   - Query DEVE conter `site:[domínio]` da whitelist
   - Validar antes de executar

2. **firecrawl_scrape:**
   - URL DEVE pertencer a um domínio da whitelist
   - Extrair domínio da URL e validar
   - Se não autorizado → REJEITAR

**Exemplo de validação:**

```python
# Extrair domínio da URL
url = "https://diretrizes.cardiol.br/diretriz/2024/hipertensao.pdf"
domain = extract_domain(url)  # "diretrizes.cardiol.br"

# Validar
if domain not in WHITELIST_DOMAINS:
    raise ValueError(f"Domínio {domain} não autorizado")
```

## Exceções e Casos Especiais

### ❌ NUNCA Autorizado

- Wikipedia (`wikipedia.org`, `pt.wikipedia.org`)
- Blogs pessoais ou não médicos
- Sites de notícias gerais (mesmo que médicas)
- Redes sociais (Twitter, Facebook, LinkedIn)
- Fóruns médicos (mesmo que populares)
- Sites comerciais de medicamentos/laboratórios
- Qualquer site não listado explicitamente na whitelist

### ⚠️ Casos que Requerem Aprovação Manual

- Novos domínios de sociedades médicas reconhecidas
- Revistas científicas peer-reviewed (avaliar caso a caso)
- Bases de dados acadêmicas adicionais

**Processo:**

1. Identificar necessidade do novo domínio
2. Verificar credibilidade (sociedade reconhecida? peer-reviewed?)
3. Adicionar à whitelist APENAS após validação
4. Documentar motivo da adição

## Implementação Técnica

### Função de Validação (Pseudocódigo)

```python
WHITELIST_DOMAINS = [
    # Sociedades BR
    "diretrizes.cardiol.br",
    "abc.cardiol.br",
    "diabetes.org.br",
    "sbpt.org.br",
    # ... (lista completa acima)

    # Governo BR
    "saude.gov.br",
    "anvisa.gov.br",
    # ...

    # Internacional
    "heart.org",
    "acc.org",
    # ...
]

def validate_web_query(query: str, tool: str) -> bool:
    """
    Valida se a query de busca web está conforme guardrail.

    Args:
        query: String da query de busca
        tool: Ferramenta usada ('web_search', 'firecrawl_search', 'firecrawl_scrape')

    Returns:
        bool: True se válido, False se rejeitado

    Raises:
        ValueError: Se domínio não autorizado
    """
    # 1. Extrair domínio(s) da query
    domains = extract_domains_from_query(query, tool)

    # 2. Se não há domínio, adicionar automaticamente (ou rejeitar)
    if not domains:
        if tool == 'web_search':
            # Para web_search, adicionar domínio padrão baseado no tema
            domain = get_default_domain_for_topic(query)
            if not domain:
                raise ValueError("Query sem domínio especificado e sem contexto para adicionar automaticamente")
        else:
            raise ValueError(f"{tool} requer domínio explícito")

    # 3. Validar cada domínio
    for domain in domains:
        if domain not in WHITELIST_DOMAINS:
            raise ValueError(
                f"Domínio '{domain}' não autorizado. "
                f"Use apenas fontes da whitelist. "
                f"Domínios permitidos: {list_approved_domains_for_category(domain)}"
            )

    return True

def extract_domains_from_query(query: str, tool: str) -> list[str]:
    """Extrai domínios da query."""
    domains = []

    if tool == 'firecrawl_scrape':
        # Extrair da URL
        domain = urlparse(query).netloc
        if domain:
            domains.append(domain)
    else:
        # Extrair de "site:domain.com" na query
        import re
        pattern = r'site:([^\s]+)'
        matches = re.findall(pattern, query)
        domains.extend(matches)

    return domains

def get_default_domain_for_topic(query: str) -> str:
    """Retorna domínio padrão baseado no tema da query."""
    query_lower = query.lower()

    # Mapeamento tema -> domínio padrão
    topic_domain_map = {
        'cardio': 'diretrizes.cardiol.br',
        'hipertensão': 'diretrizes.cardiol.br',
        'diabetes': 'diabetes.org.br',
        'pneumonia': 'sbpt.org.br',
        'dpoc': 'sbpt.org.br',
        'protocolo': 'saude.gov.br',
        'pcdt': 'saude.gov.br',
        # ... mais mapeamentos
    }

    for topic, domain in topic_domain_map.items():
        if topic in query_lower:
            return domain

    # Se não encontrar, retornar domínio mais genérico
    return 'saude.gov.br'  # ou None para forçar especificação
```

### Integração com Comandos

**Nos arquivos `.cursor/commands/resumo.md` e `.cursor/commands/resumo-conciso.md`:**

Adicionar validação antes de cada chamada de busca web:

```python
# ANTES de executar:
validate_web_query(query, tool='web_search')

# Executar se válido:
web_search(query)
```

## Mensagens de Erro Padronizadas

### Erro 1: Query sem Domínio

```
❌ ERRO: Query de busca não especifica domínio confiável.

Solução: Adicione 'site:[domínio]' usando apenas fontes autorizadas:
- Sociedades médicas: site:diretrizes.cardiol.br
- Governo: site:saude.gov.br
- Internacional: site:heart.org

Exemplo correto: "hipertensão diretriz 2024 site:diretrizes.cardiol.br"
```

### Erro 2: Domínio Não Autorizado

```
❌ ERRO: Domínio '[domínio]' não está na whitelist de fontes confiáveis.

Domínios autorizados por categoria:
- Cardiologia: diretrizes.cardiol.br, heart.org
- Diabetes: diabetes.org.br, diabetes.org
- [listar mais...]

Por favor, use um domínio autorizado ou solicite adição à whitelist após validação.
```

### Erro 3: Múltiplos Domínios Não Autorizados

```
❌ ERRO: Query contém domínios não autorizados: [lista]

Todos os domínios especificados devem estar na whitelist.
Remova os domínios não autorizados ou substitua por domínios aprovados.
```

## Logging e Auditoria

**Registrar todas as buscas executadas:**

```python
log_entry = {
    "timestamp": datetime.now(),
    "tool": "web_search" | "firecrawl_search" | "firecrawl_scrape",
    "query": query,
    "domain": extracted_domain,
    "status": "approved" | "rejected",
    "reason": "whitelist" | "auto-added" | "invalid-domain"
}
```

## Manutenção da Whitelist

### Adicionar Novo Domínio

1. **Justificativa:**
   - Documentar por que o domínio adultos é necessário
   - Verificar credibilidade da fonte
   - Confirmar que é organização médica reconhecida

2. **Validação:**
   - ✅ Sociedade médica oficial
   - ✅ Organização governamental de saúde
   - ✅ Instituição acadêmica reconhecida
   - ✅ Base de dados científica peer-reviewed

3. **Documentação:**
   - Adicionar à whitelist com categoria e descrição
   - Atualizar esta documentação
   - Registrar data e motivo da adição

### Remover Domínio

- Se organização perde credibilidade
- Se domínio descontinuado
- Se violação de políticas

## Testes de Validação

### Testes que DEVEM Passar

✅ `web_search("hipertensão site:diretrizes.cardiol.br")`  
✅ `firecrawl_search(query="diabetes site:diabetes.org.br")`  
✅ `firecrawl_scrape(url="https://saude.gov.br/protocolo.pdf")`  
✅ Query sem `site:` mas com auto-seleção de domínio válido

### Testes que DEVEM Falhar

❌ `web_search("hipertensão")` (sem site:)  
❌ `web_search("hipertensão site:wikipedia.org")` (domínio não autorizado)  
❌ `firecrawl_scrape(url="https://blog-medico.com/artigo")` (não autorizado)

## Referências

- Lista completa de sociedades médicas brasileiras: AMB (amb.org.br)
- Sociedades internacionais: Ver whitelist acima
- Critérios de credibilidade: Baseados em guidelines de medicina baseada em evidências

---

## Resumo Executivo

**⚠️ REGRA PRINCIPAL:**

- ✅ SEMPRE especificar `site:[domínio]` da whitelist
- ✅ Se não especificado, adicionar automaticamente domínio apropriado
- ✅ REJEITAR qualquer busca sem domínio válido
- ✅ Validar ANTES de executar qualquer query

**✅ Ações Permitidas:**

- Buscar em domínios da whitelist
- Auto-adicionar domínio se não especificado (com contexto)

**❌ Ações Proibidas:**

- Buscar sem especificar domínio
- Usar domínios fora da whitelist
- Buscar em Wikipedia, blogs, redes sociais, fóruns

**🔧 Implementação:**

- Validar antes de executar
- Rejeitar com mensagem clara
- Registrar para auditoria

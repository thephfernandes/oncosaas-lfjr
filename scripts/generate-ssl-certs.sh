#!/bin/bash

# Script para gerar certificados SSL autoassinados para desenvolvimento local
# Compatível com Windows (Git Bash), Linux e Mac

set -e

echo "🔐 Gerando certificados SSL autoassinados para desenvolvimento local..."

# Criar diretório para certificados se não existir
CERT_DIR="./certs"
mkdir -p "$CERT_DIR"

# Configurações
DOMAIN="localhost"
DAYS=365
KEY_FILE="$CERT_DIR/localhost.key"
CERT_FILE="$CERT_DIR/localhost.crt"
CONFIG_FILE="$CERT_DIR/openssl.conf"

# Criar arquivo de configuração OpenSSL
cat > "$CONFIG_FILE" <<EOF
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
req_extensions = v3_req

[dn]
C=BR
ST=Sao Paulo
L=Sao Paulo
O=ONCONAV Development
OU=Development
CN=localhost

[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = *.localhost
IP.1 = 127.0.0.1
IP.2 = ::1
EOF

# Gerar chave privada
echo "📝 Gerando chave privada..."
openssl genrsa -out "$KEY_FILE" 2048

# Gerar certificado autoassinado
echo "📜 Gerando certificado SSL..."
openssl req -new -x509 -key "$KEY_FILE" -out "$CERT_FILE" -days $DAYS -config "$CONFIG_FILE" -extensions v3_req

# Verificar certificado
echo ""
echo "✅ Certificados gerados com sucesso!"
echo ""
echo "📁 Localização dos arquivos:"
echo "   Chave privada: $KEY_FILE"
echo "   Certificado:   $CERT_FILE"
echo ""
echo "⚠️  IMPORTANTE: Você precisa confiar neste certificado no seu sistema operacional."
echo ""
echo "📋 Próximos passos:"
echo "   1. Instale o certificado no seu sistema operacional"
echo "   2. Configure o Next.js e NestJS para usar HTTPS"
echo "   3. Reinicie os servidores"
echo ""
echo "Para Windows:"
echo "   - Clique duas vezes em $CERT_FILE"
echo "   - Clique em 'Instalar Certificado'"
echo "   - Selecione 'Usuário Atual' ou 'Computador Local'"
echo "   - Selecione 'Colocar todos os certificados no seguinte repositório'"
echo "   - Navegue até 'Repositório de Autoridades de Certificação Raiz Confiáveis'"
echo "   - Clique em Concluir"
echo ""
echo "Para Mac:"
echo "   - Abra Keychain Access"
echo "   - Arraste $CERT_FILE para 'login' ou 'System'"
echo "   - Clique duas vezes no certificado"
echo "   - Expanda 'Trust' e selecione 'Always Trust'"
echo ""
echo "Para Linux:"
echo "   sudo cp $CERT_FILE /usr/local/share/ca-certificates/localhost.crt"
echo "   sudo update-ca-certificates"


#!/usr/bin/env node

/**
 * Script para gerar certificados SSL autoassinados para desenvolvimento local
 * Usa mkcert ou openssl (se disponível)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const certDir = path.join(__dirname, '..', 'certs');
const keyFile = path.join(certDir, 'localhost.key');
const certFile = path.join(certDir, 'localhost.crt');

// Criar diretório se não existir
if (!fs.existsSync(certDir)) {
  fs.mkdirSync(certDir, { recursive: true });
}

console.log(
  '🔐 Gerando certificados SSL autoassinados para desenvolvimento local...\n'
);

// Verificar se mkcert está disponível (mais fácil)
try {
  execSync('mkcert --version', { stdio: 'ignore' });
  console.log('✅ mkcert encontrado! Usando mkcert (recomendado)...\n');

  try {
    // Instalar certificado root do mkcert (se ainda não instalado)
    execSync('mkcert -install', { stdio: 'inherit' });
  } catch (error) {
    // Ignorar se já estiver instalado
  }

  // Gerar certificado com mkcert
  execSync(
    `mkcert -key-file "${keyFile}" -cert-file "${certFile}" localhost 127.0.0.1 ::1`,
    {
      stdio: 'inherit',
      cwd: certDir,
    }
  );

  console.log('\n✅ Certificados gerados com sucesso usando mkcert!');
  console.log('📁 Localização dos arquivos:');
  console.log(`   Chave privada: ${keyFile}`);
  console.log(`   Certificado:   ${certFile}`);
  console.log(
    '\n✨ O certificado já foi instalado como confiável pelo mkcert!'
  );
} catch (mkcertError) {
  // Se mkcert não estiver disponível, tentar OpenSSL
  console.log('⚠️  mkcert não encontrado. Tentando usar OpenSSL...\n');

  try {
    execSync('openssl version', { stdio: 'ignore' });

    // Criar arquivo de configuração OpenSSL
    const configContent = `[req]
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
`;

    const configFile = path.join(certDir, 'openssl.conf');
    fs.writeFileSync(configFile, configContent);

    // Gerar chave privada
    console.log('📝 Gerando chave privada...');
    execSync(`openssl genrsa -out "${keyFile}" 2048`, { stdio: 'inherit' });

    // Gerar certificado autoassinado
    console.log('📜 Gerando certificado SSL...');
    execSync(
      `openssl req -new -x509 -key "${keyFile}" -out "${certFile}" -days 365 -config "${configFile}" -extensions v3_req`,
      { stdio: 'inherit' }
    );

    console.log('\n✅ Certificados gerados com sucesso usando OpenSSL!');
    console.log('📁 Localização dos arquivos:');
    console.log(`   Chave privada: ${keyFile}`);
    console.log(`   Certificado:   ${certFile}`);
    console.log(
      '\n⚠️  IMPORTANTE: Você precisa confiar neste certificado no seu sistema operacional.'
    );
    console.log('\n📋 Para instalar o certificado:');
    console.log('\n   Windows:');
    console.log('   - Clique duas vezes em', certFile);
    console.log('   - Clique em "Instalar Certificado"');
    console.log('   - Selecione "Usuário Atual"');
    console.log(
      '   - Selecione "Colocar todos os certificados no seguinte repositório"'
    );
    console.log(
      '   - Navegue até "Repositório de Autoridades de Certificação Raiz Confiáveis"'
    );
    console.log('   - Clique em Concluir');
    console.log('\n   Mac:');
    console.log('   - Abra Keychain Access');
    console.log(`   - Arraste ${certFile} para "login"`);
    console.log('   - Clique duas vezes no certificado');
    console.log('   - Expanda "Trust" e selecione "Always Trust"');
    console.log('\n   Linux:');
    console.log(
      `   sudo cp ${certFile} /usr/local/share/ca-certificates/localhost.crt`
    );
    console.log('   sudo update-ca-certificates');
  } catch (opensslError) {
    console.error('\n❌ Erro: Nem mkcert nem OpenSSL foram encontrados!');
    console.error('\n📋 Instale uma das opções:');
    console.error('\n   Opção 1 - mkcert (Recomendado):');
    console.error('   Windows: choco install mkcert');
    console.error('   Mac: brew install mkcert');
    console.error(
      '   Linux: https://github.com/FiloSottile/mkcert#installation'
    );
    console.error('\n   Opção 2 - OpenSSL:');
    console.error('   Windows: choco install openssl');
    console.error('   Mac: brew install openssl');
    console.error('   Linux: sudo apt-get install openssl');
    process.exit(1);
  }
}

console.log('\n🎉 Pronto! Agora configure os servidores para usar HTTPS.\n');

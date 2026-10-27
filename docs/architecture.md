# AlugaFácil Pro — Documentação Técnica e Arquitetura

## 1. Visão Geral da Arquitetura
O **AlugaFácil Pro** é um portal imobiliário completo com múltiplos proprietários (multi-tenant) voltado para locação imobiliária com foco em Presidente Dutra e municípios do Maranhão, expansível para todo o Brasil.

A aplicação adota:
- **Frontend:** Next.js 15+ (App Router) com React 19 e Tailwind CSS.
- **PWA (Progressive Web App):** Manifesto web, ícones 192px/512px com safe-zone maskable, hook `usePWAInstall` e suporte para instalação no Android, Desktop e iOS Safari.
- **Backend Privilegiado:** Rotas API em Next.js (`/api/admin/action`) para validação e execução de ações sensíveis (conferência de pagamentos manuais PIX, moderação de imóveis, alteração de status e geração de trilha de auditoria).
- **Banco de Dados & Autenticação:** Cloud Firestore provisionado com ID específico e Firebase Authentication com verificação de papéis (RBAC Zero-Trust).
- **Segurança:** Regras de segurança Firestore (`firestore.rules`) implementando o princípio do menor privilégio, bloqueando escalada de privilégios de clientes e ocultando dados residenciais privados da consulta pública de visitantes.

## 2. Modelo de Dados (Firestore)
- `/users/{uid}`: Perfil do anunciante com papéis `proprietario`, `imobiliaria` ou `admin`.
- `/admins/{uid}`: Coleção restrita de administradores autorizados.
- `/properties/{propertyId}`: Anúncios imobiliários com controle de moderação (`pending`, `approved`, `rejected`), status de locação (`published`, `rented`, `draft`) e expiração de destaque (`featuredUntil`).
- `/plans/{planId}`: Planos comerciais (Gratuito, Proprietário Pro, Imobiliária).
- `/subscriptions/{subscriptionId}`: Assinaturas ativas dos proprietários.
- `/charges/{chargeId}`: Cobranças manuais com status `pending`, `confirmed`, `rejected` ou `refunded`.
- `/propertyEvents/{eventId}`: Métricas de visualização, cliques no WhatsApp e compartilhamentos.
- `/reports/{reportId}`: Denúncias de anúncios por visitantes.
- `/notifications/{notificationId}`: Notificações em tempo real para os usuários.
- `/auditLogs/{logId}`: Registro cronológico e imutável de todas as ações administrativas.
- `/platformSettings/global-settings`: Configurações dinâmicas de cidades atendidas, valores de destaque e dados bancários para PIX.

## 3. Integração WhatsApp
Conforme a Seção 11 da especificação, as mensagens de contato são construídas com normalização de números telefônicos brasileiros (DDD válido entre 11 e 99 + prefixo nacional 55) e codificação URI de mensagem com o código de referência do imóvel (ex: `AF-PROP01`).

## 4. Testes Automatizados Executados
Executados via `node tests/business-logic.test.mjs` com **8/8 testes aprovados**:
1. Formatação de moeda brasileira BRL (centavos para R$).
2. Validação e normalização de números de WhatsApp com DDD.
3. Geração de mensagem oficial com código de referência imobiliária.
4. Expiração automática de destaques pagos.
5. Enforcement de limites de anúncios por plano contratado.
6. Bloqueio de auto-aprovação de anúncios por proprietários.
7. Bloqueio de auto-confirmação de pagamentos pelo cliente.
8. Ocultação de dados residenciais privados (LGPD) para visitantes.

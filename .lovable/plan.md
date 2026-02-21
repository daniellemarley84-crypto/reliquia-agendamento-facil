# Relíquia Barber — Sistema de Agendamento

## Visão Geral

Site de agendamento para a barbearia **Relíquia Barber**, com tema escuro (preto fosco, cinza e branco), logo da empresa, autenticação de clientes e sistema de agendamento com seleção de serviços, horários e data.

---

## 1. Tela de Login

- Campos: **Email** e **Senha**
- Botão "Entrar"
- Link para tela de Cadastro
- Logo da Relíquia Barber centralizada no topo
- Design escuro e elegante

## 2. Tela de Cadastro

- Campos obrigatórios: 
  - **Nome Completo (Obrigatório)**
  - **Data de Nascimento** (com máscara DD/MM/AAAA)
  - **Número de Contato** (com máscara de DDD — ex: (85) 99741-0934)
  - **Email**
  - **Senha** (mínimo 6 caracteres, com validação)
- Botão "Cadastrar"
- Link para voltar ao Login

## 3. Área Logada — Sidebar com Abas

Layout inspirado na imagem de referência (cashbarber), com sidebar lateral contendo a logo da Relíquia Barber no topo e as seguintes abas:

### Aba 1: Agendamentos

- **Seleção de Serviços**: Lista de serviços disponíveis com checkbox (os serviços serão cadastrados futuramente pelo admin)
- **Calendário**: Seleção de dia do mês
- **Horários disponíveis** (seleção única):
  - 09:00, 09:45, 10:30, 11:15, 12:00
  - 15:00, 15:45, 16:30, 17:15, 18:00, 18:45, 19:30, 20:15
- Botão "Agendar" para confirmar

### Aba 2: Localização

- Endereço: **Caucaia, Jurema, Rua Idealista 886**
- Mapa estático ou embed do Google Maps com o endereço

### Aba 3: Suporte

- Link para WhatsApp: wa.me/+5585997410934
- Link para Instagram: @reliquiabarber_

### Aba 4: Pagar

- Resumo dos serviços agendados pelo cliente
- Valor total de consumo calculado automaticamente

### Aba 5: Sair

- Desloga o usuário e redireciona para a tela de Login

---

## 4. Backend (Supabase / Lovable Cloud)

- **Autenticação**: Login e cadastro via email/senha com Supabase Auth
- **Tabela de perfis**: Nome, data de nascimento, telefone
- **Tabela de serviços**: Nome e preço (para o admin cadastrar depois)
- **Tabela de agendamentos**: Cliente, serviço(s), data, horário

## 5. Design

- **Cores**: Preto fosco (#1a1a1a), cinza (#333/#666), branco
- **Logo**: Imagem PNG da Relíquia Barber usada na sidebar e nas telas de login/cadastro
- **Estilo**: Visual elegante e masculino, tipografia clean
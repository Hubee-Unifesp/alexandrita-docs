sidebar_position: 9
title: Tela de Login

# Tela de Login

A página de autenticação ("Login") possui 1 tela: uma área de Login exigindo campos obrigatórios como E-mail e Senha. Todo o design foi concebido para suportar na perfeição os modos claro e escuro, estando desenhado tanto para ecrãs desktop como para mobile (largura de 375px).

## Formulário e Campos
O formulário recolhe as credenciais essenciais para o acesso à plataforma:
* **E-mail:** Campo de texto normalizado para a identificação do utilizador.
* **Senha:** Campo de palavra-passe que inclui um botão lateral (ícone de olho) para revelar ou ocultar os carateres.
* **Lembre-me:** Caixa de seleção (*checkbox*) opcional para memorizar a sessão.
* **Recuperação:** Link "Esqueci a senha", posicionado de forma estática no ecrã.
* **Ações:** O formulário inclui o botão principal de submissão ("Entrar") e um link no rodapé para novos utilizadores ("Ainda não tem uma conta Hubee? Crie uma conta").

## Estados de Autenticação e Validação

* **Campos de texto:** Prevêem os estados "Com foco" (contorno destacado), "Preenchido" e "Erro" (exibindo o campo com borda vermelha e mensagem de validação, "Use o formato seunome@email.com").
* **Botão primário ("Entrar"):** O botão de ação altera visualmente entre:
  * *Habilitado/Entrando* 
  * *Desabilitado* 
* **Alerta geral de erro**  
* *"E-mail ou senha inválidos"* para falhas gerais de autenticação.
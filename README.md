# 🐾 VetPlus - Sistema Web para Clínica Veterinária

**Desenvolvedor:** Matheus Furlan Cota
**Objetivo:** Sistema web full-stack desenvolvido para gerenciar pacientes (animais), registrar serviços clínicos e controlar o acesso de usuários através de autenticação.

---

## 🚀 Funcionalidades

*   **🔒 Módulo de Autenticação:** Sistema de login e cadastro de usuários para controle de acesso seguro à plataforma.
*   **🐕 Cadastro de Pacientes:** Registro detalhado de animais com informações de espécie, raça, dados de nascimento e vínculo com o tutor.
*   **🩺 Registro de Serviços:** Lançamento de consultas, exames, vacinas, cirurgias e internações com valores e observações.
*   **📋 Histórico Clínico:** Consulta rápida de todo o histórico de procedimentos realizados por paciente.

---

## 💻 Tecnologias Utilizadas

### Camada de Apresentação (Front-end)
*   **Recursos:** HTML5, CSS3, JavaScript (Vanilla JS / Fetch API).
*   **Descrição:** Interface responsiva para interação do usuário e comunicação assíncrona com a API via requisições HTTP (GET/POST) para login, cadastros e consultas.

### Camada Lógica / API (Back-end)
*   **Recursos:** PHP 8+ (Lógica Pura).
*   **Descrição:** API RESTful que gerencia as requisições, validações de regras de negócio, rotas e comunicação com o banco de dados.

### Camada de Persistência (Banco de Dados)
*   **Recursos:** SQLite (via PDO PHP).
*   **Descrição:** Armazenamento leve, local e persistente dos dados estruturados em tabelas relacionais.

---

## 🏗️ Arquitetura e Modelagem de Dados

**Arquitetura Implementada:** 
O sistema segue a arquitetura em camadas (*Three-Tier Architecture*), desacoplando totalmente o Front-end (Camada de Apresentação) do Back-end (Camada de Lógica) através de uma API estruturada.

---

## ⚙️ Como Executar o Projeto Localmente

Este projeto foi construído para ser de fácil execução. Ele utiliza o servidor web do **XAMPP**, mas **não exige** a importação manual de tabelas no phpMyAdmin, pois a própria aplicação gera as tabelas no arquivo SQLite embutido.

### Pré-requisitos
* Ter o [XAMPP](https://www.apachefriends.org/pt_br/index.html) instalado no seu computador.
* Um navegador web atualizado.

### Passo a Passo
1. Faça o download ou clone este repositório.
2. Copie a pasta principal do projeto (contendo as subpastas `frontend`, `backend` e `database`) e cole dentro do diretório **`htdocs`** do seu XAMPP (o padrão do Windows é `C:\xampp\htdocs`).
3. Abra o **Painel de Controle do XAMPP** e clique em "Start" apenas no módulo **Apache** (o módulo MySQL não precisa ser ativado).
4. Abra o seu navegador e digite a URL correspondente à pasta do Front-end. Exemplo: 
   `http://localhost/NOME_DA_SUA_PASTA/frontend/index.html`
5. Pronto! O sistema já estará rodando e pronto para uso.

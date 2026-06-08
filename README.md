# Biblioteca_ReactNative

## 📱 Sobre o Projeto

Este projeto consiste em um **aplicativo mobile de gerenciamento de biblioteca**, desenvolvido em **React Native** com **TypeScript**. A aplicação foi projetada para atender três perfis distintos de usuários, centralizando o fluxo de leitura, empréstimos e organização de um acervo literário de forma intuitiva.

## Vídeo de apresentação

- [Link do vídeo disponível no YouTube](https://youtu.be/AsJhssZGdqk)


### 📁 Estrutura do Projeto

```Biblioteca Mobile
src/
├── components/
│   ├── Lib/
│   │   ├── LibHeader.tsx
│   │   ├── LibInventory.tsx
│   │   ├── LibLoansTab.tsx
│   │   ├── LibNavBar.tsx
│   │   ├── LibProfile.tsx
│   │   └── LibRequestsTab.tsx
│   ├── styles/
│   │   ├── UserHeader.styles.ts
│   │   ├── UserLoans.styles.ts
│   │   └── UserProfile.styles.ts
│   └── User/
│       ├── Loans.tsx
│       ├── NetflixCatalogTypo.tsx
│       ├── UserCatalog.tsx
│       ├── UserHeader.tsx
│       └── UserProfile.tsx
├── data/
├── screens/
│   ├── Admin/
│   │   ├── AddBookScreen.tsx
│   │   └── BookDetailScreen.tsx
│   ├── Auth/
│   │   ├── AuthScreen.tsx
│   │   └── Registerscreen.tsx
│   ├── Home/
│   │   └── HomeScreen.tsx
│   ├── Librarian/
│   │   └── LibrarianApp.tsx
│   └── User/
│       └── UserApp.tsx
├── services/
│   ├── bookService.ts
│   ├── Bookstorageservice.ts
│   ├── Loanrequestservice.ts
│   ├── profileStorage.ts
│   └── userservice.ts
└── types.ts 
```
* **`components/`**: Componentes reutilizáveis da interface, divididos entre a visão da biblioteca (`Lib`), do usuário (`User`) e arquivos de estilização (`styles`).
* **`screens/`**: Telas completas da aplicação, organizadas por fluxos e níveis de acesso (Admin, Autenticação, Home, Bibliotecário e Usuário).
* **`services/`**: Módulos responsáveis pelas requisições de API, regras de negócio e persistência de dados (como gerenciamento de livros, empréstimos e usuários).
* **`types.ts`**: Definições de tipos e interfaces globais do TypeScript.

### 👥 Perfis de Acesso e Funcionalidades

O aplicativo divide suas telas e permissões com base no tipo de usuário:

* **👤 Usuário (Leitor):** Pode navegar pelo catálogo de livros (com interface inspirada no estilo de carrosséis da Netflix), visualizar detalhes das obras, gerenciar seu perfil e solicitar empréstimos de livros.
* **📚 Bibliotecário:** Responsável por gerenciar a fila de requisições, analisar os pedidos de empréstimos feitos pelos usuários e controlar o histórico de devoluções.
* **⚙️ Administrador:** Possui controle total sobre o acervo, permitindo cadastrar novos livros, editar informações e gerenciar os dados gerais do sistema.

### 🛠️ Arquitetura e Dados

Para viabilizar a entrega do escopo completo e garantir a autonomia do aplicativo mobile dentro do prazo acadêmico, o projeto utiliza uma **API Mockada** estruturada na camada de serviços (`src/services/`). Essa abordagem simula perfeitamente as operações de requisição, persistência de dados e autenticação, tornando o aplicativo totalmente funcional e independente de um servidor externo ativo.

## ⚠️ Disclaimer: Status da API e Integração

Durante o desenvolvimento do projeto, a equipe iniciou a criação de uma API dedicada utilizando **Spring Boot** (cujos modelos e estrutura inicial ainda se encontram neste repositório no diretório `API-Bilioteca/`). 

No entanto, conforme as diretrizes do projeto permitiam a escolha entre uma API própria ou uma estrutura mockada, optamos por seguir com uma **API Mockada** para garantir a entrega das funcionalidades mobile dentro do prazo e focar na experiência do aplicativo em **React Native**.

* **Status Atual:** A API em Spring Boot está descontinuada e serve apenas como histórico de desenvolvimento.
* **Solução Adotada:** O aplicativo consome dados simulados (mocks) através dos arquivos localizados na pasta `src/services/`, garantindo o funcionamento completo de todas as telas (Admin, Usuário e Bibliotecário) sem dependências externas complexas.
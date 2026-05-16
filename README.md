#  Sistema de Monitoramento com IA

Este é um sistema completo (Fullstack) de monitoramento que utiliza **Inteligência Artificial (Visão Computacional)** para detectar e contar objetos em imagens. O projeto foi arquitetado utilizando microsserviços e está totalmente conteinerizado com Docker.

##  Resumo do Sistema

O sistema permite que o usuário faça o upload de uma imagem através de uma interface web. Essa imagem é enviada para uma API REST de alta performance que processa a foto utilizando o modelo **YOLOv8**, identificando objetos (como pessoas, carros, animais, etc) e demarcando-os na imagem.

Após a detecção, o backend salva um registro no banco de dados contendo o nome do arquivo e a contagem de cada classe detectada (em formato JSON) e devolve a imagem processada para ser exibida no frontend.

### ✨ Principais Funcionalidades
- **Detecção Avançada:** Identificação e contagem de objetos em imagens usando YOLOv8.
- **Filtro de Classes:** Capacidade de focar a detecção apenas em objetos de interesse digitados pelo usuário (ex: `person, car`).
- **Ajuste de Confiança (Threshold):** Controle deslizante para definir a certeza mínima exigida pela IA, evitando falsos positivos.
- **Dashboard de Estatísticas:** Painel em tempo real com o consolidado de imagens processadas e ranking dos objetos mais detectados.
- **Histórico Persistente:** Tabela completa com todas as predições realizadas, armazenadas de forma segura no MySQL.
- **Gerenciamento de Dados:** Opção para exportar o histórico de detecções para formato CSV ou realizar a limpeza da base de dados.

###  Tecnologias Utilizadas

- **Frontend:** React + Vite
- **Backend:** Python + FastAPI
- **Inteligência Artificial:** Ultralytics (YOLOv8) + OpenCV
- **Banco de Dados:** MySQL 8.0
- **Infraestrutura:** Docker e Docker Compose

---

##  Como rodar localmente

Como o projeto utiliza Docker, você não precisa instalar o Python, Node.js ou MySQL diretamente na sua máquina. Apenas certifique-se de ter o **[Docker](https://www.docker.com/)** e o **Docker Compose** instalados.

### Passo a Passo

1. **Clone o repositório** para a sua máquina local:
   ```bash
   git clone https://github.com/JulioR2022/monitoramento.git
   cd monitoramento
   ```

2. **Inicie os contêineres** através do Docker Compose:
   ```bash
   docker-compose up --build
   ```
3. **Acesse a aplicação:**
   - **Frontend (Interface Web):** Abra o seu navegador e acesse [http://localhost:5173](http://localhost:5173)
   - **Backend (Swagger UI):** Acesse a documentação interativa da API em [http://localhost:8000/docs](http://localhost:8000/docs)

### Acesso ao Sistema
Ao acessar a aplicação web, será solicitada a autenticação na tela inicial. Você pode:
- **Fazer login como Administrador:** Utilize as credenciais padrão já criadas pelo sistema (Usuário: `admin` | Senha: `admin`).
- **Criar uma nova conta:** Clique no botão "Não tem conta? Registre-se" na tela de login para criar um acesso personalizado.

## Infraestrutura e Docker
Este projeto foi otimizado utilizando os conceitos de Base Image e Layer Caching do Docker. Bibliotecas pesadas,como YOLOv8 e OpenCV, e dependências de processamento de imagem foram isoladas em uma imagem base pública (juliorsilva/monitoramento-base) hospedada no Docker Hub. Isso permite que a inicialização local do projeto ou a pipeline de deploy na nuvem ocorram em segundos, eliminando os gargalos de compilação e o longo tempo de download dos pesos do modelo de IA que ocorreriam em uma configuração tradicional.

###  Parando a aplicação

Para parar e remover os contêineres, basta pressionar `CTRL+C` no terminal onde o projeto está rodando, ou executar o seguinte comando em outra aba:
```bash
docker-compose down
```

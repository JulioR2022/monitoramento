#  Sistema de Monitoramento com IA

Este é um sistema completo (Fullstack) de monitoramento que utiliza **Inteligência Artificial (Visão Computacional)** para detectar e contar objetos em imagens. O projeto foi arquitetado utilizando microsserviços e está totalmente conteinerizado com Docker.

##  Resumo do Sistema

O sistema permite que o usuário faça o upload de uma imagem através de uma interface web. Essa imagem é enviada para uma API REST de alta performance que processa a foto utilizando o modelo **YOLOv8**, identificando objetos (como pessoas, carros, animais, etc) e demarcando-os na imagem.

Após a detecção, o backend salva um registro no banco de dados contendo o nome do arquivo e a contagem de cada classe detectada (em formato JSON) e devolve a imagem processada para ser exibida no frontend.

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
   git clone https://github.com/seu-usuario/monitoramento.git
   cd monitoramento
   ```

2. **Inicie os contêineres** através do Docker Compose:
   ```bash
   docker-compose up --build
   ```
   *(Nota: A primeira execução pode levar alguns minutos, pois o Docker irá baixar as imagens do MySQL, instalar as dependências do Python/React e realizar o download automático dos pesos do modelo YOLOv8).*

3. **Acesse a aplicação:**
   - **Frontend (Interface Web):** Abra o seu navegador e acesse [http://localhost:5173](http://localhost:5173)
   - **Backend (Swagger UI):** Acesse a documentação interativa da API em [http://localhost:8000/docs](http://localhost:8000/docs)

###  Parando a aplicação

Para parar e remover os contêineres, basta pressionar `CTRL+C` no terminal onde o projeto está rodando, ou executar o seguinte comando em outra aba:
```bash
docker-compose down
```
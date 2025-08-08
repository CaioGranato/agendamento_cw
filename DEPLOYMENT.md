# Guia de Implantação

Este guia descreve como implantar e atualizar a aplicação no ambiente de produção (VPS Hetzner com Docker Swarm e Portainer).

## 1. Configuração Inicial (Primeira Vez)

1.  **Acesse sua VPS:**
    ```bash
    ssh seu_usuario@ip_da_vps
    ```

2.  **Clone o Repositório:**
    ```bash
    git clone <URL_DO_SEU_REPOSITORIO>
    cd <NOME_DO_REPOSITORIO>
    ```

3.  **Crie o Arquivo de Variáveis de Ambiente:**
    Copie o arquivo de exemplo para criar o seu arquivo de produção `.env`.
    ```bash
    cp .env.example .env
    ```

4.  **Edite o Arquivo `.env`:**
    Abra o arquivo `.env` com um editor de texto (como `nano` ou `vim`) e preencha **todas** as variáveis com os seus valores de produção (chaves de API, URLs, etc.).
    ```bash
    nano .env
    ```

5.  **Faça o Deploy via Portainer:**
    *   Acesse sua instância do Portainer.
    *   Vá para **Stacks** no menu lateral.
    *   Clique em **Add Stack**.
    *   Dê um nome para o stack (ex: `agendamento-cw`).
    *   Selecione a opção **Web editor**.
    *   Copie todo o conteúdo do arquivo `docker-compose.stack.yml` do repositório e cole no editor.
    *   Certifique-se de que as variáveis de ambiente do seu arquivo `.env` estão disponíveis para o Portainer.
    *   Clique em **Deploy the stack**.

## 2. Atualizando a Aplicação

Sempre que houver uma nova versão do código no GitHub que você queira implantar:

1.  **Acesse sua VPS e Puxe as Alterações:**
    ```bash
    cd <NOME_DO_SEU_REPOSITORIO>
    git pull
    ```

2.  **Atualize o Stack no Portainer:**
    *   Acesse sua instância do Portainer.
    *   Vá para **Stacks** e selecione o seu stack (`agendamento-cw`).
    *   Na página do stack, clique no botão **Update the stack**.
    *   **Importante:** Marque a opção **Re-pull image and redeploy** para forçar o Docker a reconstruir as imagens com o código mais recente.
    *   Clique em **Update**.

O Portainer irá baixar as novas imagens, parar os contêineres antigos e iniciar os novos com a versão atualizada, tudo de forma transparente e gerenciado pelo Traefik.

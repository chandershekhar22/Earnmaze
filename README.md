# Svelte Kit Project

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev
```

## Publishing to GitLab Registry

1. **Build the Docker image:**
    ```sh
    docker build -t registry.gitlab.com/earnmaze/em-panel .
    ```

2. **Login to GitLab Container Registry:**
    ```sh
    docker login registry.gitlab.com
    ```

3. **Push the image to GitLab:**
    ```sh
    docker push registry.gitlab.com/earnmaze/em-panel
    ```
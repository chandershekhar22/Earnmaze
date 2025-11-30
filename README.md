# Svelte Kit Project

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev
```

## Building

Solid apps are built with _presets_, which optimise your project for deployment to different environments.

By default, `npm run build` will generate a Node app that you can run with `npm start`. To use a different preset, add it to the `devDependencies` in `package.json` and specify in your `app.config.js`.

# pm-portal

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
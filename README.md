## Setup

```
$ nvm use # uses node version in .nvmrc
$ yarn install
```

This project uses **Yarn 4** managed by **Corepack** and declares:

```json
"packageManager": "yarn@4.12.0"
```

### If you have Yarn 1 globally and see a packageManager error

If running `yarn` shows an error like:

> This project's package.json defines "packageManager": "yarn@4.12.0". However the current global version of Yarn is 1.22.x.

do the following once on your machine:

```bash
# 1) Remove global Yarn (optional but recommended)
npm uninstall -g yarn

# 2) Enable Corepack (shipped with Node 16.9+ / 14.19+)
corepack enable

# 3) Set Yarn 1.x as the default for projects WITHOUT packageManager
corepack prepare yarn@1.22.22 --activate
```

Then, in this project (normal case, once Corepack is enabled):

```bash
nvm use                 # use the version from .nvmrc
yarn install
```

If for some reason `yarn --version` still shows `1.x` inside this repo (for example due to old Corepack state), prepare the Yarn 4 binary without changing the global default or `package.json`:

```bash
COREPACK_ENABLE_AUTO_PIN=0 corepack prepare yarn@4.12.0
yarn --version          # should now print 4.12.0
yarn install
```

After this:

-   This repo will use **Yarn 4.12.0**.
-   Other repos without `packageManager` will keep using **Yarn 1.22.22** (or whatever you activated with `corepack prepare`).

## Development

Start development server:

```
$ VITE_PORT=8082 VITE_DHIS2_BASE_URL="https://play.dhis2.org/dev" yarn start
```

Linting:

```
$ yarn lint
```

## Tests

Run unit tests:

```
$ yarn test
```

## Build app ZIP

```
$ yarn build-webapp
```

## Some development tips

### Structure

-   `i18n/`: Contains literal translations (gettext format)
-   `public/`: Main app folder with a `index.html`, exposes the APP, contains the feedback-tool
-   `src/pages`: Main React components.
-   `src/components`: Reusable React components.
-   `src/models`: Models that encapsulate all the logic of the app (React components should only contain view logic).
-   `src/types`: `.d.ts` file types for modules without TS definitions.
-   `src/utils`: Misc utilities.
-   `src/locales`: Auto-generated, don't change nor add to version control.

### i18n

```
$ yarn update-po
# ... add/edit translations in i18n/*.po files ...
$ yarn localize
```

### App context

File `src/contexts/app-context.ts` holds some general app context so typical infrastructure objects (`api`, `d2`, `currentUser`...) are readily available. Add your own global objects if necessary.

```
import { useAppContext } from "./path/to/contexts/app-context";

const SomeComponent: React.FunctionComponent = () => {
    const { d2, api, currentUser } = useAppContext();
    // ...
}
```

### App logo

Add `VITE_LOGO_PATH` to change the path from where the app is loading the logo image on Homepage. Since the root path is `public`, the variable value must be preceded by `img/`. By default, if the value is left blank, WHO logo will show up.

### Build as a library

```bash
yarn build-lib
```

### Example

```bash
yarn add @eyeseetea/training-component
```

```tsx
import { TutorialModule } from "@eyeseetea/training-component";

function MyComponent() {
    const { api } = useAppContext();
    const [showTutorial, setShowTutorial] = React.useState(true);

    return (
        <TutorialModule
            moduleId="data-entry"
            onExit={() => setShowTutorial(false)}
            onHome={() => setShowTutorial(false)}
            locale="en"
            baseUrl={api.baseUrl}
        />
    );
}
```

Tutorials were build for being executed in the whole page so it's a good idea to use them inside a full screen component like Dialog.

```tsx
import { TutorialModule } from "@eyeseetea/training-component";

function MyComponent() {
    const { api } = useAppContext();
    const [showTutorial, setShowTutorial] = React.useState(false);

    const openTutorial = React.useCallback(() => {
        setShowTutorial(true);
    }, []);

    return (
        <>
            <button onClick={openTutorial}>Open Tutorial</button>
            <Dialog open={showTutorial} fullScreen>
                <TutorialModule
                    moduleId="data-entry"
                    onExit={() => setShowTutorial(false)}
                    onHome={() => setShowTutorial(false)}
                    locale="en"
                    baseUrl={api.baseUrl}
                />
            </Dialog>
        </>
    );
}
```

If you have problems to see the images in your LOCAL environment you'll need to redirect the following urls:

```bash
"^/dhis2": "/",
"^/documents/": "/api/documents/",
"^/api/": "/api/",
```

If you're using an older version of our [skeleton app](https://github.com/EyeSeeTea/dhis2-app-skeleton) you can modify the `setupProxy.js` file:

```js
const proxy = createProxyMiddleware({
    target: targetUrl,
    auth,
    logLevel,
    changeOrigin: true,
    pathRewrite: {
        "^/dhis2": "/",
        "^/documents/": "/api/documents/",
        "^/api/": "/api/",
    },
    onProxyReq: function (proxyReq, req, res) {
        const { path } = proxyReq;
        const shouldRedirect = redirectPaths.some(redirectPath => path.startsWith(redirectPath));

        if (shouldRedirect) {
            const redirectUrl = targetUrl.replace(/\/$/, "") + path;
            res.location(redirectUrl);
            res.sendStatus(302);
        }
    },
});

app.use(["/dhis2", "/documents", "/api"], proxy);
```

For the latest version you must edit `vite.config.ts` and add the following entries in the `getProxy` method:

```ts
"/documents": {
    target: targetUrl,
    changeOrigin: true,
    auth: auth,
    rewrite: path => path.replace(/^\/documents/, "/api/documents"),
},
"/api": {
    target: targetUrl,
    changeOrigin: true,
    auth: auth,
    rewrite: path => path.replace(/^\/api/, "/api"),
},
```

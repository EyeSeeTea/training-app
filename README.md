#dhis2-app-skeleton

## Tests

```
$ yarn test
```

## Build

Creates `PACKAGE_NAME.zip`:

```
$ yarn build-webapp
```

## i18n

### Update existing language

```
$ yarn extract-pot && yarn update-po
# edit po files
$ yarn localize
```

### Create a new language (LOCALE)

```
$ cp i18n/en.pot i18n/LOCALE.po
# edit po file
$ yarn localize
```

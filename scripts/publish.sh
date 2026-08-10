#!/bin/bash
set -e -u -o pipefail

version=$(jq <package.json -r '.version')

publish_opts=()
if echo "$version" | grep -q beta; then
    publish_opts+=(--tag beta)
fi

yarn build-lib
npm publish "${publish_opts[@]}" --access public dist/
git tag -a "v$version" -m "Bump version" -f
git push --force origin "v$version"

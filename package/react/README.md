# Pikachu React SDK

This repository is a react sdk for integrating pikachu server api.

## Getting started

Clone the [Pikach|(https://github.com/SteamShon/pikachu.git)], then checkout example/nextjs project for usages.

It is not published npm yet, so go through following steps to locally test the package.

Let's assume your CRA is "my-app".

```
cd packages/react
yarn link
```

cd to "my-app" then run command

```
yarn link "@pikachu/react"
```

now In your CRA app, you can use this package as it's linked locally

```
import { usePikach } from '@pikachu/react';
```

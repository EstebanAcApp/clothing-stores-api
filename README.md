<p align="center">
  <img src="https://i.postimg.cc/d38JfYRX/Clothing-Stores-API-Logo.png" alt="ClothingStoresAPI-Logo" width="400" height="auto" />
</p>

<p align="center">API designed for clothing stores use, developed in NestJS, utilizing S3, MercadoPago, and Neon.</p>
<p align="center">
  <a href="https://nodejs.org" target="_blank"><img src="https://img.shields.io/badge/versión-v24.16.0-green?label=NodeJS&logo=nodedotjs&logoColor=white" alt="Version 24.16.0"></a>
  <a href="https://www.npmjs.com" target="_blank"><img src="https://img.shields.io/badge/versión-v11.16.0-green?label=npm&logo=npm&logoColor=white" alt="Version 11.16.0"></a>
  <a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/badge/versión-v11.0.1-green?label=NestJS&logo=nestjs&logoColor=white" alt="Version 11.0.1"></a>
  <a href="https://neon.com/docs/introduction" target="_blank"><img src="https://img.shields.io/badge/versión-v18-green?label=Neon&logo=neon&logoColor=white" alt="Version 18"></a>
  <a href="https://www.prisma.io/docs/orm" target="_blank"><img src="https://img.shields.io/badge/versión-v7.8.0-green?label=Prisma&logo=prisma&logoColor=white" alt="Version 7.8.0"></a>
  <a href="https://www.npmjs.com/package/@aws-sdk/client-s3" target="_blank"><img src="https://img.shields.io/badge/versión-v3.1072.0-green?label=AWS%20S3" alt="Version 3.1072.0"></a>
  <a href="https://www.npmjs.com/package/mercadopago" target="_blank"><img src="https://img.shields.io/badge/versión-v3.1.0-green?label=Mercado%20Pago&logo=mercadopago&logoColor=white" alt="Version 3.1.0"></a>
</p>

## Description

This API is designed for use in clothing stores; it implements role management for store staff, as well as the management of products, variants, colors, sizes, and orders.

## Modules

The API is structured into modular domains using NestJS best practices. Below is a breakdown of the available modules and their access controls:

| Module        | Routes | Staff | Customer | Public Routes |
| ------------- | :----: | :---: | :------: | :-----------: |
| **Auth**      |   7    |  ✅   |    ✅    |      ✅       |
| **Users**     |   4    |  ✅   |    ❌    |      ❌       |
| **Dashboard** |   6    |  ✅   |    ❌    |      ❌       |
| **Customers** |   4    |  ❌   |    ✅    |      ❌       |
| **Orders**    |   4    |  ✅   |    ✅    |      ❌       |
| **Products**  |   7    |  ✅   |    ✅    |      ✅       |
| **Variants**  |   3    |  ✅   |    ❌    |      ❌       |
| **Colors**    |   3    |  ✅   |    ❌    |      ❌       |
| **Sizes**     |   3    |  ✅   |    ❌    |      ❌       |
| **Payments**  |   2    |  ❌   |    ❌    |      ✅       |
| **Prisma**    |   0    |  ✅   |    ✅    |      ❌       |
| **Aws**       |   0    |  ✅   |    ❌    |      ❌       |

## Requirements & Prerequisites

Before running or deploying this project, ensure you have the following credentials and environment setup:

* **Node.js**: Version 24 or higher is highly recommended.
* **AWS Credentials**: Required for S3 storage usage (e.g., handling store images/product assets).
* **Mercado Pago Credentials**: Required to process and handle payment webhooks/checkouts.

## Project setup

1. **Clone the repository.**

```bash
git clone https://github.com/EstebanAcApp/clothing-stores-api.git

cd clothing-stores-api
```

2. **Install the dependencies.**
```bash
$ npm install
```

3. **Configure the .env file.**

```bash
DATABASE_URL=

JWT_SECRET=

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_BUCKET_NAME=

MERCADOPAGO_STORE_ACCESS_TOKEN=
MERCADOPAGO_STORE_WEBHOOK_SECRET=

MERCADOPAGO_SAAS_ACCESS_TOKEN=
MERCADOPAGO_SAAS_WEBHOOK_SECRET=
SAAS_PRICE=
```

4. **Compile and run the project.**

```bash
# Development:
$ npm run start

# watch mode
$ npm run start:dev
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

You can easily deploy the API to production by following these simple steps.

1. **Import your repository to your favorite service.**
2. **Configure the environment variables.**
3. **Run the build and start commands to get your API ready for use.**

```bash
# Production:

# Build Command
$ npm install && npm run build:prod

# Start Command
$ npm run deploy:prod
```

## Stay in touch

- **Author** (Linkedin) - [Esteban Acosta Aponte](https://www.linkedin.com/in/estebandev11)

## License

This API is [MIT licensed](https://github.com/EstebanAcApp/ClothingStores-API/blob/main/LICENSE).

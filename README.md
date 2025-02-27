# wormbackend

## Overview

Backend service built with TypeScript. It uses Prisma for database management and includes various scripts for development, building, and maintaining code quality.

## Table of Contents

- [Installation](#installation)
- [Scripts](#scripts)
- [Usage](#usage)
- [Development](#development)
- [Linting and Formatting](#linting-and-formatting)

## Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd wormbackend
   ```

2. Install dependencies:

   ```bash
   yarn install
   ```

3. Set up your environment variables by creating a `.env` file in the root directory and adding your configuration.

## Scripts

The following scripts are defined in the `package.json`:

- **build**: Generates Prisma client and compiles TypeScript files.

  ```bash
  yarn build
  ```

- **clean**: Removes the `dist` directory.

  ```bash
  yarn clean
  ```

- **dev**: Starts the development server with hot reloading.

  ```bash
  yarn dev
  ```

- **lint**: Checks TypeScript and linting errors.

  ```bash
  yarn lint
  ```

- **format**: Formats the codebase using Prettier.

  ```bash
  yarn format
  ```

- **prisma:generate**: Generates Prisma client.
  ```bash
  yarn prisma:generate
  ```

## Usage

To start the development server, run:

```bash
yarn dev
```

## Docker

Start the development server with Docker:

```bash
docker compose up -d --build
```

Migration can be run with the following command:

```bash
sudo docker compose exec api npx prisma migrate deploy
sudo docker compose exec api npx prisma db seed
```

#!/bin/bash

read -p "Are you sure you want to start the application in production mode? (yes/no): " confirm
if [ "$confirm" = "yes" ]; then

  dotenv -e .env.production nodemon src/index.ts
else
  echo "Aborted."
  exit 1
fi
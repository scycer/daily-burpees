# TODO

- Get a way to record burpees to databse

# Steps taken

## Project Initiation

Setup lando container to start initiating the project

`lando start`

`lando npx degit solidjs/templates/ts daily-burpees`

`mv -f ./daily-burpees/{.,}* ./`
`rm -f ./daily-burpees`

Update vite.config.ts with port 80 (--port 80)

lando rebuild

From here I have a working SolidJS example running in lando

## Adding Firebase

`lando npm install -g firebase-tools`

Add firebase to lando tooling

`lando firebase login --no-localhost`

Create a new firebase project for this app

- Firestore, Functions, Hosting, Emulators
- Added emulator ports to lando file

Updated the deployment folder in firebase.json
Deployed demo page

## Add a burpee record

Added simple UI with 10 as default

Added firebase config and linked to create new record on save while handling states

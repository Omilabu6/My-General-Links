# linkdump

A personal link vault. Add a link, give it a name you will remember, click the card to open it.

Stack: React, Vite, Tailwind CSS v4, JavaScript.

## Run

```
npm install
npm run dev
```

## Features

- Pages (tabs): work and school by default, add your own, rename or delete them. Deleting a page moves its links to the first remaining page
- Add, edit, delete links (delete has a 6 second undo). Move a link to another page from the edit form
- Click a card to open the link in a new tab
- Pin links to the top, search by name or URL, sort by newest, most opened, or A to Z
- Copy a link, see how many times you opened it
- Backup to JSON and import from JSON

## Storage

Links are stored in the browser's localStorage. They stay on this browser and device only.
Use the backup button to move them elsewhere or to keep a safe copy.

## Structure

```
src/
  App.jsx                 state, filtering, actions
  components/LinkCard.jsx card and its action bar
  components/LinkModal.jsx add and edit form
  hooks/useLocalStorage.js persistence
  utils.js                URL validation, palette, helpers
  index.css               theme tokens and component styles
```

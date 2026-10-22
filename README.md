# Taskboard (mock)

A small mock task-tracking web app: plain HTML, CSS and JavaScript, with no build step and no backend.

## Features

- Seeded with sample tasks
- Add, complete and delete tasks
- Filter by all / open / done
- Stats row with total, open and done counts
- Saves to `localStorage` in your browser
- Light and dark mode follow your system setting

## Run it

Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

To reset to the sample data, clear the `taskboard.tasks` key from `localStorage`.

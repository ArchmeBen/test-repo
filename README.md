# Taskboard (mock)

A small mock task-tracking web app: plain HTML, CSS and JavaScript, with no build step.

It talks to [taskboard-api](https://github.com/ArchmeBen/taskboard-api) when that server is running, and falls back to saving in your browser when it isn't. The dot in the top-right corner shows which mode it's in: green for **api**, amber for **local**.

## Features

- Seeded with sample tasks
- Add, complete and delete tasks
- Filter by all / open / done
- Stats row with total, open and done counts
- Saves to taskboard-api, or to `localStorage` in your browser when the API is unreachable
- Light and dark mode follow your system setting

## Run it

Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

### With the API

In another terminal, start the API (it listens on port 3000 by default):

```sh
cd ../taskboard-api && npm start
```

Then reload the page. To use a different API address, add `?api=` to the URL, for example `http://localhost:8000/?api=http://localhost:4000`.

The app checks for the API once when the page loads. If a request fails later, it switches to local mode for the rest of the session. Tasks you change in local mode stay in your browser and aren't synced to the API.

To reset to the sample data, restart the API, or in local mode clear the `taskboard.tasks` key from `localStorage`.

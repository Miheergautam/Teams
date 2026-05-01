# Teams Frontend

React + Vite frontend for the Teams workspace.

## Stack

- React
- Vite
- Tailwind CSS
- Axios

## Setup

```
npm install
npm run dev
```

## Configuration

The API base URL is defined in `src/api/axios.ts`:

```
http://127.0.0.1:8000/api
```

Update it if your backend runs on a different host or port.

## Features

- Auth (login/register)
- Dashboard stats
- Projects: create projects, manage members
- Tasks: create tasks, assign members, update status

## Auth behavior

After login/register, the token is stored in `localStorage` under the `token` key and sent as a Bearer token on API requests.

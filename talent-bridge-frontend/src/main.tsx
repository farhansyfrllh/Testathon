import { createRoot } from 'react-dom/client'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { DndProvider } from 'react-dnd'
import './index.css'
import App from './App.tsx'

// StrictMode intentionally disabled: react-dnd v16 registers the HTML5 backend
// once per DndProvider mount. React 19 StrictMode double-invokes effects, which
// causes the backend to register twice and throw "Cannot have two HTML5 backends
// at the same time." Removing StrictMode for demo stability.
createRoot(document.getElementById('root')!).render(
  <DndProvider backend={HTML5Backend}>
    <App />
  </DndProvider>,
)

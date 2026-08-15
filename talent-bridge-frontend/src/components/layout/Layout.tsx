import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function Layout() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--pixel-bg)', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main
        style={{
          flex: 1,
          width: '100%',
          boxSizing: 'border-box',
        }}
        id="main-content"
      >
        <Outlet />
      </main>
    </div>
  );
}

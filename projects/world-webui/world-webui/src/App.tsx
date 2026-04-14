import { Routes, Route, Navigate } from 'react-router-dom';
import WorldList from '@/pages/WorldList';
import WorldDashboard from '@/pages/WorldDashboard';
import SimulationPage from '@/pages/SimulationPage';

export default function App() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#e0e0e0' }}>
      <Routes>
        <Route path="/" element={<WorldList />} />
        <Route path="/world/:worldId" element={<WorldDashboard />} />
        <Route path="/world/:worldId/simulate" element={<SimulationPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import SessionPage from './pages/SessionPage';
import './App.css';

function WelcomePage() {
  return (
    <div className="welcome-panel">
      <div className="welcome-content">
        <h2>Claude Coding Agent</h2>
        <p>Start a new chat from the sidebar to begin.</p>
        <div className="welcome-examples">
          <p>Try:</p>
          <ul>
            <li>List all TypeScript files</li>
            <li>Read package.json</li>
            <li>Search for TODO comments</li>
            <li>Create a new file</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/sessions/:sessionId" element={<SessionPage />} />
      </Routes>
    </Layout>
  );
}

export default App;

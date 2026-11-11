import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Modules from './pages/Modules';
import ModuleDetail from './pages/ModuleDetail';
import Lesson from './pages/Lesson';

export default function App() {
  return (
    <BrowserRouter>
      <header>
        <div className="container header-inner">
          <Link to="/" className="logo">Divã</Link>
          <nav>
            <Link to="/">Início</Link>
            <Link to="/modulos">Módulos</Link>
          </nav>
        </div>
      </header>
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/modulos" element={<Modules />} />
          <Route path="/modulos/:slug" element={<ModuleDetail />} />
          <Route path="/aula/:id" element={<Lesson />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
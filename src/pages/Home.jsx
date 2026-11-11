import { Link } from 'react-router-dom';
import { modules } from '../data';

export default function Home() {
  return (
    <div style={{ paddingTop: 24 }}>
      <div className="section-label">Sessão de estudo</div>
      <h1>Olá, Fernando.</h1>

      <div style={{ marginTop: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Módulos</h2>
          <span className="muted">0/243 aulas</span>
        </div>
        {modules.map(mod => (
          <Link key={mod.slug} to={`/modulos/${mod.slug}`} className="card module-card">
            <img src="/pranchas/capa.png" alt="" />
            <div>
              <div style={{ fontWeight: 500 }}>{mod.title}</div>
              <div className="muted">{mod.subtitle}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
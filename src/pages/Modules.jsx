import { Link } from 'react-router-dom';
import { modules } from '../data';

export default function Modules() {
  return (
    <div style={{ paddingTop: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h1>Módulos</h1>
        <span className="muted">0/243 aulas</span>
      </div>
      {modules.map(mod => (
        <Link key={mod.slug} to={`/modulos/${mod.slug}`} className="card module-card">
          <img src={mod.image || '/pranchas/capa.png'} alt="" />
          <div>
            <div style={{ fontWeight: 500 }}>{mod.title}</div>
            <div className="muted">{mod.subtitle}</div>
          </div>
        </Link>
      ))}
    </div>
  );
}
import { useParams, Link } from 'react-router-dom';
import { modules, lessonsData } from '../data';

export default function ModuleDetail() {
  const { slug } = useParams();
  const mod = modules.find(m => m.slug === slug);
  const lessons = lessonsData[slug] || [];

  if (!mod) return <div>Módulo não encontrado</div>;

  return (
    <div>
      <Link to="/modulos" className="muted">← Voltar</Link>
      <h1>{mod.title}</h1>
      {lessons.map(lesson => (
        <Link key={lesson.id} to={`/aula/${lesson.id}`} className="lesson-card">
          {lesson.title}
        </Link>
      ))}
    </div>
  );
}
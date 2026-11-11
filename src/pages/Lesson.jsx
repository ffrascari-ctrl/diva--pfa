import { useParams } from 'react-router-dom';
import { lessonsData } from '../data';

export default function Lesson() {
  const { id } = useParams();
  let lesson = null;
  for (const key in lessonsData) {
    const found = lessonsData[key].find(l => l.id === id);
    if (found) { lesson = found; break; }
  }

  if (!lesson) return <div>Aula não encontrada</div>;

  return (
    <div>
      <h1>{lesson.title}</h1>
      {lesson.pdf && (
        <iframe
          src={lesson.pdf}
          style={{ width: '100%', height: '80vh', border: '1px solid #E8E1D6', borderRadius: 8, marginTop: 16 }}
          title={lesson.title}
        />
      )}
    </div>
  );
}
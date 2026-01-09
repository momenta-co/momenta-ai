'use client';

import { useState } from 'react';
import type { UserContext, Recommendation, RecommendationMeta } from '@/lib/intelligence/types';

export default function IntelligenceDemoPage() {
  const [userContext, setUserContext] = useState<UserContext>({
    // Prioridad 1 (Crítica)
    fecha: 'este sábado',
    ciudad: 'Bogotá',
    personas: 2,
    // Prioridad 2 (Alta)
    tipoGrupo: 'pareja',
    ocasion: 'aniversario',
    categoria: undefined,
    presupuesto: 'medio',
    // Prioridad 3 (Media)
    nivelEnergia: 'calm_mindful',
    intencion: 'celebrar',
    evitar: undefined,
    // Prioridad 4 (Baja)
    modalidad: undefined,
    moodActual: undefined,
    tipoConexion: undefined,
  });

  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [meta, setMeta] = useState<RecommendationMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userContext,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get recommendations');
      }

      const data = await response.json();
      console.log('API recommendations data: ', data);
      setRecommendations(data.recommendations);
      setMeta(data.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Momenta Intelligence Demo</h1>

        {/* Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Cuéntanos qué buscas</h2>
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Prioridad 1 */}
            <div className="border-l-4 border-red-500 pl-4">
              <h3 className="text-sm font-bold text-red-600 mb-2">PRIORIDAD 1 (Crítica)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Ciudad</label>
                  <select
                    value={userContext.ciudad}
                    onChange={(e) => setUserContext({ ...userContext, ciudad: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="Bogotá">Bogotá</option>
                    <option value="Medellín">Medellín</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Fecha</label>
                  <input
                    type="text"
                    value={userContext.fecha}
                    onChange={(e) => setUserContext({ ...userContext, fecha: e.target.value })}
                    placeholder="este sábado, mañana..."
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Personas</label>
                  <input
                    type="number"
                    value={userContext.personas}
                    onChange={(e) => setUserContext({ ...userContext, personas: parseInt(e.target.value) || 1 })}
                    min="1"
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </div>
            </div>

            {/* Prioridad 2 */}
            <div className="border-l-4 border-yellow-500 pl-4">
              <h3 className="text-sm font-bold text-yellow-600 mb-2">PRIORIDAD 2 (Alta)</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tipo de Grupo</label>
                  <select
                    value={userContext.tipoGrupo}
                    onChange={(e) => setUserContext({ ...userContext, tipoGrupo: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="sola">Sola</option>
                    <option value="pareja">Pareja</option>
                    <option value="familia">Familia</option>
                    <option value="amigos">Amigos</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ocasión</label>
                  <input
                    type="text"
                    value={userContext.ocasion || ''}
                    onChange={(e) => setUserContext({ ...userContext, ocasion: e.target.value || undefined })}
                    placeholder="cumpleaños, aniversario..."
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Categoría</label>
                  <select
                    value={userContext.categoria || ''}
                    onChange={(e) => setUserContext({ ...userContext, categoria: e.target.value as any || undefined })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">Cualquiera</option>
                    <option value="gastronomia">Gastronomía</option>
                    <option value="bienestar">Bienestar</option>
                    <option value="arte_creatividad">Arte & Creatividad</option>
                    <option value="aventura">Aventura</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Presupuesto</label>
                  <select
                    value={userContext.presupuesto || ''}
                    onChange={(e) => setUserContext({ ...userContext, presupuesto: e.target.value as any || undefined })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">No prioritario</option>
                    <option value="bajo">Bajo (&lt;100k)</option>
                    <option value="medio">Medio (100-250k)</option>
                    <option value="alto">Alto (&gt;250k)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Prioridad 3 */}
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="text-sm font-bold text-green-600 mb-2">PRIORIDAD 3 (Media)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nivel de Energía</label>
                  <select
                    value={userContext.nivelEnergia || ''}
                    onChange={(e) => setUserContext({ ...userContext, nivelEnergia: e.target.value as any || undefined })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">Flexible</option>
                    <option value="slow_cozy">Slow & Cozy (tranquilo)</option>
                    <option value="calm_mindful">Calm & Mindful (íntimo)</option>
                    <option value="uplifting">Uplifting (activo)</option>
                    <option value="social">Social (fiesta)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Intención</label>
                  <select
                    value={userContext.intencion || ''}
                    onChange={(e) => setUserContext({ ...userContext, intencion: e.target.value as any || undefined })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">No especificada</option>
                    <option value="invitar">Invitar</option>
                    <option value="sorprender">Sorprender</option>
                    <option value="compartir">Compartir</option>
                    <option value="agradecer">Agradecer</option>
                    <option value="celebrar">Celebrar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Modalidad</label>
                  <select
                    value={userContext.modalidad || ''}
                    onChange={(e) => setUserContext({ ...userContext, modalidad: e.target.value as any || undefined })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">Flexible</option>
                    <option value="indoor">Indoor</option>
                    <option value="outdoor">Outdoor</option>
                    <option value="stay_in">Stay-in (en casa)</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Buscando...' : 'Obtener Recomendaciones'}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Recomendaciones para ti</h2>
              {meta && (
                <div className="text-sm text-gray-600 bg-gray-100 px-4 py-2 rounded-lg">
                  <span className="font-medium">Powered by:</span>{' '}
                  <span className={meta.model.includes('gpt') ? 'text-green-600 font-semibold' : 'text-orange-600'}>
                    {meta.model.includes('gpt') ? `OpenAI ${meta.model}` : 'Fallback Algorithm'}
                  </span>
                </div>
              )}
            </div>
            <div className="grid gap-6">
              {recommendations.map((rec, index) => (
                <div key={rec.experience.id} className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="md:flex">
                    <div className="md:w-1/3">
                      <img
                        src={rec.experience.image}
                        alt={rec.experience.title}
                        className="w-full h-48 md:h-full object-cover"
                      />
                    </div>
                    <div className="md:w-2/3 p-6">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-xl font-bold">
                          #{index + 1} {rec.experience.title}
                        </h3>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">
                            {rec.scoreBreakdown.total}
                          </div>
                          <div className="text-xs text-gray-500">score</div>
                        </div>
                      </div>

                      <div className="flex gap-2 mb-4 flex-wrap">
                        {rec.experience.categories.slice(0, 4).map((cat) => (
                          <span key={cat} className="px-2 py-1 bg-gray-100 text-xs rounded">
                            {cat}
                          </span>
                        ))}
                      </div>

                      <p className="text-gray-600 text-sm mb-4">
                        {rec.reasons}
                      </p>

                      <div className="grid grid-cols-4 gap-2 mb-4 text-sm">
                        <div>
                          <div className="text-gray-500">Ocasión</div>
                          <div className="font-semibold">{rec.scoreBreakdown.occasion}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Relación</div>
                          <div className="font-semibold">{rec.scoreBreakdown.relation}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Energía</div>
                          <div className="font-semibold">{rec.scoreBreakdown.mood}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Precio</div>
                          <div className="font-semibold">{rec.scoreBreakdown.budget}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

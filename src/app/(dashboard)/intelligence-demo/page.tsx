'use client';

import { useState } from 'react';
import type { UserContext, Recommendation, RecommendationMeta } from '@/lib/intelligence/types';

export default function IntelligenceDemoPage() {
  const [userContext, setUserContext] = useState<UserContext>({
    occasion: 'cumpleaños',
    withWho: 'mama',
    mood: 'relajado',
    budget: 150000,
    city: 'Bogotá'
  });

  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [meta, setMeta] = useState<RecommendationMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedReasons, setExpandedReasons] = useState<Set<string>>(new Set());

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

  const toggleReasons = (experienceId: string) => {
    setExpandedReasons(prev => {
      const next = new Set(prev);
      if (next.has(experienceId)) {
        next.delete(experienceId);
      } else {
        next.add(experienceId);
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Momenta Intelligence Demo</h1>

        {/* Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Cuéntanos qué buscas</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Ocasión</label>
                <input
                  type="text"
                  value={userContext.occasion}
                  onChange={(e) => setUserContext({ ...userContext, occasion: e.target.value })}
                  placeholder="Ej: Cita romántica, Cumpleaños..."
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">¿Con quién?</label>
                <input
                  type="text"
                  value={userContext.withWho}
                  onChange={(e) => setUserContext({ ...userContext, withWho: e.target.value })}
                  placeholder="Ej: Pareja, Amigos, Solo/a..."
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Estado de ánimo</label>
                <input
                  type="text"
                  value={userContext.mood}
                  onChange={(e) => setUserContext({ ...userContext, mood: e.target.value })}
                  placeholder="Ej: Relajado, Aventurero..."
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Presupuesto (COP)</label>
                <input
                  type="number"
                  value={userContext.budget}
                  onChange={(e) => setUserContext({ ...userContext, budget: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Ciudad</label>
                <select
                  value={userContext.city}
                  onChange={(e) => setUserContext({ ...userContext, city: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="Bogotá">Bogotá</option>
                  <option value="Medellín">Medellín</option>
                </select>
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

                      <p className="text-gray-600 text-sm mb-4">
                        {rec.experience.description.substring(0, 150)}...
                      </p>

                      <div className="flex gap-2 mb-4 flex-wrap">
                        {rec.experience.categories.slice(0, 4).map((cat) => (
                          <span key={cat} className="px-2 py-1 bg-gray-100 text-xs rounded">
                            {cat}
                          </span>
                        ))}
                      </div>

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
                          <div className="text-gray-500">Mood</div>
                          <div className="font-semibold">{rec.scoreBreakdown.mood}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Precio</div>
                          <div className="font-semibold">{rec.scoreBreakdown.budget}</div>
                        </div>
                      </div>

                      <button
                        onClick={() => toggleReasons(rec.experience.id)}
                        className="text-blue-600 text-sm font-medium hover:underline"
                      >
                        {expandedReasons.has(rec.experience.id) ? '▼' : '▶'} Por qué Momenta eligió esto
                      </button>

                      {expandedReasons.has(rec.experience.id) && (
                        <ul className="mt-3 space-y-1 text-sm">
                          {rec.reasons.map((reason, idx) => (
                            <li key={idx} className="flex items-start">
                              <span className="text-blue-600 mr-2">•</span>
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                      )}
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

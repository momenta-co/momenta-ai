"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const suggestions = [
  "Busco una experiencia romántica para dos",
  "Quiero un taller de cocina para mi cumpleaños",
  "Necesito team building para 15 personas",
  "¿Qué experiencias tienen en Medellín?",
];

const floatingMessages = [
  { text: "Taller de cerámica para 4 amigas", position: "top-20 left-10" },
  { text: "Cata de vinos romántica", position: "top-32 right-16" },
  { text: "Team building creativo", position: "bottom-32 left-20" },
];

export function ChatConcierge() {
  const [message, setMessage] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      // Redirect to WhatsApp or handle chat
      const whatsappUrl = `https://wa.me/573001234567?text=${encodeURIComponent(
        message
      )}`;
      window.open(whatsappUrl, "_blank");
      setMessage("");
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setMessage(suggestion);
  };

  return (
    <section className="relative py-24 bg-gradient-to-b from-cream to-columbia/20 overflow-hidden">
      {/* Floating Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {floatingMessages.map((item, index) => (
          <div
            key={index}
            className={cn(
              "absolute hidden lg:block bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg",
              "text-sm text-charcoal/70 animate-pulse",
              item.position
            )}
            style={{ animationDelay: `${index * 0.5}s` }}
          >
            {item.text}
          </div>
        ))}
      </div>

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-charcoal/10 text-charcoal px-4 py-2 rounded-full mb-6">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">Concierge AI</span>
          </div>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-charcoal leading-tight">
            Cuéntanos qué momento
            <br />
            <span className="text-sage italic">quieres crear</span>
          </h2>
          <p className="mt-4 text-charcoal/60 text-lg max-w-xl mx-auto">
            Describe lo que buscas y te ayudaremos a encontrar la experiencia
            perfecta para ti.
          </p>
        </div>

        {/* Chat Input */}
        <div
          className={cn(
            "relative bg-white rounded-2xl shadow-xl transition-all duration-300",
            isFocused ? "shadow-2xl ring-2 ring-sage/20" : ""
          )}
        >
          <form onSubmit={handleSubmit} className="p-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="Ej: Busco una experiencia de cocina para el cumpleaños de mi mamá..."
                  className="border-0 bg-transparent text-lg py-6 px-4 focus-visible:ring-0 placeholder:text-charcoal/40"
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="bg-sage hover:bg-sage/90 text-white rounded-xl h-14 px-6"
                disabled={!message.trim()}
              >
                <Send className="h-5 w-5" />
                <span className="sr-only">Enviar</span>
              </Button>
            </div>
          </form>

          {/* Suggestions */}
          <div className="px-4 pb-4">
            <p className="text-xs text-charcoal/40 mb-3">Sugerencias rápidas:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="text-sm bg-sage-light/30 hover:bg-sage-light/50 text-charcoal/70 px-4 py-2 rounded-full transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: "Personalizado",
              description: "Experiencias adaptadas a tus gustos y necesidades",
            },
            {
              title: "Respuesta inmediata",
              description: "Te respondemos en minutos por WhatsApp",
            },
            {
              title: "Sin compromiso",
              description: "Consulta gratis, reserva cuando quieras",
            },
          ].map((feature) => (
            <div key={feature.title} className="text-center">
              <h4 className="font-medium text-charcoal">{feature.title}</h4>
              <p className="mt-1 text-sm text-charcoal/60">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Alternative CTA */}
        <div className="mt-12 text-center">
          <p className="text-charcoal/50 text-sm mb-4">
            ¿Prefieres explorar por tu cuenta?
          </p>
          <Button
            asChild
            variant="outline"
            className="rounded-full border-charcoal/20 text-charcoal hover:bg-charcoal hover:text-cream"
          >
            <a href="/experiencias">
              Ver todas las experiencias
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}

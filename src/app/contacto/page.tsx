"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Mail,
  Phone,
  MapPin,
  MessageCircle,
  Instagram,
  Send,
} from "lucide-react";

const contactInfo = [
  {
    icon: MapPin,
    title: "Ubicación",
    content: "Bogotá & Medellín, Colombia",
    description: "Operamos en las principales ciudades",
  },
  {
    icon: Mail,
    title: "Email",
    content: "hello@momentaboutique.com",
    href: "mailto:hello@momentaboutique.com",
  },
  {
    icon: Phone,
    title: "Teléfono",
    content: "+57 300 123 4567",
    href: "tel:+573001234567",
  },
  {
    icon: Instagram,
    title: "Instagram",
    content: "@momenta_concierge",
    href: "https://instagram.com/momenta_concierge",
  },
];

export default function ContactoPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
    type: "general",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log(formData);
  };

  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="bg-indigo py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="text-flame text-sm font-medium uppercase tracking-wider">
              Contacto
            </span>
            <h1 className="mt-2 font-serif text-4xl md:text-5xl lg:text-6xl text-cream">
              Hablemos de tu próximo momento
            </h1>
            <p className="mt-6 text-columbia/80 text-lg max-w-2xl mx-auto">
              ¿Tienes alguna pregunta o quieres diseñar una experiencia
              personalizada? Estamos aquí para ayudarte.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-cream">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Contact Info */}
            <div>
              <h2 className="font-serif text-3xl text-indigo">
                ¿Cómo podemos ayudarte?
              </h2>
              <p className="mt-4 text-indigo/60">
                Ya sea que busques una experiencia para ti, tu grupo de amigos,
                o tu equipo de trabajo, estamos listos para crear algo especial.
              </p>

              {/* Contact Cards */}
              <div className="mt-10 grid sm:grid-cols-2 gap-4">
                {contactInfo.map((item) => (
                  <Card key={item.title} className="border-0 shadow-sm">
                    <CardContent className="p-6">
                      <div className="w-10 h-10 rounded-full bg-columbia/30 flex items-center justify-center mb-4">
                        <item.icon className="h-5 w-5 text-indigo" />
                      </div>
                      <h4 className="font-medium text-indigo">{item.title}</h4>
                      {item.href ? (
                        <a
                          href={item.href}
                          target={item.href.startsWith("http") ? "_blank" : undefined}
                          rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                          className="mt-1 text-flame hover:underline"
                        >
                          {item.content}
                        </a>
                      ) : (
                        <p className="mt-1 text-indigo/70">{item.content}</p>
                      )}
                      {item.description && (
                        <p className="mt-1 text-sm text-indigo/50">
                          {item.description}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* WhatsApp CTA */}
              <div className="mt-10 p-6 bg-green-50 rounded-2xl">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-indigo">
                      ¿Prefieres WhatsApp?
                    </h4>
                    <p className="mt-1 text-indigo/60 text-sm">
                      Escríbenos directamente y te responderemos en minutos.
                    </p>
                    <Button
                      asChild
                      className="mt-4 bg-green-500 hover:bg-green-600 text-white rounded-full"
                    >
                      <a
                        href="https://wa.me/573001234567?text=Hola,%20me%20interesa%20conocer%20más%20sobre%20las%20experiencias%20de%20Momenta"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Abrir WhatsApp
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <Card className="border-0 shadow-lg">
                <CardContent className="p-8">
                  <h3 className="font-serif text-2xl text-indigo mb-6">
                    Envíanos un mensaje
                  </h3>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Type Selection */}
                    <div>
                      <label className="text-sm font-medium text-indigo/70 mb-2 block">
                        ¿Qué tipo de experiencia buscas?
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: "personal", label: "Personal" },
                          { id: "grupo", label: "Grupo/Amigos" },
                          { id: "corporativo", label: "Corporativo" },
                          { id: "general", label: "Consulta general" },
                        ].map((type) => (
                          <button
                            key={type.id}
                            type="button"
                            onClick={() =>
                              setFormData({ ...formData, type: type.id })
                            }
                            className={`p-3 rounded-lg text-sm font-medium transition-all ${
                              formData.type === type.id
                                ? "bg-indigo text-cream"
                                : "bg-columbia/20 text-indigo/70 hover:bg-columbia/40"
                            }`}
                          >
                            {type.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-indigo/70 mb-2 block">
                          Nombre
                        </label>
                        <Input
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          placeholder="Tu nombre"
                          className="rounded-lg"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-indigo/70 mb-2 block">
                          Email
                        </label>
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          placeholder="tu@email.com"
                          className="rounded-lg"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-indigo/70 mb-2 block">
                        Teléfono (opcional)
                      </label>
                      <Input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        placeholder="+57 300 000 0000"
                        className="rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-indigo/70 mb-2 block">
                        Mensaje
                      </label>
                      <textarea
                        value={formData.message}
                        onChange={(e) =>
                          setFormData({ ...formData, message: e.target.value })
                        }
                        placeholder="Cuéntanos qué tipo de experiencia buscas, para cuántas personas, fechas tentativas..."
                        rows={4}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-flame hover:bg-flame/90 text-white rounded-full h-12"
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Enviar mensaje
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

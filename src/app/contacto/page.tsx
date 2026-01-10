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
import FeedbackForm from "@/components/organisms/FeedbackForm";


export default function ContactoPage() {
  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="bg-indigo py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="mt-6 text-columbia/80 text-lg max-w-2xl mx-auto">
              ¿Tienes alguna pregunta o quieres diseñar una experiencia
              personalizada? Estamos aquí para ayudarte.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <FeedbackForm messageId="contacto" />
    </div>
  );
}

// app/pacientes/layout.tsx
import React from 'react';

export default function PacientesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // No futuro, este layout poderia ter um sub-menu ou contexto específico para pacientes.
    // Por enquanto, ele apenas renderiza os filhos.
    <section>{children}</section>
  );
}

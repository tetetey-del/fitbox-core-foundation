import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout, LegalSectionBlock } from "@/components/legal/LegalLayout";

const SECTIONS = [
  { id: "que-son", title: "1. Qué son las cookies" },
  { id: "tipos", title: "2. Tipos que usamos" },
  { id: "terceros", title: "3. Cookies de terceros" },
  { id: "gestion", title: "4. Cómo gestionar tus preferencias" },
  { id: "duracion", title: "5. Duración" },
  { id: "cambios", title: "6. Cambios en la política" },
];

export const Route = createFileRoute("/legal/cookies")({
  head: () => ({
    meta: [
      { title: "Política de cookies — FitBox" },
      { name: "description", content: "Información sobre las cookies utilizadas por FitBox." },
    ],
  }),
  component: CookiesPage,
});

function CookiesPage() {
  return (
    <LegalLayout title="Política de cookies" sections={SECTIONS} updatedAt="4 de julio de 2026">
      <LegalSectionBlock id="que-son" title={SECTIONS[0].title}>
        <p>
          Las cookies son pequeños archivos que un sitio web almacena en tu dispositivo cuando lo visitas. Se usan
          para hacer que el sitio funcione, recordar tus preferencias, o entender cómo lo utilizas.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="tipos" title={SECTIONS[1].title}>
        <p>En FitBox utilizamos tres categorías de cookies o almacenamiento local equivalente:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Técnicas (obligatorias):</strong> imprescindibles para iniciar sesión, mantener la sesión
            activa y recordar el estado de la aplicación. Sin ellas el servicio no funciona.
          </li>
          <li>
            <strong>De preferencia:</strong> guardan opciones como el tema visual seleccionado o el idioma. Sólo
            se activan si aceptas.
          </li>
          <li>
            <strong>De analítica:</strong> agregadas y anónimas, nos permiten entender el uso general de la
            plataforma para mejorarla. Sólo se activan si aceptas.
          </li>
        </ul>
      </LegalSectionBlock>

      <LegalSectionBlock id="terceros" title={SECTIONS[2].title}>
        <p>
          FitBox puede utilizar servicios de terceros (por ejemplo, para hosting, notificaciones o analítica).
          Cuando sea el caso, dichos terceros se listarán como encargados del tratamiento en la política de
          privacidad y actuarán conforme a la normativa aplicable.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="gestion" title={SECTIONS[3].title}>
        <p>
          Puedes aceptar, rechazar o configurar tus preferencias en el aviso que aparece la primera vez que
          accedes a FitBox. La configuración se guarda de forma local en tu dispositivo. Además, la mayoría de
          navegadores permiten controlar las cookies desde su configuración.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="duracion" title={SECTIONS[4].title}>
        <p>
          Las cookies técnicas se mantienen durante la sesión o hasta que cierras sesión. Las de preferencia y
          analítica se conservan por un máximo de 12 meses salvo que las elimines antes.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="cambios" title={SECTIONS[5].title}>
        <p>
          Podremos actualizar esta política para adaptarla a cambios legales o técnicos. La fecha de última
          actualización figura al inicio del documento.
        </p>
      </LegalSectionBlock>
    </LegalLayout>
  );
}

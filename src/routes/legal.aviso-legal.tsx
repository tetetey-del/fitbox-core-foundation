import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout, LegalSectionBlock } from "@/components/legal/LegalLayout";
import { company } from "@/config/company";

const SECTIONS = [
  { id: "titular", title: "1. Datos del titular" },
  { id: "objeto", title: "2. Objeto" },
  { id: "condiciones", title: "3. Condiciones de uso" },
  { id: "responsabilidad", title: "4. Exclusión de responsabilidad" },
  { id: "enlaces", title: "5. Enlaces a terceros" },
  { id: "propiedad", title: "6. Propiedad intelectual" },
  { id: "ley", title: "7. Ley aplicable" },
];

export const Route = createFileRoute("/legal/aviso-legal")({
  head: () => ({
    meta: [
      { title: "Aviso legal — Kinflow" },
      { name: "description", content: "Aviso legal de la plataforma Kinflow." },
    ],
  }),
  component: AvisoLegalPage,
});

function AvisoLegalPage() {
  return (
    <LegalLayout title="Aviso legal" sections={SECTIONS} updatedAt="27 de octubre de 2026">
      <LegalSectionBlock id="titular" title={SECTIONS[0].title}>
        <p>
          En cumplimiento del artículo 10 de la Ley 34/2002 de servicios de la sociedad de la información y de
          comercio electrónico (LSSICE), se informa que el titular de este sitio web es:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Titular:</strong> {company.legalName}</li>
          <li><strong>Nombre comercial:</strong> {company.tradeName}</li>
          <li><strong>NIF:</strong> {company.taxId}</li>
          <li><strong>Domicilio:</strong> {company.address}</li>
          <li><strong>Correo electrónico:</strong> {company.emails.contact}</li>
          {company.registryData && <li><strong>Datos registrales:</strong> {company.registryData}</li>}
        </ul>
      </LegalSectionBlock>

      <LegalSectionBlock id="objeto" title={SECTIONS[1].title}>
        <p>
          El presente aviso legal regula el uso del sitio web y de la plataforma Kinflow, sin perjuicio de los
          términos y condiciones específicos aplicables al servicio contratado.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="condiciones" title={SECTIONS[2].title}>
        <p>
          El acceso al sitio implica la aceptación de estas condiciones. El usuario se compromete a hacer un uso
          adecuado de los contenidos y servicios, absteniéndose de utilizarlos con fines ilícitos, lesivos o
          contrarios a la buena fe.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="responsabilidad" title={SECTIONS[3].title}>
        <p>
          Kinflow realiza esfuerzos razonables para garantizar la disponibilidad y exactitud de la información,
          pero no puede garantizar la ausencia total de errores, interrupciones o incidencias técnicas.
        </p>
        <p>
          Kinflow es una herramienta que usan gimnasios independientes. Cada gimnasio es el único responsable de su
          actividad, de sus clases y entrenadores, de sus precios y cobros, y del contenido y los datos que publica o
          registra en la plataforma. Más detalle en los{" "}
          <a href="/legal/terminos" className="underline">términos y condiciones</a>.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="enlaces" title={SECTIONS[4].title}>
        <p>
          El sitio puede contener enlaces a sitios de terceros. Kinflow no asume responsabilidad sobre el
          contenido o las prácticas de dichos sitios.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="propiedad" title={SECTIONS[5].title}>
        <p>
          Todos los contenidos, marcas, logotipos y elementos del sitio están protegidos por derechos de
          propiedad intelectual e industrial. Queda prohibida su reproducción sin autorización.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="ley" title={SECTIONS[6].title}>
        <p>
          La relación entre el usuario y Kinflow se rige por la legislación española. Para la resolución de
          controversias, las partes se someten a los Juzgados y Tribunales de {company.jurisdiction}.
        </p>
      </LegalSectionBlock>
    </LegalLayout>
  );
}

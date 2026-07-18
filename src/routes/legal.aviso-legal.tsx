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
      { title: "Aviso legal — FitBox" },
      { name: "description", content: "Aviso legal de la plataforma FitBox." },
    ],
  }),
  component: AvisoLegalPage,
});

function AvisoLegalPage() {
  return (
    <LegalLayout title="Aviso legal" sections={SECTIONS} updatedAt="4 de julio de 2026">
      <LegalSectionBlock id="titular" title={SECTIONS[0].title}>
        <p>
          En cumplimiento del artículo 10 de la Ley 34/2002 de servicios de la sociedad de la información y de
          comercio electrónico (LSSICE), se informa que el titular de este sitio web es:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Denominación:</strong> [NOMBRE EMPRESA]</li>
          <li><strong>CIF:</strong> [CIF]</li>
          <li><strong>Domicilio:</strong> [DIRECCIÓN]</li>
          <li><strong>Correo electrónico:</strong> [EMAIL]</li>
          <li><strong>Datos registrales:</strong> [REGISTRO MERCANTIL, TOMO, FOLIO, HOJA]</li>
        </ul>
      </LegalSectionBlock>

      <LegalSectionBlock id="objeto" title={SECTIONS[1].title}>
        <p>
          El presente aviso legal regula el uso del sitio web y de la plataforma FitBox, sin perjuicio de los
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
          FitBox realiza esfuerzos razonables para garantizar la disponibilidad y exactitud de la información,
          pero no puede garantizar la ausencia total de errores, interrupciones o incidencias técnicas.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="enlaces" title={SECTIONS[4].title}>
        <p>
          El sitio puede contener enlaces a sitios de terceros. FitBox no asume responsabilidad sobre el
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
          La relación entre el usuario y FitBox se rige por la legislación española. Para la resolución de
          controversias, las partes se someten a los Juzgados y Tribunales de [CIUDAD].
        </p>
      </LegalSectionBlock>
    </LegalLayout>
  );
}

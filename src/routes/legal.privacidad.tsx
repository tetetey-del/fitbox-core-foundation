import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout, LegalSectionBlock } from "@/components/legal/LegalLayout";
import { company } from "@/config/company";

const SECTIONS = [
  { id: "responsable", title: "1. Responsable del tratamiento" },
  { id: "datos", title: "2. Categorías de datos" },
  { id: "finalidad", title: "3. Finalidad" },
  { id: "base", title: "4. Base legal" },
  { id: "conservacion", title: "5. Conservación" },
  { id: "cesion", title: "6. Cesiones y encargados" },
  { id: "internacional", title: "7. Transferencias internacionales" },
  { id: "derechos", title: "8. Tus derechos" },
  { id: "seguridad", title: "9. Seguridad" },
  { id: "menores", title: "10. Menores" },
  { id: "cambios", title: "11. Cambios en la política" },
];

export const Route = createFileRoute("/legal/privacidad")({
  head: () => ({
    meta: [
      { title: "Política de privacidad — FitBox" },
      { name: "description", content: "Política de privacidad de FitBox conforme al RGPD y a la LOPDGDD." },
    ],
  }),
  component: PrivacidadPage,
});

function PrivacidadPage() {
  return (
    <LegalLayout title="Política de privacidad" sections={SECTIONS} updatedAt="4 de julio de 2026">
      <LegalSectionBlock id="responsable" title={SECTIONS[0].title}>
        <p>
          El responsable del tratamiento de los datos personales recogidos a través de la plataforma FitBox es
          <strong> {company.legalName}</strong>, con CIF <strong>{company.taxId}</strong>, domicilio en <strong>{company.address}</strong>
          y correo electrónico de contacto <strong>{company.emails.privacy}</strong>.
        </p>
        <p>
          Si has contratado FitBox como titular de un gimnasio o box, actúas como responsable del tratamiento de los
          datos de tus socios; FitBox actúa en tal caso como encargado del tratamiento en los términos del contrato
          suscrito.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="datos" title={SECTIONS[1].title}>
        <p>Podemos recabar y tratar las siguientes categorías de datos:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Datos identificativos: nombre, apellidos, email, teléfono.</li>
          <li>Datos de la cuenta: contraseña cifrada, rol, historial de accesos.</li>
          <li>Datos de la relación: plan contratado, cuotas, historial de asistencia, PRs deportivos.</li>
          <li>Datos técnicos: dirección IP aproximada, tipo de dispositivo y navegador.</li>
        </ul>
      </LegalSectionBlock>

      <LegalSectionBlock id="finalidad" title={SECTIONS[2].title}>
        <p>Tratamos los datos con las siguientes finalidades:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Prestación del servicio contratado (reservas, socios, cuotas, PRs, feed).</li>
          <li>Gestión de accesos y seguridad de la cuenta.</li>
          <li>Comunicaciones internas relativas al servicio (avisos, notificaciones).</li>
          <li>Cumplimiento de obligaciones legales, fiscales y contables.</li>
        </ul>
      </LegalSectionBlock>

      <LegalSectionBlock id="base" title={SECTIONS[3].title}>
        <p>
          La base legitimadora principal es la <strong>ejecución del contrato</strong> suscrito con FitBox
          (art. 6.1.b RGPD), así como el <strong>cumplimiento de obligaciones legales</strong> aplicables
          (art. 6.1.c RGPD) y, en su caso, el <strong>interés legítimo</strong> en garantizar la seguridad y
          continuidad del servicio (art. 6.1.f RGPD).
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="conservacion" title={SECTIONS[4].title}>
        <p>
          Los datos se conservarán mientras se mantenga la relación contractual y, tras su finalización, durante
          los plazos legalmente exigibles para atender posibles responsabilidades derivadas de la prestación del
          servicio.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="cesion" title={SECTIONS[5].title}>
        <p>
          No se cederán datos a terceros salvo obligación legal. Podemos utilizar proveedores tecnológicos que
          actúan como encargados del tratamiento con garantías adecuadas, en particular servicios de hosting y
          envío de comunicaciones. El listado actualizado puede solicitarse a <strong>[EMAIL]</strong>.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="internacional" title={SECTIONS[6].title}>
        <p>
          En caso de que algún proveedor implique transferencias internacionales de datos, se realizarán con las
          garantías previstas por el RGPD, incluidas cláusulas contractuales tipo aprobadas por la Comisión Europea.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="derechos" title={SECTIONS[7].title}>
        <p>
          Puedes ejercer en cualquier momento tus derechos de <strong>acceso, rectificación, supresión,
          oposición, limitación del tratamiento y portabilidad</strong>, así como retirar el consentimiento
          prestado, escribiendo a <strong>[EMAIL]</strong>. También tienes derecho a presentar una reclamación
          ante la Agencia Española de Protección de Datos (www.aepd.es).
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="seguridad" title={SECTIONS[8].title}>
        <p>
          Aplicamos medidas técnicas y organizativas apropiadas al riesgo, incluyendo control de accesos por rol,
          cifrado de contraseñas y trazabilidad de operaciones críticas. La demostración pública de FitBox almacena
          datos únicamente en el navegador del usuario.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="menores" title={SECTIONS[9].title}>
        <p>
          El servicio no está dirigido a menores de 14 años. En caso de que un box gestione socios menores de
          edad, será responsabilidad del titular del box recabar el consentimiento paterno/tutor conforme a la
          normativa vigente.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="cambios" title={SECTIONS[10].title}>
        <p>
          Podremos actualizar esta política para adaptarla a cambios legislativos o del servicio. La fecha de
          última actualización figura al inicio del documento.
        </p>
      </LegalSectionBlock>
    </LegalLayout>
  );
}

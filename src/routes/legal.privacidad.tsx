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
      { title: "Política de privacidad — Kinflow" },
      { name: "description", content: "Política de privacidad de Kinflow conforme al RGPD y a la LOPDGDD." },
    ],
  }),
  component: PrivacidadPage,
});

function PrivacidadPage() {
  return (
    <LegalLayout title="Política de privacidad" sections={SECTIONS} updatedAt="27 de octubre de 2026">
      <LegalSectionBlock id="responsable" title={SECTIONS[0].title}>
        <p>
          El responsable del tratamiento de los datos de los gimnasios que contratan Kinflow y de los visitantes de
          esta web es <strong>{company.legalName}</strong> (nombre comercial {company.tradeName}), con NIF{" "}
          <strong>{company.taxId}</strong>, domicilio en <strong>{company.address}</strong> y correo electrónico de
          contacto <strong>{company.emails.privacy}</strong>.
        </p>
        <p>
          <strong>Si eres socio de un gimnasio que usa Kinflow</strong>, el responsable de tus datos es tu gimnasio.
          Kinflow los trata por su cuenta, como encargado del tratamiento (art. 28 RGPD), solo para prestarle el
          servicio. Para ejercer tus derechos puedes dirigirte a tu gimnasio o escribirnos y se lo haremos llegar.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="datos" title={SECTIONS[1].title}>
        <p>Podemos recabar y tratar las siguientes categorías de datos:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Datos identificativos y de contacto: nombre, apellidos, email, teléfono, fecha de nacimiento, DNI/NIE y dirección.</li>
          <li>Contacto de emergencia: nombre y teléfono de la persona que el socio indique.</li>
          <li>Fotografía de perfil, si el socio decide subirla.</li>
          <li>Datos de la cuenta: contraseña cifrada, rol, historial de accesos.</li>
          <li>Datos de la relación: plan contratado, cuotas y pagos, reservas, historial de asistencia, marcas personales (PRs), rutinas y retos.</li>
          <li>Mediciones de progreso (por ejemplo, peso o perímetros), solo si el socio decide registrarlas. El socio elige si las comparte con sus entrenadores.</li>
          <li>Datos técnicos: dirección IP aproximada, tipo de dispositivo y navegador.</li>
        </ul>
      </LegalSectionBlock>

      <LegalSectionBlock id="finalidad" title={SECTIONS[2].title}>
        <p>Tratamos los datos con las siguientes finalidades:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Prestación del servicio contratado (reservas, socios, cuotas, PRs, feed).</li>
          <li>Identificar al socio en el gimnasio y poder avisar a su contacto de emergencia si ocurre un incidente durante el entrenamiento.</li>
          <li>Gestión de accesos y seguridad de la cuenta.</li>
          <li>Comunicaciones internas relativas al servicio (avisos, notificaciones).</li>
          <li>Cumplimiento de obligaciones legales, fiscales y contables.</li>
        </ul>
      </LegalSectionBlock>

      <LegalSectionBlock id="base" title={SECTIONS[3].title}>
        <p>
          La base legitimadora principal es la <strong>ejecución del contrato</strong> suscrito con Kinflow
          (art. 6.1.b RGPD), así como el <strong>cumplimiento de obligaciones legales</strong> aplicables
          (art. 6.1.c RGPD) y, en su caso, el <strong>interés legítimo</strong> en garantizar la seguridad y
          continuidad del servicio (art. 6.1.f RGPD).
        </p>
        <p>
          La fotografía de perfil y las mediciones de progreso se tratan con el <strong>consentimiento</strong> del
          socio (arts. 6.1.a y 9.2.a RGPD), que puede retirarlo en cualquier momento borrando la foto o los datos,
          o dejando de compartirlos con sus entrenadores, desde Mi cuenta.
        </p>
        <p>
          Quien indica un contacto de emergencia debe informar a esa persona de que ha facilitado su nombre y
          teléfono para ese fin.
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
          actúan como encargados del tratamiento con garantías adecuadas: <strong>Vercel Inc.</strong> (alojamiento de
          la web) y <strong>Google</strong> (correo electrónico de contacto). El listado actualizado puede solicitarse
          a <strong>{company.emails.privacy}</strong>.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="internacional" title={SECTIONS[6].title}>
        <p>
          En caso de que algún proveedor implique transferencias internacionales de datos, se realizarán con las
          garantías previstas por el RGPD: el Marco de Privacidad de Datos UE-EE. UU. o cláusulas contractuales tipo
          aprobadas por la Comisión Europea. Es el caso de Vercel y Google, con sede en Estados Unidos.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="derechos" title={SECTIONS[7].title}>
        <p>
          Puedes ejercer en cualquier momento tus derechos de <strong>acceso, rectificación, supresión,
          oposición, limitación del tratamiento y portabilidad</strong>, así como retirar el consentimiento
          prestado, escribiendo a <strong>{company.emails.privacy}</strong>. También tienes derecho a presentar una reclamación
          ante la Agencia Española de Protección de Datos (www.aepd.es). Si estás en Argentina, también puedes
          ejercerlos conforme a la Ley 25.326 y reclamar ante la Agencia de Acceso a la Información Pública
          (www.argentina.gob.ar/aaip).
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="seguridad" title={SECTIONS[8].title}>
        <p>
          Aplicamos medidas técnicas y organizativas apropiadas al riesgo, incluyendo control de accesos por rol,
          cifrado de contraseñas y trazabilidad de operaciones críticas. La demostración pública de Kinflow almacena
          datos únicamente en el navegador del usuario.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="menores" title={SECTIONS[9].title}>
        <p>
          Los menores de 14 años no pueden crear su propia cuenta. Si un gimnasio gestiona socios menores de edad,
          es responsabilidad del gimnasio recabar el consentimiento de sus padres o tutores conforme a la normativa
          vigente (art. 7 LOPDGDD).
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

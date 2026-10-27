import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout, LegalSectionBlock } from "@/components/legal/LegalLayout";
import { company } from "@/config/company";

const SECTIONS = [
  { id: "objeto", title: "1. Objeto y aceptación" },
  { id: "papel", title: "2. Qué es Kinflow y qué no es" },
  { id: "gimnasio", title: "3. Responsabilidad del gimnasio" },
  { id: "socios", title: "4. Socios y entrenadores" },
  { id: "contenido", title: "5. Contenido publicado por el gimnasio" },
  { id: "salud", title: "6. Entrenamiento y salud" },
  { id: "datos", title: "7. Datos de los socios" },
  { id: "cuenta", title: "8. Cuentas y uso correcto" },
  { id: "precios", title: "9. Precios, prueba gratis y facturación" },
  { id: "cancelacion", title: "10. Cancelación" },
  { id: "servicio", title: "11. Disponibilidad del servicio" },
  { id: "limitacion", title: "12. Limitación de responsabilidad" },
  { id: "indemnidad", title: "13. Indemnidad" },
  { id: "propiedad", title: "14. Propiedad intelectual" },
  { id: "modificaciones", title: "15. Modificaciones" },
  { id: "ley", title: "16. Ley aplicable y jurisdicción" },
];

export const Route = createFileRoute("/legal/terminos")({
  head: () => ({
    meta: [
      { title: "Términos de servicio — Kinflow" },
      { name: "description", content: "Términos y condiciones de uso de la plataforma Kinflow." },
    ],
  }),
  component: TerminosPage,
});

function TerminosPage() {
  return (
    <LegalLayout title="Términos y condiciones" sections={SECTIONS} updatedAt="27 de octubre de 2026">
      <LegalSectionBlock id="objeto" title={SECTIONS[0].title}>
        <p>
          Estos términos regulan el uso de la plataforma Kinflow, titularidad de <strong>{company.legalName}</strong>{" "}
          (nombre comercial {company.tradeName}), con NIF <strong>{company.taxId}</strong>.
        </p>
        <p>
          El gimnasio que crea una cuenta los acepta expresamente al registrarse. Los socios y entrenadores los
          aceptan al crear su cuenta o al usar la plataforma.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="papel" title={SECTIONS[1].title}>
        <p>
          Kinflow es una <strong>herramienta de software</strong> (SaaS) que los boxes de CrossFit, Hyrox y
          gimnasios usan para organizar su actividad: reservas, socios, planes, cobros, WODs, marcas personales,
          publicaciones y tienda.
        </p>
        <p>Kinflow <strong>no</strong>:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>presta servicios deportivos, de entrenamiento, de salud ni de nutrición;</li>
          <li>gestiona, supervisa ni controla las instalaciones, las clases ni el equipo de ningún gimnasio;</li>
          <li>contrata ni emplea a los entrenadores, ni verifica su titulación;</li>
          <li>es parte de la relación ni de los contratos entre el gimnasio y sus socios;</li>
          <li>
            cobra, custodia ni devuelve dinero de los socios: los pagos que aparecen en la plataforma son registros
            que hace el propio gimnasio;
          </li>
          <li>revisa ni aprueba previamente el contenido que publica cada gimnasio.</li>
        </ul>
      </LegalSectionBlock>

      <LegalSectionBlock id="gimnasio" title={SECTIONS[2].title}>
        <p>
          Cada gimnasio es el <strong>único responsable</strong> de su actividad y de todo lo que ocurra en ella o
          como consecuencia de ella, en particular:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>las clases, los entrenamientos, las instalaciones, el material y la seguridad de las personas;</li>
          <li>las lesiones, accidentes o daños que sufran socios, entrenadores o terceros;</li>
          <li>
            la cualificación de sus entrenadores y el cumplimiento de la normativa deportiva, laboral, sanitaria y
            de seguridad aplicable;
          </li>
          <li>
            contar con los seguros obligatorios o recomendables (por ejemplo, responsabilidad civil y accidentes) y
            con los documentos que exija su actividad (aptitud física, consentimientos, normas internas);
          </li>
          <li>
            los precios, cuotas, cobros, facturas, impuestos, reembolsos y políticas de cancelación que aplica a
            sus socios, incluidas las reglas de reservas y créditos que configura en Kinflow;
          </li>
          <li>los productos que vende en su tienda y su entrega;</li>
          <li>el cumplimiento de la normativa de consumidores frente a sus socios;</li>
          <li>
            el cumplimiento de toda la normativa que le aplique en su país (España, Argentina u otro), aunque use
            Kinflow para organizarse.
          </li>
        </ul>
      </LegalSectionBlock>

      <LegalSectionBlock id="socios" title={SECTIONS[3].title}>
        <p>
          Si eres <strong>socio o entrenador</strong>, tu relación es con tu gimnasio, no con Kinflow. Cualquier
          consulta o reclamación sobre clases, reservas, créditos, cuotas, pagos, devoluciones, entrenamientos,
          lesiones o trato recibido debe dirigirse a tu gimnasio.
        </p>
        <p>
          Kinflow solo responde frente a los socios del funcionamiento técnico de la plataforma, dentro de los
          límites de estos términos.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="contenido" title={SECTIONS[4].title}>
        <p>
          Los WODs, rutinas, retos, publicaciones, imágenes, productos, precios y cualquier otro contenido que
          publiquen el gimnasio, sus entrenadores o sus socios son responsabilidad exclusiva de quien los publica.
          El gimnasio garantiza que tiene derecho a usarlos (incluidas fotos de personas y marcas de terceros) y
          que no son ilícitos.
        </p>
        <p>
          Kinflow puede retirar contenido o suspender cuentas cuando tenga conocimiento de que el contenido es
          ilícito o vulnera estos términos.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="salud" title={SECTIONS[5].title}>
        <p>
          El contenido de entrenamiento que aparece en Kinflow lo crea cada gimnasio y no constituye consejo
          médico, de salud ni de nutrición. Cada socio entrena bajo su propia responsabilidad y la supervisión de
          su gimnasio, y debe consultar a un profesional sanitario cuando sea necesario.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="datos" title={SECTIONS[6].title}>
        <p>
          Cada gimnasio es el <strong>responsable del tratamiento</strong> de los datos de sus socios y equipo
          (datos de contacto, fecha de nacimiento, documento de identidad, dirección, contacto de emergencia,
          fotografía, reservas, pagos y marcas). Kinflow los trata por cuenta del gimnasio como{" "}
          <strong>encargado del tratamiento</strong>, solo para prestar el servicio, conforme al artículo 28 del RGPD
          y a la <a href="/legal/privacidad" className="underline">política de privacidad</a>.
        </p>
        <p>
          El gimnasio se compromete a informar a sus socios del uso de Kinflow, a contar con una base legal para
          los datos que registre, a no introducir datos que no necesite y a atender las solicitudes de sus socios
          sobre sus datos. Las sanciones o reclamaciones derivadas de un uso indebido de los datos por parte del
          gimnasio son responsabilidad del gimnasio.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="cuenta" title={SECTIONS[7].title}>
        <p>
          Quien crea una cuenta debe facilitar información veraz y mantenerla actualizada, y es responsable de la
          confidencialidad de sus credenciales y de toda actividad realizada desde su cuenta. El gimnasio es
          responsable de las cuentas que crea o invita (entrenadores y socios) y de los permisos que les da.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="precios" title={SECTIONS[8].title}>
        <p>
          Los precios vigentes de Kinflow están publicados en la sección de precios. Se facturan por adelantado y
          no incluyen IVA salvo indicación en contrario.
        </p>
        <p>
          Los gimnasios pueden probar Kinflow <strong>gratis durante 14 días</strong>, sin compromiso y sin
          introducir datos de pago. Al terminar la prueba, el servicio solo continúa si el gimnasio contrata un plan.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="cancelacion" title={SECTIONS[9].title}>
        <p>
          El gimnasio puede cancelar su plan en cualquier momento. La cancelación surte efecto al final del periodo
          facturado. No se realizan reembolsos por periodos ya iniciados salvo obligación legal. Antes de cancelar,
          el gimnasio puede pedir una copia de sus datos.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="servicio" title={SECTIONS[10].title}>
        <p>
          Kinflow se ofrece <strong>tal cual</strong> y según disponibilidad. Hacemos esfuerzos razonables para que
          funcione de forma continua y segura, pero no garantizamos que esté libre de errores ni de interrupciones
          (por mantenimiento, fallos de proveedores o causas ajenas). La versión de demostración guarda los datos
          solo en el navegador de cada persona y puede borrarse en cualquier momento.
        </p>
        <p>
          El gimnasio debe conservar por su cuenta la información imprescindible para su actividad (por ejemplo,
          facturas y contratos con sus socios).
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="limitacion" title={SECTIONS[11].title}>
        <p>
          En la medida máxima permitida por la ley, Kinflow no responde de los daños que se produzcan en la
          actividad de los gimnasios ni de las decisiones que estos tomen usando la plataforma (por ejemplo, la
          gestión de reservas, créditos, cobros o comunicaciones con sus socios).
        </p>
        <p>
          Kinflow no será responsable de daños indirectos, pérdida de beneficios, lucro cesante ni pérdida de
          datos. Su responsabilidad total frente a un gimnasio se limita al importe que este haya pagado a Kinflow
          en los seis meses anteriores al hecho que la origine. Durante la prueba gratuita el servicio se ofrece
          sin garantías.
        </p>
        <p>
          Estas limitaciones no se aplican en los casos en que la ley no permite excluir la responsabilidad
          (dolo, culpa grave o derechos irrenunciables de los consumidores).
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="indemnidad" title={SECTIONS[12].title}>
        <p>
          El gimnasio se compromete a <strong>mantener indemne a Kinflow</strong> y a su titular frente a cualquier
          reclamación, sanción, daño o gasto (incluidos honorarios de abogados) que reclamen socios, entrenadores,
          autoridades u otros terceros y que tenga su origen en la actividad del gimnasio, en el contenido o los
          datos que introduce en Kinflow o en el incumplimiento de estos términos o de la ley.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="propiedad" title={SECTIONS[13].title}>
        <p>
          Todos los derechos de propiedad intelectual e industrial sobre la plataforma, su código, diseño y marca
          corresponden a Kinflow o a sus legítimos titulares. El contenido que sube cada gimnasio sigue siendo suyo;
          el gimnasio autoriza a Kinflow a alojarlo y mostrarlo solo para prestar el servicio.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="modificaciones" title={SECTIONS[14].title}>
        <p>
          Kinflow podrá modificar estos términos por motivos legales, técnicos u operativos. Los cambios
          relevantes se comunicarán a los gimnasios con antelación razonable y entrarán en vigor en la fecha
          indicada.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="ley" title={SECTIONS[15].title}>
        <p>
          Estos términos se rigen por la <strong>legislación española</strong>. Para cualquier controversia con un
          gimnasio, las partes se someten a los <strong>Juzgados y Tribunales de {company.jurisdiction}</strong>.
          Si quien reclama es un consumidor, podrá acudir a los tribunales de su domicilio cuando la ley así lo
          establezca.
        </p>
      </LegalSectionBlock>
    </LegalLayout>
  );
}

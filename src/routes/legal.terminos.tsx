import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout, LegalSectionBlock } from "@/components/legal/LegalLayout";
import { company } from "@/config/company";

const SECTIONS = [
  { id: "objeto", title: "1. Objeto" },
  { id: "servicio", title: "2. Descripción del servicio" },
  { id: "cuenta", title: "3. Cuenta de usuario" },
  { id: "precios", title: "4. Precios, prueba gratis y facturación" },
  { id: "cancelacion", title: "5. Cancelación" },
  { id: "datos", title: "6. Datos de los socios" },
  { id: "salud", title: "7. Entrenamiento y salud" },
  { id: "propiedad", title: "8. Propiedad intelectual" },
  { id: "limitacion", title: "9. Limitación de responsabilidad" },
  { id: "modificaciones", title: "10. Modificaciones" },
  { id: "ley", title: "11. Ley aplicable y jurisdicción" },
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
          Los presentes términos regulan el acceso y uso de la plataforma Kinflow, titularidad de <strong>{company.legalName}</strong>,
          con NIF <strong>{company.taxId}</strong>. El registro y uso de la plataforma implican la aceptación expresa de estos términos.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="servicio" title={SECTIONS[1].title}>
        <p>
          Kinflow es una plataforma de gestión para boxes de CrossFit, Hyrox y gimnasios que permite administrar reservas,
          socios, cuotas, marcas personales (PRs), publicaciones internas y otras funcionalidades relacionadas.
          El servicio se presta bajo modalidad SaaS.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="cuenta" title={SECTIONS[2].title}>
        <p>
          El titular de la cuenta debe facilitar información veraz y mantenerla actualizada. Es responsable de la
          confidencialidad de sus credenciales y de toda actividad realizada desde su cuenta.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="precios" title={SECTIONS[3].title}>
        <p>
          Los precios vigentes están publicados en la sección de precios de la plataforma. Los importes se facturan
          por adelantado y son sin IVA salvo indicación en contrario. Cualquier impuesto aplicable se añadirá al
          importe facturado.
        </p>
        <p>
          Los gimnasios pueden probar Kinflow <strong>gratis durante 14 días</strong>, sin compromiso y sin
          introducir datos de pago. Al terminar la prueba, el servicio solo continúa si el gimnasio contrata un plan.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="cancelacion" title={SECTIONS[4].title}>
        <p>
          El usuario puede cancelar su plan en cualquier momento. La cancelación surtirá efectos al final del
          periodo facturado. No se realizan reembolsos por periodos ya iniciados salvo obligación legal.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="datos" title={SECTIONS[5].title}>
        <p>
          Cada gimnasio es el <strong>responsable del tratamiento</strong> de los datos de sus socios y equipo
          (datos de contacto, fecha de nacimiento, documento de identidad, dirección, contacto de emergencia,
          fotografía, reservas, pagos y marcas). Kinflow los trata por cuenta del gimnasio como{" "}
          <strong>encargado del tratamiento</strong>, solo para prestar el servicio, conforme al artículo 28 del RGPD
          y a la <a href="/legal/privacidad" className="underline">política de privacidad</a>.
        </p>
        <p>
          El gimnasio se compromete a informar a sus socios del uso de Kinflow, a contar con una base legal para
          los datos que registre y a no introducir datos que no necesite para su actividad.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="salud" title={SECTIONS[6].title}>
        <p>
          Los entrenamientos, WODs, rutinas y registros de marcas publicados en Kinflow son contenido del gimnasio
          y de sus entrenadores. No constituyen consejo médico. Cada socio debe entrenar según su estado de salud
          y consultar a un profesional sanitario cuando sea necesario.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="propiedad" title={SECTIONS[7].title}>
        <p>
          Todos los derechos de propiedad intelectual e industrial sobre la plataforma, su código, diseño, marcas
          y contenidos corresponden a Kinflow o a sus legítimos titulares. Queda prohibida cualquier reproducción,
          distribución o modificación sin autorización expresa.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="limitacion" title={SECTIONS[8].title}>
        <p>
          Salvo dolo o culpa grave, la responsabilidad de Kinflow se limita al importe efectivamente abonado por el
          usuario durante los seis meses anteriores al hecho generador de la responsabilidad. Kinflow no será
          responsable de daños indirectos, pérdida de beneficios o lucro cesante.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="modificaciones" title={SECTIONS[9].title}>
        <p>
          Kinflow podrá modificar estos términos por motivos legales, técnicos u operativos. Las modificaciones se
          comunicarán con antelación razonable y entrarán en vigor en la fecha indicada.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="ley" title={SECTIONS[10].title}>
        <p>
          Estos términos se rigen por la <strong>legislación española</strong>. Para la resolución de cualquier
          controversia las partes se someten a los <strong>Juzgados y Tribunales de {company.jurisdiction}</strong>, con
          renuncia expresa a cualquier otro fuero que pudiera corresponderles, salvo que la normativa aplicable
          disponga otra cosa.
        </p>
      </LegalSectionBlock>
    </LegalLayout>
  );
}

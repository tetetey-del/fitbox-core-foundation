import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout, LegalSectionBlock } from "@/components/legal/LegalLayout";
import { company } from "@/config/company";

const SECTIONS = [
  { id: "objeto", title: "1. Objeto y aceptación" },
  { id: "servicio", title: "2. Descripción del servicio" },
  { id: "cuenta", title: "3. Cuenta y responsabilidades" },
  { id: "precios", title: "4. Precios y pagos" },
  { id: "cancelacion", title: "5. Cancelación y bajas" },
  { id: "propiedad", title: "6. Propiedad intelectual" },
  { id: "limitacion", title: "7. Limitación de responsabilidad" },
  { id: "modificaciones", title: "8. Modificaciones" },
  { id: "ley", title: "9. Ley aplicable y jurisdicción" },
];

export const Route = createFileRoute("/legal/terminos")({
  head: () => ({
    meta: [
      { title: "Términos de servicio — FitBox" },
      { name: "description", content: "Términos y condiciones de uso de la plataforma FitBox." },
    ],
  }),
  component: TerminosPage,
});

function TerminosPage() {
  return (
    <LegalLayout title="Términos y condiciones" sections={SECTIONS} updatedAt="4 de julio de 2026">
      <LegalSectionBlock id="objeto" title={SECTIONS[0].title}>
        <p>
          Los presentes términos regulan el acceso y uso de la plataforma FitBox, titularidad de <strong>{company.legalName}</strong>,
          con CIF <strong>{company.taxId}</strong>. El registro y uso de la plataforma implican la aceptación expresa de estos términos.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="servicio" title={SECTIONS[1].title}>
        <p>
          FitBox es una plataforma de gestión para gimnasios y boxes de CrossFit que permite administrar reservas,
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
      </LegalSectionBlock>

      <LegalSectionBlock id="cancelacion" title={SECTIONS[4].title}>
        <p>
          El usuario puede cancelar su plan en cualquier momento. La cancelación surtirá efectos al final del
          periodo facturado. No se realizan reembolsos por periodos ya iniciados salvo obligación legal.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="propiedad" title={SECTIONS[5].title}>
        <p>
          Todos los derechos de propiedad intelectual e industrial sobre la plataforma, su código, diseño, marcas
          y contenidos corresponden a FitBox o a sus legítimos titulares. Queda prohibida cualquier reproducción,
          distribución o modificación sin autorización expresa.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="limitacion" title={SECTIONS[6].title}>
        <p>
          Salvo dolo o culpa grave, la responsabilidad de FitBox se limita al importe efectivamente abonado por el
          usuario durante los seis meses anteriores al hecho generador de la responsabilidad. FitBox no será
          responsable de daños indirectos, pérdida de beneficios o lucro cesante.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="modificaciones" title={SECTIONS[7].title}>
        <p>
          FitBox podrá modificar estos términos por motivos legales, técnicos u operativos. Las modificaciones se
          comunicarán con antelación razonable y entrarán en vigor en la fecha indicada.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="ley" title={SECTIONS[8].title}>
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

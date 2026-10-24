import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

/**
 * Textos de la landing en español neutro e inglés.
 * Para cambiar un texto, editalo acá: cada sección lee sus textos de este archivo.
 */

export type Lang = "es" | "en";

const es = {
  nav: {
    product: "Producto",
    pricing: "Precios",
    faq: "Preguntas",
    login: "Iniciar sesión",
    create: "Crear mi box",
    switchTo: "EN",
    switchLabel: "View in English",
  },
  hero: {
    badge: "Software para boxes y gimnasios",
    titleA: "Tu box,",
    titleB: "siempre en flow.",
    subtitle:
      "Reservas con lista de espera, socios y cuotas, marcas personales y la comunidad de tu box. Todo en una sola app, simple y rápida, para que el tiempo vaya al entrenamiento y no a los papeles.",
    create: "Crear mi box",
    login: "Ya tengo cuenta",
    small: "Sin tarjeta · 14 días gratis · Cancelación en cualquier momento",
    mockTitle: "Tu box · Reservas",
    days: ["Lun 08", "Mar 09", "Mié 10"],
    classes: ["07:00 WOD", "09:30 Funcional", "17:30 Halterofilia", "19:00 WOD"],
    free: "libre",
    waiting: "2 en espera",
    wodLabel: "WOD del día · Fran",
  },
  metrics: [
    { value: 14, label: "días de prueba gratis", suffix: "" },
    { value: 0, label: "comisión sobre tus cuotas", suffix: "%" },
    { value: 3, label: "pasos para empezar", suffix: "" },
    { value: 24, label: "reservas desde el teléfono", suffix: "/7" },
  ],
  features: {
    title: "Todo lo que tu box necesita, sin lo que sobra.",
    subtitle:
      "Kinflow reúne reservas, socios, cobros y comunidad en una sola herramienta, pensada por y para dueños de gimnasios.",
    items: [
      { title: "Reservas con lista de espera", desc: "Calendario semanal, lista de espera automática, check-ins y plazo de cancelación a tu medida." },
      { title: "Socios y planes", desc: "Planes ilimitados o por clases, renovaciones, historial de pagos y el estado de cada socio de un vistazo." },
      { title: "Marcas y ranking", desc: "Cada socio registra sus marcas personales, ve su evolución en gráficos y compite en el ranking del box." },
      { title: "Comunidad del box", desc: "Avisos, entrenamientos del día, consejos y novedades, sin depender de grupos de WhatsApp." },
      { title: "Tu marca, tu app", desc: "Tu logo, tu color y tu tema. Tus socios ven tu box, no una app genérica." },
      { title: "Varias sedes, un panel", desc: "Para quien tiene más de un gimnasio: todo desde un único panel, con métricas globales." },
    ],
  },
  how: {
    title: "Empezar es fácil",
    subtitle: "De cero a funcionando en menos de cinco minutos.",
    steps: [
      { title: "Tu box", desc: "Nombre, color y logo. Listo en segundos." },
      { title: "Planes y clases", desc: "Tarifas y horarios que se repiten, con plantillas." },
      { title: "Tus socios", desc: "Reciben la invitación y desde el primer día reservan y registran sus marcas." },
    ],
  },
  pwa: {
    badge: "Funciona como app",
    titleA: "Una app en el",
    titleB: "teléfono de tus socios",
    titleC: ".",
    subtitle:
      "Kinflow se instala desde el navegador: acceso directo en la pantalla de inicio, pantalla completa y navegación fluida. Sin App Store ni Google Play.",
    items: [
      { title: "Se instala en un toque", desc: "Sin descargas desde tiendas: se agrega directo a la pantalla de inicio." },
      { title: "Rápida como una app", desc: "Carga al instante y está pensada para usarse con una mano." },
      { title: "Siempre a mano", desc: "Reservas y marcas disponibles aunque la señal dentro del box sea débil." },
    ],
    cta: "Probar Kinflow",
    phoneBox: "Tu box",
    phoneClass: "Hoy · 19:00 WOD",
    phoneBooked: "9/12 · reservada",
    phonePr: "Marca personal",
  },
  pricing: {
    title: "Planes que crecen con tu box",
    subtitle: "14 días gratis. Cambio de plan o cancelación cuando quieras.",
    monthly: "Mensual",
    annual: "Anual",
    popular: "Más elegido",
    perMonth: "mes",
    perYear: "año",
    equals: (n: number) => `Equivale a ${n} €/mes`,
    start: (name: string) => `Empezar con ${name}`,
    plans: {
      Starter: {
        desc: "Para boxes pequeños o que están empezando.",
        features: ["Hasta 50 socios", "Reservas y cuotas", "1 administrador y 1 coach", "Comunidad básica", "Soporte por email"],
      },
      Pro: {
        desc: "Para boxes en crecimiento.",
        features: ["Socios ilimitados", "Todos los módulos", "Marcas y ranking", "Tu logo y tus colores", "Coaches ilimitados", "Notificaciones"],
      },
      Business: {
        desc: "Para cadenas y varias sedes.",
        features: ["Todo lo del plan Pro", "Varias sedes en un panel", "Exportación de datos", "Soporte prioritario", "Puesta en marcha acompañada"],
      },
    },
  },
  founder: {
    title: "Hecho por alguien que tuvo un box",
    quote:
      "Durante años tuve mi propio gimnasio, Chia Training. Sé lo que es organizar clases, cobrar cuotas y responder mensajes a cualquier hora. Kinflow es la herramienta que me hubiera gustado tener: simple, rápida y pensada para que el tiempo vaya al entrenamiento.",
    name: "Celeste Teyssedou",
    role: "Fundadora de Kinflow · Profesora de Educación Física · CrossFit L1",
  },
  faq: {
    title: "Preguntas frecuentes",
    items: [
      { q: "¿Sirve para gimnasios que no son de CrossFit?", a: "Sí. Kinflow funciona para boxes de CrossFit y Hyrox, gimnasios de funcional y salas de musculación. Los módulos se activan según lo que necesite cada uno." },
      { q: "¿Puedo pasar mis socios y planes actuales?", a: "Sí. Las cuentas se crean en segundos o se importan desde un archivo. En el plan Business te ayudamos con la migración." },
      { q: "¿Qué pasa con mis datos si cancelo?", a: "Son tuyos. Se pueden exportar completos en cualquier momento desde Configuración → Datos." },
      { q: "¿Hace falta instalar una app?", a: "No. Kinflow funciona desde el navegador del teléfono y, si quieren, tus socios la agregan a la pantalla de inicio como una app más." },
      { q: "¿Cuántos coaches puedo tener?", a: "En Starter, uno; en Pro y Business, ilimitados. Cada coach tiene su propio acceso con permisos limitados." },
      { q: "¿Cobran comisión sobre las cuotas?", a: "No. Es una tarifa fija mensual y nada más. Las cuotas las cobra tu box como prefiera: efectivo, tarjeta o transferencia." },
      { q: "¿Hace falta saber de tecnología?", a: "Para nada. Si Instagram no es un problema, Kinflow tampoco. Y ante cualquier duda, respondemos rápido." },
    ],
  },
  finalCta: {
    title: "Tu box en flow, desde hoy.",
    subtitle: "En menos de un minuto tu box está creado y listo para probar con datos de ejemplo.",
    button: "Crear mi box",
  },
  footer: {
    tagline: "Software para boxes de CrossFit, Hyrox y gimnasios.",
    product: "Producto",
    features: "Funciones",
    pricing: "Precios",
    faq: "Preguntas frecuentes",
    account: "Cuenta",
    signup: "Crear cuenta",
    login: "Iniciar sesión",
    recover: "Recuperar contraseña",
    legal: "Legal",
    privacy: "Privacidad",
    cookies: "Cookies",
    terms: "Términos",
    notice: "Aviso legal",
    basedOn: "Basado en la plantilla de",
    createdBy: "creada por",
    demo: "Demo: los datos se guardan en tu navegador",
  },
};

export type LandingCopy = typeof es;

const en: LandingCopy = {
  nav: {
    product: "Product",
    pricing: "Pricing",
    faq: "FAQ",
    login: "Log in",
    create: "Create my gym",
    switchTo: "ES",
    switchLabel: "Ver en español",
  },
  hero: {
    badge: "Software for boxes and gyms",
    titleA: "Your box,",
    titleB: "always in flow.",
    subtitle:
      "Class booking with waitlists, members and memberships, personal records and your box's community. All in one simple, fast app, so your time goes into training, not paperwork.",
    create: "Create my gym",
    login: "I have an account",
    small: "No card needed · 14-day free trial · Cancel anytime",
    mockTitle: "Your box · Bookings",
    days: ["Mon 08", "Tue 09", "Wed 10"],
    classes: ["07:00 WOD", "09:30 Functional", "17:30 Weightlifting", "19:00 WOD"],
    free: "open",
    waiting: "2 waitlisted",
    wodLabel: "WOD of the day · Fran",
  },
  metrics: [
    { value: 14, label: "day free trial", suffix: "" },
    { value: 0, label: "commission on your fees", suffix: "%" },
    { value: 3, label: "steps to get started", suffix: "" },
    { value: 24, label: "booking from any phone", suffix: "/7" },
  ],
  features: {
    title: "Everything your box needs. Nothing it doesn't.",
    subtitle:
      "Kinflow brings bookings, members, payments and community together in one tool, built by and for gym owners.",
    items: [
      { title: "Bookings with waitlist", desc: "Weekly schedule, automatic waitlist, check-ins and a cancellation window that fits your rules." },
      { title: "Members and plans", desc: "Unlimited or class-pack plans, renewals, payment history and every member's status at a glance." },
      { title: "PRs and leaderboard", desc: "Members log their personal records, track progress with charts and compete on the box leaderboard." },
      { title: "Box community", desc: "Announcements, daily workouts, tips and news, without relying on WhatsApp groups." },
      { title: "Your brand, your app", desc: "Your logo, your color, your theme. Members see your box, not a generic app." },
      { title: "Many locations, one panel", desc: "Running more than one gym? Manage them all from a single panel with global metrics." },
    ],
  },
  how: {
    title: "Getting started is easy",
    subtitle: "From zero to up and running in under five minutes.",
    steps: [
      { title: "Your box", desc: "Name, color and logo. Done in seconds." },
      { title: "Plans and classes", desc: "Prices and recurring schedules, with templates." },
      { title: "Your members", desc: "They get an invite and start booking and logging PRs from day one." },
    ],
  },
  pwa: {
    badge: "Works like an app",
    titleA: "An app on your",
    titleB: "members' phones",
    titleC: ".",
    subtitle:
      "Kinflow installs straight from the browser: home screen icon, full screen and smooth navigation. No App Store or Google Play needed.",
    items: [
      { title: "Installs in one tap", desc: "No store downloads: it goes straight to the home screen." },
      { title: "Fast like an app", desc: "Loads instantly and is built to be used with one hand." },
      { title: "Always at hand", desc: "Bookings and PRs available even with weak signal inside the box." },
    ],
    cta: "Try Kinflow",
    phoneBox: "Your box",
    phoneClass: "Today · 19:00 WOD",
    phoneBooked: "9/12 · booked",
    phonePr: "Personal record",
  },
  pricing: {
    title: "Plans that grow with your box",
    subtitle: "14 days free. Switch plans or cancel anytime.",
    monthly: "Monthly",
    annual: "Yearly",
    popular: "Most popular",
    perMonth: "month",
    perYear: "year",
    equals: (n: number) => `That's €${n}/month`,
    start: (name: string) => `Start with ${name}`,
    plans: {
      Starter: {
        desc: "For small boxes or those just starting out.",
        features: ["Up to 50 members", "Bookings and memberships", "1 admin and 1 coach", "Basic community", "Email support"],
      },
      Pro: {
        desc: "For growing boxes.",
        features: ["Unlimited members", "All modules", "PRs and leaderboard", "Your logo and colors", "Unlimited coaches", "Notifications"],
      },
      Business: {
        desc: "For chains and multiple locations.",
        features: ["Everything in Pro", "Multiple locations in one panel", "Data export", "Priority support", "Guided setup"],
      },
    },
  },
  founder: {
    title: "Built by someone who ran a box",
    quote:
      "For years I ran my own gym, Chia Training. I know what it takes to organize classes, collect fees and answer messages at all hours. Kinflow is the tool I wish I'd had: simple, fast and designed so your time goes into training.",
    name: "Celeste Teyssedou",
    role: "Founder of Kinflow · PE teacher · CrossFit L1",
  },
  faq: {
    title: "Frequently asked questions",
    items: [
      { q: "Does it work for gyms that aren't CrossFit?", a: "Yes. Kinflow works for CrossFit and Hyrox boxes, functional training gyms and weight rooms. Each gym turns on the modules it needs." },
      { q: "Can I bring over my current members and plans?", a: "Yes. Accounts take seconds to create or can be imported from a file. On the Business plan we help you migrate." },
      { q: "What happens to my data if I cancel?", a: "It's yours. You can export everything at any time from Settings → Data." },
      { q: "Do members need to install an app?", a: "No. Kinflow runs in the phone's browser, and members can add it to their home screen like any other app." },
      { q: "How many coaches can I have?", a: "One on Starter; unlimited on Pro and Business. Each coach gets their own login with limited permissions." },
      { q: "Do you take a cut of membership fees?", a: "No. It's a flat monthly fee, that's it. Your box collects fees however it likes: cash, card or bank transfer." },
      { q: "Do I need to be good with tech?", a: "Not at all. If you can use Instagram, you can use Kinflow. And if you get stuck, we answer fast." },
    ],
  },
  finalCta: {
    title: "Get your box in flow today.",
    subtitle: "In under a minute your box is set up and ready to try with sample data.",
    button: "Create my gym",
  },
  footer: {
    tagline: "Software for CrossFit boxes, Hyrox and gyms.",
    product: "Product",
    features: "Features",
    pricing: "Pricing",
    faq: "FAQ",
    account: "Account",
    signup: "Sign up",
    login: "Log in",
    recover: "Reset password",
    legal: "Legal",
    privacy: "Privacy",
    cookies: "Cookies",
    terms: "Terms",
    notice: "Legal notice",
    basedOn: "Based on the template by",
    createdBy: "created by",
    demo: "Demo: data is stored in your browser",
  },
};

const COPY: Record<Lang, LandingCopy> = { es, en };
const STORAGE_KEY = "kinflow.landing.lang";

const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({
  lang: "es",
  setLang: () => {},
});

/** Guarda el idioma elegido y, la primera vez, usa el idioma del navegador. */
export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("es");

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      saved = null;
    }
    if (saved === "es" || saved === "en") {
      setLangState(saved);
    } else if (navigator.language && !navigator.language.toLowerCase().startsWith("es")) {
      setLangState("en");
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* sin almacenamiento: el idioma vale solo para esta visita */
    }
  };

  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}

/** Devuelve los textos de la landing en el idioma actual. */
export function useT(): LandingCopy {
  return COPY[useContext(LangContext).lang];
}

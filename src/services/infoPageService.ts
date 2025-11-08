import InfoPage, { IInfoPage, InfoPageSlug } from "@models/InfoPage";
import sanitizeHtml from "sanitize-html";

export interface UpdateInfoPageInput {
  title: string;
  content: string;
}

type DefaultContentConfig = Record<
  InfoPageSlug,
  { title: string; content: string }
>;

const DEFAULT_CONTENT: DefaultContentConfig = {
  clases: {
    title: "Clases",
    content: `
      <p><strong>Clases privadas y semi privadas</strong> diseñadas para acompañarte en tu camino con el tango. Cada encuentro se adapta a tus objetivos personales: técnica, musicalidad, conexión y confianza en la pista.</p>
      <ul>
        <li>✅ Sesiones personalizadas para todos los niveles.</li>
        <li>✅ Opciones individuales, en pareja o pequeños grupos.</li>
        <li>✅ Planes intensivos para viajeros o eventos especiales.</li>
      </ul>
      <p><strong>Información de contacto</strong><br/>
      📞 <a href="tel:+5491169624211">+54 9 11 6962 4211</a><br/>
      💬 <a href="https://wa.me/5491169624211?text=Hola%20Renata!%20Me%20interesa%20informaci%C3%B3n%20sobre%20las%20Clases%20Privadas%20y%20Semi%20Privadas%20de%20Tango." target="_blank">Consultar por WhatsApp</a></p>
    `,
  },
  intensivos: {
    title: "Intensivos",
    content: `
      <p>Programa especialmente pensado para profundizar en los rituales y la técnica del tango en jornadas intensivas que combinan teoría, práctica y espacios de integración.</p>
      <h3>Rituales del tango</h3>
      <ul>
        <li>Cabeceo</li>
        <li>Abrazo</li>
        <li>Charla</li>
        <li>Disolución</li>
      </ul>
      <h3>Baile: bases</h3>
      <ul>
        <li>Eje e intención</li>
        <li>Diálogo de los torsos</li>
        <li>Caminata</li>
        <li>La pista</li>
      </ul>
      <h3>Baile: ochos</h3>
      <ul>
        <li>Disociación</li>
        <li>Guiar y acompañar</li>
        <li>Ocho adelante</li>
        <li>Ocho atrás</li>
      </ul>
      <p><em>Integración de todo lo aprendido:</em> Rituales + Baile.</p>
      <div><strong>Modalidad:</strong> 6 horas • Presencial • Grupal • Lugar a convenir</div>
      <p><strong>Contacto</strong><br/>
      📞 <a href="tel:+5491169624211">+54 9 11 6962 4211</a><br/>
      💬 <a href="https://wa.me/5491169624211?text=Hola%20Renata!%20Me%20interesa%20el%20Programa%20Especial%20de%20Intensivos%20de%20Tango.%20%C2%BFPodr%C3%ADas%20darme%20m%C3%A1s%20informaci%C3%B3n?" target="_blank">Consultar por WhatsApp</a></p>
    `,
  },
};

const sanitizeConfig: sanitizeHtml.IOptions = {
  allowedTags: [
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "p",
    "span",
    "strong",
    "em",
    "u",
    "s",
    "blockquote",
    "ul",
    "ol",
    "li",
    "a",
    "br",
    "hr",
    "img",
    "figure",
    "figcaption",
    "div",
  ],
  allowedAttributes: {
    a: ["href", "name", "target", "rel"],
    img: ["src", "alt", "title", "width", "height", "style"],
    "*": ["style", "class"],
  },
  allowedStyles: {
    "*": {
      color: [/^#[0-9a-fA-F]{3,6}$/, /^rgb\(/, /^rgba\(/],
      "background-color": [/^#[0-9a-fA-F]{3,6}$/, /^rgb\(/, /^rgba\(/],
      "text-align": [/^(left|right|center|justify)$/],
      "font-size": [/^\d+(px|em|rem|%)$/],
      "font-weight": [/^(normal|bold|[1-9]00)$/],
      "text-decoration": [/^(none|underline|line-through)$/],
    },
  },
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }, true),
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
};

export class InfoPageService {
  private readonly allowedSlugs: InfoPageSlug[] = ["clases", "intensivos"];

  public isValidSlug(slug: string): slug is InfoPageSlug {
    return this.allowedSlugs.includes(slug as InfoPageSlug);
  }

  private sanitizeContent(content: string): string {
    return sanitizeHtml(content || "", sanitizeConfig);
  }

  public getDefault(slug: InfoPageSlug) {
    return DEFAULT_CONTENT[slug];
  }

  public async getPage(slug: InfoPageSlug): Promise<IInfoPage> {
    let page = await InfoPage.findOne({ slug });

    if (!page) {
      const defaults = this.getDefault(slug);
      page = await InfoPage.create({
        slug,
        title: defaults.title,
        content: this.sanitizeContent(defaults.content),
      });
    }

    return page;
  }

  public async updatePage(
    slug: InfoPageSlug,
    data: UpdateInfoPageInput,
    updatedBy?: string
  ): Promise<IInfoPage> {
    const sanitizedContent = this.sanitizeContent(data.content);
    const trimmedTitle = data.title?.trim() || this.getDefault(slug).title;

    const updateDocument: Record<string, unknown> = {
      title: trimmedTitle,
      content: sanitizedContent,
    };

    if (updatedBy) {
      updateDocument.updatedBy = updatedBy;
    }

    const page = await InfoPage.findOneAndUpdate(
      { slug },
      {
        $set: updateDocument,
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    if (!page) {
      throw new Error("No se pudo actualizar la página solicitada");
    }

    return page;
  }
}

import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from '@react-pdf/renderer';
import type { ProductoView } from '@/types/domain/producto';

// Fuentes integradas de react-pdf (no requieren descarga):
// Helvetica | Helvetica-Bold | Helvetica-Oblique | Helvetica-BoldOblique
// Courier   | Courier-Bold   | Times-Roman       | Times-Bold

// ─── Paleta ───────────────────────────────────────────────────────────────────
const C = {
  coverBg:  '#0f172a',
  blue:     '#2563eb',
  blueLight:'#60a5fa',
  green:    '#15803d',
  white:    '#ffffff',
  dark:     '#18181b',
  zinc600:  '#52525b',
  zinc400:  '#a1a1aa',
  zinc200:  '#e4e4e7',
  zinc100:  '#f4f4f5',
  zinc50:   '#fafafa',
};

// ─── Estilos ──────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  // Portada
  coverPage: {
    backgroundColor: C.coverBg,
    flexDirection: 'column',
  },
  coverBar: {
    height: 5,
    backgroundColor: C.blue,
  },
  coverBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 60,
    paddingVertical: 40,
  },
  coverBadge: {
    fontSize: 8,
    letterSpacing: 4,
    color: C.blueLight,
    marginBottom: 20,
    fontFamily: 'Helvetica',
  },
  coverTitle: {
    fontSize: 36,
    fontFamily: 'Helvetica-Bold',
    color: C.white,
    textAlign: 'center',
    lineHeight: 1.25,
  },
  coverDivider: {
    width: 56,
    height: 2,
    backgroundColor: C.blue,
    marginTop: 24,
    marginBottom: 24,
  },
  coverSystem: {
    fontSize: 14,
    color: '#94a3b8',
    fontFamily: 'Helvetica',
    textAlign: 'center',
    marginBottom: 6,
  },
  coverCategory: {
    fontSize: 11,
    color: C.blueLight,
    fontFamily: 'Helvetica',
    textAlign: 'center',
    marginBottom: 2,
  },
  coverStatsRow: {
    flexDirection: 'row',
    marginTop: 44,
    gap: 48,
  },
  coverStat: {
    alignItems: 'center',
    gap: 5,
  },
  coverStatNum: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    color: C.white,
  },
  coverStatLabel: {
    fontSize: 7.5,
    letterSpacing: 2,
    color: '#64748b',
    fontFamily: 'Helvetica',
  },
  coverDate: {
    fontSize: 9,
    color: '#475569',
    fontFamily: 'Helvetica',
    marginTop: 44,
  },

  // Página de productos
  page: {
    backgroundColor: C.white,
    paddingHorizontal: 36,
    paddingTop: 16,
    paddingBottom: 16,
    fontFamily: 'Helvetica',
  },

  // Encabezado fijo
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    marginBottom: 14,
    borderBottomWidth: 0.75,
    borderBottomColor: C.zinc200,
  },
  headerLeft: {
    flexDirection: 'column',
    gap: 2,
  },
  headerLabel: {
    fontSize: 7,
    letterSpacing: 2.5,
    color: C.zinc400,
    fontFamily: 'Helvetica',
  },
  headerBrand: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: C.dark,
  },
  headerPage: {
    fontSize: 8,
    color: C.zinc400,
    fontFamily: 'Helvetica',
  },

  // Pie de página fijo
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    marginTop: 14,
    borderTopWidth: 0.75,
    borderTopColor: C.zinc200,
  },
  footerText: {
    fontSize: 7.5,
    color: C.zinc400,
    fontFamily: 'Helvetica',
  },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  // Tarjeta (columna izquierda — sin margen izquierdo)
  cardLeft: {
    width: '48.5%',
    marginRight: '3%',
    marginBottom: 12,
  },
  // Tarjeta (columna derecha — sin margen derecho)
  cardRight: {
    width: '48.5%',
    marginBottom: 12,
  },

  // Contenido de la tarjeta
  card: {
    borderWidth: 0.75,
    borderColor: C.zinc200,
    borderRadius: 5,
    overflow: 'hidden',
    backgroundColor: C.white,
  },
  cardImg: {
    width: '100%',
    height: 150,
    objectFit: 'cover',
  },
  cardImgPlaceholder: {
    width: '100%',
    height: 150,
    backgroundColor: C.zinc100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardImgPlaceholderText: {
    fontSize: 8,
    color: C.zinc400,
    fontFamily: 'Helvetica',
  },
  cardBody: {
    padding: 11,
  },
  cardName: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: C.dark,
    lineHeight: 1.35,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 8,
    color: C.zinc600,
    lineHeight: 1.45,
    marginBottom: 9,
    fontFamily: 'Helvetica',
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 2,
  },
  cardPrice: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: C.green,
  },
  cardCode: {
    fontSize: 7,
    color: C.zinc400,
    fontFamily: 'Courier',
  },
  cardStock: {
    fontSize: 7.5,
    color: C.zinc600,
    marginTop: 3,
    fontFamily: 'Helvetica',
  },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCOP(n: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function trunc(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

// ─── Tarjeta de producto ──────────────────────────────────────────────────────

function ProductCard({ product, position }: { product: ProductoView; position: number }) {
  const isRight = position % 2 === 1;
  const code = product.id ? `REF-${product.id}` : `#${product.recordId}`;

  return (
    <View style={isRight ? S.cardRight : S.cardLeft} wrap={false}>
      <View style={S.card}>
        {product.urlImagen ? (
          <Image src={product.urlImagen} style={S.cardImg} />
        ) : (
          <View style={S.cardImgPlaceholder}>
            <Text style={S.cardImgPlaceholderText}>Sin imagen</Text>
          </View>
        )}
        <View style={S.cardBody}>
          <Text style={S.cardName}>{trunc(product.nombre, 60)}</Text>
          {product.descripcion ? (
            <Text style={S.cardDesc}>{trunc(product.descripcion, 100)}</Text>
          ) : null}
          <View style={S.cardBottom}>
            <Text style={S.cardPrice}>{formatCOP(product.precioVenta)}</Text>
            <Text style={S.cardCode}>{code}</Text>
          </View>
          <Text style={S.cardStock}>Stock: {product.cantidad} uds.</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Documento PDF ────────────────────────────────────────────────────────────

export interface CatalogoPDFProps {
  products:        ProductoView[];
  sistemaId:       string;
  fecha:           string;
  categoriaNombre?: string;
}

export function CatalogoPDF({
  products,
  sistemaId,
  fecha,
  categoriaNombre,
}: CatalogoPDFProps) {
  const totalProductos = products.length;
  const paginas        = Math.ceil(totalProductos / 4) || 1;

  return (
    <Document
      title={`Catálogo${categoriaNombre ? ` — ${categoriaNombre}` : ''}`}
      author={sistemaId}
      creator="FM Productos"
      producer="FM Productos · Next.js"
    >
      {/* ── Portada ─────────────────────────────────────────── */}
      <Page size="A4" style={S.coverPage}>
        <View style={S.coverBar} />
        <View style={S.coverBody}>
          <Text style={S.coverBadge}>CATÁLOGO DIGITAL DE PRODUCTOS</Text>
          <Text style={S.coverTitle}>{'CATÁLOGO DE\nPRODUCTOS'}</Text>
          <View style={S.coverDivider} />
          <Text style={S.coverSystem}>{sistemaId}</Text>
          {categoriaNombre ? (
            <Text style={S.coverCategory}>{categoriaNombre}</Text>
          ) : null}
          <View style={S.coverStatsRow}>
            <View style={S.coverStat}>
              <Text style={S.coverStatNum}>{totalProductos}</Text>
              <Text style={S.coverStatLabel}>PRODUCTOS</Text>
            </View>
            <View style={S.coverStat}>
              <Text style={S.coverStatNum}>{paginas}</Text>
              <Text style={S.coverStatLabel}>PÁGINAS</Text>
            </View>
          </View>
          <Text style={S.coverDate}>{fecha}</Text>
        </View>
        <View style={S.coverBar} />
      </Page>

      {/* ── Páginas de productos ─────────────────────────────── */}
      <Page size="A4" style={S.page}>
        {/* Encabezado fijo */}
        <View fixed style={S.header}>
          <View style={S.headerLeft}>
            <Text style={S.headerLabel}>CATÁLOGO DE PRODUCTOS</Text>
            <Text style={S.headerBrand}>{sistemaId}</Text>
          </View>
          <Text
            style={S.headerPage}
            render={({ subPageNumber, subPageTotalPages }) =>
              `Pág. ${subPageNumber} / ${subPageTotalPages}`
            }
          />
        </View>

        {/* Grid de productos */}
        <View style={S.grid}>
          {products.map((p, i) => (
            <ProductCard key={p.recordId} product={p} position={i} />
          ))}
        </View>

        {/* Pie de página fijo */}
        <View fixed style={S.footer}>
          <Text style={S.footerText}>{fecha}</Text>
          <Text style={S.footerText}>
            {categoriaNombre ? `Categoría: ${categoriaNombre}` : 'Todos los productos'}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

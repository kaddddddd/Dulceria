export const C = {
  lila:        '#C084FC',
  morado:      '#A855F7',
  moradoDark:  '#7E22CE',
  moradoClaro: '#DDD6FE',
  lilaPalido:  '#F5F0FF',
  rosa:        '#F472B6',
  verde:       '#6EE7B7',
  rojo:        '#FB7185',
  bg:          '#FDF8FF',
  surface:     '#FFFFFF',
  border:      '#EDE9FE',
  textMuted:   '#9CA3AF',
  text:        '#1F2937',
};

export function fmt(n) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0,
  }).format(n || 0);
}

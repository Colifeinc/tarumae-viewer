
float grayscale(rgb) {
  return 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
}

#pragma glslify: export(grayscale)

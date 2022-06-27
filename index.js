const atob = require('atob');
const btoa = require('btoa');

const isBase64 = require('is-base64');

const decodeId = (node) => {
  return {
    ...node,
    id: isBase64(node.id) ? atob(node.id) : node.id,
    storefrontId: isBase64(node.id) ? node.id : btoa(node.id),
  };
};

const optionsMap = (valueKey) => (map, option) => {
  return {
    ...map,
    [option.name]: option[valueKey],
  };
};

const addProduct = function addProduct(node) {
  return {
    ...node,
    product: {
      title: this.title,
      productType: this.productType,
      id: this.id,
      legacyResourceId: this.legacyResourceId,
      handle: this.handle,
      tags: this.tags,
    },
  };
};

const normalizeImage = (image) => {
  if (!image || !image.id) return null;

  return {
    ...image,
    id: isBase64(image.id) ? atob(image.id) : image.id,
    ratio: Math.round((image.width / image.height) * 100) / 100,
  };
};

const normalizeMedia = function normalizeMedia(media) {
  if (media.mediaContentType === 'IMAGE') {
    return {
      ...media,
      image: normalizeImage(media.image),
      previewImage: normalizeImage(media.preview.image),
    };
  }

  return {
    ...media,
    previewImage: normalizeImage(media.preview.image),
  };
};

const normalizeProductVariant = (variant) => {
  return {
    ...variant,
    image: normalizeImage(variant.image),
    selectedOptionsMap: variant.selectedOptions.reduce(optionsMap('value'), {}),
  };
};

const normalizeProduct = function normalizeProduct(product) {
  const variants = product.variants
    .map(decodeId)
    .map(addProduct, product)
    .map(normalizeProductVariant);

  const media = product.media
    .map(decodeId)
    .map(addProduct, product)
    .map(normalizeMedia, product);

  const images = media
    .filter(({ mediaContentType }) => mediaContentType === 'IMAGE')
    .map(({ image }) => image);

  return {
    ...product,
    variants,
    media,
    images,
    featuredImage: images[0] || null,
    options: product.options.map(decodeId),
    optionsMap: product.options.reduce(optionsMap('values'), {}),
    seo: {
      title: product.seo.title || product.title,
      description: product.seo.description || product.description,
    },
  };
};

module.exports = (input) => {
  const { products, collections } = input;

  const result = {
    products: products.map(decodeId).map(normalizeProduct),
    collections: collections.map(decodeId),
  };

  return result;
};

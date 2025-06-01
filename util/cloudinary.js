export function getCloudinaryPublicId(imageUrl) {
  const match = imageUrl.match(/\/upload\/(?:v\d+\/)?(.+?)\.[a-z]+$/i);
  return match ? match[1] : null;
};

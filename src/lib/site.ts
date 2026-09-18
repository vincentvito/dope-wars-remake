/** Public identity and canonical URLs shared by visible copy and structured data. */
export const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.playdopewars.com').replace(/\/$/, '');
export const publisherName = 'Play Dope Wars';
export const siteIds = {
  publisher: `${siteUrl}/#publisher`,
  website: `${siteUrl}/#website`,
  game: `${siteUrl}/#game`,
};
export const publisher = {
  '@type': 'Organization', '@id': siteIds.publisher,
  name: publisherName, url: siteUrl,
  logo: { '@type': 'ImageObject', url: `${siteUrl}/icon-512.png` },
};

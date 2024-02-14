export function convertImageUrl(originalUrl, width, quality) {
    // Extract the file extension from the original URL
    const fileExtension = originalUrl.split('.').pop();

    // Extract the part of the URL before the file extension
    const baseUrl = originalUrl.replace(`.${fileExtension}`, '');

    // Construct the new URL with resizing and compression parameters
    const newUrl = `https:${baseUrl}_${width}x10000q${quality}.${fileExtension}_.webp`;

    return newUrl;
}

export function convertImageUrl(originalUrl: string, width: number, quality: number): string {
    // Extract the file extension from the original URL
    const fileExtension = originalUrl.split('.').pop();

    // Replace the domain with 'gw.alicdn.com'
    const newUrl = originalUrl.replace(/\/\/img\.alicdn\.com/, '//gw.alicdn.com');

    // Construct the new URL with resizing and compression parameters
    const finalUrl = `https:${newUrl}_${width}x10000q${quality}.jpg_.webp`;

    return finalUrl;
}
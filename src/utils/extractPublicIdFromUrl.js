export const extractPublicIdFromUrl = (url) => {
    const segments = url.split('/');
    const lastSegment = segments.pop();
    const publicId = lastSegment.split('.')[0];
    return publicId;
};

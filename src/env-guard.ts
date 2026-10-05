// A malformed CLOUDINARY_URL makes the cloudinary package throw while it is
// being imported, which takes the entire API down rather than just uploads —
// and a deploy then fails with nothing pointing at the cause. This runs before
// anything imports that package: it trims a value pasted with stray quotes or
// spaces, and drops one that is not a cloudinary:// address at all.
const raw = process.env.CLOUDINARY_URL;

if (raw !== undefined) {
    const trimmed = raw.trim().replace(/^['"]+|['"]+$/g, '');
    if (trimmed.toLowerCase().startsWith('cloudinary://')) {
        process.env.CLOUDINARY_URL = trimmed;
    } else {
        console.error(
            `CLOUDINARY_URL must start with cloudinary:// — ignoring the value that was set${trimmed ? ` (it starts with "${trimmed.slice(0, 12)}")` : ''}`,
        );
        process.env.CLOUDINARY_URL_REJECTED = '1';
        delete process.env.CLOUDINARY_URL;
    }
}

export {};

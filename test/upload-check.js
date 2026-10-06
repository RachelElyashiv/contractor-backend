// Integration check for the upload path. Boots the real controllers and posts
// real multipart bodies. Phase 1 stubs Cloudinary's transport so the upload
// succeeds and we can inspect exactly what would be sent. Phase 2 lets the
// call fail so we can inspect what the app is told.
// Not committed — this runs in the agent container only.
const request = require('supertest');
const { Test } = require('@nestjs/testing');
const { ValidationPipe } = require('@nestjs/common');
const { PassThrough } = require('stream');

process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
process.env.CLOUDINARY_API_KEY = '123456789012345';
process.env.CLOUDINARY_API_SECRET = 'definitely-not-a-real-secret';

const cloudinary = require('cloudinary').v2;
const { getRepositoryToken } = require('@nestjs/typeorm');
const { PhotosController, UploadsHealthController, PhotosService, Photo } = require('../dist/photos/photos.module');
const { JwtAuthGuard } = require('../dist/auth/jwt-auth.guard');

const realUploadStream = cloudinary.uploader.upload_stream.bind(cloudinary.uploader);
let sent = [];

function stubCloudinary() {
  cloudinary.uploader.upload_stream = (opts, cb) => {
    const chunks = [];
    const stream = new PassThrough();
    stream.on('data', (c) => chunks.push(c));
    stream.on('end', () => {
      const body = Buffer.concat(chunks);
      sent.push({ opts, bytes: body.length, head: body.subarray(0, 8) });
      const kind = opts.resource_type === 'raw' ? 'raw' : 'image';
      cb(null, {
        secure_url: `https://res.cloudinary.com/test-cloud/${kind}/upload/v1/${opts.public_id}`,
        public_id: opts.public_id,
        bytes: body.length,
      });
    });
    return stream;
  };
}
function unstubCloudinary() {
  cloudinary.uploader.upload_stream = realUploadStream;
}

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '\n        ' + detail : ''}`);
}

const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

(async () => {
  // the real PhotosService, backed by a stub repository, so the code under
  // test is the code that ships
  let rowId = 0;
  const fakeRepo = {
    create: (data) => ({ id: 'row-' + rowId++, ...data }),
    save: async (rows) => rows,
    find: async () => [],
    findOne: async () => null,
    remove: async () => undefined,
  };

  const moduleRef = await Test.createTestingModule({
    controllers: [PhotosController, UploadsHealthController],
    providers: [PhotosService, { provide: getRepositoryToken(Photo), useValue: fakeRepo }],
  })
    .overrideGuard(JwtAuthGuard)
    .useValue({
      canActivate: (ctx) => {
        ctx.switchToHttp().getRequest().user = { id: 'owner-1' };
        return true;
      },
    })
    .compile();

  const app = moduleRef.createNestApplication();
  // same global setup as src/main.ts
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: false }));
  app.setGlobalPrefix('api/v1');
  await app.init();
  const http = app.getHttpServer();

  // ---------- phase 1: the happy path, with Cloudinary's transport stubbed ----------
  stubCloudinary();

  sent = [];
  const img = await request(http)
    .post('/api/v1/photos/upload')
    .field('projectId', 'proj-9')
    .field('caption', 'יציקת רצפה')
    .attach('files', png, { filename: 'תמונה מהאתר.png', contentType: 'image/png' });

  check(
    'photo upload succeeds end to end',
    img.status === 201 && Array.isArray(img.body) && img.body.length === 1,
    `status=${img.status} body=${JSON.stringify(img.body)}`,
  );
  check(
    'the whole file arrives — the bytes multer forwards match what was posted',
    sent.length === 1 && sent[0].bytes === png.length && sent[0].head.equals(png.subarray(0, 8)),
    `bytes=${sent[0] && sent[0].bytes} expected=${png.length}`,
  );
  check(
    'a photo is uploaded as an image, into the app folder',
    sent[0] && sent[0].opts.resource_type === 'image' && sent[0].opts.folder === 'contractor-app',
    `opts=${JSON.stringify(sent[0] && sent[0].opts)}`,
  );
  check(
    'the hebrew file name is stored readable, not as gibberish',
    img.body[0] && img.body[0].filename === 'תמונה מהאתר.png',
    `filename=${img.body[0] && img.body[0].filename}`,
  );
  check(
    'the cloudinary id stays plain ascii so the link needs no encoding',
    sent[0] && /^[A-Za-z0-9_.-]+$/.test(sent[0].opts.public_id),
    `public_id=${sent[0] && sent[0].opts.public_id}`,
  );
  check(
    'projectId and caption reach the record',
    img.body[0] && img.body[0].projectId === 'proj-9' && img.body[0].caption === 'יציקת רצפה',
    `row=${JSON.stringify(img.body[0])}`,
  );

  sent = [];
  const pdf = Buffer.from('%PDF-1.4\nfake plan\n');
  const doc = await request(http)
    .post('/api/v1/photos/upload')
    .attach('files', pdf, { filename: 'תוכנית קומה 3.pdf', contentType: 'application/pdf' });
  check(
    'a pdf plan uploads, with its hebrew name intact',
    doc.status === 201 && doc.body.length === 1 && doc.body[0].filename === 'תוכנית קומה 3.pdf',
    `status=${doc.status} filename=${doc.body[0] && doc.body[0].filename}`,
  );
  check(
    'a pdf goes up as raw, keeping its .pdf extension so the link opens as a pdf',
    sent[0] && sent[0].opts.resource_type === 'raw' && sent[0].opts.public_id.endsWith('.pdf'),
    `opts=${JSON.stringify(sent[0] && sent[0].opts)}`,
  );
  check(
    'the stored url marks it raw, which is what delete relies on',
    doc.body[0] && doc.body[0].url.includes('/raw/upload/'),
    `url=${doc.body[0] && doc.body[0].url}`,
  );

  sent = [];
  const dwg = await request(http)
    .post('/api/v1/photos/upload')
    .attach('files', Buffer.from('AC1032 fake dwg'), { filename: 'plan.dwg', contentType: 'application/octet-stream' });
  check(
    'a dwg building plan uploads — the old allowed-formats list would have refused it',
    dwg.status === 201 && sent[0] && sent[0].opts.resource_type === 'raw' && sent[0].opts.public_id.endsWith('.dwg'),
    `status=${dwg.status} public_id=${sent[0] && sent[0].opts.public_id}`,
  );

  sent = [];
  const docx = await request(http)
    .post('/api/v1/photos/upload')
    .attach('files', Buffer.from('PK fake docx'), {
      filename: 'תעודת משלוח.docx',
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
  check(
    'a word delivery note uploads, hebrew name intact and ascii id',
    docx.status === 201 &&
      sent[0] &&
      sent[0].opts.public_id.endsWith('.docx') &&
      /^[A-Za-z0-9_.-]+$/.test(sent[0].opts.public_id) &&
      docx.body[0].filename === 'תעודת משלוח.docx',
    `status=${docx.status} public_id=${sent[0] && sent[0].opts.public_id} filename=${docx.body[0] && docx.body[0].filename}`,
  );

  // the phone's native uploader sends one file per request and carries the
  // name the person chose as a form field, because the part itself is named
  // after a cache file
  sent = [];
  const named = await request(http)
    .post('/api/v1/photos/upload')
    .field('originalName', 'תוכנית חשמל קומה 2.pdf')
    .field('caption', 'תוכנית')
    .attach('files', pdf, { filename: 'DocumentPicker-9f3a1c.pdf', contentType: 'application/pdf' });
  check(
    'a single upload is stored under the name the person chose, not the cache name',
    named.status === 201 && named.body[0].filename === 'תוכנית חשמל קומה 2.pdf',
    `filename=${named.body[0] && named.body[0].filename}`,
  );
  check(
    'that upload still goes up as raw with its extension',
    sent[0] && sent[0].opts.resource_type === 'raw' && sent[0].opts.public_id.endsWith('.pdf'),
    `opts=${JSON.stringify(sent[0] && sent[0].opts)}`,
  );

  sent = [];
  const many = await request(http)
    .post('/api/v1/photos/upload')
    .field('originalName', 'should-be-ignored.pdf')
    .attach('files', png, { filename: 'a.png', contentType: 'image/png' })
    .attach('files', png, { filename: 'b.png', contentType: 'image/png' })
    .attach('files', pdf, { filename: 'c.pdf', contentType: 'application/pdf' });
  check(
    'a batch ignores the single name and keeps each file its own',
    many.status === 201 && many.body[0].filename === 'a.png' && many.body[2].filename === 'c.pdf',
    `names=${many.body.map((r) => r.filename).join(', ')}`,
  );
  check(
    'several files in one go, mixed photos and documents',
    many.status === 201 && many.body.length === 3 && sent.length === 3,
    `status=${many.status} rows=${many.body.length} uploads=${sent.length}`,
  );
  check(
    'two files with the same name do not collide',
    new Set(sent.map((s) => s.opts.public_id)).size === 3,
    `public_ids=${sent.map((s) => s.opts.public_id).join(', ')}`,
  );

  const empty = await request(http).post('/api/v1/photos/upload');
  check(
    'a post with no file is a clear 400, not a silent success',
    empty.status === 400 && String(empty.body.message).includes('לא התקבל'),
    `status=${empty.status} body=${JSON.stringify(empty.body)}`,
  );

  const list = await request(http).get('/api/v1/photos');
  check('GET /api/v1/photos still works', list.status === 200, `status=${list.status}`);

  // ---------- phase 2: what the app is told when Cloudinary refuses ----------
  unstubCloudinary();

  const failed = await request(http)
    .post('/api/v1/photos/upload')
    .attach('files', png, { filename: 'x.png', contentType: 'image/png' });
  check(
    'a Cloudinary failure reaches the app as a readable reason, not "Internal server error"',
    failed.status === 502 &&
      String(failed.body.message).startsWith('ההעלאה נכשלה') &&
      String(failed.body.message).length > 'ההעלאה נכשלה: '.length,
    `status=${failed.status} message=${failed.body && failed.body.message}`,
  );

  const health = await request(http).get('/api/v1/uploads-health');
  check(
    'GET /api/v1/uploads-health is routed under the api prefix',
    health.status === 200,
    `status=${health.status} body=${JSON.stringify(health.body)}`,
  );
  check(
    'it reports a problem rather than claiming success',
    health.body && health.body.ok === false,
    `ok=${health.body && health.body.ok} reason=${health.body && health.body.reason}`,
  );
  check(
    'it never prints the api secret',
    JSON.stringify(health.body).indexOf(process.env.CLOUDINARY_API_SECRET) === -1,
    `credentials=${JSON.stringify(health.body.credentials)}`,
  );

  await app.close();

  const bad = results.filter((r) => !r.ok);
  console.log(`\n${results.length - bad.length}/${results.length} checks passed`);
  process.exit(bad.length ? 1 : 0);
})().catch((e) => {
  console.error('harness crashed:', e);
  process.exit(1);
});

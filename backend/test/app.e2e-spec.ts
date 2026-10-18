/**
 * End-to-end tests: the real API (same setup as main.ts) against the local database.
 * Needs:  docker compose up -d   and   npx prisma migrate deploy   (see README).
 */
import 'dotenv/config';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { configureApp } from '../src/setup.js';

const runId = Date.now().toString(36);
const emails = [`alice-${runId}@test.local`, `bob-${runId}@test.local`];

describe('Pavement design API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let http: ReturnType<typeof request>;
  let alice: string; // bearer tokens
  let bob: string;
  let projectId: string;
  let designId: string;

  beforeAll(async () => {
    process.env.CORS_ORIGINS = 'http://localhost:3000,https://pavement-*.vercel.app';
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = configureApp(moduleRef.createNestApplication());
    await app.init();
    prisma = app.get(PrismaService);
    http = request(app.getHttpServer());
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { in: emails } } }); // cascades to projects and designs
    await app.close();
  });

  it('GET /health reports the server and database', async () => {
    const res = await http.get('/health').expect(200);
    expect(res.body).toMatchObject({ status: 'ok', database: 'up' });
  });

  describe('auth', () => {
    it('registers two users and returns tokens', async () => {
      const a = await http.post('/auth/register').send({ email: emails[0], password: 'secret-pass-1', name: 'Alice' }).expect(201);
      const b = await http.post('/auth/register').send({ email: emails[1].toUpperCase(), password: 'secret-pass-2' }).expect(201);
      alice = a.body.accessToken;
      bob = b.body.accessToken;
      expect(a.body.user).toMatchObject({ email: emails[0], name: 'Alice' });
      expect(b.body.user.email).toBe(emails[1]); // stored lower-case
      expect(a.body.user.passwordHash).toBeUndefined();
    });

    it('rejects a duplicate email, short passwords and bad emails', async () => {
      await http.post('/auth/register').send({ email: emails[0], password: 'whatever-123' }).expect(409);
      const res = await http.post('/auth/register').send({ email: 'not-an-email', password: 'short' }).expect(400);
      expect(res.body.message).toEqual(expect.arrayContaining(['Enter a valid email address', 'Password must be at least 8 characters']));
    });

    it('logs in with the right password only', async () => {
      await http.post('/auth/login').send({ email: emails[0], password: 'secret-pass-1' }).expect(200);
      const res = await http.post('/auth/login').send({ email: emails[0], password: 'wrong-password' }).expect(401);
      expect(res.body.message).toBe('Wrong email or password');
    });

    it('protects routes and returns the current user', async () => {
      await http.get('/projects').expect(401);
      await http.get('/projects').set('Authorization', 'Bearer not-a-token').expect(401);
      const me = await http.get('/auth/me').set('Authorization', `Bearer ${alice}`).expect(200);
      expect(me.body.email).toBe(emails[0]);
    });
  });

  describe('projects', () => {
    it('creates, lists, updates a project', async () => {
      const created = await http.post('/projects').set('Authorization', `Bearer ${alice}`)
        .send({ name: '  Addis–Adama road ', location: 'km 12–18' }).expect(201);
      projectId = created.body.id;
      expect(created.body.name).toBe('Addis–Adama road');
      const list = await http.get('/projects').set('Authorization', `Bearer ${alice}`).expect(200);
      expect(list.body).toEqual([expect.objectContaining({ id: projectId, designCount: 0, adequateCount: 0 })]);
      await http.patch(`/projects/${projectId}`).set('Authorization', `Bearer ${alice}`).send({ description: 'Phase 1' }).expect(200);
    });

    it('validates input and rejects unknown fields', async () => {
      const res = await http.post('/projects').set('Authorization', `Bearer ${alice}`).send({ name: '', colour: 'red' }).expect(400);
      expect(res.body.message).toEqual(expect.arrayContaining(['Give the project a name', 'property colour should not exist']));
    });

    it("hides other users' projects (404)", async () => {
      await http.get(`/projects/${projectId}`).set('Authorization', `Bearer ${bob}`).expect(404);
      await http.delete(`/projects/${projectId}`).set('Authorization', `Bearer ${bob}`).expect(404);
      const list = await http.get('/projects').set('Authorization', `Bearer ${bob}`).expect(200);
      expect(list.body).toEqual([]);
    });
  });

  describe('designs', () => {
    it('calculates without saving (public), matching the user spreadsheet', async () => {
      const res = await http.post('/designs/calculate')
        .send({ reliability: 98, w18: 131, mrMethod: 'mr', mrPsi: { base: 43500, dbm: 400000 } }).expect(200);
      expect(res.body.zr).toBe(-2.045);
      expect(res.body.requiredSnOn.dbm).toBeCloseTo(1.901, 3);
      expect(res.body.layers[0].minThicknessMm).toBe(109.8);
    });

    it('returns readable validation errors for bad inputs', async () => {
      const res = await http.post('/designs/calculate').send({ reliability: 150, m: { base: 2 }, thicknessMm: { ac: -5 } }).expect(400);
      expect(res.body.message.join(' | ')).toMatch(/reliability.*m\.base|m\.base.*reliability/s);
      expect(res.body.message.join(' | ')).toContain('thicknessMm.ac');
    });

    it('saves a design under a project with summary columns', async () => {
      const res = await http.post(`/projects/${projectId}/designs`).set('Authorization', `Bearer ${alice}`)
        .send({ name: 'Default 4-layer', inputs: {} }).expect(201);
      designId = res.body.id;
      expect(res.body).toMatchObject({ adequate: true, layerCount: 4 });
      expect(res.body.requiredSn).toBeCloseTo(6.688, 3);
      expect(res.body.inputs).toEqual({}); // only what the user changed is stored
    });

    it('saves a not-adequate 3-layer design (AC too thin)', async () => {
      const res = await http.post(`/projects/${projectId}/designs`).set('Authorization', `Bearer ${alice}`)
        .send({ name: 'Thin AC, no DBM', inputs: { useDbmLayer: false, thicknessMm: { ac: 60 } } }).expect(201);
      expect(res.body).toMatchObject({ adequate: false, layerCount: 3 });
      expect(res.body.result.failedLayers).toEqual(['AC Course']);
    });

    it('lists, gets and updates (recalculates) a design', async () => {
      const list = await http.get(`/projects/${projectId}/designs`).set('Authorization', `Bearer ${alice}`).expect(200);
      expect(list.body).toHaveLength(2);
      expect(list.body[0].result).toBeUndefined(); // lists send summary columns only
      const one = await http.get(`/designs/${designId}`).set('Authorization', `Bearer ${alice}`).expect(200);
      expect(one.body.project.name).toBe('Addis–Adama road');
      const updated = await http.patch(`/designs/${designId}`).set('Authorization', `Bearer ${alice}`)
        .send({ name: 'With capping', inputs: { useCappingLayer: true } }).expect(200);
      expect(updated.body).toMatchObject({ name: 'With capping', layerCount: 5, adequate: true });
    });

    it("blocks other users' designs", async () => {
      await http.get(`/designs/${designId}`).set('Authorization', `Bearer ${bob}`).expect(404);
      await http.post(`/projects/${projectId}/designs`).set('Authorization', `Bearer ${bob}`).send({ name: 'x', inputs: {} }).expect(404);
    });
  });

  describe('dashboard and export', () => {
    it('summarises projects and designs', async () => {
      const res = await http.get('/dashboard').set('Authorization', `Bearer ${alice}`).expect(200);
      expect(res.body.totals).toEqual({ projects: 1, designs: 2, adequate: 1, notAdequate: 1 });
      expect(res.body.perProject[0]).toMatchObject({ name: 'Addis–Adama road', adequate: 1, notAdequate: 1 });
      expect(res.body.recent).toHaveLength(2);
    });

    it('exports CSV and Excel', async () => {
      const csv = await http.get(`/projects/${projectId}/export?format=csv`).set('Authorization', `Bearer ${alice}`).expect(200);
      expect(csv.headers['content-disposition']).toContain('Addis_Adama_road_designs.csv');
      expect(csv.text).toContain('"Thin AC, no DBM",1,AC Course,Base Course,60,'); // quoted: the name has a comma
      expect(csv.text).toContain('NOT ADEQUATE');
      const xlsx = await http.get(`/projects/${projectId}/export?format=xlsx`).set('Authorization', `Bearer ${alice}`)
        .buffer(true).parse((res, done) => { const chunks: Buffer[] = []; res.on('data', (c: Buffer) => chunks.push(c)); res.on('end', () => done(null, Buffer.concat(chunks))); })
        .expect(200);
      expect((xlsx.body as Buffer).subarray(0, 2).toString()).toBe('PK'); // xlsx files are zip archives
    });
  });

  describe('CORS', () => {
    it('allows configured origins (with * wildcards) and nothing else', async () => {
      const ok = await http.get('/health').set('Origin', 'https://pavement-git-main-abenezer.vercel.app');
      expect(ok.headers['access-control-allow-origin']).toBe('https://pavement-git-main-abenezer.vercel.app');
      const local = await http.get('/health').set('Origin', 'http://localhost:3000');
      expect(local.headers['access-control-allow-origin']).toBe('http://localhost:3000');
      const evil = await http.get('/health').set('Origin', 'https://evil.example.com');
      expect(evil.headers['access-control-allow-origin']).toBeUndefined();
    });
  });

  it('deleting a project removes its designs', async () => {
    await http.delete(`/projects/${projectId}`).set('Authorization', `Bearer ${alice}`).expect(200);
    await http.get(`/designs/${designId}`).set('Authorization', `Bearer ${alice}`).expect(404);
    expect(await prisma.design.count({ where: { projectId } })).toBe(0);
  });
});

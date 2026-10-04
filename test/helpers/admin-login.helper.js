import { readFileSync } from 'node:fs';
import request from 'supertest';
import app from '../../src/app.js';

const testData = JSON.parse(
  readFileSync(new URL('../data/test-data.json', import.meta.url), 'utf8')
);

export default async function loginAdmin() {
  const resposta = await request(app)
    .post('/api/auth/login')
    .send(testData.admin);

  if (resposta.status !== 200 || !resposta.body.token) {
    throw new Error('Não foi possível autenticar o administrador para os testes.');
  }

  return resposta.body.token;
}

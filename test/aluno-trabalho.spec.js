import { readFileSync } from 'node:fs';
import request from 'supertest';
import { expect } from 'chai';
import app from '../src/app.js';
import loginAdmin from './helpers/admin-login.helper.js';
import loginAluno from './helpers/aluno-login.helper.js';

const testData = JSON.parse(
  readFileSync(new URL('./data/test-data.json', import.meta.url), 'utf8')
);

describe('Autoatendimento de trabalhos do aluno', function () {
  this.timeout(10000);

  let adminToken;
  let alunoToken;
  let trabalhoCriadoId;
  const titulo = `Trabalho de teste ${Date.now()}`;

  before(async () => {
    [adminToken, alunoToken] = await Promise.all([loginAdmin(), loginAluno()]);
  });

  after(async () => {
    if (trabalhoCriadoId && adminToken) {
      await request(app)
        .delete(`/api/admin/trabalhos/${trabalhoCriadoId}`)
        .set('Authorization', `Bearer ${adminToken}`);
    }
  });

  it('permite ao aluno registrar um trabalho em uma disciplina cursada', async () => {
    const resposta = await request(app)
      .post(`/api/alunos/${testData.aluno.id}/trabalhos`)
      .set('Authorization', `Bearer ${alunoToken}`)
      .send({
        disciplinaId: testData.disciplina.id,
        titulo,
        descricao: 'Entrega criada pela suíte de testes.',
      });

    expect(resposta.status).to.equal(201);
    expect(resposta.body).to.include({
      alunoId: testData.aluno.id,
      disciplinaId: testData.disciplina.id,
      titulo,
      status: 'entregue',
    });
    expect(resposta.body).to.have.property('id');
    trabalhoCriadoId = resposta.body.id;
  });

  it('lista os trabalhos do próprio aluno', async () => {
    const resposta = await request(app)
      .get(`/api/alunos/${testData.aluno.id}/trabalhos`)
      .set('Authorization', `Bearer ${alunoToken}`);

    expect(resposta.status).to.equal(200);
    expect(resposta.body).to.be.an('array');
    expect(resposta.body.some((trabalho) => trabalho.titulo === titulo)).to.equal(true);
  });

  it('impede o aluno de registrar trabalhos em nome de outro aluno', async () => {
    const tokenDeOutroAluno = await loginAluno(testData.alunoDiferente);
    const resposta = await request(app)
      .post(`/api/alunos/${testData.aluno.id}/trabalhos`)
      .set('Authorization', `Bearer ${tokenDeOutroAluno}`)
      .send({
        disciplinaId: testData.disciplina.id,
        titulo: 'Tentativa não autorizada',
      });

    expect(resposta.status).to.equal(403);
  });
});

import { createClient } from "@libsql/client";

let client: ReturnType<typeof createClient> | null = null;

export function getDb() {
  if (!client) {
    client = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return client;
}

export async function initDb() {
  const db = getDb();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS sdr_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      -- Etapa 1: Negócio e Público
      nome_empresa TEXT NOT NULL,
      segmento TEXT NOT NULL,
      site_ou_instagram TEXT,
      produto_servico TEXT NOT NULL,
      ticket_medio TEXT NOT NULL,
      descricao_icp TEXT NOT NULL,
      principais_dores TEXT NOT NULL,

      -- Etapa 2: Persona da IA
      nome_persona TEXT NOT NULL,
      genero_persona TEXT NOT NULL,
      cargo_persona TEXT NOT NULL,
      forma_tratamento TEXT NOT NULL,
      frase_abertura TEXT NOT NULL,
      frase_encerramento TEXT NOT NULL,

      -- Etapa 3: Tom e Personalidade
      formalidade TEXT NOT NULL,
      nivel_empatia TEXT NOT NULL,
      uso_humor TEXT NOT NULL,
      tamanho_respostas TEXT NOT NULL,
      uso_emojis TEXT NOT NULL,
      palavras_deve_usar TEXT NOT NULL,
      palavras_nunca_usar TEXT NOT NULL,
      reacao_reclamacoes TEXT NOT NULL,
      fora_do_escopo TEXT NOT NULL,

      -- Etapa 4: Capacidades e Destinos
      o_que_sabe_fazer TEXT NOT NULL,
      o_que_nao_faz TEXT NOT NULL,
      destinos_disponiveis TEXT NOT NULL,
      criterios_qualificacao TEXT NOT NULL,
      perguntas_confirmacao TEXT NOT NULL,

      -- Etapa 5: Gatilhos e Horário
      gatilhos_criticos TEXT NOT NULL,
      quando_escalar_humano TEXT NOT NULL,
      horario_atendimento_humano TEXT NOT NULL,
      mensagem_fora_horario TEXT NOT NULL,
      canal_escalada TEXT NOT NULL,
      exemplos_interacao TEXT,

      -- Etapa 6: Contato e Objetivos
      nome_responsavel TEXT NOT NULL,
      email_responsavel TEXT NOT NULL,
      telefone TEXT,
      meta_conversao TEXT,
      prazo_desejado TEXT,
      observacoes TEXT,

      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS sdr_attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      submission_id INTEGER NOT NULL,
      filename TEXT NOT NULL,
      filetype TEXT NOT NULL,
      filesize INTEGER NOT NULL,
      filedata TEXT NOT NULL,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (submission_id) REFERENCES sdr_submissions(id)
    )
  `);
}

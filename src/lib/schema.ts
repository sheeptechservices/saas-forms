import { z } from "zod";

const sel = (msg: string) =>
  z.string({ error: msg }).min(1, msg);

export const sdrFormSchema = z.object({
  // Etapa 1: Negócio
  nome_empresa: z.string().min(2, "Informe o nome da empresa"),
  segmento: z.string().min(2, "Informe o segmento"),
  site_ou_instagram: z.string().optional(),
  produto_servico: z.string().min(10, "Descreva o produto ou serviço (mín. 10 caracteres)"),
  ticket_medio: sel("Selecione o ticket médio"),
  descricao_icp: z.string().min(10, "Descreva seu cliente ideal (mín. 10 caracteres)"),
  principais_dores: z.string().min(10, "Descreva as principais dores (mín. 10 caracteres)"),

  // Etapa 2: Persona da IA
  nome_persona: z.string().min(2, "Informe o nome da persona"),
  genero_persona: sel("Selecione o gênero"),
  cargo_persona: z.string().min(2, "Informe o cargo exibido"),
  forma_tratamento: sel("Selecione a forma de tratamento"),
  frase_abertura: z.string().min(10, "Informe a frase de abertura (mín. 10 caracteres)"),
  frase_encerramento: z.string().min(10, "Informe a frase de encerramento (mín. 10 caracteres)"),

  // Etapa 3: Tom de Voz e Personalidade
  formalidade: sel("Selecione o nível de formalidade"),
  nivel_empatia: sel("Selecione o nível de empatia"),
  uso_humor: sel("Selecione o uso de humor"),
  tamanho_respostas: sel("Selecione o tamanho das respostas"),
  uso_emojis: sel("Selecione o uso de emojis"),
  palavras_deve_usar: z.string().min(5, "Informe palavras que a IA deve usar"),
  palavras_nunca_usar: z.string().min(5, "Informe palavras que a IA nunca deve usar"),
  reacao_reclamacoes: z.string().min(10, "Descreva como reagir a reclamações"),
  fora_do_escopo: z.string().min(10, "Descreva como lidar com perguntas fora do escopo"),

  // Etapa 4: Capacidades e Destinos
  o_que_sabe_fazer: z.string().min(10, "Descreva o que a IA sabe fazer"),
  o_que_nao_faz: z.string().min(10, "Descreva o que a IA não faz"),
  destinos_disponiveis: z.string().min(10, "Descreva os destinos/ações disponíveis"),
  criterios_qualificacao: z.string().min(10, "Descreva os critérios de qualificação"),
  perguntas_confirmacao: z.string().min(10, "Informe as perguntas de confirmação"),

  // Etapa 5: Gatilhos e Horário
  gatilhos_criticos: z.string().min(5, "Informe os gatilhos críticos"),
  quando_escalar_humano: z.string().min(10, "Descreva quando escalar para humano"),
  horario_atendimento_humano: z.string().min(3, "Informe o horário de atendimento humano"),
  mensagem_fora_horario: z.string().min(10, "Informe a mensagem fora do horário"),
  canal_escalada: z.string().min(3, "Informe o canal para escalada humana"),
  exemplos_interacao: z.string().optional(),

  // Etapa 6: Contato e Objetivos
  nome_responsavel: z.string().min(2, "Informe o nome do responsável"),
  email_responsavel: z.string().email("E-mail inválido"),
  telefone: z.string().optional(),
  meta_conversao: z.string().optional(),
  prazo_desejado: z.string().optional(),
  observacoes: z.string().optional(),
});

export type SdrFormData = z.infer<typeof sdrFormSchema>;

export const STEPS = [
  {
    id: 1,
    titulo: "Negócio e Público",
    descricao: "Sobre a empresa, o que vende e para quem",
    campos: ["nome_empresa", "segmento", "site_ou_instagram", "produto_servico", "ticket_medio", "descricao_icp", "principais_dores"],
  },
  {
    id: 2,
    titulo: "Persona da IA",
    descricao: "Identidade, nome e forma de apresentação da IA",
    campos: ["nome_persona", "genero_persona", "cargo_persona", "forma_tratamento", "frase_abertura", "frase_encerramento"],
  },
  {
    id: 3,
    titulo: "Tom e Personalidade",
    descricao: "Como a IA se comunica e reage no dia a dia",
    campos: ["formalidade", "nivel_empatia", "uso_humor", "tamanho_respostas", "uso_emojis", "palavras_deve_usar", "palavras_nunca_usar", "reacao_reclamacoes", "fora_do_escopo"],
  },
  {
    id: 4,
    titulo: "Capacidades e Destinos",
    descricao: "O que a IA faz, onde direciona e como qualifica leads",
    campos: ["o_que_sabe_fazer", "o_que_nao_faz", "destinos_disponiveis", "criterios_qualificacao", "perguntas_confirmacao"],
  },
  {
    id: 5,
    titulo: "Gatilhos e Horário",
    descricao: "Quando escalar, palavras críticas e horário de atendimento",
    campos: ["gatilhos_criticos", "quando_escalar_humano", "horario_atendimento_humano", "mensagem_fora_horario", "canal_escalada", "exemplos_interacao"],
  },
  {
    id: 6,
    titulo: "Contato e Objetivos",
    descricao: "Dados do responsável e metas do projeto",
    campos: ["nome_responsavel", "email_responsavel", "telefone", "meta_conversao", "prazo_desejado", "observacoes"],
  },
] as const;

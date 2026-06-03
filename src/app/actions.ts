"use server";

import { getDb, initDb } from "@/lib/db";
import { sdrFormSchema, type SdrFormData } from "@/lib/schema";

async function sendEmailNotification(d: SdrFormData, numAnexos: number) {
  const apiKey  = process.env.RESEND_API_KEY;
  const toEmail = process.env.RESEND_TO_EMAIL;

  if (!apiKey || !toEmail) {
    console.warn("Resend: credenciais ausentes, pulando envio.");
    return;
  }

  const now = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    // Após verificar o domínio em resend.com/domains, troque pelo seu:
    // from: "SDR Formulário <noreply@sheeptechnology.com.br>",
    from: "SDR Formulário <onboarding@resend.dev>",
    to: "assinaturas@sheeptechnology.com.br",
    replyTo: d.email_responsavel,
    subject: `🐑 Novo formulário SDR — ${d.nome_empresa}`,
    html: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <style>@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&display=swap');</style>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:'Manrope','Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f5f5;padding:48px 16px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;">

        <tr><td style="background:#AAFF00;padding:28px 40px 24px;font-family:'Manrope','Helvetica Neue',Helvetica,Arial,sans-serif;">
          <p style="margin:0;font-size:12px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#0f0f0f;opacity:0.6;">Sheep Technology</p>
          <h1 style="margin:6px 0 0;font-size:22px;font-weight:800;color:#0f0f0f;letter-spacing:-0.01em;font-family:'Manrope','Helvetica Neue',Helvetica,Arial,sans-serif;">Nova resposta recebida</h1>
        </td></tr>

        <tr><td style="padding:32px 40px;font-family:'Manrope','Helvetica Neue',Helvetica,Arial,sans-serif;">
          <p style="margin:0 0 24px;font-size:15px;color:#444;line-height:1.6;">O formulário SDR foi preenchido e salvo com sucesso.</p>
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f9f9f9;border-radius:10px;overflow:hidden;">
            <tr><td style="padding:14px 20px;border-bottom:1px solid #efefef;font-family:'Manrope','Helvetica Neue',Helvetica,Arial,sans-serif;">
              <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#999;">Empresa</span><br/>
              <span style="font-size:15px;font-weight:700;color:#111;">${d.nome_empresa}</span>
            </td></tr>
            <tr><td style="padding:14px 20px;border-bottom:1px solid #efefef;font-family:'Manrope','Helvetica Neue',Helvetica,Arial,sans-serif;">
              <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#999;">Responsável</span><br/>
              <span style="font-size:15px;color:#333;">${d.nome_responsavel}</span>
            </td></tr>
            <tr><td style="padding:14px 20px;font-family:'Manrope','Helvetica Neue',Helvetica,Arial,sans-serif;">
              <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#999;">Enviado em</span><br/>
              <span style="font-size:15px;color:#333;">${now}</span>
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:0 40px 32px;font-family:'Manrope','Helvetica Neue',Helvetica,Arial,sans-serif;">
          <p style="margin:0;font-size:12px;color:#bbb;line-height:1.6;">Notificação automática · Formulário SDR para WhatsApp</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });

  if (error) {
    console.error("Resend erro:", error);
  }
}

export interface FileAttachment {
  name: string;
  type: string;
  size: number;
  data: string; // base64
}

export async function submitSdrForm(data: SdrFormData, attachments: FileAttachment[] = []) {
  try {
    const parsed = sdrFormSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: "Dados inválidos. Verifique os campos e tente novamente." };
    }

    await initDb();
    const db = getDb();
    const d = parsed.data;

    const result = await db.execute({
      sql: `INSERT INTO sdr_submissions (
        nome_empresa, segmento, site_ou_instagram, produto_servico, ticket_medio,
        descricao_icp, principais_dores,
        nome_persona, genero_persona, cargo_persona, forma_tratamento,
        frase_abertura, frase_encerramento,
        formalidade, nivel_empatia, uso_humor, tamanho_respostas, uso_emojis,
        palavras_deve_usar, palavras_nunca_usar, reacao_reclamacoes, fora_do_escopo,
        o_que_sabe_fazer, o_que_nao_faz, destinos_disponiveis,
        criterios_qualificacao, perguntas_confirmacao,
        gatilhos_criticos, quando_escalar_humano,
        horario_atendimento_humano, mensagem_fora_horario, canal_escalada, exemplos_interacao,
        nome_responsavel, email_responsavel, telefone,
        meta_conversao, prazo_desejado, observacoes
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: [
        d.nome_empresa, d.segmento, d.site_ou_instagram ?? null, d.produto_servico, d.ticket_medio,
        d.descricao_icp, d.principais_dores,
        d.nome_persona, d.genero_persona, d.cargo_persona, d.forma_tratamento,
        d.frase_abertura, d.frase_encerramento,
        d.formalidade, d.nivel_empatia, d.uso_humor, d.tamanho_respostas, d.uso_emojis,
        d.palavras_deve_usar, d.palavras_nunca_usar, d.reacao_reclamacoes, d.fora_do_escopo,
        d.o_que_sabe_fazer, d.o_que_nao_faz, d.destinos_disponiveis,
        d.criterios_qualificacao, d.perguntas_confirmacao,
        d.gatilhos_criticos, d.quando_escalar_humano,
        d.horario_atendimento_humano, d.mensagem_fora_horario, d.canal_escalada, d.exemplos_interacao ?? null,
        d.nome_responsavel, d.email_responsavel, d.telefone ?? null,
        d.meta_conversao ?? null, d.prazo_desejado ?? null, d.observacoes ?? null,
      ],
    });

    const submissionId = Number(result.lastInsertRowid ?? 0);

    for (const att of attachments) {
      await db.execute({
        sql: `INSERT INTO sdr_attachments (submission_id, filename, filetype, filesize, filedata)
              VALUES (?, ?, ?, ?, ?)`,
        args: [submissionId, att.name, att.type, att.size, att.data],
      });
    }

    await sendEmailNotification(d, attachments.length).catch((e) =>
      console.error("Email falhou:", e)
    );

    return { success: true };
  } catch (err) {
    console.error("Erro ao salvar submission:", err);
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Erro ao salvar: ${msg}` };
  }
}

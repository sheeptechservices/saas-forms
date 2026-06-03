"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FileUpload } from "./file-upload";
import type { FileAttachment } from "@/app/actions";
import { useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { sdrFormSchema, type SdrFormData, STEPS } from "@/lib/schema";
import { submitSdrForm } from "@/app/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

// ── Select options ──────────────────────────────────────────────────────────

const TICKET_OPTIONS = [
  "Até R$ 100",
  "R$ 100 – R$ 500",
  "R$ 500 – R$ 2.000",
  "R$ 2.000 – R$ 10.000",
  "Acima de R$ 10.000",
];

const GENERO_OPTIONS = ["Feminino", "Masculino", "Neutro (sem gênero)"];

const TRATAMENTO_OPTIONS = [
  "Você (informal)",
  "Senhor/Senhora (formal)",
  "Variável conforme o cliente",
];

const FORMALIDADE_OPTIONS = ["Formal", "Semi-formal", "Descontraído"];
const EMPATIA_OPTIONS = ["Alto", "Médio", "Baixo"];
const HUMOR_OPTIONS = ["Nenhum", "Leve", "Moderado"];
const TAMANHO_OPTIONS = [
  "Curto (1–2 linhas)",
  "Médio (3–5 linhas)",
  "Varia conforme o contexto",
];
const EMOJIS_OPTIONS = ["Não", "Moderado (apenas pontos-chave)", "Sim"];

// ── Component ───────────────────────────────────────────────────────────────

export function SdrForm() {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [phase, setPhase] = useState<"form" | "submitting" | "success">("form");
  const [serverError, setServerError] = useState<string | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [stepsWithErrors, setStepsWithErrors] = useState<number[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    trigger,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SdrFormData>({
    resolver: zodResolver(sdrFormSchema),
    mode: "onSubmit",
    defaultValues: {
      nome_empresa: "", segmento: "", site_ou_instagram: "", produto_servico: "",
      ticket_medio: "", descricao_icp: "", principais_dores: "",
      nome_persona: "", genero_persona: "", cargo_persona: "", forma_tratamento: "",
      frase_abertura: "", frase_encerramento: "",
      formalidade: "", nivel_empatia: "", uso_humor: "", tamanho_respostas: "", uso_emojis: "",
      palavras_deve_usar: "", palavras_nunca_usar: "", reacao_reclamacoes: "", fora_do_escopo: "",
      o_que_sabe_fazer: "", o_que_nao_faz: "", destinos_disponiveis: "",
      criterios_qualificacao: "", perguntas_confirmacao: "",
      gatilhos_criticos: "", quando_escalar_humano: "", horario_atendimento_humano: "",
      mensagem_fora_horario: "", canal_escalada: "", exemplos_interacao: "",
      nome_responsavel: "", email_responsavel: "", telefone: "",
      meta_conversao: "", prazo_desejado: "", observacoes: "",
    },
  });

  const watchedValues = watch();

  // Restore draft from localStorage on first mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("sheep_sdr_draft");
      if (!saved) return;
      const { data, step: savedStep } = JSON.parse(saved);
      if (data) reset(data);
      if (typeof savedStep === "number") setStep(savedStep);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist draft on every change
  useEffect(() => {
    try {
      localStorage.setItem("sheep_sdr_draft", JSON.stringify({ data: watchedValues, step }));
    } catch {}
  }, [watchedValues, step]);

  const currentStep = STEPS[step - 1];
  const progress = (step / STEPS.length) * 100;

  async function goNext() {
    const valid = await trigger([...currentStep.campos] as (keyof SdrFormData)[]);
    if (!valid) return;
    setStepsWithErrors((prev) => prev.filter((s) => s !== step));
    setDirection(1);
    setStep((s) => Math.min(s + 1, STEPS.length));
  }

  function goPrev() {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 1));
  }

  function onValidationError(errors: FieldErrors<SdrFormData>) {
    const errorFields = Object.keys(errors);
    const affected: number[] = STEPS
      .filter((s) => (s.campos as readonly string[]).some((c) => errorFields.includes(c)))
      .map((s) => s.id);
    setStepsWithErrors(affected);
    if (affected.length > 0 && !affected.includes(step)) {
      const target = affected[0];
      setDirection(target < step ? -1 : 1);
      setStep(target);
    }
  }

  async function onSubmit(data: SdrFormData) {
    setServerError(null);
    setPhase("submitting");

    try {
      const attachments: FileAttachment[] = await Promise.all(
        attachedFiles.map(
          (file) =>
            new Promise<FileAttachment>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () =>
                resolve({
                  name: file.name,
                  type: file.type,
                  size: file.size,
                  data: (reader.result as string).split(",")[1],
                });
              reader.onerror = reject;
              reader.readAsDataURL(file);
            })
        )
      );

      const result = await submitSdrForm(data, attachments);
      if (result.success) {
        try { localStorage.removeItem("sheep_sdr_draft"); } catch {}
        setPhase("success");
      } else {
        setServerError(result.error ?? "Erro desconhecido.");
        setPhase("form");
      }
    } catch (err) {
      console.error("Erro ao submeter formulário:", err);
      const msg = err instanceof Error ? err.message : String(err);
      setServerError(`Erro ao enviar: ${msg}`);
      setPhase("form");
    }
  }

  if (phase === "submitting") {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <motion.div
          className="bg-white rounded-3xl p-8 sm:p-14 flex flex-col items-center gap-6 sm:gap-8 text-center relative overflow-hidden"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          style={{ boxShadow: "0 25px 80px rgba(0,0,0,0.5), 0 0 80px rgba(170,255,0,0.12)" }}
        >
          {/* Spinner orbitando */}
          <div className="relative h-24 w-24 sm:h-32 sm:w-32">
            {/* Glow pulsante central */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ background: "radial-gradient(circle, rgba(170,255,0,0.18) 0%, transparent 70%)" }}
              animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* Anel externo fixo */}
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" fill="none">
              <circle cx="50" cy="50" r="44" stroke="#AAFF00" strokeWidth="1.5" strokeOpacity="0.15" />
            </svg>
            {/* Arco girando */}
            <motion.svg
              viewBox="0 0 100 100"
              className="absolute inset-0 w-full h-full"
              fill="none"
              animate={{ rotate: 360 }}
              transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
            >
              <circle
                cx="50" cy="50" r="44"
                stroke="#AAFF00"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="55 221"
                style={{ filter: "drop-shadow(0 0 6px rgba(170,255,0,0.9))" }}
              />
            </motion.svg>
            {/* Arco interno girando no sentido oposto */}
            <motion.svg
              viewBox="0 0 100 100"
              className="absolute inset-0 w-full h-full"
              fill="none"
              animate={{ rotate: -360 }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
            >
              <circle
                cx="50" cy="50" r="30"
                stroke="#AAFF00"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="25 163"
                strokeOpacity="0.5"
              />
            </motion.svg>
            {/* Ponto central */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                className="h-4 w-4 rounded-full bg-[#AAFF00]"
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                style={{ filter: "drop-shadow(0 0 10px rgba(170,255,0,1))" }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-gray-900 flex items-center justify-center gap-2">
              Enviando suas respostas
              <span className="inline-flex gap-1 items-center">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="block w-1.5 h-1.5 rounded-full bg-[#AAFF00]"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
                  />
                ))}
              </span>
            </h2>
            <p className="text-gray-400 text-sm max-w-xs leading-relaxed">
              Estamos processando todas as informações do seu SDR. Isso leva apenas alguns segundos.
            </p>
          </div>

          {/* Barra de progresso fake */}
          <div className="w-full max-w-xs h-1 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-[#AAFF00]"
              style={{ filter: "drop-shadow(0 0 4px rgba(170,255,0,0.7))" }}
              initial={{ width: "0%" }}
              animate={{ width: "85%" }}
              transition={{ duration: 2.5, ease: [0.4, 0, 0.2, 1] }}
            />
          </div>
        </motion.div>
      </div>
    );
  }

  if (phase === "success") {
    return (
      <div className="w-full max-w-2xl mx-auto relative">
        {/* Anéis de ripple fora do card — expandem no fundo escuro sem causar
            artefatos de composição GPU (overflow-hidden + scale = problema) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 0 }}>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute rounded-full border border-[#AAFF00]/25"
              style={{ width: 140, height: 140 }}
              initial={{ scale: 0.7, opacity: 0.7 }}
              animate={{ scale: 3.5 + i * 1.3, opacity: 0 }}
              transition={{ duration: 1.4, delay: 0.45 + i * 0.28, ease: "easeOut" }}
            />
          ))}
        </div>

        <motion.div
          className="bg-white rounded-3xl p-8 sm:p-14 flex flex-col items-center gap-5 sm:gap-6 text-center relative"
          initial={{ scale: 0.88, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          style={{ boxShadow: "0 25px 80px rgba(0,0,0,0.5), 0 0 40px rgba(170,255,0,0.08)", zIndex: 1 }}
        >
          {/* Confetti burst — SuccessParticles já tem seu próprio overflow-hidden */}
          <SuccessParticles />

          {/* Círculo + checkmark */}
          <motion.div
            className="relative h-20 w-20 sm:h-28 sm:w-28 z-10"
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 14, delay: 0.1 }}
          >
            <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
              <motion.circle
                cx="50" cy="50" r="44"
                stroke="#AAFF00"
                strokeWidth="3.5"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.65, ease: "easeInOut", delay: 0.25 }}
                style={{ filter: "drop-shadow(0 0 10px rgba(170,255,0,0.8))" }}
              />
              <motion.path
                d="M 27 52 L 44 69 L 73 33"
                stroke="#AAFF00"
                strokeWidth="5.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.35, ease: "easeOut", delay: 0.8 }}
                style={{ filter: "drop-shadow(0 0 10px rgba(170,255,0,0.9))" }}
              />
            </svg>
          </motion.div>

          <motion.h2
            className="text-2xl font-bold text-gray-900 z-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.05, duration: 0.4 }}
          >
            Formulário enviado!
          </motion.h2>

          <motion.p
            className="text-gray-400 max-w-sm text-sm leading-relaxed z-10"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.4 }}
          >
            Recebemos todas as informações. Em breve nossa equipe entrará em contato para iniciar a
            construção do seu SDR no WhatsApp.
          </motion.p>

          <motion.div
            className="mt-2 px-5 py-2 rounded-full text-xs font-semibold z-10"
            style={{ background: "rgba(170,255,0,0.1)", color: "#6bbf00", border: "1px solid rgba(170,255,0,0.25)" }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.35, duration: 0.35 }}
          >
            Aguarde o contato da nossa equipe
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">

      {/* Indicador de etapas */}
      <div className="flex items-center px-1">
        {STEPS.map((s, i) => (
          <div key={s.id} className={`flex items-center min-w-0 ${i < STEPS.length - 1 ? "flex-1" : ""}`}>
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <motion.div
                onClick={() => { setDirection(s.id > step ? 1 : -1); setStep(s.id); }}
                className={`relative h-9 w-9 sm:h-8 sm:w-8 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer transition-colors duration-300 ${
                  s.id < step
                    ? "bg-[#AAFF00] text-black"
                    : s.id === step
                    ? "bg-[#AAFF00] text-black step-pulse"
                    : "bg-white/10 text-white/40 hover:bg-white/20 hover:text-white/70"
                }`}
                animate={s.id === step ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                whileHover={s.id !== step ? { scale: 1.15 } : {}}
                whileTap={{ scale: 0.92 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                {s.id < step ? (
                  <motion.span
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >✓</motion.span>
                ) : s.id}
                {stepsWithErrors.includes(s.id) && s.id !== step && (
                  <motion.span
                    className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-red-500 border-2 border-[#080808]"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  />
                )}
              </motion.div>
              <span
                onClick={() => { setDirection(s.id > step ? 1 : -1); setStep(s.id); }}
                className={`text-[10px] font-medium text-center leading-tight max-w-[60px] hidden sm:block transition-colors duration-300 cursor-pointer select-none ${
                  s.id === step ? "text-white/90" : s.id < step ? "text-white/60 hover:text-white/90" : "text-white/25 hover:text-white/50"
                }`}
              >
                {s.titulo}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-px mx-1 relative overflow-hidden bg-white/10">
                <motion.div
                  className="absolute inset-0 bg-[#AAFF00]/70 origin-left"
                  initial={false}
                  animate={{ scaleX: s.id < step ? 1 : 0 }}
                  transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Card principal */}
      <div className="card-glow bg-white rounded-3xl overflow-hidden" style={{ boxShadow: "0 25px 80px rgba(0,0,0,0.5), 0 0 60px rgba(170,255,0,0.07)" }}>
        {/* Cabeçalho do card */}
        <div className="px-5 pt-5 pb-4 sm:px-8 sm:pt-8 sm:pb-6 border-b border-gray-100">
          <p className="text-xs font-semibold uppercase tracking-widest mb-1 text-gray-400">
            Etapa {step} de {STEPS.length}
          </p>
          <AnimatePresence mode="wait">
            <motion.div
              key={`header-${step}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
            >
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{currentStep.titulo}</h2>
              <p className="text-sm text-gray-400 mt-1 leading-snug">{currentStep.descricao}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Corpo do form */}
        <div className="px-5 pb-5 pt-4 sm:px-8 sm:pb-8 sm:pt-6 overflow-hidden">
          <form onSubmit={handleSubmit(onSubmit, onValidationError)} className="space-y-4 sm:space-y-5">
            <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={{
                enter: (d: number) => ({ x: d * 40, opacity: 0 }),
                center: { x: 0, opacity: 1 },
                exit: (d: number) => ({ x: d * -40, opacity: 0 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="space-y-4 sm:space-y-5"
            >

            {/* ── Etapa 1: Negócio e Público ── */}
            {step === 1 && (
              <>
                <Field label="Nome da empresa *" error={errors.nome_empresa?.message}>
                  <Input placeholder="Ex: Shark Soluções" {...register("nome_empresa")} />
                </Field>
                <Field label="Segmento / nicho *" error={errors.segmento?.message}>
                  <Input placeholder="Ex: Clínica odontológica, Consultoria, E-commerce..." {...register("segmento")} />
                </Field>
                <Field label="Site ou Instagram" error={errors.site_ou_instagram?.message}>
                  <Input placeholder="https:// ou @perfil" {...register("site_ou_instagram")} />
                </Field>
                <Field label="Produto ou serviço principal *" error={errors.produto_servico?.message}>
                  <Textarea
                    placeholder="Descreva o que você vende e como entrega valor ao cliente"
                    rows={3}
                    {...register("produto_servico")}
                  />
                </Field>
                <Field label="Ticket médio *" error={errors.ticket_medio?.message}>
                  <SimpleSelect
                    placeholder="Selecione uma faixa"
                    options={TICKET_OPTIONS}
                    value={watchedValues.ticket_medio}
                    onSelect={(v) => setValue("ticket_medio", v)}
                  />
                </Field>
                <Field label="Descrição do cliente ideal (ICP) *" error={errors.descricao_icp?.message}>
                  <Textarea
                    placeholder="Ex: Donos de clínicas com 1–5 funcionários, que buscam mais agendamentos sem aumentar equipe..."
                    rows={3}
                    {...register("descricao_icp")}
                  />
                </Field>
                <Field label="Principais dores do cliente *" error={errors.principais_dores?.message}>
                  <Textarea
                    placeholder="Quais problemas, frustrações ou medos seu cliente tem antes de te contratar?"
                    rows={3}
                    {...register("principais_dores")}
                  />
                </Field>
              </>
            )}

            {/* ── Etapa 2: Persona da IA ── */}
            {step === 2 && (
              <>
                <div className="bg-muted/50 rounded-md px-4 py-3 text-sm text-muted-foreground">
                  A persona é o personagem que a IA vai interpretar ao conversar com seus clientes no WhatsApp.
                </div>
                <Field label="Nome da persona *" error={errors.nome_persona?.message}>
                  <Input placeholder='Ex: "Ana", "Carlos", "Max"' {...register("nome_persona")} />
                </Field>
                <Field label="Gênero da persona *" error={errors.genero_persona?.message}>
                  <SimpleSelect
                    placeholder="Selecione"
                    options={GENERO_OPTIONS}
                    value={watchedValues.genero_persona}
                    onSelect={(v) => setValue("genero_persona", v)}
                  />
                </Field>
                <Field label="Cargo / função exibida ao cliente *" error={errors.cargo_persona?.message}>
                  <Input
                    placeholder='Ex: "Assistente Virtual", "Consultor de Vendas", "Atendente"'
                    {...register("cargo_persona")}
                  />
                </Field>
                <Field label="Forma de tratamento ao cliente *" error={errors.forma_tratamento?.message}>
                  <SimpleSelect
                    placeholder="Selecione"
                    options={TRATAMENTO_OPTIONS}
                    value={watchedValues.forma_tratamento}
                    onSelect={(v) => setValue("forma_tratamento", v)}
                  />
                </Field>
                <Field label="Frase de abertura padrão *" error={errors.frase_abertura?.message}>
                  <Textarea
                    placeholder='Ex: "Olá! Sou a Ana, assistente virtual da Empresa X. Como posso te ajudar hoje?"'
                    rows={2}
                    {...register("frase_abertura")}
                  />
                </Field>
                <Field label="Frase de encerramento padrão *" error={errors.frase_encerramento?.message}>
                  <Textarea
                    placeholder='Ex: "Foi um prazer te atender! Qualquer dúvida, estou por aqui. Até logo!"'
                    rows={2}
                    {...register("frase_encerramento")}
                  />
                </Field>
              </>
            )}

            {/* ── Etapa 3: Tom e Personalidade ── */}
            {step === 3 && (
              <>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <Field label="Formalidade *" error={errors.formalidade?.message}>
                    <SimpleSelect
                      placeholder="Selecione"
                      options={FORMALIDADE_OPTIONS}
                      value={watchedValues.formalidade}
                      onSelect={(v) => setValue("formalidade", v)}
                    />
                  </Field>
                  <Field label="Nível de empatia *" error={errors.nivel_empatia?.message}>
                    <SimpleSelect
                      placeholder="Selecione"
                      options={EMPATIA_OPTIONS}
                      value={watchedValues.nivel_empatia}
                      onSelect={(v) => setValue("nivel_empatia", v)}
                    />
                  </Field>
                  <Field label="Uso de humor *" error={errors.uso_humor?.message}>
                    <SimpleSelect
                      placeholder="Selecione"
                      options={HUMOR_OPTIONS}
                      value={watchedValues.uso_humor}
                      onSelect={(v) => setValue("uso_humor", v)}
                    />
                  </Field>
                  <Field label="Tamanho das respostas *" error={errors.tamanho_respostas?.message}>
                    <SimpleSelect
                      placeholder="Selecione"
                      options={TAMANHO_OPTIONS}
                      value={watchedValues.tamanho_respostas}
                      onSelect={(v) => setValue("tamanho_respostas", v)}
                    />
                  </Field>
                  <Field label="Uso de emojis *" error={errors.uso_emojis?.message} className="col-span-2">
                    <SimpleSelect
                      placeholder="Selecione"
                      options={EMOJIS_OPTIONS}
                      value={watchedValues.uso_emojis}
                      onSelect={(v) => setValue("uso_emojis", v)}
                    />
                  </Field>
                </div>

                <Field label="Palavras que a IA DEVE usar com frequência *" error={errors.palavras_deve_usar?.message}>
                  <Textarea
                    placeholder='Ex: "solução", "resultado", "economia", "exclusivo", "personalizado"'
                    rows={2}
                    {...register("palavras_deve_usar")}
                  />
                </Field>
                <Field label="Palavras que a IA NUNCA deve usar *" error={errors.palavras_nunca_usar?.message}>
                  <Textarea
                    placeholder='Ex: "problema", "impossível", "caro", nomes de concorrentes...'
                    rows={2}
                    {...register("palavras_nunca_usar")}
                  />
                </Field>
                <Field label="Como a IA deve reagir a reclamações? *" error={errors.reacao_reclamacoes?.message}>
                  <Textarea
                    placeholder='Ex: "Lamento muito pelo ocorrido. Vou encaminhar para nossa equipe resolver o mais rápido possível."'
                    rows={3}
                    {...register("reacao_reclamacoes")}
                  />
                </Field>
                <Field label="Como lidar com perguntas fora do escopo? *" error={errors.fora_do_escopo?.message}>
                  <Textarea
                    placeholder='Ex: "Ainda não consigo te ajudar com isso por aqui, mas posso te conectar com nossa equipe pelo [canal]."'
                    rows={2}
                    {...register("fora_do_escopo")}
                  />
                </Field>
              </>
            )}

            {/* ── Etapa 4: Capacidades e Destinos ── */}
            {step === 4 && (
              <>
                <Field label="O que a IA SABE fazer *" error={errors.o_que_sabe_fazer?.message}>
                  <Textarea
                    placeholder="Ex: Tirar dúvidas sobre o produto, qualificar leads, agendar demonstrações, enviar proposta, responder perguntas frequentes..."
                    rows={3}
                    {...register("o_que_sabe_fazer")}
                  />
                </Field>
                <Field label="O que a IA NÃO faz / não pode prometer *" error={errors.o_que_nao_faz?.message}>
                  <Textarea
                    placeholder="Ex: Não dá descontos sem autorização, não faz promessas de prazo, não substitui consulta especializada..."
                    rows={3}
                    {...register("o_que_nao_faz")}
                  />
                </Field>
                <Field
                  label="Destinos disponíveis (para onde a IA pode encaminhar o lead) *"
                  error={errors.destinos_disponiveis?.message}
                  hint="Liste os destinos e o que acontece em cada um. Ex: Lead qualificado → agendar reunião com vendedor. Lead desqualificado → encerrar com gentileza. Dúvida complexa → transferir para atendente humano."
                >
                  <Textarea
                    placeholder={"D01 – Lead qualificado: [ação + canal]\nD02 – Lead desqualificado: [ação + canal]\nD03 – Dúvida fora do escopo: [ação + canal]\nD04 – Reclamação: [ação + canal]"}
                    rows={5}
                    {...register("destinos_disponiveis")}
                  />
                </Field>
                <Field
                  label="Critérios de qualificação de leads *"
                  error={errors.criterios_qualificacao?.message}
                  hint="Como a IA sabe se um lead está pronto para avançar? Ex: tem orçamento, tem decisão, tem urgência, tem necessidade real."
                >
                  <Textarea
                    placeholder="Ex: Lead qualificado = tem interesse real + pode tomar decisão + tem budget compatível + quer resolver em menos de 30 dias..."
                    rows={3}
                    {...register("criterios_qualificacao")}
                  />
                </Field>
                <Field
                  label="Perguntas de qualificação / confirmação *"
                  error={errors.perguntas_confirmacao?.message}
                  hint="Quais perguntas a IA deve fazer para qualificar o lead antes de encaminhar?"
                >
                  <Textarea
                    placeholder={"Ex:\n• Você já tem orçamento definido para isso?\n• Quem mais participa dessa decisão?\n• Qual é o maior desafio que enfrenta hoje?\n• Você precisa resolver isso em quanto tempo?"}
                    rows={4}
                    {...register("perguntas_confirmacao")}
                  />
                </Field>
              </>
            )}

            {/* ── Etapa 5: Gatilhos e Horário ── */}
            {step === 5 && (
              <>
                <Field
                  label="Gatilhos críticos (palavras ou situações que exigem ação imediata) *"
                  error={errors.gatilhos_criticos?.message}
                  hint='Palavras ou frases que, ao serem detectadas, disparam uma ação imediata — como escalar para humano ou encerrar a conversa.'
                >
                  <Textarea
                    placeholder={'Ex: "quero cancelar", "fui enganado", "vou processar", "concorrente X", "já comprei de outro"...'}
                    rows={3}
                    {...register("gatilhos_criticos")}
                  />
                </Field>
                <Field
                  label="Quando escalar para atendente humano? *"
                  error={errors.quando_escalar_humano?.message}
                >
                  <Textarea
                    placeholder={"Ex:\n• Cliente em crise emocional ou insatisfação grave\n• Reclamação que envolva reembolso ou cancelamento\n• Dúvida técnica que a IA não consegue responder\n• Cliente pediu explicitamente por humano"}
                    rows={4}
                    {...register("quando_escalar_humano")}
                  />
                </Field>
                <Field label="Horário de atendimento humano *" error={errors.horario_atendimento_humano?.message}>
                  <Input
                    placeholder="Ex: Segunda a sexta, 8h às 18h / 24 horas / Apenas dias úteis"
                    {...register("horario_atendimento_humano")}
                  />
                </Field>
                <Field label="Mensagem enviada fora do horário de atendimento *" error={errors.mensagem_fora_horario?.message}>
                  <Textarea
                    placeholder='Ex: "No momento não temos atendentes disponíveis. Retornaremos no próximo dia útil. Sua mensagem está registrada!"'
                    rows={2}
                    {...register("mensagem_fora_horario")}
                  />
                </Field>
                <Field label="Canal / contato para escalada humana *" error={errors.canal_escalada?.message}>
                  <Input
                    placeholder="Ex: WhatsApp (11) 99999-9999, e-mail suporte@empresa.com, chat no site..."
                    {...register("canal_escalada")}
                  />
                </Field>
                <Field
                  label="Exemplos de interação (opcional)"
                  error={errors.exemplos_interacao?.message}
                  hint="Situações reais com a resposta esperada da IA. Quanto mais exemplos, melhor."
                >
                  <Textarea
                    placeholder={"Situação: Cliente pergunta o preço\nResposta esperada: [sua resposta aqui]\n\nSituação: Cliente diz que está caro\nResposta esperada: [sua resposta aqui]"}
                    rows={5}
                    {...register("exemplos_interacao")}
                  />
                </Field>
              </>
            )}

            {/* ── Etapa 6: Contato e Objetivos ── */}
            {step === 6 && (
              <>
                <Field label="Nome do responsável *" error={errors.nome_responsavel?.message}>
                  <Input placeholder="Seu nome completo" {...register("nome_responsavel")} />
                </Field>
                <Field label="E-mail *" error={errors.email_responsavel?.message}>
                  <Input type="email" placeholder="seuemail@empresa.com" {...register("email_responsavel")} />
                </Field>
                <Field label="WhatsApp" error={errors.telefone?.message}>
                  <Input placeholder="(11) 99999-9999" {...register("telefone")} />
                </Field>
                <div className="border-t pt-4 space-y-4">
                  <p className="text-sm font-medium text-muted-foreground">Objetivos do projeto (opcional)</p>
                  <Field label="Meta de conversão desejada" error={errors.meta_conversao?.message}>
                    <Input
                      placeholder="Ex: Converter 40% dos leads em reunião, fechar 10 vendas/mês..."
                      {...register("meta_conversao")}
                    />
                  </Field>
                  <Field label="Prazo desejado para o SDR entrar em operação" error={errors.prazo_desejado?.message}>
                    <Input placeholder="Ex: 2 semanas, 1 mês..." {...register("prazo_desejado")} />
                  </Field>
                  <Field label="Observações adicionais" error={errors.observacoes?.message}>
                    <Textarea
                      placeholder="Alguma informação extra ou detalhe importante que não foi coberto acima..."
                      rows={3}
                      {...register("observacoes")}
                    />
                  </Field>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Arquivos complementares (opcional)
                  </p>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Anexe materiais que ajudem a entender melhor o seu negócio — roteiros, exemplos de atendimento, scripts, etc.
                  </p>
                  <FileUpload onChange={setAttachedFiles} />
                </div>
              </>
            )}

            {serverError && (
              <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 border border-red-100">
                {serverError}
              </p>
            )}
            </motion.div>
            </AnimatePresence>

            {/* Navegação */}
            <div className="flex flex-col gap-3 pt-4 sm:pt-6">
            <AnimatePresence>
            {stepsWithErrors.length > 0 && (
              <motion.div
                className="flex flex-wrap items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.2 }}
              >
                <span className="text-sm text-red-600 font-medium">Campos pendentes:</span>
                <div className="flex flex-wrap gap-1.5">
                  {stepsWithErrors.map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => { setDirection(id < step ? -1 : 1); setStep(id); }}
                      className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                    >
                      Etapa {id} — {STEPS[id - 1].titulo}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
            </AnimatePresence>
            <div className="flex justify-between items-center">
              <motion.button
                type="button"
                onClick={goPrev}
                disabled={step === 1}
                className="flex items-center gap-1.5 text-sm font-semibold text-gray-400 disabled:opacity-0 disabled:pointer-events-none min-h-[44px] px-1"
                whileHover={{ color: "#111", x: -2 }}
                transition={{ duration: 0.15 }}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </motion.button>

              {step < STEPS.length ? (
                <motion.button
                  type="button"
                  onClick={goNext}
                  className="flex items-center gap-2 px-6 py-3 sm:px-7 rounded-full text-sm font-bold bg-[#AAFF00] text-black min-h-[44px]"
                  whileHover={{
                    scale: 1.04,
                    boxShadow: "0 0 30px rgba(170,255,0,0.45), 0 8px 24px rgba(170,255,0,0.2)",
                  }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                >
                  Próximo
                  <ChevronRight className="h-4 w-4" />
                </motion.button>
              ) : (
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-3 sm:px-7 rounded-full text-sm font-bold bg-[#AAFF00] text-black disabled:opacity-70 min-h-[44px]"
                  whileHover={{
                    scale: 1.04,
                    boxShadow: "0 0 30px rgba(170,255,0,0.45), 0 8px 24px rgba(170,255,0,0.2)",
                  }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar formulário"
                  )}
                </motion.button>
              )}
            </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Helper components ────────────────────────────────────────────────────────

function Field({
  label,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</Label>
      {hint && <p className="text-xs text-gray-400 leading-relaxed">{hint}</p>}
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function SimpleSelect({
  placeholder,
  options,
  onSelect,
  value,
}: {
  placeholder: string;
  options: string[];
  onSelect: (v: string) => void;
  value?: string;
}) {
  return (
    <Select value={value ?? ""} onValueChange={(v: string | null) => { if (v) onSelect(v); }}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="w-max min-w-[var(--radix-select-trigger-width)]">
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function SuccessParticles() {
  const particles = useMemo(() =>
    Array.from({ length: 28 }, (_, i) => {
      const angle = (i / 28) * Math.PI * 2;
      const distance = 80 + (i % 4) * 35;
      const colors = ["#AAFF00", "#AAFF0088", "#ffffff", "#AAFF0044", "#88cc00"];
      return {
        id: i,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        size: 3 + (i % 5) * 2,
        color: colors[i % colors.length],
        delay: 0.55 + (i % 7) * 0.04,
        duration: 0.9 + (i % 3) * 0.2,
        rotate: (i % 2 === 0) ? 180 : -180,
      };
    }), []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-sm"
          style={{ width: p.size, height: p.size, backgroundColor: p.color }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0, rotate: 0 }}
          animate={{ x: p.x, y: p.y, opacity: 0, scale: 1, rotate: p.rotate }}
          transition={{ duration: p.duration, delay: p.delay, ease: [0.15, 0, 0.1, 1] }}
        />
      ))}
    </div>
  );
}

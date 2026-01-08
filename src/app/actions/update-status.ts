"use server";

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export async function updateApplicationStatus(applicationId: string, newStatus: string, candidateEmail: string, candidateName: string, jobTitle: string) {
  
  // 0. Criar um Cliente Supabase com poderes de ADMIN (Service Role)
  // Isso garante que a atualização funcione mesmo sem cookie de sessão
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. Atualizar no Supabase usando o Admin
  const { error } = await supabaseAdmin
    .from('applications')
    .update({ status: newStatus })
    .eq('id', applicationId);

  if (error) {
      console.error("Erro Supabase:", error);
      throw new Error(`Falha no banco de dados: ${error.message}`);
  }

  let emailSent = false;

  // 2. Tentar enviar E-mail
  try {
    const apiKey = process.env.RESEND_API_KEY;

    if (apiKey) {
        const resend = new Resend(apiKey);
        let subject = "";
        let html = "";

        if (newStatus === 'INTERVIEW') {
            subject = `Convite para Entrevista - ${jobTitle}`;
            html = `<p>Olá <strong>${candidateName}</strong>,</p><p>Gostamos do seu perfil para a vaga de <strong>${jobTitle}</strong>! Vamos agendar uma conversa?</p>`;
        } else if (newStatus === 'REJECTED') {
            subject = `Atualização sobre a vaga ${jobTitle}`;
            html = `<p>Olá <strong>${candidateName}</strong>,</p><p>Agradecemos seu interesse, mas decidimos seguir com outros candidatos no momento.</p>`;
        } else if (newStatus === 'HIRED') {
            subject = `Parabéns! Você foi aprovado! - ${jobTitle}`;
            html = `<p>Parabéns <strong>${candidateName}</strong>! Bem-vindo ao time!</p>`;
        }

        if (subject) {
            await resend.emails.send({
                from: 'LZW Recrutamento <onboarding@resend.dev>',
                to: candidateEmail,
                subject: subject,
                html: html
            });
            emailSent = true;
        }
    } else {
        console.log(`[SIMULAÇÃO] Status mudou para ${newStatus}. E-mail seria enviado para ${candidateEmail}`);
    }

  } catch (emailError) {
      console.error("Erro no envio de email:", emailError);
  }

  return { success: true, emailSent };
}
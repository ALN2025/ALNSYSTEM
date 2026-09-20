import { BRAND } from '../constants/branding';
import { SUPPORT_EMAIL } from '../constants/legal';

export const PRIVACY_POLICY_UPDATED = '20/09/2026';

export const PRIVACY_POLICY_SECTIONS: { title: string; body: string[] }[] = [
  {
    title: 'Quem somos',
    body: [
      `O aplicativo ${BRAND.appName} é desenvolvido por ${BRAND.signature}.`,
      'Esta política descreve como tratamos informações quando você usa o app no Android ou em outras plataformes suportadas.',
    ],
  },
  {
    title: 'Resumo',
    body: [
      'Seus credores, despesas, acordos de fiador e configurações ficam armazenados apenas no seu aparelho.',
      'Não exigimos cadastro, não enviamos seus dados financeiros para nossos servidores e o app funciona offline.',
    ],
  },
  {
    title: 'Dados que você registra no app',
    body: [
      'Nomes, valores, datas, observações, documentos e telefones que você digitar.',
      'Preferências (notificações, moeda, juros padrão) e status do plano Pro (ativado localmente).',
      'Identificadores internos gerados pelo app para organizar registros.',
    ],
  },
  {
    title: 'O que não coletamos',
    body: [
      'Não coletamos lista de contatos, localização GPS, fotos da galeria nem áudio do microfone.',
      'Não vendemos nem compartilhamos seus dados financeiros com terceiros para publicidade.',
    ],
  },
  {
    title: 'Notificações',
    body: [
      'Se você ativar notificações, o Android agenda lembretes de vencimento e atraso no próprio dispositivo.',
      'O conteúdo dos alertas é baseado nos dados que você cadastrou localmente.',
    ],
  },
  {
    title: 'Plano Pro',
    body: [
      'Na versão distribuída fora da Play Store, a ativação Pro pode usar uma chave informada por você, guardada só no aparelho.',
      'Na Google Play Store, a compra e a restauração seguem as regras do Google Play Billing quando disponível.',
    ],
  },
  {
    title: 'Permissões no Android',
    body: [
      'Notificações (POST_NOTIFICATIONS): enviar lembretes de vencimento.',
      'Vibração e inicialização após reinício: entregar alertas conforme configurado.',
      'Não solicitamos acesso à internet para o funcionamento básico do controle financeiro.',
    ],
  },
  {
    title: 'Exclusão de dados',
    body: [
      'Em Ajustes você pode apagar todos os dados do app. Isso remove credores, despesas, fiador e configurações do aparelho.',
      'Desinstalar o aplicativo também remove os dados armazenados localmente.',
    ],
  },
  {
    title: 'Crianças',
    body: [
      'O app não é direcionado a menores de 13 anos. Não coletamos dados de crianças de forma intencional.',
    ],
  },
  {
    title: 'Alterações',
    body: [
      'Podemos atualizar esta política. A data da última revisão aparece no topo do documento.',
      'Versões novas do app podem incluir aviso sobre mudanças relevantes.',
    ],
  },
  {
    title: 'Contato',
    body: [`Dúvidas sobre privacidade: ${SUPPORT_EMAIL}`],
  },
];

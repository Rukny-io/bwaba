import { MailMessageFolder } from '@prisma/client';

export type SesVerdict = {
  status?: string;
};

export type MailClassificationInput = {
  fromAddress: string;
  spamVerdict?: SesVerdict;
  virusVerdict?: SesVerdict;
  spfVerdict?: SesVerdict;
  dkimVerdict?: SesVerdict;
  dmarcVerdict?: SesVerdict;
  precedence?: string;
  listId?: string;
  listUnsubscribe?: string;
  xSpamFlag?: string;
  xSpamStatus?: string;
};

const SOCIAL_DOMAINS = [
  'facebookmail.com',
  'instagram.com',
  'linkedin.com',
  'twitter.com',
  'x.com',
  'tiktok.com',
  'discord.com',
  'redditmail.com',
  'pinterest.com',
  'snapchat.com',
];

function failed(verdict: SesVerdict | undefined) {
  return verdict?.status?.toUpperCase() === 'FAIL';
}

function senderDomain(address: string) {
  return address.trim().toLowerCase().split('@').pop() ?? '';
}

function isSocialDomain(domain: string) {
  return SOCIAL_DOMAINS.some(
    (candidate) => domain === candidate || domain.endsWith(`.${candidate}`),
  );
}

export function classifyInboundMail(
  input: MailClassificationInput,
): MailMessageFolder {
  const precedence = (input.precedence ?? '').trim().toLowerCase();
  const spamHeader =
    `${input.xSpamFlag ?? ''} ${input.xSpamStatus ?? ''}`.toLowerCase();
  const authenticationFailed =
    failed(input.spfVerdict) &&
    failed(input.dkimVerdict) &&
    failed(input.dmarcVerdict);

  if (
    failed(input.spamVerdict) ||
    failed(input.virusVerdict) ||
    authenticationFailed ||
    /\b(?:yes|spam|junk)\b/.test(spamHeader) ||
    /\bjunk\b/.test(precedence)
  ) {
    return MailMessageFolder.SPAM;
  }

  const domain = senderDomain(input.fromAddress);
  const socialHeaders = (input.listId ?? '').toLowerCase();
  if (
    isSocialDomain(domain) ||
    /\b(?:facebook|instagram|linkedin|twitter|tiktok|discord|reddit|pinterest|snapchat)\b/.test(
      socialHeaders,
    )
  ) {
    return MailMessageFolder.SOCIAL;
  }

  if (
    input.listUnsubscribe?.trim() ||
    (input.listId?.trim() && /\b(?:bulk|list)\b/.test(precedence)) ||
    /\bbulk\b/.test(precedence)
  ) {
    return MailMessageFolder.PROMOTIONS;
  }

  return MailMessageFolder.INBOX;
}

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

function verdictStatus(verdict: SesVerdict | undefined) {
  return verdict?.status?.toUpperCase() ?? '';
}

function failed(verdict: SesVerdict | undefined) {
  return verdictStatus(verdict) === 'FAIL';
}

function gray(verdict: SesVerdict | undefined) {
  return verdictStatus(verdict) === 'GRAY';
}

function passedOrGray(verdict: SesVerdict | undefined) {
  const status = verdictStatus(verdict);
  return status === 'PASS' || status === 'GRAY' || status === '';
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

export type QuarantineHeuristicOptions = {
  quarantineNewSendersWithoutDmarc?: boolean;
};

function dmarcMissingOrNone(verdict: SesVerdict | undefined) {
  const status = verdictStatus(verdict);
  return !status || status === 'NONE' || status === 'UNKNOWN';
}

export function classifySuspiciousForQuarantine(
  input: MailClassificationInput,
  options: QuarantineHeuristicOptions = {},
): MailMessageFolder | null {
  if (gray(input.spamVerdict)) {
    return MailMessageFolder.QUARANTINE;
  }
  if (gray(input.virusVerdict)) {
    return MailMessageFolder.QUARANTINE;
  }

  const authResults = [
    failed(input.spfVerdict),
    failed(input.dkimVerdict),
    failed(input.dmarcVerdict),
  ];
  const failCount = authResults.filter(Boolean).length;
  const passOrGrayCount = [
    input.spfVerdict,
    input.dkimVerdict,
    input.dmarcVerdict,
  ].filter((verdict) => passedOrGray(verdict)).length;

  if (failCount === 1 && passOrGrayCount >= 1) {
    return MailMessageFolder.QUARANTINE;
  }

  // Disabled by default — only quarantine when DMARC is absent AND another auth signal fails.
  if (options.quarantineNewSendersWithoutDmarc) {
    if (
      dmarcMissingOrNone(input.dmarcVerdict) &&
      (failed(input.spfVerdict) || failed(input.dkimVerdict))
    ) {
      return MailMessageFolder.QUARANTINE;
    }
  }

  return null;
}

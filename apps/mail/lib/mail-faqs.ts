export type MailFaqItem = {
  id: string;
  question: string;
  answer: string;
};

export const MAIL_FAQS: MailFaqItem[] = [
  {
    id: "domain",
    question: "Do I need my own domain?",
    answer: "Yes. You send as you@yourdomain — never @rukny.io.",
  },
  {
    id: "ses",
    question: "Is this Amazon SES?",
    answer: "SES carries the mail. You stay in Rukny.",
  },
  {
    id: "password",
    question: "Why a mailbox password?",
    answer: "Rukny is the company. The mailbox has its own lock.",
  },
  {
    id: "plans",
    question: "How do plans work?",
    answer:
      "Starter starts automatically after your domain DNS is verified. Standard and Premium are requested from Pricing and activated by an admin. Prices are monthly in IQD.",
  },
  {
    id: "inbox",
    question: "Will it land in the inbox?",
    answer: "We authenticate. Reputation and the words you send decide the rest.",
  },
  {
    id: "outlook",
    question: "Can I use Outlook?",
    answer: "Not yet. Webmail is live. IMAP is on the way.",
  },
];

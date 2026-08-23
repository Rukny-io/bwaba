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
      "Three monthly plans in IQD: Starter 3,000, Standard 6,000, and Premium 10,000, with mailboxes included. Request a plan in the console.",
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

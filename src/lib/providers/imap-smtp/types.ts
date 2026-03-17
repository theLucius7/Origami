export interface MailboxPreset {
  key: string;
  label: string;
  imapHost: string;
  imapPort: number;
  smtpHost: string;
  smtpPort: number;
  secure: boolean;
  authType: "authcode" | "password";
  helpUrl?: string;
  canSend: boolean;
}

export interface ImapSmtpRuntimeConfig {
  label: string;
  email: string;
  authUser: string;
  authPass: string;
  imap: {
    host: string;
    port: number;
    secure: boolean;
  };
  smtp: {
    host: string;
    port: number;
    secure: boolean;
  };
}

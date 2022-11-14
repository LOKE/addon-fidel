export {};

interface Metadata {
  [key: string]: string;
}

interface Fidel {
  openForm: ({
    companyName,
    programId,
    sdkKey,
    metadata,
  }: {
    companyName: string;
    programId: string;
    sdkKey: string;
    metadata: Metadata;
    onCardEnrolledCallback: () => void;
    onCardEnrollFailedCallback: () => void;
    onCardVerifiedCallback: () => void;
    onCardVerifyFailedCallback: () => void;
  }) => void;
  closeForm: () => void;
}

declare global {
  interface Window {
    Fidel: Fidel;
  }
}

window.Fidel = window.Fidel || {};
